// ── Tree Node Component ───────────────────────────────────────
const TreeNodeComp = {
  name:'tree-node',
  props:{node:Object,selectedId:String},
  emits:['select','delete','hover','add','duplicate'],


  components:{'Draggable': window.vuedraggable},
  data() { return { showAddMenu: false, collapsed: false }; },

  template: `
    <div class="tree-node" @mouseleave.self="$emit('hover',null)" :data-type="node.type">
      <div class="tree-node-row" :id="'tree-node-' + node.id" :class="{selected:node.id===selectedId}"
           :data-type="node.type"
           @click.stop="$emit('select',node.id)"
           @mouseenter.stop="$emit('hover',node.id)"
           @mouseleave.stop="$emit('hover',null)">
        <i v-if="node.children!==undefined" 
           class="fa-solid fa-caret-down tree-node-toggle" 
           :class="{collapsed: collapsed}"
           @click.stop="collapsed = !collapsed"></i>
        <i class="tree-node-icon" :class="iconFor(node.type)"></i>
        <span class="tree-node-type">{{node.type.replace('mj-','')}}</span>

        <div class="node-classes">
          <span class="class-badge-mini" v-for="c in (node.classes||[]).slice(0,3)" :key="'g-'+c" :title="c">.{{c}}</span>
        </div>
        <button v-if="node.children!==undefined" class="tree-node-add" @click.stop="$emit('add', {id:node.id, type:node.type})">
          <i class="fa-solid fa-plus"></i>
        </button>
        <button class="tree-node-copy" @click.stop="$emit('duplicate', node.id)" title="Duplicate">
          <i class="fa-solid fa-copy"></i>
        </button>
        <button class="tree-node-delete" @click.stop="$emit('delete',node)"><i class="fa-solid fa-xmark"></i></button>
      </div>



      <div v-if="node.children!==undefined && !collapsed" class="tree-node-children">

        <Draggable :list="node.children" 
                   :group="{
                     name: 'mjml',
                     put: (to, from, dragEl) => checkDrop(node.type, dragEl)
                   }" 
                   item-key="id"
                   ghost-class="sortable-ghost" 
                   drag-class="sortable-drag" 
                   class="drop-zone"
                   :data-parent-type="node.type">
          <template #item="{element}">
            <tree-node :node="element" :selected-id="selectedId"
                       @select="$emit('select',$event)"
                       @delete="$emit('delete',$event)"
                       @hover="$emit('hover',$event)"
                       @add="$emit('add',$event)"
                       @duplicate="$emit('duplicate',$event)"></tree-node>


          </template>
          <template #footer>
            <div class="drop-hint-area empty" v-if="node.children.length === 0">
               <span class="text-muted" style="font-size:10px">Drag components here or use the + button</span>
            </div>
          </template>

        </Draggable>
      </div>
    </div>
  `,
  methods:{
    checkDrop,
    iconFor,
    stripHtml(h){
      if(!h) return '';
      try{ return new DOMParser().parseFromString(h,'text/html').body.textContent||''; }
      catch{ return h.replace(/<[^>]+>/g,''); }
    },
    getAllowed(){
      const types = allowedChildrenMap[this.node.type] || [];
      return types.map(t => {
        const item = compLib.find(c => c.type === t);
        return { 
          type: t, 
          name: item ? item.name : t.replace('mj-', '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
        };
      });
    },
    addChild(type){
      if (!this.node.children) this.node.children = [];
      this.node.children.push(makeNode(type));
      this.showAddMenu = false;
    }
  }
};

// ── Visual Property Editor Component ──────────────────────────────
const VisualEditorComp = {
  name: 'visual-editor',
  props: ['cls', 'isDark', 'defs', 'categories', 'helpers', 'isInline'],
  template: `
    <div class="visual-editor-compact">

      <!-- Property Grid -->
      <div class="prop-grid">
        <template v-for="cat in categories" :key="cat.name">
          <template v-for="pkey in cat.props" :key="pkey">
            <div v-if="shouldShow(pkey)" class="prop-item-compact" :class="{'prop-item-full': defs[pkey].type==='sides'}">
              <template v-if="defs[pkey]">
                <div class="prop-item-label" :title="pkey">
                  <i class="fa-solid" :class="defs[pkey].icon"></i>
                  <span>{{pkey}}</span>
                </div>
                
                <div class="prop-item-controls">
                  <!-- Color Picker -->
                  <div v-if="defs[pkey].type==='color'" class="color-compact">
                    <div class="color-swatch-mini" :style="{background:helpers.getPropValue(cls, pkey, isDark)||'#000'}">
                      <input type="color" :value="helpers.colorToHex(helpers.getPropValue(cls, pkey, isDark)||'#000000')" 
                             @input="helpers.setPropValue(cls, pkey, $event.target.value, isDark)">
                    </div>
                    <input class="prop-input-mini" :value="helpers.getPropValue(cls, pkey, isDark)" @input="helpers.setPropValue(cls, pkey, $event.target.value, isDark)">
                  </div>

                  <!-- Select -->
                  <select v-else-if="defs[pkey].type==='select'" class="prop-select-mini w-100" 
                          :value="helpers.getPropValue(cls, pkey, isDark)"
                          @change="helpers.setPropValue(cls, pkey, $event.target.value, isDark)">
                    <option v-for="opt in defs[pkey].options" :key="opt" :value="opt">{{opt}}</option>
                  </select>

                  <!-- Numeric / Sides -->
                  <div v-else-if="defs[pkey].type==='slider'" class="unit-input-group w-100">
                      <input type="text" class="prop-input-mini w-100" 
                             :value="helpers.getPropValue(cls, pkey, isDark)"
                             @input="helpers.setPropValue(cls, pkey, $event.target.value, isDark)">
                  </div>

                  <input v-else class="prop-input-mini w-100" :value="helpers.getPropValue(cls, pkey, isDark)" @input="helpers.setPropValue(cls, pkey, $event.target.value, isDark)">
                  
                  <button v-if="helpers.hasPropValue(cls, pkey, isDark)" class="prop-del-mini ms-1" @click="helpers.deleteProp(cls, pkey, isDark)"><i class="fa-solid fa-trash-can"></i></button>
                </div>
              </template>
            </div>
          </template>
        </template>
      </div>

      <!-- Advanced / Other properties flattened -->
      <div class="advanced-mini">
        <div v-for="(v,k) in helpers.getCustomProps(cls, isDark)" :key="k" class="prop-item-compact">
           <div class="prop-item-label">{{k}}</div>
           <div class="prop-item-controls">
              <input class="prop-input-mini w-100" :value="v" @input="helpers.setPropValue(cls, k, $event.target.value, isDark)">
              <button class="prop-del-mini" @click="helpers.deleteProp(cls, k, isDark)"><i class="fa-solid fa-xmark"></i></button>
           </div>
        </div>
        <div v-if="!isInline" class="add-prop-mini">
          <input class="prop-input-mini w-100" list="prop-hints" placeholder="+ New custom property..." 
                 @keyup.enter="helpers.addCustomProp(cls, $event.target.value, isDark); $event.target.value=''">
        </div>
      </div>

      <slot name="footer"></slot>
    </div>
  `,
  methods: {
    shouldShow(pkey) {
      if (!this.cls) return false;
      
      // For both Classes and Inline Node editors, we show all categorization properties 
      // so the user can easily discover and set them.
      if (!this.isDark) return true;

      // In Dark Mode, we show a property if it has a value in Light Mode OR if it already has a Dark override.
      // This keeps the dark mode UI focused on what's actually being used.
      const hasLight = (this.cls.attrs && this.cls.attrs[pkey] !== undefined) || 
                       (this.cls.style && this.cls.style[pkey] !== undefined) ||
                       (this.cls.props && this.cls.props[pkey] !== undefined);
      const hasDark = (this.cls.darkProps && this.cls.darkProps[pkey] !== undefined);
      
      return hasLight || hasDark;
    }
  }
};
