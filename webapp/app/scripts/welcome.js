var h = require('virtual-dom/h');
var VNode = require('virtual-dom/vnode/vnode');
var VText = require('virtual-dom/vnode/vtext');
var convertHTML = require('html-to-vdom')({
     VNode: VNode,
     VText: VText
});

var Welcome = {
  view: {
    register: (model) => {
      Welcome.model = model;
    },
  },
  init: () => {},
  render: (model) => {
    var tmpl = GRADE.templates.welcome(model.state.text);
    return h('div#contentWelcome.row',convertHTML(tmpl));
  }
}

module.exports = () => {
  return Welcome;
}
