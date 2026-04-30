// ── Helpers ──────────────────────────────────────────────────
const uid = () => 'n' + Math.random().toString(36).substring(2, 9);

const iconFor = t => iconMap[t] || 'fa-solid fa-cube';

function makeNode(type, withScaffold = false) {

  const isContainer = containerTypes.has(type);
  const classes = [];

  const node = {
    id: uid(), type,
    classes,
    customClasses: [],
    attrs: {},
    style: {},
    content: defaultContent[type] || '',
    children: isContainer ? [] : undefined,
  };


  // Scaffolding
  if (withScaffold && scaffoldMap[type]) {
    for (const childType of scaffoldMap[type]) {
      node.children.push(makeNode(childType, true));
    }
  }


  return node;
}

function deepCloneNode(node) {
  const clone = {
    ...node,
    id: uid(), // New unique ID
    classes: [...(node.classes || [])],
    attrs: { ...(node.attrs || {}) },
    style: { ...(node.style || {}) }
  };


  if (node.children) {
    clone.children = node.children.map(c => deepCloneNode(c));
  }

  return clone;
}


function checkDrop(parentType, dragEl) {
  if (!dragEl) return false;
  // Account for dragging from sidebar or within tree
  let target = dragEl.getAttribute('data-type') ? dragEl : dragEl.querySelector('[data-type]');
  if (!target && dragEl.closest) target = dragEl.closest('[data-type]');

  const dragType = target ? target.getAttribute('data-type') : null;
  if (!dragType) return false;
  if (!allowedChildrenMap[parentType]) return false;
  return allowedChildrenMap[parentType].includes(dragType);
}

// ── Color helpers ──────────────────────────────────────
const COLOR_PROP_KEYS = new Set([
  'color', 'background-color', 'border-color',
]);

function isColorProp(key) {
  if (!key) return false;
  return COLOR_PROP_KEYS.has(key) || key.includes('color') || key.includes('background');
}

