const { createApp, ref, reactive, computed, watch, onMounted, nextTick } = Vue;

const app = createApp({
  components:{'tree-node':TreeNodeComp, 'visual-editor': VisualEditorComp, 'draggable': window.vuedraggable},
  setup(){
    const deviceWidth   = ref('100%');
    const deviceLabel   = computed(()=>({'100%':'Desktop','768px':'Tablet 768px','414px':'Mobile L 414px','375px':'Mobile S 375px'}[deviceWidth.value]||deviceWidth.value));
    const previewTheme  = ref('light');
    const viewMode      = ref('builder');
    const showGuides    = ref(false);
    const tab           = ref('node');
    const selectedId    = ref(null);
    const previewFrame  = ref(null);
    const previewWrap   = ref(null);
    const previewHeight = ref(600);
    const compileError  = ref(false);

    // Export
    const exportOpen    = ref(false);
    const exportTab     = ref('light');
    const exportHtml    = ref('');
    const exportHtmlDark= ref('');

    // Import
    const importOpen      = ref(false);
    const importText      = ref('');
    const importErr       = ref('');
    const importFileInput = ref(null);

    // IO menu
    const ioMenuOpen = ref(false);
    const linkInput = ref(null);
    const vClickOutside = {
      mounted(el, binding) {
        el._clickOutside = (ev) => { if (!(el === ev.target || el.contains(ev.target))) binding.value(ev); };
        document.addEventListener('click', el._clickOutside);
      },
      unmounted(el) { document.removeEventListener('click', el._clickOutside); }
    };
    function closeIoMenu(e){ if(!e.target.closest('#io-wrap')) ioMenuOpen.value=false; }
    onMounted(()=>document.addEventListener('click',closeIoMenu));

    // Context from localStorage
    const SAVE_KEY='mailarchitect_v1';
    let savedStateCache = null;

    // Welcome & New Email Data
    const welcomeOpen = ref(true);
    const confirmNewOpen = ref(false);
    const hasSavedEmail = ref(false);

    // Undo / State
    const undoStack = ref([]);
    const redoStack = ref([]);
    const canUndo = computed(() => undoStack.value.length > 1);
    const canRedo = computed(() => redoStack.value.length > 0);
    let isUndoing = false;
    let undoTimer = null;

    function pushUndoState() {
      if (isUndoing) return;
      const stateStr = JSON.stringify({
        tree: tree.value,
        classes: classes.value
      });
      const last = undoStack.value[undoStack.value.length - 1];
      if (last !== stateStr) {
        undoStack.value.push(stateStr);
        if (undoStack.value.length > 50) undoStack.value.shift();
        redoStack.value = [];
      }
    }

    function scheduleUndoPush() {
      if(isUndoing) return;
      if(undoTimer) clearTimeout(undoTimer);
      undoTimer = setTimeout(pushUndoState, 800);
    }

    function undo() {
      if (undoTimer) clearTimeout(undoTimer);
      if (undoStack.value.length <= 1) return;
      isUndoing = true;
      const current = undoStack.value.pop(); // discard current state
      redoStack.value.push(current);
      const prevStr = undoStack.value[undoStack.value.length - 1];
      try {
        const state = JSON.parse(prevStr);
        tree.value = state.tree;
        classes.value = state.classes;
        selectedId.value = null;
      } catch(e) {}
      
      scheduleRender();
      nextTick(() => { isUndoing = false; });
    }

    function redo() {
      if (undoTimer) clearTimeout(undoTimer);
      if (redoStack.value.length === 0) return;
      isUndoing = true;
      const nextStr = redoStack.value.pop();
      undoStack.value.push(nextStr);
      try {
        const state = JSON.parse(nextStr);
        tree.value = state.tree;
        classes.value = state.classes;
        selectedId.value = null;
      } catch(e) {}
      
      scheduleRender();
      nextTick(() => { isUndoing = false; });
    }

    // Toast
    const toastShow    = ref(false);
    const toastSuccess = ref(false);
    const toastMsg     = ref('');
    let toastTimer = null;
    function toast(msg,ok=true){
      toastMsg.value=msg; toastSuccess.value=ok; toastShow.value=true;
      if(toastTimer) clearTimeout(toastTimer);
      toastTimer=setTimeout(()=>{toastShow.value=false;},2200);
    }

    // Classes
    const newClassName = ref('');
    const classes = ref([
      {name:'body-bg',    props:{'background-color':'#f4f4f4'}, dark:true, darkProps:{'background-color':'#0d0d0d'}, _open:false,_pk:'',_pv:'',_dpk:'',_dpv:'',_sides:{}},
      {name:'text-default', props:{'color':'#1e293b', 'font-size':'14px', 'line-height':'1.6'}, dark:true, darkProps:{'color':'#ffffff'}, _open:false,_pk:'',_pv:'',_dpk:'',_dpv:'',_sides:{}},
      {name:'btn-primary', props:{'background-color':'#4f46e5', 'color':'#ffffff', 'font-weight':'bold', 'border-radius':'6px', 'padding':'12px 24px'}, dark:false, darkProps:{}, _open:false,_pk:'',_pv:'',_dpk:'',_dpv:'',_sides:{}},
      {name:'section-default', props:{'padding':'20px'}, dark:false, darkProps:{}, _open:false,_pk:'',_pv:'',_dpk:'',_dpv:'',_sides:{}}
    ]);

    // Document tree
    const tree = ref([{
      id:'root', type:'mj-body', classes:['body-bg'], attrs:{}, content:'',
      children:[]
    }]);

    const hasContent = computed(()=>{
      return tree.value.length>0 && tree.value[0].children && tree.value[0].children.length>0;
    });

    const selectedNode = computed(()=> selectedId.value ? findNode(tree.value,selectedId.value) : null);

    function findNode(nodes,id){ for(const n of nodes){if(n.id===id)return n; if(n.children){const f=findNode(n.children,id);if(f)return f;}} return null; }
    function removeNode(nodes,target){ const i=nodes.findIndex(n=>n.id===target.id);if(i>-1){nodes.splice(i,1);return true;} for(const n of nodes){if(n.children&&removeNode(n.children,target))return true;} return false; }

    function selectNode(id){ selectedId.value=id; tab.value='node'; }
    function deleteNode(n){ if(selectedId.value===n.id)selectedId.value=null; removeNode(tree.value,n); }
    function clearDoc(){
      if(!confirm('Clear entire document?'))return;
      tree.value=[{id:'root',type:'mj-body',classes:['body-bg'],attrs:{},content:'',children:[]}];
      selectedId.value=null;
    }
    function cloneNode(tpl){
      return makeNode(tpl.type);
    }

    // Class helpers
    const pendingClass = ref('');
    const inlineEditClass = ref(null);
    const availableClasses = computed(()=>{
      const applied = new Set(selectedNode.value?.classes||[]);
      return classes.value.filter(c=>!applied.has(c.name));
    });
    function getClassObj(name){ return classes.value.find(x=>x.name===name)||null; }
    function toggleInlineEdit(name){ inlineEditClass.value = inlineEditClass.value===name ? null : name; }
    function addClass(){ if(pendingClass.value&&selectedNode.value){ if(!selectedNode.value.classes)selectedNode.value.classes=[];selectedNode.value.classes.push(pendingClass.value);pendingClass.value=''; } }
    function removeClass(n){ if(selectedNode.value){ selectedNode.value.classes=(selectedNode.value.classes||[]).filter(c=>c!==n); if(inlineEditClass.value===n) inlineEditClass.value=null; } }
    function createClass(){ 
      const name = newClassName.value.trim().toLowerCase().replace(/[^a-z0-9_-]/g,'-');
      if(!name) return null;
      const existing = classes.value.find(c => c.name === name);
      if(existing) { 
        newClassName.value = '';
        return existing; 
      }
      const cls = {name, props:{}, dark:false, darkProps:{}, _open:true, _pk:'', _pv:'', _dpk:'', _dpv:''};
      classes.value.unshift(cls);
      newClassName.value = '';
      return cls;
    }
    function createAndApplyClass(){
      const cls = createClass();
      if(cls && selectedNode.value){
        if(!selectedNode.value.classes) selectedNode.value.classes = [];
        if(!selectedNode.value.classes.includes(cls.name)) {
          selectedNode.value.classes.push(cls.name);
        }
      }
    }
    function deleteClass(i){ classes.value.splice(i,1); }
    function toggleClass(ci) {
      const target = classes.value[ci];
      const wasOpen = target._open;
      classes.value.forEach(c => c._open = false);
      target._open = !wasOpen;
    }
    function editClass(name) {
      toggleInlineEdit(name);
    }
    function goToClassDef(name) {
      selectedId.value = null; // Unselect to show overall class list
      nextTick(() => {
        const c = classes.value.find(x => x.name === name);
        if (c) c._open = true;
        nextTick(() => {
          const el = document.getElementById('cls-card-' + name);
          if (el) el.scrollIntoView({behavior: 'smooth', block: 'start'});
        });
      });
    }
    function addProp(cls){ if(cls._pk){cls.props[cls._pk]=cls._pv||'';cls._pk='';cls._pv=''; scheduleRender();} }
    function deleteProp(cls,k){ delete cls.props[k]; scheduleRender(); }
    function addDarkProp(cls){ if(!cls.darkProps) cls.darkProps={}; if(cls._dpk){cls.darkProps[cls._dpk]=cls._dpv||'';cls._dpk='';cls._dpv=''; scheduleRender();} }
    function deleteDarkProp(cls,k){ if(cls.darkProps) delete cls.darkProps[k]; scheduleRender(); }

    function addPropImmediate(cls, val) {
      if (!val) return;
      if (val === 'CUSTOM_PROP') {
        cls._showCustom = true;
        cls._pk = '';
        cls._pv = '';
        return;
      }
      if (!cls.props[val]) cls.props[val] = '';
      cls._showCustom = false;
      scheduleRender();
    }
    function addDarkPropImmediate(cls, val) {
      if (!val) return;
      if (val === 'CUSTOM_PROP') {
        cls._showCustomDark = true;
        cls._dpk = '';
        cls._dpv = '';
        return;
      }
      if (!cls.darkProps) cls.darkProps = {};
      if (!cls.darkProps[val]) cls.darkProps[val] = '';
      cls._showCustomDark = false;
      scheduleRender();
    }

    // ── Visual Editor Helpers ─────────────────────────────────────
    const showAdvanced = ref(false);
    const openCategories = ref(['Typography', 'Spacing']);

    function toggleCategory(name) {
      const i = openCategories.value.indexOf(name);
      if (i > -1) openCategories.value.splice(i, 1);
      else openCategories.value.push(name);
    }

    function isCategoryOpen(name) { return openCategories.value.includes(name); }

    function getPropValue(cls, key, isDark = false) {
      const source = isDark ? (cls.darkProps || {}) : cls.props;
      let val = source[key];
      if (isDark && val === undefined) {
        val = cls.props[key] || '';
      }
      return val || '';
    }

    function setPropValue(cls, key, val, isDark = false) {
      if (isDark) {
        if (!cls.darkProps) cls.darkProps = {};
        cls.darkProps[key] = val;
      } else {
        cls.props[key] = val;
      }
      scheduleRender();
    }

    function getPropNumeric(cls, key, isDark = false) {
      const source = isDark ? (cls.darkProps || {}) : cls.props;
      let val = source[key];
      
      // If dark mode and not set, use light mode value as reference
      if (isDark && val === undefined) {
        val = cls.props[key] || '';
      }
      return parseFloat(val || '') || 0;
    }

    function setPropNumeric(cls, key, val, unit='', isDark = false) {
      if (isDark) {
        if (!cls.darkProps) cls.darkProps = {};
        cls.darkProps[key] = val + unit;
      } else {
        cls.props[key] = val + unit;
      }
      scheduleRender();
    }

    function toggleSides(cls, key, isDark = false) {
      const source = isDark ? (cls.darkProps || {}) : cls.props;
      if (isDark && !cls.darkProps) cls.darkProps = {};
      
      if(!cls._sides) cls._sides = {};
      const sidesKey = isDark ? `${key}_dark` : key;
      cls._sides[sidesKey] = !cls._sides[sidesKey];
      
      const targetSource = isDark ? cls.darkProps : cls.props;
      
      // If turning ON individual sides
      if(cls._sides[sidesKey]) {
        const baseVal = targetSource[key] || (isDark ? cls.props[key] : null) || '0px';
        ['top','right','bottom','left'].forEach(s => {
          const k = `${key}-${s}`;
          if(!targetSource[k]) targetSource[k] = baseVal;
        });
      } else {
        // If turning OFF
        ['top','right','bottom','left'].forEach(s => {
          delete targetSource[`${key}-${s}`];
        });
      }
      scheduleRender();
    }

    function isSidesEnabled(cls, key, isDark = false) {
      const sidesKey = isDark ? `${key}_dark` : key;
      return cls._sides && cls._sides[sidesKey];
    }

    function getSidesValue(cls, key, side, isDark = false) {
      const source = isDark ? (cls.darkProps || {}) : cls.props;
      let val = source[`${key}-${side}`];
      if (isDark && val === undefined) {
        val = cls.props[`${key}-${side}`] || cls.props[key] || '0px';
      }
      return val || '0px';
    }

    function getSidesNumeric(cls, key, side, isDark = false) {
      return parseFloat(getSidesValue(cls, key, side, isDark)) || 0;
    }

    function setSidesNumeric(cls, key, side, val, unit='px', isDark = false) {
      if (isDark) {
        if (!cls.darkProps) cls.darkProps = {};
        cls.darkProps[`${key}-${side}`] = val + unit;
      } else {
        cls.props[`${key}-${side}`] = val + unit;
      }
      scheduleRender();
    }

    // Node helpers
    function nodeHasContent(type){ return['mj-text','mj-button','mj-raw','mj-table','mj-navbar-link','mj-social-element'].includes(type); }
    function stdAttrs(type){ return stdAttrMap[type]||[]; }

    const mjmlSource = computed(()=>{
      // mj-attributes block
      let attrs='      <mj-all font-family="Inter, system-ui, -apple-system, sans-serif" />\n      <mj-text font-size="inherit" color="inherit" line-height="inherit" />\n';
      for(const cls of classes.value){
        const keys=Object.keys(cls.props);
        if(keys.length){ const ps=keys.map(k=>`${k}="${cls.props[k]}"`).join(' '); attrs+=`      <mj-class name="${cls.name}" ${ps} />\n`; }
      }

      // Standard CSS for all used classes
      let linkCss = '';
      const usedLinkCls = new Set();
      function scanForLinkCls(list){
        for(const n of list){
          if(n.classes) n.classes.forEach(c => usedLinkCls.add(c));
          if(n.content){
            const m = n.content.matchAll(/class="([^"]+)"/g);
            for(const match of m) usedLinkCls.add(match[1]);
          }
          if(n.children) scanForLinkCls(n.children);
        }
      }
      scanForLinkCls(tree.value);
      for(const lc of usedLinkCls){
        const cls = classes.value.find(c=>c.name===lc);
        if(cls){
          linkCss += `      .${lc} {\n`;
          for(const [k,v] of Object.entries(cls.props)) linkCss += `        ${k}: ${v} !important;\n`;
          linkCss += `      }\n`;
        }
      }

      let darkCss='';
      for(const c of classes.value){
        if(c.dark && c.darkProps && Object.keys(c.darkProps).length>0){
          const p = Object.entries(c.darkProps).map(([k,v]) => `${k}: ${v} !important;`).join(' ');
          darkCss += `      .mja-forced-dark .${c.name}, .mja-forced-dark.${c.name} { ${p} }\n`;
          darkCss += `      @media (prefers-color-scheme: dark) { .${c.name} { ${p} } }\n`;
        }
      }

      const styleComb = (linkCss + darkCss).trim();
      const stylePart = styleComb ? `    <mj-style>\n      ${styleComb}\n    </mj-style>\n`:'';

      let body='';
      for(const n of tree.value){
        body+=compileNode(n,1)+'\n';
      }

      return `<mjml>\n  <mj-head>\n    <mj-font name="Inter" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" />\n    <mj-attributes>\n${attrs}    </mj-attributes>\n${stylePart}  </mj-head>\n${body}</mjml>`;
    });

    // Strip builder-internal mja-{id} classes for clean user output
    const cleanMjmlSource = computed(() => {
      let src = mjmlSource.value;
      
      // 1. Remove internal targeting classes from attributes (css-class="...")
      src = src.replace(/css-class="([^"]*)"/g, (match, val) => {
        const cleaned = val.replace(/\bmja-[a-z0-9]+\b/g, '').replace(/\s+/g,' ').trim();
        return cleaned ? `css-class="${cleaned}"` : '';
      });

      // 2. Remove internal targeting classes from standard HTML attributes in content (class="...")
      src = src.replace(/\bclass="([^"]*)"/g, (match, val) => {
        const cleaned = val.replace(/\bmja-[a-z0-9]+\b/g, '').replace(/\s+/g,' ').trim();
        return `class="${cleaned}"`;
      });

      // 3. Remove .mja-forced-dark selectors from the generated <mj-style>
      // These looks like: .mja-forced-dark .classname, .mja-forced-dark.classname { ... }
      src = src.replace(/\.mja-forced-dark\s+\.[a-z0-9_-]+,\s+\.mja-forced-dark\.[a-z0-9_-]+\s*\{[^}]+\}/gi, '');

      // 4. Clean up any leftover double-spaces or empty attributes
      return src.replace(/  +/g, ' ').replace(/class=""/g, '').trim();
    });

    // MJML resolver
    function getMjml2Html(){
      if(typeof window.mjml==='function') return window.mjml;
      if(window.mjml&&typeof window.mjml.default==='function') return window.mjml.default;
      if(typeof window.mjml2html==='function') return window.mjml2html;
      throw new Error('mjml-browser not loaded');
    }

    // ── Rich text editor (contenteditable) ────────────────────
    const rteEl = ref(null);
    const showRawHtml = ref(false);
    const linkPop = Vue.reactive({ show:false, url:'', cls:'', target:'', savedRange:null, editNode:null });
    
    watch(showRawHtml, (isRaw) => {
      if (!isRaw) {
        nextTick(() => {
          if(!rteEl.value||!selectedNode.value) return;
          rteEl.value.innerHTML = selectedNode.value.content||'';
        });
      }
    });
    
    function onRteClick(e) {
      const a = e.target.closest('a');
      if (a) {
        linkPop.savedRange = null; 
        linkPop.editNode = a;
        linkPop.url = a.getAttribute('href') || '';
        linkPop.cls = a.getAttribute('class') || '';
        linkPop.target = a.getAttribute('target') || '';
        linkPop.show = true;
      }
    }

    // Sync editor content when selected node changes
    watch(selectedId, ()=>{
      showRawHtml.value = false;
      nextTick(()=>{
        if(!rteEl.value||!selectedNode.value) return;
        rteEl.value.innerHTML = selectedNode.value.content||'';
      });
    });

    function onRteInput(){
      if(!rteEl.value||!selectedNode.value) return;
      selectedNode.value.content=rteEl.value.innerHTML;
      scheduleRender();
    }
    function insertRteBr(){
      document.execCommand('insertHTML',false,'<br>');
    }
    function execFmt(cmd){
      rteEl.value?.focus();
      document.execCommand(cmd,false,null);
      onRteInput();
    }
    function saveRange(){
      const sel=window.getSelection();
      if(sel&&sel.rangeCount) linkPop.savedRange=sel.getRangeAt(0).cloneRange();
    }
    function isFmt(cmd){
      try { return document.queryCommandState(cmd); } catch { return false; }
    }
    function startLink(){
      const sel=window.getSelection();
      if(!sel) return;
      
      // Check if we are already in a link
      let el = sel.anchorNode;
      if(el && el.nodeType===3) el = el.parentElement;
      const a = el ? el.closest('a') : null;
      
      if(a) {
        // Edit mode
        linkPop.editNode = a;
        linkPop.url = a.getAttribute('href') || '';
        linkPop.cls = a.getAttribute('class') || '';
        linkPop.target = a.getAttribute('target') || '';
        linkPop.show = true;
        return;
      }

      if(sel.isCollapsed){ toast('Select text first to add a link',false); return; }
      saveRange();
      linkPop.editNode=null; linkPop.url=''; linkPop.cls=''; linkPop.target='_blank'; linkPop.show=true;
      nextTick(() => { if(linkInput.value) linkInput.value.focus(); });
    }
    function applyLink(){
      if(!linkPop.url) return;
      let a;
      if (linkPop.editNode) {
        a = linkPop.editNode;
      } else {
        if(!linkPop.savedRange) return;
        const sel=window.getSelection();
        sel.removeAllRanges();
        sel.addRange(linkPop.savedRange);
        const range=sel.getRangeAt(0);
        a=document.createElement('a');
        try{ range.surroundContents(a); }
        catch{ const f=range.extractContents(); a.appendChild(f); range.insertNode(a); }
        sel.removeAllRanges();
      }

      a.href=linkPop.url;
      if (linkPop.target) a.setAttribute('target', linkPop.target);
      else a.removeAttribute('target');

      if(linkPop.cls){
        const cls=classes.value.find(c=>c.name===linkPop.cls);
        if(cls){
          const styles=[];
          if(cls.props.color) styles.push(`color:${cls.props.color}`);
          if(cls.props['font-weight']) styles.push(`font-weight:${cls.props['font-weight']}`);
          if(styles.length) a.setAttribute('style',styles.join(';'));
          else a.removeAttribute('style');
        }
        a.setAttribute('class',linkPop.cls);
      } else {
        a.removeAttribute('class');
        a.removeAttribute('style');
      }
      
      linkPop.show=false;
      onRteInput();
    }
    function removeLinkFromPopup() {
      if(linkPop.editNode) {
        const f = document.createDocumentFragment();
        while(linkPop.editNode.firstChild) f.appendChild(linkPop.editNode.firstChild);
        linkPop.editNode.parentNode.replaceChild(f, linkPop.editNode);
        linkPop.show=false;
        onRteInput();
      }
    }
    function removeLink(){
      rteEl.value?.focus();
      document.execCommand('unlink',false,null);
      onRteInput();
    }

    // Re-render preview when switching back to builder view
    watch(viewMode, (v) => {
      if (v === 'builder') {
        setTimeout(() => {
          if (previewFrame.value) {
            scheduleRender();
          } else {
            nextTick(() => setTimeout(scheduleRender, 150));
          }
        }, 100);
      }
    });

    // Selection in preview
    const prevSel = reactive({ show:false, x:0, y:0, text:'', node:null, range:null });
    
    function detectPreviewSelection(){
      const win = previewFrame.value?.contentWindow;
      if(!win) return;
      const sel = win.getSelection();
      if(!sel || sel.isCollapsed || !sel.toString().trim()) {
        prevSel.show = false;
        return;
      }
      
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      // Find the MJML node this selection belongs to
      let el = range.commonAncestorContainer;
      if(el.nodeType===3) el = el.parentElement;
      while(el && el!==win.document.body){
        const mc = [...el.classList].find(c=>c.startsWith('mja-') && c!=='mja-hl');
        if(mc){
          const nodeId = mc.replace('mja-','');
          const node = findNodeById(tree.value, nodeId);
          if(node && node.type==='mj-text'){
            prevSel.node = node;
            prevSel.text = sel.toString();
            prevSel.range = range;
            prevSel.x = rect.left + (rect.width/2);
            prevSel.y = rect.top;
            prevSel.show = true;
            return;
          }
        }
        el = el.parentElement;
      }
      prevSel.show = false;
    }

    function openLinkFromPreview(){
      if(!prevSel.node) return;
      selectNode(prevSel.node.id);
      nextTick(()=>{
        linkPop.url = '';
        linkPop.cls = '';
        linkPop.show = true;
        toast('Adding link to: "'+prevSel.text.substring(0,20)+'..."');
      });
      prevSel.show = false;
    }

    function findNodeById(list, id){
      for(const n of list){
        if(n.id===id) return n;
        if(n.children){
          const found = findNodeById(n.children, id);
          if(found) return found;
        }
      }
      return null;
    }

    // Apply hover highlight directly on the iframe DOM
    const hoverNodeId = ref(null);
    function setHoverNode(id){ hoverNodeId.value=id; }

    function applyHoverHighlight(id){
      try{
        const iDoc=previewFrame.value?.contentDocument;
        if(!iDoc)return;
        iDoc.querySelectorAll('.mja-hl').forEach(el=>el.classList.remove('mja-hl'));
        if(id && id !== selectedId.value){
          iDoc.querySelectorAll('.mja-'+id).forEach(el=>el.classList.add('mja-hl'));
        }
      }catch{}
    }
    watch(hoverNodeId,(id)=>{ applyHoverHighlight(id); });

    function applySelectionHighlight(id){
      try{
        const iDoc=previewFrame.value?.contentDocument;
        if(!iDoc)return;
        iDoc.querySelectorAll('.mja-selected').forEach(el=>el.classList.remove('mja-selected'));
        if(id){
          iDoc.querySelectorAll('.mja-'+id).forEach(el=>el.classList.add('mja-selected'));
        }
      }catch{}
    }
    watch(selectedId,(id)=>{ applySelectionHighlight(id); });

    // Preview render
    let debounceTimer=null;
    const HOVER_STYLE=`<style id="mja-hl-style">
      .mja-hl{outline:2px solid rgba(99,102,241,0.5)!important;outline-offset:1px!important;border-radius:2px!important;}
      .mja-selected{outline:2px solid #6366f1!important;outline-offset:1px!important;border-radius:2px!important;box-shadow:0 0 0 4px rgba(99,102,241,0.1)!important;}
      
      html { background-color: #f1f5f9; }
      body {
        margin: 0 !important;
        background-color: transparent !important;
        background-image: repeating-linear-gradient(45deg, rgba(0,0,0,0.03) 0px, rgba(0,0,0,0.03) 10px, transparent 10px, transparent 20px) !important;
      }
      body > div {
        background-color: #ffffff;
        box-shadow: 0 0 0 1px rgba(0,0,0,0.05), 0 8px 40px rgba(0,0,0,0.08) !important;
        min-height: 100vh;
      }
    </style>`;

    function renderPreview(){
      if(!previewFrame.value)return;
      try{
        const fn=getMjml2Html();
        let src = mjmlSource.value;
        if (previewTheme.value === 'dark') {
          src = src.replace(/<mj-body([^>]*)>/i, (match, attrs) => attrs.includes('css-class="') ? `<mj-body${attrs.replace('css-class="', 'css-class="mja-forced-dark ')}>` : `<mj-body css-class="mja-forced-dark"${attrs}>`);
        }
        const r=fn(src,{keepComments:false,validationLevel:'soft'});
        compileError.value=false;
        let html=r.html;
        html=disableSystemDark(html);
        html=stripDivTypography(html);
        html=html.replace(/<\/head>/,HOVER_STYLE+'</head>');
        const doc=previewFrame.value.contentDocument;
        doc.open();doc.write(html);doc.close();
        
        try{
          doc.addEventListener('click',(e)=>{
            e.preventDefault();
            let el=e.target;
            while(el&&el!==doc.body){
              const mc=[...el.classList].find(c=>c.startsWith('mja-')&&c!=='mja-hl');
              if(mc){ selectNode(mc.replace('mja-','')); return; }
              el=el.parentElement;
            }
          },true);

          doc.addEventListener('dblclick',(e)=>{
            e.preventDefault();
            let el=e.target;
            while(el&&el!==doc.body){
              const mc=[...el.classList].find(c=>c.startsWith('mja-')&&c!=='mja-hl');
              if(mc){ 
                selectNode(mc.replace('mja-','')); 
                nextTick(() => {
                  if (rteEl.value) rteEl.value.focus();
                });
                return; 
              }
              el=el.parentElement;
            }
          },true);

          const st=doc.createElement('style');
          st.textContent='body *{cursor:pointer!important}';
          doc.head.appendChild(st);

          doc.addEventListener('selectionchange', detectPreviewSelection);
          doc.addEventListener('mouseup', detectPreviewSelection);
          doc.addEventListener('keyup', detectPreviewSelection);
          doc.addEventListener('scroll', ()=> { prevSel.show = false; });
        }catch{}
        setTimeout(()=>{
          applySelectionHighlight(selectedId.value);
          applyHoverHighlight(hoverNodeId.value);
        },50);
        setTimeout(()=>{ try{const h=previewFrame.value.contentDocument.documentElement.scrollHeight;if(h>100)previewHeight.value=h+20;}catch{} },350);
      } catch(e){
        compileError.value=true;
        console.warn('MJML error:',e);
      }
    }
    function scheduleRender(){ if(debounceTimer)clearTimeout(debounceTimer);debounceTimer=setTimeout(renderPreview,600); }
    watch([tree,classes,previewTheme],scheduleRender,{deep:true});
    function setDevice(w){ deviceWidth.value=w; }
    function setTheme(t){ previewTheme.value=t; scheduleRender(); }

    function copyCode(){ navigator.clipboard.writeText(cleanMjmlSource.value).then(()=>toast('MJML copied!')); }
    function copyHtml(){ navigator.clipboard.writeText(exportHtml.value).then(()=>toast('HTML copied!')); }
    function downloadHtml(){
      try {
        const fn = getMjml2Html();
        const r = fn(cleanMjmlSource.value, {keepComments:false, validationLevel:'soft'});
        let html = r.html;
        html = stripDivTypography(html);
        if(window.html_beautify) html = window.html_beautify(html, {indent_size:2, wrap_line_length:120});
        
        const blob = new Blob([html], {type:'text/html'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'email.html';
        a.click();
        URL.revokeObjectURL(url);
        ioMenuOpen.value = false;
        toast('HTML file downloaded');
      } catch(e) {
        toast('Error generating HTML: ' + e.message, false);
      }
    }
    function exportMjml(){
      const mj = cleanMjmlSource.value;
      const blob = new Blob([mj], {type:'text/xml'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'email-project.mjml';
      a.click();
      URL.revokeObjectURL(url);
      ioMenuOpen.value = false;
      toast('MJML project downloaded');
    }
    function triggerImport(){ ioMenuOpen.value=false;importErr.value='';if(importFileInput.value)importFileInput.value.click(); }
    function triggerWelcomeImport(){ welcomeOpen.value=false; triggerImport(); }
    function openImportModal(){ ioMenuOpen.value=false;importText.value='';importErr.value='';importOpen.value=true; welcomeOpen.value=false; }
    function handleFileImport(e){ const file=e.target.files[0];if(!file)return;const reader=new FileReader();reader.onload=ev=>{importText.value=ev.target.result;importErr.value='';importOpen.value=true;welcomeOpen.value=false;};reader.readAsText(file);e.target.value=''; }

    function applyImport(){
      importErr.value='';
      try{
        const {tree:newTree,newClasses}=parseMjmlToTree(importText.value);
        tree.value=newTree;
        if(newClasses.length>0)classes.value=newClasses;
        selectedId.value=null;importOpen.value=false;importText.value='';
        welcomeOpen.value=false;
        undoStack.value=[]; redoStack.value=[]; pushUndoState();
        toast('MJML imported!');setTimeout(renderPreview,200);
      }catch(e){importErr.value=e.message;}
    }

    function openExport(){
      try{
        const fn=getMjml2Html();
        const r=fn(cleanMjmlSource.value,{keepComments:false,validationLevel:'soft'});
        let html=r.html;
        html=stripDivTypography(html);
        if(window.html_beautify)html=window.html_beautify(html,{indent_size:2,wrap_line_length:120});
        exportHtml.value=html;

        const rd=fn(cleanMjmlSource.value.replace(/<mj-body([^>]*)>/i, (match, attrs) => attrs.includes('css-class="') ? `<mj-body${attrs.replace('css-class="', 'css-class="mja-forced-dark ')}>` : `<mj-body css-class="mja-forced-dark"${attrs}>`),{keepComments:false,validationLevel:'soft'});
        let htmlDark=rd.html;
        htmlDark=stripDivTypography(htmlDark);
        if(window.html_beautify)htmlDark=window.html_beautify(htmlDark,{indent_size:2,wrap_line_length:120});
        exportHtmlDark.value=htmlDark;

        exportTab.value='light';exportOpen.value=true;
      }catch(e){toast('MJML error: '+e.message,false);}
    }

    // ── Autosave to localStorage ──────────────────────────────────
    let saveTimer=null;
    function saveNow(){
      if(welcomeOpen.value) return; 
      try{
        localStorage.setItem(SAVE_KEY,JSON.stringify({
          tree:tree.value,
          classes:classes.value,
          ts:Date.now()
        }));
      }catch{}
    }
    function scheduleSave(){ if(saveTimer)clearTimeout(saveTimer); saveTimer=setTimeout(saveNow,1500); }
    watch([tree,classes],scheduleSave,{deep:true});
    watch([tree,classes],scheduleUndoPush,{deep:true});

    function welcomeContinue() {
      if (savedStateCache) {
        tree.value = savedStateCache.tree;
        if(savedStateCache.classes) classes.value = savedStateCache.classes;
        undoStack.value = [];
        redoStack.value = [];
        pushUndoState();
      }
      welcomeOpen.value = false;
      toast('Restored previous session', true);
    }

    function welcomeNewEmail() {
      if (hasSavedEmail.value) {
        confirmNewOpen.value = true;
      } else {
        executeNewEmail();
      }
    }
    
    function promptNewEmail() {
      confirmNewOpen.value = true;
    }

    function executeNewEmail() {
      tree.value = [{id:'root',type:'mj-body',classes:['body-bg'],attrs:{},content:'',children:[]}];
      classes.value = [
        {name:'body-bg',    props:{'background-color':'#f4f4f4'}, _open:false,_pk:'',_pv:''},
        {name:'text-default', props:{'color':'#1e293b', 'font-size':'14px', 'line-height':'1.6'}, _open:false,_pk:'',_pv:''},
        {name:'btn-primary', props:{'background-color':'#4f46e5', 'color':'#ffffff', 'font-weight':'bold', 'border-radius':'6px', 'padding':'12px 24px'}, _open:false,_pk:'',_pv:''},
        {name:'section-default', props:{'padding':'20px'}, _open:false,_pk:'',_pv:''}
      ];
      undoStack.value = [];
      redoStack.value = [];
      pushUndoState();
      try{ localStorage.removeItem(SAVE_KEY); }catch{}
      hasSavedEmail.value = false;
      savedStateCache = null;
      confirmNewOpen.value = false;
      welcomeOpen.value = false;
      toast('Started new email');
    }


    // ── Panel resize ─────────────────────────────────────────
    const leftW = ref(parseInt(localStorage.getItem('mb-leftW'))||120);
    const treeW = ref(parseInt(localStorage.getItem('mb-treeW'))||280);
    const rightW = ref(parseInt(localStorage.getItem('mb-rightW'))||360);

    function startResize(e, panel){
      e.preventDefault();
      const handle = e.currentTarget;
      handle.classList.add('dragging');
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      const startX = e.clientX;
      const startLW = leftW.value;
      const startTW = treeW.value;
      const startRW = rightW.value;

      function onMove(ev){
        const delta = ev.clientX - startX;
        if(panel==='left'){
          leftW.value = Math.max(120, Math.min(320, startLW + delta));
          localStorage.setItem('mb-leftW', leftW.value);
        } else if(panel==='tree'){
          treeW.value = Math.max(180, Math.min(520, startTW + delta));
          localStorage.setItem('mb-treeW', treeW.value);
        } else if(panel==='right'){
          rightW.value = Math.max(300, Math.min(600, startRW - delta));
          localStorage.setItem('mb-rightW', rightW.value);
        }
      }
      function onUp(){
        handle.classList.remove('dragging');
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
      }
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    }

    onMounted(()=>{
      pushUndoState(); 
      try{
        const raw=localStorage.getItem(SAVE_KEY);
        if(raw){
          const saved=JSON.parse(raw);
          if(saved.tree&&saved.tree.length){
            hasSavedEmail.value = true;
            savedStateCache = saved;
          }
        }
      }catch{}

      setTimeout(renderPreview,900);
    });

    return {
      welcomeOpen,welcomeContinue,welcomeNewEmail,triggerWelcomeImport,
      confirmNewOpen,hasSavedEmail,promptNewEmail,executeNewEmail,
      undo,redo,canUndo,canRedo,
      deviceWidth,deviceLabel,previewTheme,viewMode,showGuides,tab,selectedId,selectedNode,
      previewFrame,previewWrap,previewHeight,compileError,hasContent,
      componentLibrary:computed(() => {
        const obj = tree.value.find(n => n.type === 'mj-body');
        return obj ? compLib.filter(c => c.type !== 'mj-body') : compLib;
      }),tree,classes,
      cloneNode,selectNode,deleteNode,clearDoc,
      pendingClass,inlineEditClass,availableClasses,getClassObj,toggleInlineEdit,addClass,removeClass,
      newClassName,createClass,createAndApplyClass,deleteClass,toggleClass,editClass,goToClassDef,addProp,deleteProp,addDarkProp,deleteDarkProp,
      addPropImmediate,addDarkPropImmediate,
      nodeHasContent,stdAttrs,iconFor,propSuggestions,
      isColorProp,colorToHex,disableSystemDark,
      mjmlSource,cleanMjmlSource,setDevice,setTheme,copyCode,
      exportOpen,exportTab,exportHtml,openExport,copyHtml,downloadHtml,
      toastShow,toastSuccess,toastMsg,
      ioMenuOpen,exportMjml,
      importOpen,importText,importErr,importFileInput,triggerImport,handleFileImport,applyImport,openImportModal,
      hoverNodeId,setHoverNode,
      prevSel,openLinkFromPreview,
      showRawHtml,rteEl,linkInput,linkPop,execFmt,isFmt,startLink,applyLink,removeLink,removeLinkFromPopup,onRteInput,onRteClick,insertRteBr,
      leftW,treeW,rightW,startResize,
      showAdvanced, openCategories, toggleCategory, isCategoryOpen,
      editorHelpers: {
        getPropNumeric, setPropNumeric, getPropValue, setPropValue,
        toggleSides, isSidesEnabled, getSidesValue, getSidesNumeric, setSidesNumeric,
        isCategoryOpen, toggleCategory, colorToHex, scheduleRender
      },
      getPropValue, setPropValue,
      getPropNumeric, setPropNumeric, toggleSides, isSidesEnabled, getSidesValue, getSidesNumeric, setSidesNumeric,
      PROP_DEFS, PROP_CATEGORIES
    };
  },
  directives: { 'click-outside': (el, binding) => { /* placeholder if needed, using the const above */ } }
}).directive('click-outside', {
  mounted(el, binding) {
    el._clickOutside = (ev) => { if (!(el === ev.target || el.contains(ev.target))) binding.value(ev); };
    document.addEventListener('click', el._clickOutside);
  },
  unmounted(el) { document.removeEventListener('click', el._clickOutside); }
});
app.mount('#app');
