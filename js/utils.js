// ── Helpers ──────────────────────────────────────────────────
const uid = () => 'n' + Math.random().toString(36).substring(2, 9);

const iconFor = t => iconMap[t] || 'fa-solid fa-cube';

function makeNode(type, withScaffold = false) {

  const isContainer = containerTypes.has(type);
  const classes = [];

  const node = {
    id: uid(), type,
    classes,
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
function buildAttrs(node) {
  let s = '';
  if (node.classes && node.classes.length) s += ` mj-class="${node.classes.join(' ')}"`;

  const cssClasses = [`mja-${node.id}`];
  if (node.classes && node.classes.length) cssClasses.push(...node.classes);
  s += ` css-class="${cssClasses.join(' ')}"`;

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
    const stdMjmlAttrs = new Set(['align', 'background-color', 'border', 'border-bottom', 'border-left', 'border-right', 'border-top', 'border-radius', 'color', 'container-background-color', 'direction', 'font-family', 'font-size', 'font-style', 'font-weight', 'height', 'letter-spacing', 'line-height', 'padding', 'padding-bottom', 'padding-left', 'padding-right', 'padding-top', 'text-align', 'text-decoration', 'vertical-align', 'width', 'src', 'href', 'target', 'alt', 'mode']);


    for (const [k, v] of Object.entries(node.style)) {
      if (v === undefined || v === null || v === '' || k === 'border-width' || k === 'border-style' || k === 'border-color') continue;
      if (stdMjmlAttrs.has(k)) {
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


function compileNode(node, depth) {
  const pad = '  '.repeat(depth);
  const attrs = buildAttrs(node);
  const isLeaf = node.children === undefined;
  if (isLeaf && !node.content) return `${pad}<${node.type}${attrs} />`;
  let out = `${pad}<${node.type}${attrs}>`;
  if (node.content) {
    let c = node.content;
    out += '\n' + '  '.repeat(depth + 1) + c;
  }
  if (node.children) { if (node.children.length) { out += '\n'; for (const c of node.children) out += compileNode(c, depth + 1) + '\n'; out += pad; } }
  out += `</${node.type}>`;
  return out;
}

// ── Import helper ───────────────────────────────────────────
function parseMjmlToTree(src) {
  const parser = new DOMParser();
  // Use text/html to be permissive with loose HTML tags (like <br> or <img>)
  // that are common in MJML but invalid in strict XML.
  const doc = parser.parseFromString(src, 'text/html');

  const mjStyleLookup = {}; // Map of .mja-{id} -> props
  const darkStyleLookup = {}; // Map of .classname -> props

  const styleEl = doc.querySelector('mj-style');
  if (styleEl) {
    const css = styleEl.textContent;
    // Extract local overrides: .mja-id { k: v !important; ... }
    const localMatches = css.matchAll(/\.mja-([a-z0-9]+)\s*\{([^}]+)\}/gi);
    for (const m of localMatches) {
      const id = m[1];
      const props = {};
      m[2].split(';').forEach(p => {
        const [k, v] = p.split(':');
        if (k && v) props[k.trim()] = v.replace('!important', '').trim();
      });
      mjStyleLookup[id] = props;
    }
    // Extract dark mode overrides: .mja-forced-dark .classname { ... }
    const darkMatches = css.matchAll(/\.mja-forced-dark\s+\.([a-z0-9_-]+)[^{]*\{([^}]+)\}/gi);
    for (const m of darkMatches) {
      const cname = m[1];
      const props = {};
      m[2].split(';').forEach(p => {
        const [k, v] = p.split(':');
        if (k && v) props[k.trim()] = v.replace('!important', '').trim();
      });
      darkStyleLookup[cname] = props;
    }
  }

  function parseEl(el) {
    const type = el.tagName.toLowerCase();
    const cssClassLine = el.getAttribute('css-class') || el.getAttribute('class') || '';
    const m = cssClassLine.match(/\bmja-([a-z0-9]+)\b/);
    const id = m ? m[1] : uid();

    const cls = (el.getAttribute('mj-class') || '').split(' ').filter(Boolean);
    const attrs = {};
    for (const a of el.attributes) {
      if (a.name !== 'mj-class') attrs[a.name] = a.value;
    }

    let content = '', children = undefined;

    if (TEXT_TYPES.includes(type)) {
      content = el.innerHTML;
    } else {
      children = [];
      for (const child of el.children) {
        if (child.tagName.toLowerCase().startsWith('mj-')) {
          children.push(parseEl(child));
        }
      }
    }

    // Combine styles from 'style' attribute, standard MJML attributes, and mj-style lookup
    const style = {};

    // 1. From style attribute
    const styleAttr = el.getAttribute('style');
    if (styleAttr) {
      styleAttr.split(';').forEach(pair => {
        const [k, v] = pair.split(':');
        if (k && v) style[k.trim()] = v.trim();
      });
    }

    // 2. From standard MJML attributes
    const stdMjmlAttrs = ['align', 'background-color', 'border', 'border-bottom', 'border-left', 'border-right', 'border-top', 'border-radius', 'color', 'container-background-color', 'direction', 'font-family', 'font-size', 'font-style', 'font-weight', 'height', 'letter-spacing', 'line-height', 'padding', 'padding-bottom', 'padding-left', 'padding-right', 'padding-top', 'text-align', 'text-decoration', 'vertical-align', 'width', 'src', 'href', 'target', 'alt', 'mode'];
    stdMjmlAttrs.forEach(a => {
      const val = el.getAttribute(a);
      if (val) {
        style[a] = val;
        attrs[a] = undefined;
      }
    });

    // 3. From mj-style lookup (local overrides mja-id)
    if (mjStyleLookup[id]) {
      Object.assign(style, mjStyleLookup[id]);
    }

    return { id, type, classes: cls, attrs, style, content, children };
  }

  const newClasses = [];
  const attrsEl = doc.querySelector('mj-attributes');
  if (attrsEl) {
    for (const c of attrsEl.querySelectorAll('mj-class')) {
      const name = c.getAttribute('name');
      if (!name) continue;
      const props = {};
      for (const a of c.attributes) {
        if (a.name !== 'name') props[a.name] = a.value;
      }

      const clsObj = { name, props, _open: false, _pk: '', _pv: '', dark: false, darkProps: {} };
      if (darkStyleLookup[name]) {
        clsObj.dark = true;
        clsObj.darkProps = darkStyleLookup[name];
      }
      newClasses.push(clsObj);
    }
  }

  const bodyEl = doc.querySelector('mj-body');
  if (!bodyEl) throw new Error('No <mj-body> found in MJML.');

  const bodyNode = parseEl(bodyEl);
  // Ensure the body ID remains 'root' if it was root, or adopt the detected ID
  if (!m && !bodyEl.getAttribute('css-class')?.includes('mja-')) {
    bodyNode.id = 'root';
  }

  return { tree: [bodyNode], newClasses };
}

