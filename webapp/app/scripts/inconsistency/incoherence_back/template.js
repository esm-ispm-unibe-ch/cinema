var h = require('virtual-dom/h');
// if you use handlebars
// var VNode = require('virtual-dom/vnode/vnode');
// var VText = require('virtual-dom/vnode/vtext');
// var convertHTML = require('html-to-vdom')({
//      VNode: VNode,
//      VText: VText
// });

      //in case you still use handlebars
      // var tmpl = GRADE.templates.conmatrix(View(model));
      // return h("div#contMatContainer.col-xs-12",convertHTML(tmpl));
var Template = (model,children) => {
  return h('div.menu', [
    h('ul', [
      h('li', 'Incoherence baby!!'),
      h('a', {
        'attributes': {
          'onclick': 'Actions.Incoherence.clickedMe()'
        }
      }, 'Click'),
      h('li', 'option #2')
    ])
  ])
}

module.exports = () => {
  return Template;
}
