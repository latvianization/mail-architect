const { createApp, ref, reactive, computed, watch, onMounted, nextTick } = Vue;

const app = createApp({
  components: { 'tree-node': TreeNodeComp, 'visual-editor': VisualEditorComp, 'draggable': window.vuedraggable },
  setup() {
    const deviceWidth = ref('100%');
    const deviceLabel = computed(() => ({ '100%': 'Desktop', '768px': 'Tablet 768px', '414px': 'Mobile L 414px', '375px': 'Mobile S 375px' }[deviceWidth.value] || deviceWidth.value));
    const previewTheme = ref('light');
    const viewMode = ref('builder');
    const manualMjml = ref('');


    const showGuides = ref(false);
    const showAdvanced = ref(false);
    const showAdvancedInline = ref(false);

    const tab = ref('node');
    const selectedId = ref(null);
    const previewFrame = ref(null);
    const previewWrap = ref(null);
    const previewHeight = ref(600);
    const hoveredPreviewHtml = ref('');

    const compileError = ref(false);

    // Export
    const exportOpen = ref(false);
    const exportTab = ref('light');
    const exportHtml = ref('');
    const globalProps = ref({});
    const typeDefaults = ref({});
    const globalFonts = ref([]);
    const extraStyle = ref('');
    const exportHtmlDark = ref('');

    // Import
    const importOpen = ref(false);
    const importText = ref('');
    const importErr = ref('');
    const importFileInput = ref(null);

    // IO menu
    const ioMenuOpen = ref(false);

    // Add Block Popup
    const addBlockPop = reactive({
      show: false,
      parentId: null,
      parentType: '',
      hoveredType: null,
      tab: 'blocks'
    });


    const linkInput = ref(null);

    function closeIoMenu(e) { if (!e.target.closest('#io-wrap')) ioMenuOpen.value = false; }
    onMounted(() => document.addEventListener('click', closeIoMenu));

    function getPreviewMjml(node) {
      if (!node) return '';
      if (node.type === 'mjml') return compileNode(node, 0, globalProps.value, typeDefaults.value);
      
      let body = compileNode(node, 0);

      // If the node is a content-level component, wrap it in section and column so MJML renders it correctly

      const isContent = ['mj-text', 'mj-image', 'mj-button', 'mj-divider', 'mj-spacer', 'mj-social', 'mj-navbar', 'mj-accordion', 'mj-table'].includes(node.type);
      if (isContent) {
        body = `<mj-section><mj-column>${body}</mj-column></mj-section>`;
      } else if (node.type === 'mj-column') {
        body = `<mj-section>${body}</mj-section>`;
      } else if (node.type === 'mj-head') {
        return `<mjml>${body}<mj-body></mj-body></mjml>`;
      }

      return `<mjml><mj-body>${body}</mj-body></mjml>`;
    }

    let previewTimer = null;
    watch(() => addBlockPop.hoveredType, (newType) => {
      if (!newType) { hoveredPreviewHtml.value = ''; return; }
      if (previewTimer) clearTimeout(previewTimer);

      previewTimer = setTimeout(() => {
        try {
          let node;
          if (addBlockPop.tab === 'templates') {
            const tmpl = templateLib.find(t => t.type === newType);
            if (tmpl) node = tmpl.build();
          } else {
            node = makeNode(newType);
          }

          if (node) {
            const mjml = getPreviewMjml(node);
            const fn = getMjml2Html();
            const r = fn(mjml, { validationLevel: 'skip' });
            hoveredPreviewHtml.value = r.html;
          }
        } catch (e) {
          console.error('Preview error:', e);
          hoveredPreviewHtml.value = '';
        }
      }, 100);
    });

    const SAVE_KEY = 'mailarchitect_v1';
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
      if (isUndoing) return;
      if (undoTimer) clearTimeout(undoTimer);
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
      } catch (e) { }

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
      } catch (e) { }

      scheduleRender();
      nextTick(() => { isUndoing = false; });
    }

    // Toast
    const toastShow = ref(false);
    const toastSuccess = ref(false);
    const toastMsg = ref('');
    let toastTimer = null;
    function toast(msg, ok = true) {
      toastMsg.value = msg; toastSuccess.value = ok; toastShow.value = true;
      if (toastTimer) clearTimeout(toastTimer);
      toastTimer = setTimeout(() => { toastShow.value = false; }, 2200);
    }

    // Classes
    const newClassName = ref('');
    const classes = ref([]);

    // Document tree
    const tree = ref([{
      id: 'root', type: 'mjml', classes: [], attrs: {}, content: '',
      children: [
        { id: uid(), type: 'mj-head', classes: [], attrs: {}, style: {}, content: '', children: [] },
        { id: uid(), type: 'mj-body', classes: [], attrs: {}, style: {}, content: '', children: [] }
      ]
    }]);

    const hasContent = computed(() => {
      return tree.value.length > 0 && tree.value[0].children && tree.value[0].children.length > 0;
    });

    const selectedNode = computed(() => selectedId.value ? findNode(tree.value, selectedId.value) : null);

    function findNode(nodes, id) { for (const n of nodes) { if (n.id === id) return n; if (n.children) { const f = findNode(n.children, id); if (f) return f; } } return null; }
    function removeNode(nodes, target) { const i = nodes.findIndex(n => n.id === target.id); if (i > -1) { nodes.splice(i, 1); return true; } for (const n of nodes) { if (n.children && removeNode(n.children, target)) return true; } return false; }

    function selectNode(id) { selectedId.value = id; tab.value = 'node'; classes.value.forEach(c => c._open = false); }
    function deleteNode(n) {
      if (['mjml', 'mj-head', 'mj-body'].includes(n.type)) {
        if (n.type === 'mj-body') {
          n.children = [];
          toast('Cleared all components in body');
        } else {
          toast(`Cannot delete ${n.type} element`, false);
        }
        return;
      }
      if (selectedId.value === n.id) selectedId.value = null;
      removeNode(tree.value, n);
    }


    // Add Block methods
    function openAddBlock(parentId, parentType) {
      addBlockPop.parentId = parentId;
      addBlockPop.parentType = parentType;
      addBlockPop.show = true;
      // Default hover to first allowed item
      const allowed = popupAllowedTypes.value;
      if (allowed.length) addBlockPop.hoveredType = allowed[0].type;
    }
    function closeAddBlock() {
      addBlockPop.show = false;
      addBlockPop.parentId = null;
      addBlockPop.hoveredType = null;
    }
    function addBlockFromPopup(type) {
      if (!addBlockPop.parentId) return;
      const parent = findNode(tree.value, addBlockPop.parentId);
      if (parent) {
        if (!parent.children) parent.children = [];
        const newNode = makeNode(type, false); // No scaffolding by default now
        parent.children.push(newNode);
        selectNode(newNode.id);
        toast(`Added ${type.replace('mj-', '')} component`);
      }
      closeAddBlock();
    }

    function applyManualMjml() {
      if (!manualMjml.value) return;
      try {
        const result = parseMjmlToTree(manualMjml.value);
        if (result.tree && result.tree.length) {
          tree.value = result.tree;
          classes.value = result.newClasses || [];
          globalProps.value = result.globalProps || {};
          typeDefaults.value = result.typeDefaults || {};
          globalFonts.value = result.globalFonts || [];
          extraStyle.value = result.extraStyle || '';
          viewMode.value = 'builder';
          selectedId.value = null; // Reset selection to avoid crashes
          
          pushUndoState();
          toast('Sync successful! Visual tree updated.');
        } else {
          toast('Error: Failed to parse visual tree from MJML.', false);
        }
      } catch (err) {
        console.error(err);
        toast('Parse Error: ' + err.message, false);
      }
    }

    function addTemplateFromPopup(type) {
      const tmpl = templateLib.find(t => t.type === type);
      if (!tmpl || !addBlockPop.parentId) return;

      const parent = findNode(tree.value, addBlockPop.parentId);
      if (parent && parent.children) {
        const newNode = tmpl.build();
        parent.children.push(newNode);
        selectNode(newNode.id);
        toast(`Added ${tmpl.name} template`);
      }
      closeAddBlock();
    }

    function duplicateNode(id) {
      // Find parent context
      function findParentAndIndex(nodes, targetId) {
        for (let i = 0; i < nodes.length; i++) {
          if (nodes[i].id === targetId) return { list: nodes, index: i };
          if (nodes[i].children) {
            const res = findParentAndIndex(nodes[i].children, targetId);
            if (res) return res;
          }
        }
        return null;
      }

      const res = findParentAndIndex(tree.value, id);
      if (res) {
        const original = res.list[res.index];
        const clone = deepCloneNode(original);
        res.list.splice(res.index + 1, 0, clone);
        selectNode(clone.id);
        toast(`Duplicated ${original.type.replace('mj-', '')}`);
        scheduleRender();
      }
    }

    const popupAllowedTypes = computed(() => {
      if (!addBlockPop.parentType) return [];
      if (addBlockPop.tab === 'templates') {
        // Only show templates if the parent is a body or wrapper/hero (usually sections)
        // or just show all for now, but pre-filter standard ones
        const isBody = addBlockPop.parentType === 'mj-body' || addBlockPop.parentType === 'mj-wrapper';
        return isBody ? templateLib : [];
      }
      const allowed = allowedChildrenMap[addBlockPop.parentType] || [];
      return allowed.map(t => compLib.find(c => c.type === t)).filter(Boolean);
    });

    const popupHoveredDetail = computed(() => {
      if (!addBlockPop.hoveredType) return null;
      if (addBlockPop.tab === 'templates') return templateLib.find(t => t.type === addBlockPop.hoveredType);
      return compLib.find(c => c.type === addBlockPop.hoveredType);
    });



    function clearDoc() {
      if (!confirm('Clear entire document?')) return;
      tree.value = [{
        id: 'root', type: 'mjml', classes: [], attrs: {}, content: '',
        children: [
          { id: uid(), type: 'mj-head', classes: [], attrs: {}, style: {}, content: '', children: [] },
          { id: uid(), type: 'mj-body', classes: [], attrs: {}, style: {}, content: '', children: [] }
        ]
      }];
      selectedId.value = null;
    }
    function cloneNode(tpl) {
      return makeNode(tpl.type);
    }

    // Class helpers
    const pendingClass = ref('');
    const inlineEditClass = ref(null);
    const availableClasses = computed(() => {
      const applied = new Set(selectedNode.value?.classes || []);
      return classes.value.filter(c => !applied.has(c.name));
    });
    function getClassObj(name) { return classes.value.find(x => x.name === name) || null; }
    function toggleInlineEdit(name) { inlineEditClass.value = inlineEditClass.value === name ? null : name; }
    function addClass() { 
      if (pendingClass.value && selectedNode.value) { 
        if (!selectedNode.value.classes) selectedNode.value.classes = []; 
        if (!selectedNode.value.classes.includes(pendingClass.value)) {
          selectedNode.value.classes.push(pendingClass.value); 
        }
        pendingClass.value = ''; 
        scheduleRender();
      } 
    }
    function removeClass(n) { 
      if (selectedNode.value) { 
        selectedNode.value.classes = (selectedNode.value.classes || []).filter(c => c !== n); 
        if (inlineEditClass.value === n) inlineEditClass.value = null; 
        scheduleRender();
      } 
    }
    function createClass() {
      const name = newClassName.value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
      if (!name) return null;
      const existing = classes.value.find(c => c.name === name);
      if (existing) {
        newClassName.value = '';
        return existing;
      }
      const cls = { name, props: {}, dark: false, darkProps: {}, _open: true, _pk: '', _pv: '', _dpk: '', _dpv: '' };
      classes.value.unshift(cls);
      newClassName.value = '';
      return cls;
    }
    function createAndApplyClass() {
      const cls = createClass();
      if (cls && selectedNode.value) {
        if (!selectedNode.value.classes) selectedNode.value.classes = [];
        if (!selectedNode.value.classes.includes(cls.name)) {
          selectedNode.value.classes.push(cls.name);
        }
        scheduleRender();
      }
    }
    function deleteClass(name) {
      if (!confirm(`Are you sure you want to delete class ".${name}"? This will remove it from all components.`)) return;

      const idx = classes.value.findIndex(c => c.name === name);
      if (idx > -1) {
        classes.value.splice(idx, 1);

        // Recursive removal from tree
        const removeRef = (nodes) => {
          for (const n of nodes) {
            if (n.classes) n.classes = n.classes.filter(c => c !== name);
            if (n.children) removeRef(n.children);
          }
        };
        removeRef(tree.value);
        toast(`Deleted class .${name} globally`);
        scheduleRender();
      }
    }
    function toggleClass(ci) {
      const target = classes.value[ci];
      const wasOpen = target._open;
      classes.value.forEach(c => c._open = false);
      target._open = !wasOpen;
    }
    function toggleClassByName(name) {
      const target = classes.value.find(c => c.name === name);
      if(target) {
        const wasOpen = target._open;
        classes.value.forEach(c => c._open = false);
        target._open = !wasOpen;
      }
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
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      });
    }
    function addProp(cls) { if (cls._pk) { cls.props[cls._pk] = cls._pv || ''; cls._pk = ''; cls._pv = ''; scheduleRender(); } }
    function deleteProp(cls, k) { delete cls.props[k]; scheduleRender(); }
    function addDarkProp(cls) { if (!cls.darkProps) cls.darkProps = {}; if (cls._dpk) { cls.darkProps[cls._dpk] = cls._dpv || ''; cls._dpk = ''; cls._dpv = ''; scheduleRender(); } }
    function deleteDarkProp(cls, k) { if (cls.darkProps) delete cls.darkProps[k]; scheduleRender(); }

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
    const inspectorThemes = reactive({}); // Stores 'light' or 'dark' for each class/node
    function getThemeKey(obj) { return obj.id || obj.name || 'global'; }
    function getActiveTheme(obj) { return inspectorThemes[getThemeKey(obj)] || 'light'; }
    function setActiveTheme(obj, theme) { 
      inspectorThemes[getThemeKey(obj)] = theme; 
      // Scroll to opened section
      nextTick(() => {
        setTimeout(() => {
          const el = document.querySelector(`.theme-segment.active`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 50);
      });
    }

    function getPropParts(val) {
      if (!val) return { num: '', unit: 'px' };
      const num = parseFloat(val);
      if (isNaN(num)) return { num: val, unit: '' };
      const unit = val.toString().replace(num.toString(), '').trim() || 'px';
      return { num, unit };
    }

    function setPropParts(obj, key, num, unit, isDark = false) {
      if (!obj) return;
      const val = (num === '' || num === null) ? '' : num + unit;
      setPropValue(obj, key, val, isDark);
    }

    const openCatsMap = reactive({});

    function getOpenKey(obj, name, isDark) {
      const id = obj.id || obj.name || 'global';
      const type = obj.id ? 'node' : 'class';
      return `${type}:${id}:${isDark ? 'dark' : 'light'}:${name}`;
    }

    function toggleCategory(obj, name, isDark) {
      const key = getOpenKey(obj, name, isDark);
      openCatsMap[key] = !openCatsMap[key];
    }

    function isCategoryOpen(obj, name, isDark) {
      return !!openCatsMap[getOpenKey(obj, name, isDark)];
    }

    function getCustomProps(obj, isDark = false) {
      if (!obj) return {};
      const source = isDark ? (obj.darkProps || {}) : (obj.props || obj.style || obj);
      const custom = {};
      for (const [k, v] of Object.entries(source)) {
        if (!PROP_DEFS[k] && !['id', 'type', 'classes', 'attrs', 'style', 'content', 'children', 'name', 'props', 'dark', 'darkProps', '_open', '_pk', '_pv', '_dpk', '_dpv', '_sides', '_showCustom', '_showCustomDark'].includes(k)) {
          custom[k] = v;
        }
      }
      return custom;
    }

    function addCustomProp(obj, key, isDark = false) {
      if (!key) return;
      if (!stdMjmlAttrs.has(key)) {
        toast(`Attribute "${key}" is not natively supported by MJML.`, false);
        return;
      }
      if (isDark) {
        if (!obj.darkProps) obj.darkProps = {};
        obj.darkProps[key] = '';
      } else {
        const target = obj.props || obj.style || obj;
        target[key] = '';
      }
      scheduleRender();
    }

    const stdMjmlAttrs = new Set(['align', 'background-color', 'background-url', 'background-repeat', 'background-size', 'background-position', 'border', 'border-bottom', 'border-left', 'border-right', 'border-top', 'border-radius', 'color', 'container-background-color', 'direction', 'font-family', 'font-size', 'font-style', 'font-weight', 'height', 'letter-spacing', 'line-height', 'padding', 'padding-bottom', 'padding-left', 'padding-right', 'padding-top', 'text-align', 'text-decoration', 'vertical-align', 'width', 'src', 'href', 'target', 'alt', 'mode', 'full-width', 'fluid-on-mobile', 'inner-padding', 'inner-background-color', 'text-transform', 'border-width', 'border-style', 'border-color', 'rel', 'path']);

    function deleteProp(obj, key, isDark = false) {
      if (!obj) return;
      if (isDark) {
        if (obj.darkProps) delete obj.darkProps[key];
      } else {
        if (obj.attrs) delete obj.attrs[key];
        if (obj.style) delete obj.style[key];
        if (obj.props) delete obj.props[key];
      }
      scheduleRender();
    }

    function getPropValue(obj, key, isDark = false) {
      if (!obj) return '';
      if (isDark) {
        const val = (obj.darkProps || {})[key];
        if (val !== undefined) return val;
        // Fallback to light mode value
        return getPropValue(obj, key, false);
      }
      // Light Mode: Check attrs (MJML) then style (CSS) then props (Classes)
      if (obj.attrs && obj.attrs[key] !== undefined) return obj.attrs[key];
      if (obj.style && obj.style[key] !== undefined) return obj.style[key];
      if (obj.props && obj.props[key] !== undefined) return obj.props[key];
      return '';
    }


    function isPropSupported(type, key) {
      if (!type) return true; // Default to show if type unknown
      const allowed = TAG_PROPS[type];
      if (!allowed) return true; // Default to show all for non-whitelisted tags
      return allowed.includes(key);
    }

    function hasPropValue(obj, key, isDark = false) {
      if (!obj) return false;
      if (isDark) return obj.darkProps && obj.darkProps[key] !== undefined;
      return (obj.attrs && obj.attrs[key] !== undefined) || 
             (obj.style && obj.style[key] !== undefined) || 
             (obj.props && obj.props[key] !== undefined);
    }

    function setPropValue(obj, key, val, isDark = false) {
      if (!obj) return;
      if (isDark) {
        if (!obj.darkProps) obj.darkProps = {};
        obj.darkProps[key] = val;
      } else {
        // If it's a node with attrs/style, use the appropriate collection
        if (obj.attrs && stdMjmlAttrs.has(key)) {
          obj.attrs[key] = val;
        } else if (obj.style) {
          obj.style[key] = val;
        } else if (obj.props) {
          obj.props[key] = val;
        }
      }
      scheduleRender();
    }


    function getPropNumeric(obj, key, isDark = false) {
      if (!obj) return 0;
      const source = isDark ? (obj.darkProps || {}) : (obj.props || obj.style || obj);
      let val = source[key];
      if (isDark && val === undefined) {
        val = (obj.props || obj.style || obj)[key] || '';
      }
      return parseFloat(val || '') || 0;
    }

    function setPropNumeric(obj, key, val, unit = '', isDark = false) {
      if (!obj) return;
      if (isDark) {
        if (!obj.darkProps) obj.darkProps = {};
        obj.darkProps[key] = val + unit;
      } else {
        const target = obj.props || obj.style || obj;
        target[key] = val + unit;
      }
      scheduleRender();
    }

    function getSidesKeys(key) {
      if (key === 'border-radius') return ['top-left', 'top-right', 'bottom-right', 'bottom-left'];
      return ['top', 'right', 'bottom', 'left'];
    }

    function toggleSides(obj, key, isDark = false) {
      if (!obj) return;
      const targetSource = isDark ? (obj.darkProps || {}) : (obj.props || obj.style || obj);
      if (isDark && !obj.darkProps) obj.darkProps = {};

      if (!obj._sides) obj._sides = {};
      const sidesKey = isDark ? `${key}_dark` : key;
      obj._sides[sidesKey] = !obj._sides[sidesKey];

      const keys = getSidesKeys(key);

      if (obj._sides[sidesKey]) {
        const baseVal = targetSource[key] || (isDark ? (obj.props || obj.style || obj)[key] : null) || '0px';
        keys.forEach(s => {
          const k = `${key}-${s}`;
          if (!targetSource[k]) targetSource[k] = baseVal;
        });
      } else {
        keys.forEach(s => {
          delete targetSource[`${key}-${s}`];
        });
      }
      scheduleRender();
    }




    // Node helpers
    function nodeHasContent(type) { return ['mj-text', 'mj-button', 'mj-raw', 'mj-table', 'mj-navbar-link', 'mj-social-element'].includes(type); }
    const allCategorizedProps = computed(() => {
      const s = new Set();
      PROP_CATEGORIES.forEach(cat => cat.props.forEach(p => s.add(p)));
      return s;
    });

    function stdAttrs(type) { return stdAttrMap[type] || []; }
    function getFilteredStdAttrs(node) {
      if (!node) return [];
      return stdAttrs(node.type).filter(a => !allCategorizedProps.value.has(a.key));
    }

    function addInlineProp(node, key) {
      if (!node.style) node.style = {};
      if (!node.style[key]) node.style[key] = '';
      scheduleRender();
    }
    function deleteInlineProp(node, key) {
      if (node.style) delete node.style[key];
      scheduleRender();
    }


    function getMergedProps(source) {
      if (!source) return {};
      const merged = { ...source };
      const corners = ['top-left', 'top-right', 'bottom-right', 'bottom-left'];
      if (corners.some(c => merged[`border-radius-${c}`])) {
        const vals = corners.map(c => merged[`border-radius-${c}`] || merged['border-radius'] || '0px');
        merged['border-radius'] = vals.join(' ');
        corners.forEach(c => delete merged[`border-radius-${c}`]);
      }
      return merged;
    }

    let debounceTimer = null;

    // Shared: MJML global attributes (mj-all and component defaults)
    const globalAttributes = computed(() => {
      let attrs = '';
      for (const [tag, props] of Object.entries(typeDefaults.value)) {
        let s = `      <${tag}`;
        for (const [k, v] of Object.entries(props)) s += ` ${k}="${String(v).replace(/"/g, '&quot;')}"`;
        attrs += s + ' />\n';
      }
      if (Object.keys(globalProps.value).length > 0) {
        let ps = Object.entries(globalProps.value).map(([k,v]) => `${k}="${String(v).replace(/"/g, '&quot;')}"`).join(' ');
        attrs += `      <mj-all ${ps} />\n`;
      }
      
      return attrs;
    });

    const computedStyle = computed(() => {
      // 1. Scan tree for all used classes
      const usedClasses = new Set();
      function scanTree(nodes) {
        for (const n of nodes) {
          if (n.classes) n.classes.forEach(c => usedClasses.add(c));
          if (n.content) {
            const matches = n.content.matchAll(/\bclass="([^"]+)"/g);
            for (const m of matches) m[1].split(' ').filter(Boolean).forEach(c => usedClasses.add(c));
          }
          if (n.children) scanTree(n.children);
        }
      }
      scanTree(tree.value);

      const buildSimpleSelectors = (selector, mp) => {
        let pStandard = [];
        let pBg = [];
        let pColor = [];
        for (const [k, v] of Object.entries(mp)) {
          if (v === undefined || v === null || v === '') continue;
          let cssK = k === 'align' ? 'text-align' : (k === 'container-background-color' ? 'background-color' : k);
          pStandard.push(`${cssK}: ${v} !important;`);
          if (cssK === 'background-color' || cssK === 'background' || cssK.startsWith('border-radius')) {
             pBg.push(`${cssK}: ${v} !important;`);
          } else if (cssK === 'color') {
             pColor.push(`${cssK}: ${v} !important;`);
          }
        }
        
        let res = `      ${selector} { ${pStandard.join(' ')} }\n`;
        
        if (pBg.length > 0 || pColor.length > 0) {
          const innerSelectors = selector.split(',').map(s => s.trim()).filter(s => s && s !== 'body').map(s => {
             let sels = [];
             if (pBg.length > 0) {
                sels.push(`${s} > table`, `${s} > div > table`);
             }
             if (pColor.length > 0) {
                sels.push(`${s} div`, `${s} span`, `${s} a`, `${s} td`);
             }
             return sels.join(', ');
          }).filter(Boolean).join(', ');
          
          if (innerSelectors) {
             const rules = [];
             if (pBg.length > 0) rules.push(...pBg);
             if (pColor.length > 0) rules.push(...pColor);
             res += `      ${innerSelectors} { ${rules.join(' ')} }\n`;
          }
        }
        return res;
      };

      // 2. Generate CSS Rules for all classes
      let css = '';
      for (const lc of usedClasses) {
        const cls = classes.value.find(c => c.name === lc);
        if (cls) {
          const mp = getMergedProps(cls.props);
          const isBodyClass = tree.value[0]?.children?.find(c => c.type === 'mj-body' && c.classes?.includes(lc));
          const selector = isBodyClass ? `.${lc}, body` : `.${lc}`;
          css += buildSimpleSelectors(selector, mp);
        }
      }

      // 3. Generate Dark Mode CSS rules
      let darkRules = '';

      for (const c of classes.value) {
        if (!usedClasses.has(c.name)) continue;
        if (c.darkProps && Object.keys(c.darkProps).length > 0) {
          darkRules += buildSimpleSelectors(`.${c.name}`, getMergedProps(c.darkProps));
        }
      }
      function scanDarkNodes(nodes) {
        for (const n of nodes) {
          if (n.darkProps && Object.keys(n.darkProps).length > 0) {
            if (n.type === 'mj-body') {
              let rb = [];
              for (const [k, v] of Object.entries(getMergedProps(n.darkProps))) {
                let cssK = k === 'align' ? 'text-align' : (k === 'container-background-color' ? 'background-color' : k);
                rb.push(`${cssK}: ${v} !important;`);
              }
              darkRules += `      body { ${rb.join(' ')} }\n`;
            } else {
              darkRules += buildSimpleSelectors(`.mja-${n.id}`, getMergedProps(n.darkProps));
            }
          }
          if (n.children) scanDarkNodes(n.children);
        }
      }
      scanDarkNodes(tree.value);

      if (darkRules) {
        css += `\n      @media (prefers-color-scheme: dark) {\n${darkRules}      }\n`;
      }
      return css;
    });

    const mjmlSource = computed(() => {
      const root = tree.value[0];
      if (!root || root.type !== 'mjml') return '';
      const head = root.children.find(c => c.type === 'mj-head');
      const bodyNode = root.children.find(c => c.type === 'mj-body');

      let fonts = '';
      if (globalFonts.value.length === 0) {
        fonts = '    <mj-font name="Inter" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" />\n';
      } else {
        for (const f of globalFonts.value) fonts += `    <mj-font name="${f.name}" href="${f.href}" />\n`;
      }

      let inlineStyleRules = '';
      function scanInline(nodes) {
        for (const n of nodes) {
          const inlineProps = Object.entries(n.style || {}).filter(([k, v]) => v !== '' && !stdMjmlAttrs.has(k));
          if (inlineProps.length > 0) {
            inlineStyleRules += `      #mja-${n.id} {\n`;
            for (const [k, v] of inlineProps) inlineStyleRules += `        ${k}: ${v} !important;\n`;
            inlineStyleRules += `      }\n`;
          }
          if (n.children) scanInline(n.children);
        }
      }
      // We skip ID-based inline styles for the main code/export views
      // only including standard MJML attributes that buildAttrs handles.
      // if (bodyNode) scanInline([bodyNode]); 

      const globalFixes = `
      [style*="border-radius"] > table,
      [style*="border-radius"] > div > table {
        border-radius: inherit !important;
      }
      `;

      const styleComb = (globalFixes + '\n' + computedStyle.value + '\n' + inlineStyleRules + '\n' + (extraStyle.value || '')).trim();
      const stylePart = styleComb ? `    <mj-style>\n      ${styleComb}\n    </mj-style>\n` : '';

      let headChildrenHtml = '';
      let hasTreeAttributes = false;
      if (head && head.children) {
        for (const c of head.children) {
          if (['mj-attributes', 'mj-font', 'mj-style'].includes(c.type)) {
            if (c.type === 'mj-attributes') hasTreeAttributes = true;
            continue;
          }
          headChildrenHtml += compileNode(c, 2, globalProps.value, typeDefaults.value, { includeInternalIds: false }) + '\n';
        }
      }

      let finalAttributesBlock = '';
      if (globalAttributes.value) {
        finalAttributesBlock = `    <mj-attributes>\n${globalAttributes.value}    </mj-attributes>\n`;
      }

      const fullHead = `  <mj-head>\n${fonts}${finalAttributesBlock}${stylePart}${headChildrenHtml}  </mj-head>`;
      const fullBody = bodyNode ? compileNode(bodyNode, 1, globalProps.value, typeDefaults.value, { includeInternalIds: false }) : '  <mj-body></mj-body>';
      return `<mjml>\n${fullHead}\n${fullBody}\n</mjml>`;
    });

    watch([viewMode, mjmlSource], ([v, source]) => {
      if (v === 'code') {
        manualMjml.value = source;
      }
    });

    // Provide a "Clean" MJML for export
    const cleanMjmlSource = computed(() => {
      const root = tree.value[0];
      if (!root || root.type !== 'mjml') return '';
      const head = root.children.find(c => c.type === 'mj-head');
      const bodyNode = root.children.find(c => c.type === 'mj-body');
      
      let fonts = '';
      if (globalFonts.value.length === 0) {
        fonts = '    <mj-font name="Inter" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" />\n';
      } else {
        for (const f of globalFonts.value) fonts += `    <mj-font name="${f.name}" href="${f.href}" />\n`;
      }

      // We exclude mja- internal IDs from clean export's style block
      // computedStyle already contains clean class rules and dark modes.
      const stylePart = computedStyle.value ? `    <mj-style>\n${computedStyle.value}    </mj-style>\n` : '';
      
      let headHtml = '';
      if (head && head.children) {
        for (const c of head.children) {
          if (!['mj-attributes', 'mj-font', 'mj-style'].includes(c.type)) {
             headHtml += compileNode(c, 2, globalProps.value, typeDefaults.value, { includeInternalIds: false }) + '\n';
          }
        }
      }
      
      const finalAttributesBlock = globalAttributes.value ? `    <mj-attributes>\n${globalAttributes.value}    </mj-attributes>\n` : '';
      const headBlock = `  <mj-head>\n${fonts}${finalAttributesBlock}${stylePart}${headHtml}  </mj-head>`;
      const bodyBlock = bodyNode ? compileNode(bodyNode, 1, globalProps.value, typeDefaults.value, { includeInternalIds: false }) : '  <mj-body></mj-body>';
      
      return `<mjml>\n${headBlock}\n${bodyBlock}\n</mjml>`;
    });


    // Keep mja-ids in MJML for round-trip support
    // (Old duplicate removed)

    // MJML resolver
    function getMjml2Html() {
      if (typeof window.mjml === 'function') return window.mjml;
      if (window.mjml && typeof window.mjml.default === 'function') return window.mjml.default;
      if (typeof window.mjml2html === 'function') return window.mjml2html;
      throw new Error('mjml-browser not loaded');
    }

    // ── Rich text editor (contenteditable) ────────────────────
    const rteEl = ref(null);
    const showRawHtml = ref(false);
    const linkPop = Vue.reactive({ show: false, url: '', cls: '', target: '', savedRange: null, editNode: null });

    watch(showRawHtml, (isRaw) => {
      if (!isRaw) {
        nextTick(() => {
          if (!rteEl.value || !selectedNode.value) return;
          rteEl.value.innerHTML = selectedNode.value.content || '';
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

    function scrollToSelected() {
      if (!selectedId.value || !previewFrame.value) return;
      const doc = previewFrame.value.contentDocument;
      if (!doc) return;

      // Since MJML strips 'id', we target the 'mja-{id}' class which we mapped during renderPreview
      const el = doc.querySelector(`.mja-${selectedId.value}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    function scrollToTreeNode() {
      if (!selectedId.value) return;
      const el = document.getElementById(`tree-node-${selectedId.value}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }

    // Sync editor content when selected node changes
    watch(selectedId, () => {
      showRawHtml.value = false;
      nextTick(() => {
        if (rteEl.value && selectedNode.value) {
          rteEl.value.innerHTML = selectedNode.value.content || '';
        }
        // Small delay to ensure any internal MJML re-render (if quick) doesn't capture half-ready state
        setTimeout(scrollToSelected, 50);
      });
    });

    function onRteInput() {
      if (!rteEl.value || !selectedNode.value) return;
      selectedNode.value.content = rteEl.value.innerHTML;
      scheduleRender();
    }
    function insertRteBr() {
      document.execCommand('insertHTML', false, '<br>');
    }
    function execFmt(cmd) {
      rteEl.value?.focus();
      document.execCommand(cmd, false, null);
      onRteInput();
    }
    function saveRange() {
      const sel = window.getSelection();
      if (sel && sel.rangeCount) linkPop.savedRange = sel.getRangeAt(0).cloneRange();
    }
    function isFmt(cmd) {
      try { return document.queryCommandState(cmd); } catch { return false; }
    }
    function startLink() {
      const sel = window.getSelection();
      if (!sel) return;

      // Check if we are already in a link
      let el = sel.anchorNode;
      if (el && el.nodeType === 3) el = el.parentElement;
      const a = el ? el.closest('a') : null;

      if (a) {
        // Edit mode
        linkPop.editNode = a;
        linkPop.url = a.getAttribute('href') || '';
        linkPop.cls = a.getAttribute('class') || '';
        linkPop.target = a.getAttribute('target') || '';
        linkPop.show = true;
        return;
      }

      if (sel.isCollapsed) { toast('Select text first to add a link', false); return; }
      saveRange();
      linkPop.editNode = null; linkPop.url = ''; linkPop.cls = ''; linkPop.target = '_blank'; linkPop.show = true;
      nextTick(() => { if (linkInput.value) linkInput.value.focus(); });
    }
    function applyLink() {
      if (!linkPop.url) return;
      let a;
      if (linkPop.editNode) {
        a = linkPop.editNode;
      } else {
        if (!linkPop.savedRange) return;
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(linkPop.savedRange);
        const range = sel.getRangeAt(0);
        a = document.createElement('a');
        try { range.surroundContents(a); }
        catch { const f = range.extractContents(); a.appendChild(f); range.insertNode(a); }
        sel.removeAllRanges();
      }

      a.href = linkPop.url;
      if (linkPop.target) a.setAttribute('target', linkPop.target);
      else a.removeAttribute('target');

      if (linkPop.cls) {
        const cls = classes.value.find(c => c.name === linkPop.cls);
        if (cls) {
          const styles = [];
          if (cls.props.color) styles.push(`color:${cls.props.color}`);
          if (cls.props['font-weight']) styles.push(`font-weight:${cls.props['font-weight']}`);
          if (styles.length) a.setAttribute('style', styles.join(';'));
          else a.removeAttribute('style');
        }
        a.setAttribute('class', linkPop.cls);
      } else {
        a.removeAttribute('class');
        a.removeAttribute('style');
      }

      linkPop.show = false;
      onRteInput();
    }
    function removeLinkFromPopup() {
      if (linkPop.editNode) {
        const f = document.createDocumentFragment();
        while (linkPop.editNode.firstChild) f.appendChild(linkPop.editNode.firstChild);
        linkPop.editNode.parentNode.replaceChild(f, linkPop.editNode);
        linkPop.show = false;
        onRteInput();
      }
    }
    function removeLink() {
      rteEl.value?.focus();
      document.execCommand('unlink', false, null);
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
    const prevSel = reactive({ show: false, x: 0, y: 0, text: '', node: null, range: null });

    function detectPreviewSelection() {
      const win = previewFrame.value?.contentWindow;
      if (!win) return;
      const sel = win.getSelection();
      if (!sel || sel.isCollapsed || !sel.toString().trim()) {
        prevSel.show = false;
        return;
      }

      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      // Find the MJML node this selection belongs to
      let el = range.commonAncestorContainer;
      if (el.nodeType === 3) el = el.parentElement;
      while (el && el !== win.document.body) {
        const mc = [...el.classList].find(c => c.startsWith('mja-') && c !== 'mja-hl');
        if (mc) {
          const nodeId = mc.replace('mja-', '');
          const node = findNodeById(tree.value, nodeId);
          if (node && node.type === 'mj-text') {
            prevSel.node = node;
            prevSel.text = sel.toString();
            prevSel.range = range;
            prevSel.x = rect.left + (rect.width / 2);
            prevSel.y = rect.top;
            prevSel.show = true;
            return;
          }
        }
        el = el.parentElement;
      }
      prevSel.show = false;
    }

    function openLinkFromPreview() {
      if (!prevSel.node) return;
      selectNode(prevSel.node.id);
      nextTick(() => {
        linkPop.url = '';
        linkPop.cls = '';
        linkPop.show = true;
        toast('Adding link to: "' + prevSel.text.substring(0, 20) + '..."');
      });
      prevSel.show = false;
    }

    function findNodeById(list, id) {
      for (const n of list) {
        if (n.id === id) return n;
        if (n.children) {
          const found = findNodeById(n.children, id);
          if (found) return found;
        }
      }
      return null;
    }

    // Apply hover highlight directly on the iframe DOM
    const hoverNodeId = ref(null);
    function setHoverNode(id) { hoverNodeId.value = id; }

    function applyHoverHighlight(id) {
      try {
        const iDoc = previewFrame.value?.contentDocument;
        if (!iDoc) return;
        iDoc.querySelectorAll('.mja-hl').forEach(el => el.classList.remove('mja-hl'));
        if (id && id !== selectedId.value) {
          iDoc.querySelectorAll('.mja-' + id).forEach(el => el.classList.add('mja-hl'));
        }
      } catch { }
    }
    watch(hoverNodeId, (id) => { applyHoverHighlight(id); });

    function applySelectionHighlight(id) {
      try {
        const iDoc = previewFrame.value?.contentDocument;
        if (!iDoc) return;
        iDoc.querySelectorAll('.mja-selected').forEach(el => el.classList.remove('mja-selected'));
        if (id) {
          iDoc.querySelectorAll('.mja-' + id).forEach(el => el.classList.add('mja-selected'));
        }
      } catch { }
    }
    watch(selectedId, (id) => {
      showRawHtml.value = false;
      nextTick(() => {
        // Scroll inspector to top on new selection
        const ins = document.querySelector('.inspector-body');
        if (ins) ins.scrollTop = 0;

        if (rteEl.value && selectedNode.value) {
          rteEl.value.innerHTML = selectedNode.value.content || '';
        }
        // Bidirectional Scroll Sync
        setTimeout(() => {
          scrollToSelected();
          scrollToTreeNode();
        }, 150);
      });
      applySelectionHighlight(id);
    });

    const previewMjmlSource = computed(() => {
      const root = tree.value[0];
      if (!root) return '';
      const head = root.children.find(c => c.type === 'mj-head');
      const bodyNode = root.children.find(c => c.type === 'mj-body');

      let fonts = '';
      if (globalFonts.value.length === 0) {
        fonts = '    <mj-font name="Inter" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" />\n';
      } else {
        for (const f of globalFonts.value) fonts += `    <mj-font name="${f.name}" href="${f.href}" />\n`;
      }

      const styleComb = (computedStyle.value || '').trim();
      const stylePart = styleComb ? `    <mj-style>\n      ${styleComb}\n    </mj-style>\n` : '';

      let headChildrenHtml = '';
      if (head && head.children) {
        for (const c of head.children) headChildrenHtml += compileNode(c, 2, globalProps.value, typeDefaults.value, { includeInternalIds: true, previewMode: true }) + '\n';
      }

      const fullHead = `  <mj-head>\n${fonts}    <mj-attributes>\n${globalAttributes.value}    </mj-attributes>\n${stylePart}${headChildrenHtml}  </mj-head>`;
      const fullBody = bodyNode ? compileNode(bodyNode, 1, globalProps.value, typeDefaults.value, { includeInternalIds: true, previewMode: true }) : '  <mj-body></mj-body>';

      return `<mjml>\n${fullHead}\n${fullBody}\n</mjml>`;
    });

    const renderPreview = () => {
      if (!previewFrame.value) return;
      try {
        const fn = getMjml2Html();
        // Expand self-closing tags to full tags
        const expandedMjml = previewMjmlSource.value.replace(/<(mj-[a-z0-9-]+)([^>]*?)\s*\/>/gi, '<$1$2></$1>');
        
        const r = fn(expandedMjml, { keepComments: false, validationLevel: 'soft' });
        compileError.value = false;
        let html = r.html;
        
        const currentHoverStyle = `<style id="mja-hl-style">
          .mja-hl{outline:2px solid rgba(99,102,241,0.5)!important;outline-offset:1px!important;}
          .mja-selected{outline:2px solid #6366f1!important;outline-offset:1px!important;box-shadow:0 0 0 4px rgba(99,102,241,0.1)!important;}
          
          html { background-color: #f1f5f9; color-scheme: ${previewTheme.value}; }
          body {
            margin: 0 !important;
            background-color: transparent !important;
            background-image: repeating-linear-gradient(45deg, rgba(0,0,0,0.03) 0px, rgba(0,0,0,0.03) 10px, transparent 10px, transparent 20px) !important;
          }
          body > div {
            background-color: #ffffff;
            box-shadow: 0 0 0 1px rgba(0,0,0,0.05), 0 8px 40px rgba(0,0,0,0.08) !important;
          }
        </style>`;

        html = html.replace(/<\/head>/, currentHoverStyle + '</head>');
        const doc = previewFrame.value.contentDocument;
        doc.open(); doc.write(html); doc.close();

        // Ensure root element has the correct color-scheme
        if (doc.documentElement) {
          doc.documentElement.style.colorScheme = previewTheme.value;
        }

        // Auto-focus selected element in preview if it exists
        if (selectedId.value) {
          setTimeout(scrollToSelected, 150);
        }

        try {
          doc.addEventListener('click', (e) => {
            e.preventDefault();
            let el = e.target;
            while (el && el !== doc.body) {
              const mc = [...el.classList].find(c => c.startsWith('mja-') && c !== 'mja-hl' && c !== 'mja-selected');
              if (mc) {
                selectNode(mc.replace('mja-', ''));
                return;
              }
              el = el.parentElement;
            }
          }, true);

          doc.addEventListener('dblclick', (e) => {
            e.preventDefault();
            let el = e.target;
            while (el && el !== doc.body) {
              const mc = [...el.classList].find(c => c.startsWith('mja-') && c !== 'mja-hl' && c !== 'mja-selected');
              if (mc) {
                selectNode(mc.replace('mja-', ''));
                nextTick(() => {
                  if (rteEl.value) rteEl.value.focus();
                });
                return;
              }
              el = el.parentElement;
            }
          }, true);

          const st = doc.createElement('style');
          st.textContent = 'body *{cursor:pointer!important}';
          doc.head.appendChild(st);

          doc.addEventListener('selectionchange', detectPreviewSelection);
          doc.addEventListener('mouseup', detectPreviewSelection);
          doc.addEventListener('keyup', detectPreviewSelection);
          doc.addEventListener('scroll', () => { prevSel.show = false; });
        } catch { }
        setTimeout(() => {
          applySelectionHighlight(selectedId.value);
          applyHoverHighlight(hoverNodeId.value);
        }, 50);
        setTimeout(() => { try { const h = previewFrame.value.contentDocument.documentElement.scrollHeight; if (h > 100) previewHeight.value = h + 20; } catch { } }, 350);
      } catch (e) {
        compileError.value = true;
        console.warn('MJML error:', e);
        console.log('Failed MJML Source:', mjmlSource.value);
      }
    }
    function scheduleRender() { if (debounceTimer) clearTimeout(debounceTimer); debounceTimer = setTimeout(renderPreview, 600); }
    watch([tree, classes, previewTheme], scheduleRender, { deep: true });
    function setDevice(w) { deviceWidth.value = w; }
    function setTheme(t) { previewTheme.value = t; scheduleRender(); }

    function copyCode() { navigator.clipboard.writeText(cleanMjmlSource.value).then(() => toast('MJML copied!')); }
    function copyHtml() { navigator.clipboard.writeText(exportHtml.value).then(() => toast('HTML copied!')); }
    function downloadHtml() {
      try {
        const fn = getMjml2Html();
        const r = fn(cleanMjmlSource.value, { keepComments: false, validationLevel: 'soft' });
        let html = r.html;
        if (window.html_beautify) html = window.html_beautify(html, { indent_size: 2, wrap_line_length: 120 });

        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'email.html';
        a.click();
        URL.revokeObjectURL(url);
        ioMenuOpen.value = false;
        toast('HTML file downloaded');
      } catch (e) {
        toast('Error generating HTML: ' + e.message, false);
      }
    }
    function exportMjml() {
      const mj = cleanMjmlSource.value;
      const blob = new Blob([mj], { type: 'text/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'email-project.mjml';
      a.click();
      URL.revokeObjectURL(url);
      ioMenuOpen.value = false;
      toast('MJML project downloaded');
    }
    function triggerImport() {
      ioMenuOpen.value = false;
      importErr.value = '';
      if (importFileInput.value) {
        importFileInput.value.value = ''; // Reset to allow same file re-import
        importFileInput.value.click();
      } else {
        console.error('importFileInput ref not found');
        toast('Internal error: File input not found', false);
      }
    }
    function triggerWelcomeImport() { welcomeOpen.value = false; triggerImport(); }
    function openImportModal() { ioMenuOpen.value = false; importText.value = ''; importErr.value = ''; importOpen.value = true; welcomeOpen.value = false; }

    function handleFileImport(e) {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = ev => {
        importText.value = ev.target.result;
        importErr.value = '';
        importOpen.value = true;
        welcomeOpen.value = false;
        toast('File loaded, click Import to apply');
      };
      reader.onerror = () => {
        toast('Error reading file', false);
      };
      reader.readAsText(file);
    }


    function applyImport() {
      if (!importText.value.trim()) {
        importErr.value = 'Please paste some MJML code first.';
        return;
      }
      importErr.value = '';
      try {
        const result = parseMjmlToTree(importText.value);
        if (!result.tree || result.tree.length === 0) {
          throw new Error('No valid MJML structure found in input.');
        }

        tree.value = result.tree;
        classes.value = result.newClasses || [];
        globalProps.value = result.globalProps || {};
        typeDefaults.value = result.typeDefaults || {};
        globalFonts.value = result.globalFonts || [];
        extraStyle.value = result.extraStyle || '';

        selectedId.value = null;
        importOpen.value = false;
        importText.value = '';
        welcomeOpen.value = false;

        // Reset undo stack for the new document
        undoStack.value = [];
        redoStack.value = [];
        pushUndoState();

        toast('MJML project imported successfully!', true);
        setTimeout(renderPreview, 300);
      } catch (e) {
        console.error('Import error:', e);
        importErr.value = 'Import failed: ' + e.message;
        toast('Import failed', false);
      }
    }


    function openExport() {
      try {
        const fn = getMjml2Html();
        const r = fn(cleanMjmlSource.value, { keepComments: false, validationLevel: 'soft' });
        let html = r.html;
        if (window.html_beautify) html = window.html_beautify(html, { indent_size: 2, wrap_line_length: 120 });
        exportHtml.value = html;

        const rd = fn(cleanMjmlSource.value, { keepComments: false, validationLevel: 'soft' });
        let htmlDark = rd.html;
        if (window.html_beautify) htmlDark = window.html_beautify(htmlDark, { indent_size: 2, wrap_line_length: 120 });
        exportHtmlDark.value = htmlDark;

        exportTab.value = 'light'; exportOpen.value = true;
      } catch (e) { toast('MJML error: ' + e.message, false); }
    }

    // ── Autosave to localStorage ──────────────────────────────────
    let saveTimer = null;
    function saveNow() {
      if (welcomeOpen.value) return;
      try {
        localStorage.setItem(SAVE_KEY, JSON.stringify({
          tree: tree.value,
          classes: classes.value,
          globalProps: globalProps.value,
          typeDefaults: typeDefaults.value,
          globalFonts: globalFonts.value,
          extraStyle: extraStyle.value,
          ts: Date.now()
        }));
        console.log('[MailArchitect] Progress auto-saved');
      } catch (e) { console.warn('Save failed:', e); }
    }
    function scheduleSave() { if (saveTimer) clearTimeout(saveTimer); saveTimer = setTimeout(saveNow, 1000); }

    // More robust watch for deep mutations
    watch(() => [tree.value, classes.value], scheduleSave, { deep: true });
    watch(() => [tree.value, classes.value], scheduleUndoPush, { deep: true });


    function ensureStyleRefs(nodeList) {
      if (!nodeList) return;
      for (const n of nodeList) {
        if (!n.style) n.style = {};
        if (n.children) ensureStyleRefs(n.children);
      }
    }

    function welcomeContinue() {
      if (savedStateCache) {
        ensureStyleRefs(savedStateCache.tree);
        tree.value = savedStateCache.tree;
        if (savedStateCache.classes) classes.value = savedStateCache.classes;
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
      tree.value = [{
        id: 'root', type: 'mjml', classes: [], attrs: {}, content: '',
        children: [
          { id: uid(), type: 'mj-head', classes: [], attrs: {}, style: {}, content: '', children: [] },
          { id: uid(), type: 'mj-body', classes: [], attrs: {}, style: {}, content: '', children: [] }
        ]
      }];
      classes.value = [];
      undoStack.value = [];
      redoStack.value = [];
      pushUndoState();

      try { localStorage.removeItem(SAVE_KEY); } catch { }
      hasSavedEmail.value = false;
      savedStateCache = null;
      confirmNewOpen.value = false;
      welcomeOpen.value = false;
      toast('Started new email');
    }


    // ── Panel resize ─────────────────────────────────────────
    const leftW = ref(parseInt(localStorage.getItem('mb-leftW')) || 120);
    const treeW = ref(parseInt(localStorage.getItem('mb-treeW')) || 280);
    const rightW = ref(parseInt(localStorage.getItem('mb-rightW')) || 360);

    function startResize(e, panel) {
      e.preventDefault();
      const handle = e.currentTarget;
      handle.classList.add('dragging');
      document.body.classList.add('resizing-active');
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      const startX = e.clientX;
      const startLW = leftW.value;
      const startTW = treeW.value;
      const startRW = rightW.value;

      function onMove(ev) {
        const delta = ev.clientX - startX;
        if (panel === 'left') {
          leftW.value = Math.max(120, Math.min(320, startLW + delta));
          localStorage.setItem('mb-leftW', leftW.value);
        } else if (panel === 'tree') {
          treeW.value = Math.max(180, Math.min(520, startTW + delta));
          localStorage.setItem('mb-treeW', treeW.value);
        } else if (panel === 'right') {
          rightW.value = Math.max(300, Math.min(600, startRW - delta));
          localStorage.setItem('mb-rightW', rightW.value);
        }
      }
      function onUp() {
        handle.classList.remove('dragging');
        document.body.classList.remove('resizing-active');
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
      }
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    }

    onMounted(() => {
      pushUndoState();
      try {
        const raw = localStorage.getItem(SAVE_KEY);
        if (raw) {
          const saved = JSON.parse(raw);
          if (saved.tree && saved.tree.length) {
            hasSavedEmail.value = true;
            tree.value = saved.tree;
            classes.value = saved.classes || [];
            globalProps.value = saved.globalProps || {};
            typeDefaults.value = saved.typeDefaults || {};
            globalFonts.value = saved.globalFonts || [];
            extraStyle.value = saved.extraStyle || '';
            savedStateCache = saved;
          }
        }
      } catch { }

      window.addEventListener('beforeunload', saveNow);

      setTimeout(renderPreview, 900);
    });


    return {
      welcomeOpen, welcomeContinue, welcomeNewEmail, triggerWelcomeImport,
      confirmNewOpen, hasSavedEmail, promptNewEmail, executeNewEmail,
      undo, redo, canUndo, canRedo,
      deviceWidth, deviceLabel, previewTheme, viewMode, showGuides, tab, selectedId, selectedNode,
      previewFrame, previewWrap, previewHeight, compileError, hasContent,
      componentLibrary: computed(() => {
        // Exclude root-level singletons from the general gallery
        return compLib.filter(c => !['mjml', 'mj-head', 'mj-body'].includes(c.type));
      }), tree, classes,
      cloneNode, selectNode, deleteNode, clearDoc,
      pendingClass, inlineEditClass, availableClasses, getClassObj, toggleInlineEdit, addClass, removeClass,
      newClassName, createClass, createAndApplyClass, deleteClass, toggleClass, toggleClassByName, editClass, goToClassDef, addProp, deleteProp, addDarkProp, deleteDarkProp,
      addPropImmediate, addDarkPropImmediate, addInlineProp, deleteInlineProp,

      nodeHasContent, stdAttrs, getFilteredStdAttrs, iconFor, propSuggestions,
      isColorProp, colorToHex,
      mjmlSource, cleanMjmlSource, setDevice, setTheme, copyCode,
      globalProps, typeDefaults, globalFonts, extraStyle,
      exportOpen, exportTab, exportHtml, openExport, copyHtml, downloadHtml,
      manualMjml, applyManualMjml,
      toastShow, toastSuccess, toastMsg,
      ioMenuOpen, exportMjml,
      importOpen, importText, importErr, importFileInput, triggerImport, handleFileImport, applyImport, openImportModal,
      hoverNodeId, setHoverNode,
      prevSel, openLinkFromPreview,
      showRawHtml, rteEl, linkInput, linkPop, execFmt, isFmt, startLink, applyLink, removeLink, removeLinkFromPopup, onRteInput, onRteClick, insertRteBr,
      leftW, treeW, rightW, startResize,
      showAdvanced, showAdvancedInline, openCatsMap, toggleCategory, isCategoryOpen,

      addBlockPop, openAddBlock, closeAddBlock, addBlockFromPopup, addTemplateFromPopup, duplicateNode,
      popupAllowedTypes, popupHoveredDetail, hoveredPreviewHtml,



      editorHelpers: {
        getPropNumeric, setPropNumeric, getPropValue, setPropValue,
        getPropParts, setPropParts,
        getActiveTheme, setActiveTheme,
        isCategoryOpen, toggleCategory, colorToHex, scheduleRender,
        getCustomProps, addCustomProp, deleteProp, hasPropValue,
        isPropSupported
      },
      getPropValue, setPropValue, getPropNumeric, setPropNumeric,
      getActiveTheme, setActiveTheme,
      PROP_DEFS, PROP_CATEGORIES
    };
  }
}).directive('click-outside', {
  mounted(el, binding) {
    el._clickOutside = (ev) => {
      // If clicking exactly the same element or its children, ignore
      if (el === ev.target || el.contains(ev.target)) return;
      binding.value(ev);
    };
    // Delay listener registration to avoid catching the same event that opened the element
    setTimeout(() => {
      document.addEventListener('click', el._clickOutside);
    }, 0);
  },
  unmounted(el) {
    document.removeEventListener('click', el._clickOutside);
  }
});

app.mount('#app');
