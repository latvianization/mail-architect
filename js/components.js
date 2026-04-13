// ── Tree Node Component ───────────────────────────────────────
const TreeNodeComp = {
  name:'tree-node',
  props:{node:Object,selectedId:String},
  emits:['select','delete','hover','add'],

  components:{'Draggable': window.vuedraggable},
  data() { return { showAddMenu: false }; },
  template: `
    <div class="tree-node" @mouseleave.self="$emit('hover',null)" :data-type="node.type">
      <div class="tree-node-row" :class="{selected:node.id===selectedId}"
           :data-type="node.type"
           @click.stop="$emit('select',node.id)"
           @mouseenter.stop="$emit('hover',node.id)"
           @mouseleave.stop="$emit('hover',null)">
        <i class="tree-node-icon" :class="iconFor(node.type)"></i>
        <span class="tree-node-type">{{node.type.replace('mj-','')}}</span>
        <div class="node-classes">
          <span class="node-class-tag" v-for="c in (node.classes||[]).slice(0,2)" :key="c" :title="c">.{{c}}</span>
        </div>
        <button v-if="node.children!==undefined" class="tree-node-add" @click.stop="$emit('add', {id:node.id, type:node.type})">
          <i class="fa-solid fa-plus"></i>
        </button>
        <button class="tree-node-delete" @click.stop="$emit('delete',node)"><i class="fa-solid fa-xmark"></i></button>
      </div>


      <div v-if="node.children!==undefined" class="tree-node-children">
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
                       @add="$emit('add',$event)"></tree-node>

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
  props: ['cls', 'isDark', 'defs', 'categories', 'helpers'],
  template: `
    <div class="visual-editor">
      <div v-for="cat in categories" :key="cat.name" class="prop-category" :class="{open: helpers.isCategoryOpen(cat.name)}">
        <div class="prop-category-header" @click="helpers.toggleCategory(cat.name)">
          <i class="fa-solid prop-category-icon" :class="cat.icon"></i>
          <span class="prop-category-title">{{cat.name}}</span>
          <i class="fa-solid fa-chevron-down prop-category-arrow"></i>
        </div>
        <div class="prop-category-body" v-if="helpers.isCategoryOpen(cat.name)">
          <div v-for="pkey in cat.props" :key="pkey" class="prop-control">
            <template v-if="defs[pkey]">
              <div class="prop-control-header">
                <span class="prop-control-label">
                  <i class="fa-solid" :class="defs[pkey].icon"></i>
                  {{pkey}}
                </span>
                <label v-if="defs[pkey].type==='sides'" class="sides-toggle-wrap">
                  <input type="checkbox" :checked="helpers.isSidesEnabled(cls, pkey, isDark)" @change="helpers.toggleSides(cls, pkey, isDark)">
                  Individual
                </label>
              </div>

              <div v-if="defs[pkey].type==='slider'" class="prop-slider-wrap">
                <input type="range" class="prop-slider" 
                       :min="defs[pkey].min" :max="defs[pkey].max" :step="defs[pkey].step||1"
                       :value="helpers.getPropNumeric(cls, pkey, isDark)"
                       @input="helpers.setPropNumeric(cls, pkey, $event.target.value, defs[pkey].unit, isDark)">
                <span class="prop-slider-val">{{helpers.getPropNumeric(cls, pkey, isDark)}}{{defs[pkey].unit}}</span>
              </div>

              <select v-else-if="defs[pkey].type==='select'" class="field-select" 
                      :value="helpers.getPropValue(cls, pkey, isDark)"
                      @change="helpers.setPropValue(cls, pkey, $event.target.value, isDark)">
                <option v-for="opt in defs[pkey].options" :key="opt" :value="opt">{{opt}}</option>
              </select>

              <div v-else-if="defs[pkey].type==='color'" class="color-picker-wrap">
                <div class="color-swatch-btn" :style="{background:helpers.getPropValue(cls, pkey, isDark)||'#000'}">
                  <input type="color" :value="helpers.colorToHex(helpers.getPropValue(cls, pkey, isDark)||'#000000')" 
                         @input="helpers.setPropValue(cls, pkey, $event.target.value, isDark)">
                </div>
                <input class="field-input py-1" :value="helpers.getPropValue(cls, pkey, isDark)" @input="helpers.setPropValue(cls, pkey, $event.target.value, isDark)">
              </div>

              <div v-else-if="defs[pkey].type==='sides'">
                <div v-if="!helpers.isSidesEnabled(cls, pkey, isDark)" class="prop-slider-wrap">
                  <input type="range" class="prop-slider" 
                         :min="defs[pkey].min" :max="defs[pkey].max"
                         :value="helpers.getPropNumeric(cls, pkey, isDark)"
                         @input="helpers.setPropNumeric(cls, pkey, $event.target.value, defs[pkey].unit, isDark)">
                  <span class="prop-slider-val">{{helpers.getPropNumeric(cls, pkey, isDark)}}{{defs[pkey].unit}}</span>
                </div>
                <div v-else class="sides-grid">
                  <div v-for="s in ['top','right','bottom','left']" :key="s" class="side-item">
                    <div class="d-flex justify-content-between align-items-center mb-1">
                      <span class="side-label">{{s}}</span>
                      <span class="side-val" style="font-size:9px; font-weight:700; color:#6366f1">{{helpers.getSidesNumeric(cls, pkey, s, isDark)}}</span>
                    </div>
                    <input type="range" class="prop-slider mini" 
                           :min="defs[pkey].min" :max="defs[pkey].max"
                           :value="helpers.getSidesNumeric(cls, pkey, s, isDark)"
                           @input="helpers.setSidesNumeric(cls, pkey, s, $event.target.value, defs[pkey].unit, isDark)">
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
  `
};
