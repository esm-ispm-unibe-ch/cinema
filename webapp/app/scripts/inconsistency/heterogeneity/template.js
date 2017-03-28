var h = require('virtual-dom/h');
var View = require('./view.js')();
var VNode = require('virtual-dom/vnode/vnode');
var VText = require('virtual-dom/vnode/vtext');
var convertHTML = require('html-to-vdom')({
     VNode: VNode,
     VText: VText
});

      //in case you still use handlebars
var Template = (model,children) => {
  var tmpl = GRADE.templates.heterogeneity(_.extend(View(model),{text:model.getState().text.Heterogeneity}));
  return convertHTML(tmpl);
}

module.exports = () => {
  return Template;
}
