var View = require('./view.js')();
var h = require('virtual-dom/h');
var VNode = require('virtual-dom/vnode/vnode');
var VText = require('virtual-dom/vnode/vtext');
var convertHTML = require('html-to-vdom')({
     VNode: VNode,
     VText: VText
});

var Template = (model,children) => {
    var tmpl = GRADE.templates.indirectness(
      _.extend(View(model),{text:model.getState().text.directIndr})
    );
    let tmplchildren = _.map(children, c => {return c.render(model);});
    return [h('div#directSelectionWrapper.col-xs-12',convertHTML(tmpl))].concat(_.flatten(tmplchildren));
}

module.exports = () => {
  return Template;
}
