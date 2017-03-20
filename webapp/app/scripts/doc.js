var h = require('virtual-dom/h');
var VNode = require('virtual-dom/vnode/vnode');
var VText = require('virtual-dom/vnode/vtext');
var convertHTML = require('html-to-vdom')({
     VNode: VNode,
     VText: VText
});

var Doc = {
  view: {
    register: (model) => {
      Doc.model = model;
    },
  },
  init: () => {},
  render: (model) => {
    var tmpl = GRADE.templates.doc(model.state.text);
    return h("div#content.row",convertHTML(tmpl));
  }
}

module.exports = () => {
  return Doc;
}
