const { buildAttrs } = require('./js/utils.js');

const node = {
  id: '123',
  type: 'mj-text',
  classes: ['blue-text'],
  attrs: { align: 'center' }
};

console.log('Builder View (Code):', buildAttrs(node, {}, {}, { includeInternalIds: true, previewMode: false }));
console.log('Clean Export:', buildAttrs(node, {}, {}, { includeInternalIds: false, previewMode: false }));
console.log('Preview View:', buildAttrs(node, {}, {}, { includeInternalIds: true, previewMode: true }));
