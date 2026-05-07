const iconMap = {
  'mj-body':'fa-solid fa-border-all','mj-section':'fa-regular fa-square-full',
  'mj-column':'fa-solid fa-table-columns','mj-group':'fa-solid fa-object-group',
  'mj-text':'fa-solid fa-font','mj-image':'fa-regular fa-image',
  'mj-button':'fa-solid fa-arrow-pointer','mj-divider':'fa-solid fa-grip-lines',
  'mj-spacer':'fa-solid fa-arrows-up-down','mj-social':'fa-solid fa-share-nodes',
  'mj-social-element':'fa-brands fa-twitter', 'mj-wrapper':'fa-solid fa-box',
  'mj-hero':'fa-solid fa-panorama', 'mj-accordion':'fa-solid fa-rectangle-list',
  'mj-table':'fa-solid fa-table', 'mj-raw':'fa-solid fa-code',
  'mj-navbar':'fa-solid fa-bars', 'mj-navbar-link':'fa-solid fa-link',
  'mjml':'fa-solid fa-file-code', 'mj-head':'fa-solid fa-gears',
  'mj-title':'fa-solid fa-heading', 'mj-preview':'fa-solid fa-eye',
  'mj-breakpoint':'fa-solid fa-mobile-screen', 'mj-carousel':'fa-solid fa-images',
  'mj-carousel-image':'fa-solid fa-image', 'mj-include':'fa-solid fa-file-import',
  'mj-style':'fa-solid fa-palette', 'mj-font':'fa-solid fa-font-awesome',
  'mj-attributes':'fa-solid fa-list-check', 'mj-all':'fa-solid fa-asterisk',
  'mj-class':'fa-solid fa-tag'
};

const compLib = [
  {name:'Title',    type:'mj-title',          icon:'fa-solid fa-heading',          desc:'Set the HTML title of your email.'},
  {name:'Preview',  type:'mj-preview',        icon:'fa-solid fa-eye',              desc:'Set the preheader text visible in inboxes.'},
  {name:'Breakpoint',type:'mj-breakpoint',    icon:'fa-solid fa-mobile-screen',    desc:'Define mobile breakpoint width.'},
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
  {name:'Carousel', type:'mj-carousel',       icon:'fa-solid fa-images',           desc:'Interactive image gallery gallery.'},
  {name:'Table',    type:'mj-table',          icon:'fa-solid fa-table',            desc:'Raw HTML table for data layout.'},
  {name:'Raw',      type:'mj-raw',            icon:'fa-solid fa-code',             desc:'Generic HTML container.'},
  {name:'Include',  type:'mj-include',        icon:'fa-solid fa-file-import',      desc:'Include external MJML snippet.'},
];

