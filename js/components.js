// ── Tree Node Component ───────────────────────────────────────
const TreeNodeComp = {
  name:'tree-node',
  props:{node:Object,selectedId:String},
  emits:['select','delete','hover'],
  components:{'Draggable': window.vuedraggable},
  template:`
    <div class="tree-node" @mouseleave.self="$emit('hover',null)" :data-type="node.type">
      <div class="tree-node-row" :class="{selected:node.id===selectedId}"
           :data-type="node.type"
           @click.stop="$emit('select',node.id)"
           @mouseenter.stop="$emit('hover',node.id)"
           @mouseleave.stop="$emit('hover',null)">
        <i class="tree-node-icon" :class="iconFor(node.type)"></i>
        <span class="tree-node-type">{{node.type}}</span>
        <div class="node-classes">
          <span class="node-class-tag" v-for="c in (node.classes||[]).slice(0,2)" :key="c" :title="c">.{{c}}</span>
          <span class="node-class-tag" v-if="(node.classes||[]).length>2" style="color:#94a3b8">+{{node.classes.length-2}}</span>
        </div>
        <button class="tree-node-delete" @click.stop="$emit('delete',node)"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div v-if="node.type==='mj-text'||node.type==='mj-button'" class="tree-node-preview">{{stripHtml(node.content)||'—'}}</div>
      <div v-if="node.children!==undefined" class="tree-node-children">
        <Draggable :list="node.children" 
                   :group="{
                     name: 'mjml',
                     put: (to, from, dragEl) => checkDrop(node.type, dragEl)
                   }" 
                   item-key="id"
                   ghost-class="sortable-ghost" drag-class="sortable-drag" class="drop-zone">
          <template #item="{element}">
            <tree-node :node="element" :selected-id="selectedId"
                       @select="$emit('select',$event)"
                       @delete="$emit('delete',$event)"
                       @hover="$emit('hover',$event)"></tree-node>
          </template>
          <template #footer>
            <div class="drop-hint-list" :class="{ 'persistent-hint': node.children.length > 0 }">
              <div class="drop-hint-title">Drop or Add:</div>
              <div class="drop-hint-items">
                <button v-for="c in getAllowed()" :key="c.type" class="drop-hint-btn" @click="addChild(c.type)">
                  + {{c.name}}
                </button>
              </div>
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
        return { type: t, name: item ? item.name : t.replace('mj-', '') };
      });
    },
    addChild(type){
      if (!this.node.children) this.node.children = [];
      this.node.children.push(makeNode(type));
    }
  }
};
