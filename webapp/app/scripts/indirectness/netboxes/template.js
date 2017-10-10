var View = require('./view.js')();
var h = require('virtual-dom/h');
var VNode = require('virtual-dom/vnode/vnode');
var VText = require('virtual-dom/vnode/vtext');
var convertHTML = require('html-to-vdom')({
     VNode: VNode,
     VText: VText
});

var Template = (model,children) => {
    var tmpl = GRADE.templates.netindr(
      _.extend(View(model),{text:model.getState().text.NetIndr})
    );
    return h('div#NetIndr.col-xs-12',convertHTML(tmpl));
}

module.exports = () => {
  return Template;
}
