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
function buildAttrs(node, globalProps = {}, typeDefaults = {}) {
  let s = '';
  if (node.classes && node.classes.length) s += ` css-class="${[`mja-${node.id}`, ...node.classes].join(' ')}"`;
  else s += ` css-class="mja-${node.id}"`;

  const tagDefaults = typeDefaults[node.type] || {};

  if (node.attrs) {
    for (const [k, v] of Object.entries(node.attrs)) {
      if (v !== undefined && v !== null && v !== '') s += ` ${k}="${String(v).replace(/"/g, '&quot;')}"`;
    }
  }

  // Handle Inline Styles
  if (node.style && Object.keys(node.style).length > 0) {
    const inlineStyles = [];
    const mjAttributes = ['mj-text', 'mj-button', 'mj-column', 'mj-section', 'mj-hero', 'mj-wrapper', 'mj-image', 'mj-divider', 'mj-spacer', 'mj-social', 'mj-social-element', 'mj-navbar', 'mj-navbar-link', 'mj-accordion', 'mj-accordion-element', 'mj-accordion-title', 'mj-accordion-text', 'mj-table'];

    // Properties that MJML supports as direct attributes on almost all tags
    const stdMjmlAttrs = new Set(['align', 'background-color', 'background-url', 'background-repeat', 'background-size', 'background-position', 'border', 'border-bottom', 'border-left', 'border-right', 'border-top', 'border-radius', 'color', 'container-background-color', 'direction', 'font-family', 'font-size', 'font-style', 'font-weight', 'height', 'letter-spacing', 'line-height', 'padding', 'padding-bottom', 'padding-left', 'padding-right', 'padding-top', 'text-align', 'text-decoration', 'vertical-align', 'width', 'src', 'href', 'target', 'alt', 'mode', 'full-width', 'fluid-on-mobile', 'inner-padding', 'inner-background-color', 'text-transform', 'border-width', 'border-style', 'border-color']);


    for (const [k, v] of Object.entries(node.style)) {
      if (v === undefined || v === null || v === '' || k === 'border-width' || k === 'border-style' || k === 'border-color') continue;
      if (stdMjmlAttrs.has(k)) {
        // Suppress if value matches global default OR tag-specific default
        if (globalProps && globalProps[k] === v) continue;
        if (tagDefaults[k] === v) continue;
        s += ` ${k}="${String(v).replace(/"/g, '&quot;')}"`;
      } else {
        inlineStyles.push(`${k}:${v}`);
      }
    }
    if (inlineStyles.length > 0) {
      s += ` style="${inlineStyles.join(';')}"`;
    }
  }

  return s;
}


