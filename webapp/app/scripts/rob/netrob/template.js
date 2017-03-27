var View = require('./view.js')();
var h = require('virtual-dom/h');
var VNode = require('virtual-dom/vnode/vnode');
var VText = require('virtual-dom/vnode/vtext');
var convertHTML = require('html-to-vdom')({
     VNode: VNode,
     VText: VText
});

var Template = (model,children) => {
    var tmpl = GRADE.templates.netrob(
      _.extend(View(model),{ text:model.getState().text.NetRob})
    );
    return h("div#directRob.col-xs-12",convertHTML(tmpl));
}

module.exports = () => {
  return Template;
}
