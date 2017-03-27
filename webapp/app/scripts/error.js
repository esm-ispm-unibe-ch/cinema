var h = require('virtual-dom/h');
var VNode = require('virtual-dom/vnode/vnode');
var VText = require('virtual-dom/vnode/vtext');
var convertHTML = require('html-to-vdom')({
     VNode: VNode,
     VText: VText
});

var Error = {
  init: () => {},
  render: (model) => {
    var tmpl = GRADE.templates.error(model.getState().text);
    return convertHTML(tmpl);
  }
}

module.exports = () => {
  return Error;
}