function compileNode(node, depth, globalProps = {}, typeDefaults = {}) {
  const pad = '  '.repeat(depth);
  const attrs = buildAttrs(node, globalProps, typeDefaults);
  const isLeaf = node.children === undefined;
  if (isLeaf && !node.content) return `${pad}<${node.type}${attrs} />`;
  let out = `${pad}<${node.type}${attrs}>`;
  if (node.content) {
    let c = node.content;
    out += '\n' + '  '.repeat(depth + 1) + c;
  }
  if (node.children) { if (node.children.length) { out += '\n'; for (const c of node.children) out += compileNode(c, depth + 1, globalProps, typeDefaults) + '\n'; out += pad; } }
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
    let css = styleEl.textContent;
    // Improved parser: split by rules, then by selectors
    const ruleBlocks = css.split('}');
    ruleBlocks.forEach(block => {
      const [selectorPart, content] = block.split('{');
      if (!selectorPart || !content) return;
      
      const selectors = selectorPart.split(',').map(s => s.trim());
      const contentTrim = content.trim();
      const props = {};
      contentTrim.split(';').forEach(p => {
        const [k, v] = p.split(':');
        if (k && v) props[k.trim()] = v.replace('!important', '').trim();
      });

      let isComplex = false;
      let handledAsNative = false;

      // Handle each selector in the comma list
      selectors.forEach(fullSelector => {
        // CASE A: Local ID Overrides (.mja-id)
        if (fullSelector.startsWith('.mja-') && !fullSelector.includes(' ') && !fullSelector.includes(',')) {
          mjStyleLookup[fullSelector.replace('.mja-', '')] = props;
          handledAsNative = true;
        }
        // CASE B: Dark Mode Overrides (.mja-forced-dark .className)
        else if (fullSelector.startsWith('.mja-forced-dark')) {
          const sub = fullSelector.match(/\.([a-z0-9_-]+)$/i);
          if (sub) darkStyleLookup[sub[1]] = props;
          handledAsNative = true;
        }
        // CASE C: Simple Global Classes (.className)
        else if (fullSelector.startsWith('.') && !fullSelector.includes(' ') && !fullSelector.includes('>') && !fullSelector.includes(':')) {
          const name = fullSelector.substring(1);
          let existing = newClasses.find(c => c.name === name);
          if (existing) {
            Object.assign(existing.props, props);
          } else {
            newClasses.push({ name, props, _open: false, _pk: '', _pv: '', dark: false, darkProps: {} });
          }
          handledAsNative = true;
        }
        // CASE D: Complex selectors (.tg-h1 p, body, etc.)
        else {
          isComplex = true;
        }
      });

      if (isComplex || !handledAsNative) {
        extraStyle += `${selectorPart.trim()} { ${contentTrim} }\n`;
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

  const stdMjmlAttrs = new Set(['align', 'background-color', 'background-url', 'background-repeat', 'background-size', 'background-position', 'border', 'border-bottom', 'border-left', 'border-right', 'border-top', 'border-radius', 'color', 'container-background-color', 'direction', 'font-family', 'font-size', 'font-style', 'font-weight', 'height', 'letter-spacing', 'line-height', 'padding', 'padding-bottom', 'padding-left', 'padding-right', 'padding-top', 'text-align', 'text-decoration', 'vertical-align', 'width', 'src', 'href', 'target', 'alt', 'mode', 'full-width', 'fluid-on-mobile', 'inner-padding', 'inner-background-color', 'text-transform', 'border-width', 'border-style', 'border-color']);

  function parseEl(el) {
    const type = el.tagName.toLowerCase();
    const cssClassLine = el.getAttribute('css-class') || el.getAttribute('class') || '';
    const m = cssClassLine.match(/\bmja-([a-z0-9]+)\b/);
    const id = m ? m[1] : uid();

    const cls = (el.getAttribute('mj-class') || '').split(' ').filter(Boolean);
    // Capture manual classes, but MIGRATE any that have discovered rules to Global Classes
    const manualCls = cssClassLine.split(' ').filter(c => {
      if (!c || c.startsWith('mja-')) return false;
      if (cls.includes(c)) return false;
      
      // If we found a rule for this in mj-style, treat it as a Global Class
      if (newClasses.some(xc => xc.name === c)) {
        cls.push(c);
        return false;
      }
      return true;
    });
    const attrs = {};
    for (const a of el.attributes) {
      if (a.name !== 'mj-class' && a.name !== 'css-class') attrs[a.name] = a.value;
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
    const style = { ...globalDefaults };
    if (typeDefaults[type]) Object.assign(style, typeDefaults[type]);
    
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

  const bodyEl = doc.querySelector('mj-body');
  if (!bodyEl) return { tree: [], newClasses, globalProps: globalDefaults, typeDefaults, globalFonts, extraStyle };

  const bodyNode = parseEl(bodyEl);
  // Scan for missing classes in the tree
  const usedClasses = new Set();
  function harvest(node) {
    if (node.classes) node.classes.forEach(c => usedClasses.add(c));
    if (node.children) node.children.forEach(harvest);
  }
  harvest(bodyNode);
  usedClasses.forEach(c => {
    if (!newClasses.some(nc => nc.name === c)) {
      newClasses.push({ name: c, props: {}, _open: false, _pk: '', _pv: '', dark: false, darkProps: {} });
    }
  });

  return { tree: [bodyNode], newClasses, globalProps: globalDefaults, typeDefaults, globalFonts, extraStyle };
}
