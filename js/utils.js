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
    const classList = (node.classes || []).filter(c => !c.startsWith('mja-fix-w-'));
    if (previewMode && includeInternalIds) {
      classList.unshift(`mja-${node.id}`);
    }

    if (node.type === 'mj-column' || node.type === 'mj-group') {
      let w = node.style?.width || node.attrs?.width;
      
      // If no direct width, check if any applied class defines one
      if (!w && options.allClasses && node.classes) {
        for (const cn of node.classes) {
          const cDef = options.allClasses.find(x => x.name === cn);
          if (cDef && (cDef.props?.width || cDef.style?.width || cDef.attrs?.width)) {
            w = cDef.props?.width || cDef.style?.width || cDef.attrs?.width;
            break;
          }
        }
      }

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

  const finalAttrs = {};
  if (node.attrs) {
    for (const [k, v] of Object.entries(node.attrs)) {
      if (v !== undefined && v !== null && v !== '') finalAttrs[k] = v;
    }
  }

  // Handle Inline Styles
  if (node.style && Object.keys(node.style).length > 0) {
    const inlineStyles = [];

    for (const [k, v] of Object.entries(node.style)) {
      if (v === undefined || v === null || v === '') continue;
      if (stdMjmlAttrs.has(k)) {
        // Suppress if value matches global default OR tag-specific default
        if (globalProps && globalProps[k] === v) continue;
        if (tagDefaults[k] === v) continue;
        finalAttrs[k] = v;
      } else if (!noRawStyleTags.has(node.type)) {
        inlineStyles.push(`${k}:${v}`);
      }
    }
    if (inlineStyles.length > 0 && !noRawStyleTags.has(node.type)) {
      finalAttrs['style'] = inlineStyles.join(';');
    }
  }

  // Force mj-text to inherit color natively to allow CSS classes to cascade effectively 
  // and override MJML's hard-coded default `#000000` text color without requiring complex child selectors.
  if (node.type === 'mj-text') {
    const hasInlineColor = finalAttrs['color'];
    if (!hasInlineColor) {
      finalAttrs['color'] = 'inherit';
    }
  }

  for (const [k, v] of Object.entries(finalAttrs)) {
    s += ` ${k}="${String(v).replace(/"/g, '&quot;')}"`;
  }

  return s;
}

function formatMjml(src) {
  if (!src) return '';
  // Since compileNode now handles indentation, we just use beautify to clean up any oddities 
  // and handle the mj-style CSS block formatting.
  if (window.html_beautify) {
    return window.html_beautify(src, {
      indent_size: 2,
      wrap_line_length: 120,
      unformatted: ['mj-text', 'mj-raw', 'mj-style'],
      content_unformatted: ['mj-text', 'mj-raw', 'mj-style'],
      indent_inner_html: true,
      extra_liners: []
    });
  }
  return src;
}

function compileNode(node, depth = 0, globalProps = {}, typeDefaults = {}, options = {}) {
  const pad = '  '.repeat(depth);
  const attrs = buildAttrs(node, globalProps, typeDefaults, options);
  const isLeaf = node.children === undefined;

  if (isLeaf && !node.content) return `${pad}<${node.type}${attrs} />`;

  let out = `${pad}<${node.type}${attrs}>`;

  if (node.content) {
    // For content, we trim it and then put it on a new line with indentation if it's a block
    // but for mj-text we might want to keep it somewhat compact if it's short.
    const cleanContent = node.content.trim();
    const lines = cleanContent.split('\n');
    
    // Only add manual formatting newlines if there are actual physical newlines in the content,
    // OR if it's a style block which usually looks better formatted.
    if (lines.length > 1 || node.type === 'mj-style') {
      out += '\n' + lines.map(l => '  '.repeat(depth + 1) + l).join('\n') + '\n' + pad;
    } else {
      out += cleanContent;
    }
  }

  if (node.children && node.children.length) {
    out += '\n';
    for (const c of node.children) {
      out += compileNode(c, depth + 1, globalProps, typeDefaults, options) + '\n';
    }
    out += pad;
  }

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
  const styleEls = doc.querySelectorAll('mj-style');
  for (const styleEl of styleEls) {
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
      
      // Builder-generated patterns to skip entirely during import
      const filteredSelectors = selectors.filter(s => {
        if (s.includes('[style*="border-radius"]')) return false;
        if (s.includes('.mja-fix-w-')) return false;
        if (s.includes(' > table') || s.includes(' > div > table')) return false;
        if (/\s+(div|span|a|td)$/i.test(s)) return false;
        return true;
      });

      if (filteredSelectors.length === 0) return;

      const props = {};
      contentTrim.split(';').forEach(p => {
        const [k, v] = p.split(':');
        if (k && v) props[k.trim()] = v.replace('!important', '').trim();
      });

      if (Object.keys(props).length === 0) return;

      const complexSelectors = [];

      filteredSelectors.forEach(fullSelector => {
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
          // If it's "body", and we have an mj-body, it might be better handled, 
          // but for now we keep it in extraStyle to be safe.
          complexSelectors.push(fullSelector);
        }
      });

      if (complexSelectors.length > 0) {
        let rule = `${complexSelectors.join(', ')} { ${contentTrim} }`;
        if (isDark) {
          let darkBlock = `@media (prefers-color-scheme: dark) {\n  ${rule}\n}\n`;
          if (!extraStyle.includes(darkBlock)) extraStyle += darkBlock;
        } else {
          if (!extraStyle.includes(rule)) extraStyle += rule + '\n';
        }
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


  function parseEl(el) {
    const type = el.tagName.toLowerCase();
    const idAttr = el.getAttribute('id') || '';
    const m = idAttr.match(/^mja-([a-z0-9]+)$/);
    const id = m ? m[1] : uid();

    const cls = (el.getAttribute('mj-class') || '').split(' ').filter(Boolean);
    const cssCls = (el.getAttribute('css-class') || el.getAttribute('class') || '').split(' ').filter(c => c && !c.startsWith('mja-'));
    cssCls.forEach(c => { if (!cls.includes(c)) cls.push(c); });
    const attrs = {};
    for (const a of el.attributes) {
      if (a.name !== 'mj-class' && a.name !== 'css-class' && a.name !== 'id') attrs[a.name] = a.value;
    }

    let content = '', children = undefined;
    if (TEXT_TYPES.includes(type)) {
      // Very aggressive trim to ensure DOMParser doesn't leak leading newlines from formatted HTML back into the content model
      content = el.innerHTML.trim().replace(/^[\r\n]+|[\r\n]+$/g, '').trim().replace(/&nbsp;|\u00A0/g, ' ');
    } else {
      children = [];
      for (const child of el.children) {
        const ctype = child.tagName.toLowerCase();
        if (ctype.startsWith('mj-')) {
          // Skip blocks that we've already parsed into application state to avoid duplication in the tree
          if (ctype === 'mj-style' || ctype === 'mj-font' || ctype === 'mj-attributes') continue;
          children.push(parseEl(child));
        }
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