// Convert any CSS color string to #rrggbb that <input type=color> accepts
function colorToHex(val) {
  if (!val || typeof val !== 'string') return '#000000';
  const v = val.trim();
  // Already 6-digit hex
  if (/^#[0-9a-f]{6}$/i.test(v)) return v.toLowerCase();
  // Expand 3-digit hex
  if (/^#[0-9a-f]{3}$/i.test(v)) return '#' + v[1] + v[1] + v[2] + v[2] + v[3] + v[3];
  // Use canvas to convert rgb/hsl/named colors
  try {
    const c = document.createElement('canvas'); c.width = c.height = 1;
    const ctx = c.getContext('2d'); ctx.fillStyle = v; ctx.fillRect(0, 0, 1, 1);
    const d = ctx.getImageData(0, 0, 1, 1).data;
    return '#' + [d[0], d[1], d[2]].map(n => n.toString(16).padStart(2, '0')).join('');
  } catch { return '#000000'; }
}


// ── MJML compilation helpers ────────────────────────────────
function buildAttrs(node, globalProps = {}, typeDefaults = {}, options = {}) {
  let s = '';
  const includeInternalIds = options.includeInternalIds !== false;
  const previewMode = options.previewMode === true;
  
  // Tags that do NOT support css-class or custom inline style
  const noRawStyleTags = new Set(['mjml', 'mj-head', 'mj-attributes', 'mj-all', 'mj-class', 'mj-font', 'mj-style', 'mj-title', 'mj-preview', 'mj-breakpoint']);

  if (includeInternalIds && !previewMode) {
    s += ` id="mja-${node.id}"`;
  }

  if (!noRawStyleTags.has(node.type)) {
    const classList = [...(node.classes || [])];
    if (previewMode && includeInternalIds) {
      classList.unshift(`mja-${node.id}`);
    }

    if (node.type === 'mj-column') {
      const w = node.style?.width || node.attrs?.width;
      if (w && String(w).endsWith('px')) {
        classList.push(`mja-fix-w-${String(w).replace('px', '')}`);
      }
    }

    const finalClasses = [...new Set(classList.filter(Boolean))];
    if (finalClasses.length) {
      s += ` css-class="${finalClasses.join(' ')}"`;
    }
  }

  const tagDefaults = typeDefaults[node.type] || {};

  if (node.attrs) {
    for (const [k, v] of Object.entries(node.attrs)) {
      if (v !== undefined && v !== null && v !== '') s += ` ${k}="${String(v).replace(/"/g, '&quot;')}"`;
    }
  }

  // Handle Inline Styles
  if (node.style && Object.keys(node.style).length > 0) {
    const inlineStyles = [];
    // Properties that MJML supports as direct attributes on almost all tags
    const stdMjmlAttrs = new Set(['align', 'background-color', 'background-url', 'background-repeat', 'background-size', 'background-position', 'border', 'border-bottom', 'border-left', 'border-right', 'border-top', 'border-radius', 'color', 'container-background-color', 'direction', 'font-family', 'font-size', 'font-style', 'font-weight', 'height', 'letter-spacing', 'line-height', 'padding', 'padding-bottom', 'padding-left', 'padding-right', 'padding-top', 'text-align', 'text-decoration', 'vertical-align', 'width', 'src', 'href', 'target', 'alt', 'mode', 'full-width', 'fluid-on-mobile', 'inner-padding', 'inner-background-color', 'text-transform', 'border-width', 'border-style', 'border-color', 'rel', 'path']);


    for (const [k, v] of Object.entries(node.style)) {
      if (v === undefined || v === null || v === '') continue;
      if (stdMjmlAttrs.has(k)) {
        // Suppress if value matches global default OR tag-specific default
        if (globalProps && globalProps[k] === v) continue;
        if (tagDefaults[k] === v) continue;
        s += ` ${k}="${String(v).replace(/"/g, '&quot;')}"`;
      } else if (!noRawStyleTags.has(node.type)) {
        inlineStyles.push(`${k}:${v}`);
      }
    }
    if (inlineStyles.length > 0 && !noRawStyleTags.has(node.type)) {
      s += ` style="${inlineStyles.join(';')}"`;
    }
  }

  // Force mj-text to inherit color natively to allow CSS classes to cascade effectively 
  // and override MJML's hard-coded default `#000000` text color without requiring complex child selectors.
  if (node.type === 'mj-text') {
    const hasInlineColor = node.attrs?.['color'] || (node.style && node.style['color']);
    if (!hasInlineColor) {
      s += ` color="inherit"`;
    }
  }

  return s;
}


function compileNode(node, depth, globalProps = {}, typeDefaults = {}, options = {}) {
  const pad = '  '.repeat(depth);
  const attrs = buildAttrs(node, globalProps, typeDefaults, options);
  const isLeaf = node.children === undefined;
  if (isLeaf && !node.content) return `${pad}<${node.type}${attrs} />`;
  let out = `${pad}<${node.type}${attrs}>`;
  if (node.content) {
    let c = node.content;
    out += '\n' + '  '.repeat(depth + 1) + c;
  }
  if (node.children) { if (node.children.length) { out += '\n'; for (const c of node.children) out += compileNode(c, depth + 1, globalProps, typeDefaults, options) + '\n'; out += pad; } }
  out += `</${node.type}>`;
  return out;
}

// ── Import helper ───────────────────────────────────────────
function parseMjmlToTree(src) {
  const parser = new DOMParser();
  // Browser's DOMParser in text/html mode ignores self-closing tags like <mj-image />
  // We must expand them to <mj-image></mj-image> before parsing.
  const expandedSrc = src.replace(/<(mj-[a-z0-9-]+)([^>]*?)\s*\/>/gi, '<$1$2></$1>');
  const doc = parser.parseFromString(expandedSrc, 'text/html');

  const mjStyleLookup = {};
  const darkStyleLookup = {};
  const globalDefaults = {};
  const typeDefaults = {};
  const globalFonts = [];
  let extraStyle = '';

  // 1. Parse MJML Head Attributes (mj-all, mj-class, type resets, mj-font)
  const attrsEl = doc.querySelector('mj-attributes');
  const newClasses = [];
  if (attrsEl) {
    // mj-all
    const allEl = attrsEl.querySelector('mj-all');
    if (allEl) {
      for (const a of allEl.attributes) globalDefaults[a.name] = a.value;
    }

    // type defaults & mj-class
    for (const child of attrsEl.children) {
      const tag = child.tagName.toLowerCase();
      if (tag === 'mj-class') {
        const name = child.getAttribute('name');
        if (!name) continue;
        const props = {};
        for (const a of child.attributes) if (a.name !== 'name') props[a.name] = a.value;
        newClasses.push({ name, props, _open: false, _pk: '', _pv: '', dark: false, darkProps: {} });
      } else if (tag !== 'mj-all') {
        typeDefaults[tag] = {};
        for (const a of child.attributes) typeDefaults[tag][a.name] = a.value;
      }
    }
  }

  // 2. Parse mj-font
  const fontEls = doc.querySelectorAll('mj-font');
  for (const f of fontEls) {
    const name = f.getAttribute('name');
    const href = f.getAttribute('href');
    if (name && href) globalFonts.push({ name, href });
  }

  // 3. Parse mj-style for dark mode, local overrides, and MIGRATING simple classes to Global Classes
  const styleEl = doc.querySelector('mj-style');
  if (styleEl) {
    let css = styleEl.textContent.replace(/\/\*[\s\S]*?\*\//g, '');
    
    function parseBlocks(cssString) {
      let blocks = [];
      let currentSelector = '';
      let currentBlock = '';
      let depth = 0;
      for (let i = 0; i < cssString.length; i++) {
        let char = cssString[i];
        if (char === '{') {
          if (depth === 0) currentSelector = currentSelector.trim();
          else currentBlock += char;
          depth++;
        } else if (char === '}') {
          depth--;
          if (depth === 0) {
            if (currentSelector) blocks.push({ selector: currentSelector, rules: currentBlock.trim() });
            currentSelector = '';
            currentBlock = '';
          } else {
            currentBlock += char;
          }
        } else {
          if (depth === 0) currentSelector += char;
          else currentBlock += char;
        }
      }
      return blocks;
    }
    
    let topBlocks = parseBlocks(css);
    
    function processRule(selectorPart, contentTrim, isDark) {
      const selectors = selectorPart.split(',').map(s => s.trim()).filter(Boolean);
      const props = {};
      contentTrim.split(';').forEach(p => {
        const [k, v] = p.split(':');
        if (k && v) props[k.trim()] = v.replace('!important', '').trim();
      });

      const complexSelectors = [];

      selectors.forEach(fullSelector => {
        // CASE A: Local ID Overrides (.mja-id)
        if (fullSelector.startsWith('.mja-') && !fullSelector.includes(' ') && !fullSelector.includes(',')) {
          const id = fullSelector.replace('.mja-', '');
          if (isDark) darkStyleLookup[id] = Object.assign(darkStyleLookup[id] || {}, props);
          else mjStyleLookup[id] = Object.assign(mjStyleLookup[id] || {}, props);
        }
        // CASE B: Dark Mode Overrides (.mja-forced-dark .className)
        else if (fullSelector.startsWith('.mja-forced-dark') && !isDark) {
          const sub = fullSelector.match(/\.([a-z0-9_-]+)$/i);
          if (sub) darkStyleLookup[sub[1]] = Object.assign(darkStyleLookup[sub[1]] || {}, props);
        }
        // CASE C: Simple Global Classes (.className)
        else if (fullSelector.startsWith('.') && !fullSelector.includes(' ') && !fullSelector.includes('>') && !fullSelector.includes(':')) {
          const name = fullSelector.substring(1);
          let existing = newClasses.find(c => c.name === name);
          if (!existing) { existing = { name, props: {}, _open: false, _pk: '', _pv: '', dark: false, darkProps: {} }; newClasses.push(existing); }
          if (isDark) { Object.assign(existing.darkProps, props); existing.dark = true; }
          else Object.assign(existing.props, props);
        }
        // CASE D: Complex selectors (.tg-h1 p, body, etc.)
        else {
          complexSelectors.push(fullSelector);
        }
      });

      if (complexSelectors.length > 0) {
        if (isDark) extraStyle += `@media (prefers-color-scheme: dark) {\n  ${complexSelectors.join(', ')} { ${contentTrim} }\n}\n`;
        else extraStyle += `${complexSelectors.join(', ')} { ${contentTrim} }\n`;
      }
    }

    topBlocks.forEach(block => {
      let isDarkMedia = block.selector.toLowerCase().includes('@media') && block.selector.toLowerCase().includes('prefers-color-scheme: dark');
      if (isDarkMedia) {
        let innerBlocks = parseBlocks(block.rules);
        innerBlocks.forEach(inner => processRule(inner.selector, inner.rules, true));
      } else if (block.selector.toLowerCase().includes('@media')) {
        extraStyle += `${block.selector} { ${block.rules} }\n`;
      } else {
        processRule(block.selector, block.rules, false);
      }
    });
  }

  // Inject dark mode props into classes
  newClasses.forEach(c => {
    if (darkStyleLookup[c.name]) {
      c.dark = true;
      c.darkProps = darkStyleLookup[c.name];
    }
  });

  const stdMjmlAttrs = new Set(['align', 'background-color', 'background-url', 'background-repeat', 'background-size', 'background-position', 'border', 'border-bottom', 'border-left', 'border-right', 'border-top', 'border-radius', 'color', 'container-background-color', 'direction', 'font-family', 'font-size', 'font-style', 'font-weight', 'height', 'letter-spacing', 'line-height', 'padding', 'padding-bottom', 'padding-left', 'padding-right', 'padding-top', 'text-align', 'text-decoration', 'vertical-align', 'width', 'src', 'href', 'target', 'alt', 'mode', 'full-width', 'fluid-on-mobile', 'inner-padding', 'inner-background-color', 'text-transform', 'border-width', 'border-style', 'border-color', 'rel', 'path']);

  function parseEl(el) {
    const type = el.tagName.toLowerCase();
    const idAttr = el.getAttribute('id') || '';
    const cssClassLine = el.getAttribute('css-class') || el.getAttribute('class') || '';
    const m = idAttr.match(/^mja-([a-z0-9]+)$/);
    const id = m ? m[1] : uid();

    const cls = (el.getAttribute('mj-class') || '').split(' ').filter(Boolean);
    const cssCls = (el.getAttribute('css-class') || el.getAttribute('class') || '').split(' ').filter(c => c && !c.startsWith('mja-'));
    cssCls.forEach(c => { if (!cls.includes(c)) cls.push(c); });
    const manualCls = []; // Already captured in cls above.
    const attrs = {};
    for (const a of el.attributes) {
      if (a.name !== 'mj-class' && a.name !== 'css-class' && a.name !== 'id') attrs[a.name] = a.value;
    }

    let content = '', children = undefined;
    if (TEXT_TYPES.includes(type)) {
      content = el.innerHTML;
    } else {
      children = [];
      for (const child of el.children) {
        if (child.tagName.toLowerCase().startsWith('mj-')) children.push(parseEl(child));
      }
    }

    // --- Attribute Priority Merging ---
    const style = {};
    
    // Explicit tag attributes take precedence and are moved to 'style' if they are standard MJML props
    for (const [k, v] of Object.entries(attrs)) {
      if (stdMjmlAttrs.has(k)) {
        style[k] = v;
        delete attrs[k];
      }
    }

    const styleAttr = el.getAttribute('style');
    if (styleAttr) {
      styleAttr.split(';').forEach(pair => {
        const [k, v] = pair.split(':');
        if (k && v) style[k.trim()] = v.trim();
      });
    }

    if (mjStyleLookup[id]) Object.assign(style, mjStyleLookup[id]);

    return { id, type, classes: cls, attrs, style, content, children };
  }

  const mjmlEl = doc.querySelector('mjml');
  const bodyEl = doc.querySelector('mj-body');
  
  if (!mjmlEl && !bodyEl) return { tree: [], newClasses, globalProps: globalDefaults, typeDefaults, globalFonts, extraStyle };

  let rootNode;
  if (mjmlEl) {
    rootNode = parseEl(mjmlEl);
    // Ensure mjml node has mj-head and mj-body if missing
    if (!rootNode.children.some(c => c.type === 'mj-head')) {
      rootNode.children.unshift({ id: uid(), type: 'mj-head', classes: [], attrs: {}, style: {}, content: '', children: [] });
    }
    if (!rootNode.children.some(c => c.type === 'mj-body')) {
      rootNode.children.push({ id: uid(), type: 'mj-body', classes: [], attrs: {}, style: {}, content: '', children: [] });
    }
  } else {
    // Wrap stand-alone body in mjml/mj-head/mj-body structure
    rootNode = {
      id: uid(), type: 'mjml', classes: [], attrs: {}, style: {}, content: '',
      children: [
        { id: uid(), type: 'mj-head', classes: [], attrs: {}, style: {}, content: '', children: [] },
        parseEl(bodyEl)
      ]
    };
  }

  // Scan for missing classes in the tree
  const usedClasses = new Set();
  function harvest(node) {
    if (node.classes) node.classes.forEach(c => usedClasses.add(c));
    if (node.children) node.children.forEach(harvest);
  }
  harvest(rootNode);
  usedClasses.forEach(c => {
    if (!newClasses.some(nc => nc.name === c)) {
      newClasses.push({ name: c, props: {}, _open: false, _pk: '', _pv: '', dark: false, darkProps: {} });
    }
  });

  return { tree: [rootNode], newClasses, globalProps: globalDefaults, typeDefaults, globalFonts, extraStyle };
}
