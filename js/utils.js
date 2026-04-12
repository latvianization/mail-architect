// ── Helpers ──────────────────────────────────────────────────
const uid = () => 'n' + Math.random().toString(36).substring(2, 9);

const iconFor = t => iconMap[t] || 'fa-solid fa-cube';

function makeNode(type) {
  const isContainer = containerTypes.has(type);
  let classes = [];
  if (type === 'mj-text') classes = ['text-default'];
  if (type === 'mj-button') classes = ['btn-primary'];
  if (type === 'mj-section') classes = ['section-default'];

  const node = {
    id: uid(), type,
    classes,
    attrs: {},
    content: defaultContent[type] || '',
    children: isContainer ? [] : undefined,
  };

  // Scaffolding
  if (scaffoldMap[type]) {
    for (const childType of scaffoldMap[type]) {
      node.children.push(makeNode(childType));
    }
  }

  return node;
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
  'color','background-color','border-color',
]);

function isColorProp(key){
  if(!key) return false;
  return COLOR_PROP_KEYS.has(key) || key.includes('color') || key.includes('background');
}

// Convert any CSS color string to #rrggbb that <input type=color> accepts
function colorToHex(val){
  if(!val || typeof val !== 'string') return '#000000';
  const v = val.trim();
  // Already 6-digit hex
  if(/^#[0-9a-f]{6}$/i.test(v)) return v.toLowerCase();
  // Expand 3-digit hex
  if(/^#[0-9a-f]{3}$/i.test(v)) return '#'+v[1]+v[1]+v[2]+v[2]+v[3]+v[3];
  // Use canvas to convert rgb/hsl/named colors
  try{
    const c=document.createElement('canvas'); c.width=c.height=1;
    const ctx=c.getContext('2d'); ctx.fillStyle=v; ctx.fillRect(0,0,1,1);
    const d=ctx.getImageData(0,0,1,1).data;
    return '#'+[d[0],d[1],d[2]].map(n=>n.toString(16).padStart(2,'0')).join('');
  }catch{ return '#000000'; }
}

function disableSystemDark(html){
  if(!html) return '';
  return html.replace(/@media\s*\(\s*prefers-color-scheme\s*:\s*dark\s*\)/gi, '@media (prefers-color-scheme: disabled-mode)');
}

function stripDivTypography(html) {
  if(!html) return html;
  return html.replace(/<div([^>]*)style="([^"]*)"([^>]*)>/gi, (match, prefix, style, postfix) => {
    let s = style.replace(/(?:^|;)\s*(?:font-family|font-size|line-height|text-align|color)\s*:[^;]+/gi, '');
    s = s.replace(/^;+/, '').replace(/;+/g, ';').trim();
    if(!s || s === ';') return `<div${prefix}${postfix}>`;
    return `<div${prefix}style="${s}"${postfix}>`;
  });
}

// ── MJML compilation helpers ────────────────────────────────
function buildAttrs(node){
  let s='';
  if(node.classes&&node.classes.length) s+=` mj-class="${node.classes.join(' ')}"`;
  // Always include a unique css-class for hover-highlight targeting in preview
  const cssClasses=[`mja-${node.id}`];
  if(node.classes&&node.classes.length) cssClasses.push(...node.classes);
  s+=` css-class="${cssClasses.join(' ')}"`;
  if(node.attrs){ for(const[k,v]of Object.entries(node.attrs)){if(v!==undefined&&v!==null&&v!=='')s+=` ${k}="${String(v).replace(/"/g,'&quot;')}"`;} }
  return s;
}

function compileNode(node,depth){
  const pad='  '.repeat(depth);
  const attrs=buildAttrs(node);
  const isLeaf=node.children===undefined;
  if(isLeaf&&!node.content) return `${pad}<${node.type}${attrs} />`;
  let out=`${pad}<${node.type}${attrs}>`;
  if(node.content){
    let c=node.content;
    out+='\n'+'  '.repeat(depth+1)+c;
  }
  if(node.children){ if(node.children.length){out+='\n';for(const c of node.children)out+=compileNode(c,depth+1)+'\n';out+=pad;} }
  out+=`</${node.type}>`;
  return out;
}

// ── Import helper ───────────────────────────────────────────
function parseMjmlToTree(src){
  const parser=new DOMParser();
  const doc=parser.parseFromString(src,'application/xml');
  if(doc.querySelector('parsererror')) throw new Error('Invalid XML/MJML.');
  let _idCtr=1; const mkid=()=>'imp-'+(_idCtr++);
  const TEXT_NODES=new Set(['mj-text','mj-button','mj-raw','mj-table','mj-social-element','mj-navbar-link']);
  function parseEl(el){
    const type=el.tagName; const cls=(el.getAttribute('mj-class')||'').split(' ').filter(Boolean);
    const attrs={};for(const a of el.attributes){if(a.name!=='mj-class')attrs[a.name]=a.value;}
    let content='',children=undefined;
    if(TEXT_NODES.has(type))content=el.innerHTML;
    else if(containerTypes.has(type)){children=[];for(const child of el.children){if(child.tagName.startsWith('mj-'))children.push(parseEl(child));}}
    return {id:mkid(),type,classes:cls,attrs,content,children};
  }
  const newClasses=[];
  const attrsEl=doc.querySelector('mj-head > mj-attributes');
  if(attrsEl){for(const c of attrsEl.querySelectorAll('mj-class')){const name=c.getAttribute('name');if(!name)continue;const props={};for(const a of c.attributes){if(a.name!=='name')props[a.name]=a.value;}newClasses.push({name,props,_open:false,_pk:'',_pv:''}); }}
  const bodyEl=doc.querySelector('mj-body');
  if(!bodyEl)throw new Error('No <mj-body> found in MJML.');
  const bodyNode=parseEl(bodyEl);bodyNode.id='root';
  return {tree:[bodyNode],newClasses};
}