const containerTypes = new Set([
  'mjml','mj-head','mj-body','mj-section','mj-column','mj-group',
  'mj-wrapper','mj-hero','mj-social','mj-accordion','mj-navbar', 'mj-carousel'
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
  'mj-title': 'Email Title',
  'mj-preview': 'Preheader text content...',
};

const TEXT_TYPES = ['mj-text', 'mj-button', 'mj-raw', 'mj-social-element', 'mj-navbar-link', 'mj-table', 'mj-accordion-title', 'mj-accordion-text', 'mj-title', 'mj-preview'];

const scaffoldMap = {
  'mjml':         ['mj-head', 'mj-body'],
  'mj-section':   ['mj-column'],
  'mj-column':    ['mj-text'],
  'mj-wrapper':   ['mj-section'],
  'mj-group':     ['mj-column', 'mj-column'],
  'mj-social':    ['mj-social-element', 'mj-social-element', 'mj-social-element'],
  'mj-navbar':    ['mj-navbar-link', 'mj-navbar-link', 'mj-navbar-link'],
  'mj-accordion': ['mj-accordion-element'],
  'mj-accordion-element': ['mj-accordion-title', 'mj-accordion-text'],
  'mj-hero':      ['mj-text'],
  'mj-carousel':  ['mj-carousel-image', 'mj-carousel-image'],
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
  'mjml':         [],
  'mj-head':      [],
  'mj-body':      [],
  'mj-button':    [{key:'href',placeholder:'https://...'},{key:'target',placeholder:'_blank'},{key:'rel',placeholder:'nofollow'}],
  'mj-image':     [{key:'src',placeholder:'https://...'},{key:'href',placeholder:'https://...'},{key:'alt',placeholder:'description'}],
  'mj-social-element':[{key:'name',placeholder:'twitter'},{key:'href',placeholder:'https://...'},{key:'src',placeholder:'icon url'},{key:'rel',placeholder:'nofollow'}],
  'mj-navbar-link':[{key:'href',placeholder:'https://...'},{key:'target',placeholder:'_blank'},{key:'rel',placeholder:'nofollow'}],
  'mj-hero':      [{key:'mode',placeholder:'fixed-height'}],
  'mj-carousel-image':[{key:'src',placeholder:'https://...'},{key:'href',placeholder:'https://...'},{key:'alt',placeholder:'description'}],
  'mj-breakpoint':[{key:'width',placeholder:'480px'}],
  'mj-include':   [{key:'path',placeholder:'path/to/snippet.mjml'}],
};

const allowedChildrenMap = {
  'mjml':         ['mj-head', 'mj-body'],
  'mj-head':      ['mj-title', 'mj-preview', 'mj-breakpoint', 'mj-font', 'mj-style', 'mj-attributes', 'mj-raw'],
  'mj-body':      ['mj-section', 'mj-wrapper', 'mj-hero', 'mj-raw'],
  'mj-section':   ['mj-column', 'mj-group', 'mj-raw'],
  'mj-wrapper':   ['mj-section', 'mj-hero', 'mj-raw'],
  'mj-hero':      ['mj-text', 'mj-image', 'mj-button', 'mj-divider', 'mj-spacer', 'mj-social', 'mj-navbar', 'mj-accordion', 'mj-carousel', 'mj-table', 'mj-raw'],
  'mj-column':    ['mj-text', 'mj-image', 'mj-button', 'mj-divider', 'mj-spacer', 'mj-social', 'mj-navbar', 'mj-accordion', 'mj-carousel', 'mj-table', 'mj-raw'],
  'mj-group':     ['mj-column', 'mj-raw'],
  'mj-social':    ['mj-social-element'],
  'mj-navbar':    ['mj-navbar-link'],
  'mj-accordion': ['mj-accordion-element'],
  'mj-accordion-element': ['mj-accordion-title', 'mj-accordion-text'],
  'mj-carousel':  ['mj-carousel-image'],
};
const TAG_PROPS = {
  'mj-body': ['background-color', 'width'],
  'mj-section': [
    'background-color', 'background-url', 'background-repeat', 'background-size', 'background-position',
    'padding', 'padding-top', 'padding-bottom', 'padding-left', 'padding-right', 
    'full-width', 'border', 'border-radius', 'text-align', 'direction'
  ],
  'mj-wrapper': [
    'background-color', 'background-url', 'background-repeat', 'background-size', 'background-position',
    'padding', 'padding-top', 'padding-bottom', 'padding-left', 'padding-right', 
    'full-width', 'border', 'border-radius', 'text-align'
  ],
  'mj-column': [
    'background-color', 'width', 'vertical-align', 
    'padding', 'padding-top', 'padding-bottom', 'padding-left', 'padding-right', 
    'border', 'border-radius', 'inner-background-color', 'inner-padding', 'direction'
  ],
  'mj-text': [
    'color', 'font-family', 'font-size', 'font-weight', 'line-height', 'letter-spacing', 'align', 
    'padding', 'padding-top', 'padding-bottom', 'padding-left', 'padding-right', 
    'container-background-color', 'text-transform', 'text-decoration'
  ],
  'mj-image': [
    'src', 'href', 'alt', 'title', 'target', 'width', 'height', 
    'padding', 'padding-top', 'padding-bottom', 'padding-left', 'padding-right', 
    'fluid-on-mobile', 'align', 'border', 'border-radius', 'container-background-color'
  ],
  'mj-button': [
    'background-color', 'color', 'font-family', 'font-size', 'font-weight', 'line-height', 'letter-spacing',
    'align', 'padding', 'padding-top', 'padding-bottom', 'padding-left', 'padding-right', 
    'inner-padding', 'border', 'border-radius', 'href', 'target', 'width', 'vertical-align',
    'container-background-color', 'text-transform', 'text-decoration'
  ],
  'mj-divider': [
    'border-color', 'border-style', 'border-width', 'width', 'align', 
    'padding', 'padding-top', 'padding-bottom', 'padding-left', 'padding-right', 
    'container-background-color'
  ],
  'mj-spacer': ['height', 'width', 'container-background-color', 'padding'],
  'mj-social': [
    'align', 'font-family', 'font-size', 'icon-size', 'icon-height', 'icon-padding', 
    'mode', 'padding', 'padding-top', 'padding-bottom', 'padding-left', 'padding-right',
    'container-background-color', 'inner-padding', 'text-padding'
  ],
  'mj-social-element': [
    'background-color', 'color', 'font-family', 'font-size', 'font-weight', 
    'href', 'src', 'target', 'icon-size', 'icon-height', 'padding', 'padding-top', 'padding-bottom', 'padding-left', 'padding-right',
    'text-padding', 'line-height', 'text-decoration'
  ],
  'mj-hero': [
    'background-color', 'background-url', 'background-position', 'background-repeat', 'background-size', 
    'height', 'width', 'padding', 'padding-top', 'padding-bottom', 'padding-left', 'padding-right',
    'vertical-align', 'mode'
  ],
  'mj-navbar': [
    'align', 'padding', 'padding-top', 'padding-bottom', 'padding-left', 'padding-right',
    'hamburger', 'ico-color', 'ico-font-size'
  ],
  'mj-navbar-link': [
    'color', 'font-family', 'font-size', 'font-weight', 'href', 'target', 
    'padding', 'padding-top', 'padding-bottom', 'padding-left', 'padding-right',
    'text-transform', 'text-decoration', 'line-height'
  ],
  'mj-accordion': [
    'container-background-color', 'border', 'padding', 'padding-top', 'padding-bottom', 'padding-left', 'padding-right',
    'font-family'
  ],
  'mj-accordion-element': ['background-color', 'family', 'icon-align', 'icon-height', 'icon-width', 'icon-position'],
  'mj-accordion-title': ['background-color', 'color', 'font-family', 'font-size', 'padding', 'padding-top', 'padding-bottom', 'padding-left', 'padding-right'],
  'mj-accordion-text': ['background-color', 'color', 'font-family', 'font-size', 'padding', 'padding-top', 'padding-bottom', 'padding-left', 'padding-right'],
  'mj-table': [
    'color', 'font-family', 'font-size', 'line-height', 'padding', 'padding-top', 'padding-bottom', 'padding-left', 'padding-right',
    'width', 'container-background-color', 'border', 'cellpadding', 'cellspacing'
  ],
  'mj-carousel': ['background-color', 'border-radius', 'icon-width', 'left-icon', 'right-icon', 'thumbnails', 'align'],
  'mj-group': ['width', 'vertical-align', 'background-color', 'direction'],
  'mj-carousel-image': ['src', 'alt', 'href', 'title', 'target', 'thumbnails-src']
};
const PROP_DEFS = {
  // Typography & Layout
  'color':          { type: 'color', icon: 'fa-droplet' },
  'font-family':    { type: 'input', icon: 'fa-font' },
  'font-size':      { type: 'slider', min: 8, max: 80, unit: 'px', icon: 'fa-text-height' },
  'font-weight':    { type: 'select', options: ['300', '400', '500', '600', '700', '800', 'normal', 'bold'], icon: 'fa-bold' },
  'line-height':    { type: 'slider', min: 1, max: 3, step: 0.1, unit: '', icon: 'fa-line-height' },
  'letter-spacing': { type: 'input', icon: 'fa-text-width' },
  'align':          { type: 'select', options: ['left', 'center', 'right', 'justify'], icon: 'fa-align-justify' },
  'background-color':{ type: 'color', icon: 'fa-fill-drip' },
  'text-transform': { type: 'select', options: ['none', 'uppercase', 'lowercase', 'capitalize'], icon: 'fa-font' },
  'text-decoration':{ type: 'select', options: ['none', 'underline', 'overline', 'line-through'], icon: 'fa-underline' },
  'direction':      { type: 'select', options: ['ltr', 'rtl'], icon: 'fa-arrow-right-arrow-left' },

  // Spacing & Sizing
  'padding':        { type: 'input', icon: 'fa-expand' },
  'padding-top':    { type: 'input', icon: 'fa-arrow-up' },
  'padding-bottom': { type: 'input', icon: 'fa-arrow-down' },
  'padding-left':   { type: 'input', icon: 'fa-arrow-left' },
  'padding-right':  { type: 'input', icon: 'fa-arrow-right' },
  'width':          { type: 'slider', min: 0, max: 100, unit: '%', icon: 'fa-arrows-left-right' },
  'height':         { type: 'slider', min: 0, max: 500, unit: 'px', icon: 'fa-arrows-up-down' },
  'border':         { type: 'input', icon: 'fa-square-minus' },
  'border-radius':  { type: 'input', icon: 'fa-circle-notch' },
  'border-width':   { type: 'slider', min: 0, max: 20, unit: 'px', icon: 'fa-border-all' },
  'border-style':   { type: 'select', options: ['none', 'solid', 'dashed', 'dotted'], icon: 'fa-border-none' },
  'border-color':   { type: 'color', icon: 'fa-palette' },
  'margin':         { type: 'input', icon: 'fa-compress' },
  'cellpadding':    { type: 'input', icon: 'fa-table-cells' },
  'cellspacing':    { type: 'input', icon: 'fa-table-cells-large' },

  // Image Specifics
  'src':            { type: 'input', icon: 'fa-image' },
  'href':           { type: 'input', icon: 'fa-link' },
  'alt':            { type: 'input', icon: 'fa-quote-left' },
  'title':          { type: 'input', icon: 'fa-circle-info' },
  'fluid-on-mobile':{ type: 'select', options: ['true', 'false'], icon: 'fa-mobile-screen' },
  'thumbnails-src': { type: 'input', icon: 'fa-image' },

  // Column & Section Controls
  'vertical-align': { type: 'select', options: ['top', 'middle', 'bottom'], icon: 'fa-align-center' },
  'full-width':     { type: 'select', options: ['true', 'false'], icon: 'fa-arrows-left-right' },
  'background-url': { type: 'input', icon: 'fa-image' },
  'background-size':{ type: 'select', options: ['cover', 'contain', 'auto'], icon: 'fa-maximize' },
  'background-repeat':{ type: 'select', options: ['no-repeat', 'repeat', 'repeat-x', 'repeat-y'], icon: 'fa-repeat' },
  'background-position':{ type: 'input', icon: 'fa-location-dot' },
  'text-align':     { type: 'select', options: ['left', 'center', 'right', 'justify'], icon: 'fa-align-left' },
  'container-background-color':{ type: 'color', icon: 'fa-fill-drip' },

  // Button & Navbar Functional
  'inner-background-color':{ type: 'color', icon: 'fa-fill-drip' },
  'inner-padding':  { type: 'input', icon: 'fa-expand' },
  'text-padding':   { type: 'input', icon: 'fa-expand' },
  'target':         { type: 'select', options: ['_blank', '_self'], icon: 'fa-up-right-from-square' },
  'hamburger':      { type: 'select', options: ['hamburger', 'none'], icon: 'fa-burger' },
  'ico-color':      { type: 'color', icon: 'fa-palette' },
  'ico-font-size':  { type: 'slider', min: 8, max: 60, unit: 'px', icon: 'fa-text-height' },

  // Accordion Specific
  'icon-align':     { type: 'select', options: ['top', 'middle', 'bottom'], icon: 'fa-align-center' },
  'icon-position':  { type: 'select', options: ['left', 'right'], icon: 'fa-arrows-left-right' },
  'icon-height':    { type: 'input', icon: 'fa-arrows-up-down' },
  'icon-width':     { type: 'input', icon: 'fa-arrows-left-right' },
};

const PROP_CATEGORIES = [
  { name: 'Typography & Layout', icon: 'fa-font', props: ['color', 'font-family', 'font-size', 'font-weight', 'line-height', 'letter-spacing', 'align', 'background-color', 'text-transform', 'text-decoration', 'direction'] },
  { name: 'Spacing & Sizing',    icon: 'fa-arrows-up-down-left-right', props: ['padding', 'padding-top', 'padding-bottom', 'padding-left', 'padding-right', 'width', 'height', 'margin', 'border', 'border-radius', 'border-width', 'border-style', 'border-color', 'cellpadding', 'cellspacing'] },
  { name: 'Image Specifics',     icon: 'fa-regular fa-image', props: ['src', 'href', 'alt', 'fluid-on-mobile', 'title', 'thumbnails-src'] },
  { name: 'Column & Section Controls', icon: 'fa-table-columns', props: ['vertical-align', 'full-width', 'background-url', 'background-repeat', 'background-size', 'background-position', 'text-align', 'container-background-color'] },
  { name: 'Button & Navbar Functional', icon: 'fa-sliders', props: ['inner-padding', 'text-padding', 'target', 'hamburger', 'ico-color', 'ico-font-size'] },
  { name: 'Accordion Controls',  icon: 'fa-rectangle-list', props: ['icon-align', 'icon-position', 'icon-height', 'icon-width'] },
];

const templateLib = [
  {
    name: '2 Columns',
    type: 'tmpl-2col',
    icon: 'fa-solid fa-columns',
    desc: 'A section pre-filled with two equal columns.',
    build: () => {
      const section = makeNode('mj-section');
      section.children = [makeNode('mj-column'), makeNode('mj-column')];
      return section;
    }
  },
  {
    name: 'Hero Unit',
    type: 'tmpl-hero',
    icon: 'fa-solid fa-image',
    desc: 'Hero section with background image and text.',
    build: () => {
      const hero = makeNode('mj-hero');
      hero.attrs.mode = 'fixed-height';
      hero.attrs['background-url'] = 'https://picsum.photos/800/400';
      hero.children = [makeNode('mj-column')];
      hero.children[0].children = [makeNode('mj-text')];
      hero.children[0].children[0].content = '<h1 style="text-align:center; color:#ffffff">Welcome!</h1>';
      return hero;
    }
  },
  {
    name: 'Social Bar',
    type: 'tmpl-social',
    icon: 'fa-solid fa-share-nodes',
    desc: 'Social media container with Twitter, Facebook, and Instagram.',
    build: () => {
      const social = makeNode('mj-social');
      social.children = [
        makeNode('mj-social-element'),
        makeNode('mj-social-element'),
        makeNode('mj-social-element')
      ];
      social.children[0].attrs.name = 'twitter';
      social.children[1].attrs.name = 'facebook';
      social.children[2].attrs.name = 'instagram';
      return social;
    }
  },
  {
    name: 'Product Card',
    type: 'tmpl-product',
    icon: 'fa-solid fa-cart-shopping',
    desc: 'Complete product block: Image, Title, Price and Button.',
    build: () => {
      const section = makeNode('mj-section');
      const column = makeNode('mj-column');
      const img = makeNode('mj-image');
      img.attrs.src = 'https://picsum.photos/400/300';
      const title = makeNode('mj-text');
      title.attrs['padding-bottom'] = '0px';
      title.content = '<h3 style="margin:0; font-size:18px">Premium Leather Bag</h3>';
      const price = makeNode('mj-text');
      price.attrs['padding-top'] = '4px';
      price.attrs.color = '#6366f1';
      price.attrs['font-size'] = '16px';
      price.attrs['font-weight'] = '700';
      price.content = '$129.00';
      const btn = makeNode('mj-button');
      btn.attrs['background-color'] = '#4f46e5';
      btn.attrs['border-radius'] = '8px';
      btn.attrs.width = '100%';
      btn.content = 'Add to Cart';
      
      column.children = [img, title, price, btn];
      section.children = [column];
      return section;
    }
  },
  {
    name: '3-Col Features',
    type: 'tmpl-3col-features',
    icon: 'fa-solid fa-table-cells',
    desc: 'Three vertical columns with icons, perfect for USPs or service lists.',
    build: () => {
      const section = makeNode('mj-section');
      const createFeature = (icon, title) => {
        const col = makeNode('mj-column');
        const img = makeNode('mj-image');
        img.attrs.src = icon;
        img.attrs.width = '64px';
        const txt = makeNode('mj-text');
        txt.attrs.align = 'center';
        txt.content = `<div style="text-align:center"><strong>${title}</strong><br/><span style="color:#64748b; font-size:13px">Premium design patterns for modern apps.</span></div>`;
        col.children = [img, txt];
        return col;
      };
      section.children = [
        createFeature('https://cdn-icons-png.flaticon.com/512/3159/3159310.png', 'Modern'),
        createFeature('https://cdn-icons-png.flaticon.com/512/3159/3159298.png', 'Fast'),
        createFeature('https://cdn-icons-png.flaticon.com/512/3159/3159302.png', 'Secure')
      ];
      return section;
    }
  },
  {
    name: 'Split Article',
    type: 'tmpl-article',
    icon: 'fa-solid fa-newspaper',
    desc: 'Image on left, text on right. Perfect for newsletter highlights.',
    build: () => {
      const section = makeNode('mj-section');
      const colImg = makeNode('mj-column');
      const img = makeNode('mj-image');
      img.attrs.src = 'https://picsum.photos/600/400?article=1';
      img.attrs.padding = '0px';
      colImg.children = [img];
      
      const colText = makeNode('mj-column');
      colText.attrs.padding = '20px';
      const tag = makeNode('mj-text');
      tag.attrs.color = '#ef4444';
      tag.attrs['font-size'] = '11px';
      tag.attrs['font-weight'] = '800';
      tag.attrs['text-transform'] = 'uppercase';
      tag.content = 'New Arrival';
      const title = makeNode('mj-text');
      title.attrs['font-size'] = '20px';
      title.attrs['font-weight'] = '700';
      title.content = 'The Future of Email Design';
      const desc = makeNode('mj-text');
      desc.attrs.color = '#475569';
      desc.content = 'Discover how AI is transforming the way we build and send professional emails...';
      const lnk = makeNode('mj-text');
      lnk.content = '<a href="#" style="color:#4f46e5; font-weight:700; text-decoration:none">Read More →</a>';
      
      colText.children = [tag, title, desc, lnk];
      section.children = [colImg, colText];
      return section;
    }
  },
  {
    name: 'Pro Footer',
    type: 'tmpl-footer-pro',
    icon: 'fa-solid fa-shoe-prints',
    desc: 'Complete footer with social bar, links, and legal text.',
    build: () => {
      const section = makeNode('mj-section');
      section.attrs['background-color'] = '#f8fafc';
      section.attrs.padding = '40px 20px';
      
      const col = makeNode('mj-column');
      const social = makeNode('mj-social');
      social.attrs['font-size'] = '12px';
      social.attrs['icon-size'] = '24px';
      social.attrs.mode = 'horizontal';
      ['facebook', 'twitter', 'instagram', 'linkedin'].forEach(n => {
        const el = makeNode('mj-social-element');
        el.attrs.name = n;
        social.children.push(el);
      });
      
      const links = makeNode('mj-text');
      links.attrs.align = 'center';
      links.attrs.color = '#64748b';
      links.attrs['font-size'] = '13px';
      links.content = '<a href="#" style="color:#64748b; margin:0 10px; text-decoration:none">Privacy</a> • <a href="#" style="color:#64748b; margin:0 10px; text-decoration:none">Terms</a> • <a href="#" style="color:#64748b; margin:0 10px; text-decoration:none">Unsubscribe</a>';
      
      const legal = makeNode('mj-text');
      legal.attrs.align = 'center';
      legal.attrs.color = '#94a3b8';
      legal.attrs['font-size'] = '11px';
      legal.attrs['padding-top'] = '20px';
      legal.content = '© 2026 MailArchitect Inc. 123 Design St, Creative Valley, CA.';
      
      col.children = [social, links, legal];
      section.children = [col];
      return section;
    }
  }
];

