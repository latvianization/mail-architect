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
const PROP_DEFS = {
  'font-size':      { type: 'slider', min: 8, max: 80, unit: 'px', icon: 'fa-text-height' },
  'font-weight':    { type: 'select', options: ['300', '400', '500', '600', '700', '800', 'normal', 'bold'], icon: 'fa-bold' },
  'line-height':    { type: 'slider', min: 1, max: 3, step: 0.1, unit: '', icon: 'fa-line-height' },
  'letter-spacing': { type: 'slider', min: -2, max: 10, unit: 'px', icon: 'fa-arrows-left-right' },
  'align':          { type: 'select', options: ['left', 'center', 'right', 'justify'], icon: 'fa-align-justify' },
  'color':          { type: 'color', icon: 'fa-droplet' },
  'background-color':{ type: 'color', icon: 'fa-fill-drip' },
  'padding':        { type: 'input', icon: 'fa-expand' },
  'margin':         { type: 'input', icon: 'fa-compress' },
  'border-radius':  { type: 'input', icon: 'fa-circle-notch' },
  'border-width':   { type: 'slider', min: 0, max: 20, unit: 'px', icon: 'fa-border-all' },
  'border-style':   { type: 'select', options: ['none', 'solid', 'dashed', 'dotted'], icon: 'fa-border-none' },
  'border-color':   { type: 'color', icon: 'fa-palette' },
  'width':          { type: 'slider', min: 0, max: 100, unit: '%', icon: 'fa-arrows-left-right' },
  'height':         { type: 'slider', min: 0, max: 500, unit: 'px', icon: 'fa-arrows-up-down' },
  'background-url': { type: 'input', icon: 'fa-image' },
  'background-size':{ type: 'select', options: ['cover', 'contain', 'auto'], icon: 'fa-maximize' },
  'background-repeat':{ type: 'select', options: ['no-repeat', 'repeat', 'repeat-x', 'repeat-y'], icon: 'fa-repeat' },
  'container-background-color':{ type: 'color', icon: 'fa-fill-drip' },
  'inner-background-color':{ type: 'color', icon: 'fa-fill-drip' },
  'inner-padding':  { type: 'input', icon: 'fa-expand' },
  'fluid-on-mobile':{ type: 'select', options: ['true', 'false'], icon: 'fa-mobile-screen' },
  'text-transform': { type: 'select', options: ['none', 'uppercase', 'lowercase', 'capitalize'], icon: 'fa-font' },
};

const PROP_CATEGORIES = [
  { name: 'Typography', icon: 'fa-font', props: ['font-size', 'font-weight', 'line-height', 'align', 'color', 'text-transform'] },
  { name: 'Spacing',    icon: 'fa-arrows-up-down-left-right', props: ['padding', 'margin', 'inner-padding'] },
  { name: 'Appearance', icon: 'fa-palette', props: ['background-color', 'background-url', 'background-size', 'background-repeat', 'container-background-color', 'inner-background-color', 'width', 'height', 'fluid-on-mobile'] },
  { name: 'Borders',    icon: 'fa-square', props: ['border-width', 'border-style', 'border-color', 'border-radius'] },
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

