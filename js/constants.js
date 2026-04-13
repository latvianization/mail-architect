const iconMap = {
  'mj-body':'fa-solid fa-border-all','mj-section':'fa-regular fa-square-full',
  'mj-column':'fa-solid fa-table-columns','mj-group':'fa-solid fa-object-group',
  'mj-text':'fa-solid fa-font','mj-image':'fa-regular fa-image',
  'mj-button':'fa-solid fa-arrow-pointer','mj-divider':'fa-solid fa-grip-lines',
  'mj-spacer':'fa-solid fa-arrows-up-down','mj-social':'fa-solid fa-share-nodes',
  'mj-social-element':'fa-brands fa-twitter','mj-wrapper':'fa-solid fa-box',
  'mj-hero':'fa-solid fa-panorama','mj-accordion':'fa-solid fa-rectangle-list',
  'mj-table':'fa-solid fa-table','mj-raw':'fa-solid fa-code',
  'mj-navbar':'fa-solid fa-bars','mj-navbar-link':'fa-solid fa-link',
};

const compLib = [
  {name:'Body',     type:'mj-body',           icon:'fa-solid fa-border-all',       desc:'Required root element. Use only once per email.'},
  {name:'Section',  type:'mj-section',        icon:'fa-regular fa-square-full',    desc:'Row container to hold your columns.'},
  {name:'Column',   type:'mj-column',         icon:'fa-solid fa-table-columns',    desc:'Vertical column placed inside sections.'},
  {name:'Group',    type:'mj-group',          icon:'fa-solid fa-object-group',     desc:'Keeps columns side-by-side on mobile.'},
  {name:'Text',     type:'mj-text',           icon:'fa-solid fa-font',             desc:'Standard rich text and paragraphs.'},
  {name:'Image',    type:'mj-image',          icon:'fa-regular fa-image',          desc:'Responsive image element.'},
  {name:'Button',   type:'mj-button',         icon:'fa-solid fa-arrow-pointer',    desc:'Clickable actionable button.'},
  {name:'Divider',  type:'mj-divider',        icon:'fa-solid fa-grip-lines',       desc:'Horizontal separation line.'},
  {name:'Spacer',   type:'mj-spacer',         icon:'fa-solid fa-arrows-up-down',   desc:'Empty vertical whitespace.'},
  {name:'Social',   type:'mj-social',         icon:'fa-solid fa-share-nodes',      desc:'Container for social networks.'},
  {name:'Social Btn',type:'mj-social-element',icon:'fa-brands fa-twitter',         desc:'Individual social media icon.'},
  {name:'Wrapper',  type:'mj-wrapper',        icon:'fa-solid fa-box',              desc:'Wraps multiple sections together.'},
  {name:'Hero',     type:'mj-hero',           icon:'fa-solid fa-panorama',         desc:'Section with background image.'},
  {name:'Accordion',type:'mj-accordion',      icon:'fa-solid fa-rectangle-list',   desc:'Interactive collapsible panels.'},
  {name:'Table',    type:'mj-table',          icon:'fa-solid fa-table',            desc:'Raw HTML table for data layout.'},
];

const containerTypes = new Set([
  'mj-body','mj-section','mj-column','mj-group',
  'mj-wrapper','mj-hero','mj-social','mj-accordion','mj-navbar'
]);

const defaultContent = {
  'mj-text':'Your text goes here.',
  'mj-button':'Click Here',
  'mj-raw':'<!-- Custom HTML -->',
  'mj-social-element':'Share',
  'mj-navbar-link':'Link',
  'mj-table':'<tr><th>Header</th></tr><tr><td>Cell</td></tr>',
  'mj-accordion-title':'Accordion Title',
  'mj-accordion-text':'Accordion content goes here.',
};

const scaffoldMap = {
  'mj-section':   ['mj-column'],
  'mj-column':    ['mj-text'],
  'mj-wrapper':   ['mj-section'],
  'mj-group':     ['mj-column', 'mj-column'],
  'mj-social':    ['mj-social-element', 'mj-social-element', 'mj-social-element'],
  'mj-navbar':    ['mj-navbar-link', 'mj-navbar-link', 'mj-navbar-link'],
  'mj-accordion': ['mj-accordion-element'],
  'mj-accordion-element': ['mj-accordion-title', 'mj-accordion-text'],
  'mj-hero':      ['mj-text'],
};

