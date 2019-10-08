var h = require('virtual-dom/h');
var View = require('./view.js')();
var VNode = require('virtual-dom/vnode/vnode');
var VText = require('virtual-dom/vnode/vtext');
var convertHTML = require('html-to-vdom')({
     VNode: VNode,
     VText: VText
});

var Template = (model,children) => {
  let view = View(model);
    var tmpl = GRADE.templates.indrchart(
     _.extend(View(model),{ text:model.getState().text.IndrChart})
    );
  return h('div#IndrChartWrapper.col-md-offset-2.col-md-8.col-xs-12',convertHTML(tmpl));
}

module.exports = () => {
  return Template;
}