const propSuggestions = [
  'align',
  'background-color', 'background-position', 'background-repeat', 'background-size', 'background-url',
  'border', 'border-bottom', 'border-color', 'border-left', 'border-radius', 'border-right', 'border-style', 'border-top', 'border-width',
  'color', 'container-background-color',
  'direction',
  'font-family', 'font-size', 'font-style', 'font-weight',
  'full-width',
  'height',
  'icon-height', 'icon-padding', 'icon-size',
  'inner-background-color', 'inner-border', 'inner-padding',
  'letter-spacing', 'line-height',
  'margin',
  'max-width',
  'padding', 'padding-bottom', 'padding-left', 'padding-right', 'padding-top',
  'text-align', 'text-decoration', 'text-transform',
  'vertical-align',
  'width'
];

const stdAttrMap = {
  'mj-body':      [],
  'mj-button':    [{key:'href',placeholder:'https://...'},{key:'target',placeholder:'_blank'}],
  'mj-image':     [{key:'src',placeholder:'https://...'},{key:'href',placeholder:'https://...'},{key:'alt',placeholder:'description'}],
  'mj-social-element':[{key:'name',placeholder:'twitter'},{key:'href',placeholder:'https://...'},{key:'src',placeholder:'icon url'}],
  'mj-navbar-link':[{key:'href',placeholder:'https://...'},{key:'target',placeholder:'_blank'}],
  'mj-hero':      [{key:'mode',placeholder:'fixed-height'}],
};

const allowedChildrenMap = {
  'mj-body':      ['mj-section', 'mj-wrapper', 'mj-hero', 'mj-raw'],
  'mj-section':   ['mj-column', 'mj-group', 'mj-raw'],
  'mj-wrapper':   ['mj-section', 'mj-hero', 'mj-raw'],
  'mj-hero':      ['mj-text', 'mj-image', 'mj-button', 'mj-divider', 'mj-spacer', 'mj-social', 'mj-navbar', 'mj-accordion', 'mj-table', 'mj-raw'],
  'mj-column':    ['mj-text', 'mj-image', 'mj-button', 'mj-divider', 'mj-spacer', 'mj-social', 'mj-navbar', 'mj-accordion', 'mj-table', 'mj-raw'],
  'mj-group':     ['mj-column', 'mj-raw'],
  'mj-social':    ['mj-social-element'],
  'mj-navbar':    ['mj-navbar-link'],
  'mj-accordion': ['mj-accordion-element'],
  'mj-accordion-element': ['mj-accordion-title', 'mj-accordion-text'],
};
const PROP_DEFS = {
  'font-size':      { type: 'slider', min: 8, max: 80, unit: 'px', icon: 'fa-text-height' },
  'font-weight':    { type: 'select', options: ['300', '400', '500', '600', '700', '800', 'normal', 'bold'], icon: 'fa-bold' },
  'line-height':    { type: 'slider', min: 1, max: 3, step: 0.1, unit: '', icon: 'fa-line-height' },
  'letter-spacing': { type: 'slider', min: -2, max: 10, unit: 'px', icon: 'fa-arrows-left-right' },
  'text-align':     { type: 'select', options: ['left', 'center', 'right', 'justify'], icon: 'fa-align-left' },
  'align':          { type: 'select', options: ['left', 'center', 'right'], icon: 'fa-align-justify' },
  'color':          { type: 'color', icon: 'fa-droplet' },
  'background-color':{ type: 'color', icon: 'fa-fill-drip' },
  'padding':        { type: 'sides', min: 0, max: 100, unit: 'px', icon: 'fa-expand' },
  'margin':         { type: 'sides', min: 0, max: 100, unit: 'px', icon: 'fa-compress' },
  'border-radius':  { type: 'slider', min: 0, max: 100, unit: 'px', icon: 'fa-circle-notch' },
  'border-width':   { type: 'slider', min: 0, max: 20, unit: 'px', icon: 'fa-border-all' },
  'border-style':   { type: 'select', options: ['none', 'solid', 'dashed', 'dotted'], icon: 'fa-border-none' },
  'border-color':   { type: 'color', icon: 'fa-palette' },
  'width':          { type: 'slider', min: 0, max: 100, unit: '%', icon: 'fa-arrows-left-right' },
};

const PROP_CATEGORIES = [
  { name: 'Typography', icon: 'fa-font', props: ['font-size', 'font-weight', 'line-height', 'letter-spacing', 'text-align', 'align', 'color'] },
  { name: 'Spacing',    icon: 'fa-arrows-up-down-left-right', props: ['padding', 'margin'] },
  { name: 'Appearance', icon: 'fa-palette', props: ['background-color', 'width'] },
  { name: 'Borders',    icon: 'fa-square', props: ['border-width', 'border-style', 'border-color', 'border-radius'] },
];
