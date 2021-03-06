var h = require('virtual-dom/h');
var diff = require('virtual-dom/diff');
var patch = require('virtual-dom/patch');
var createElement = require('virtual-dom/create-element');
var Router = require('./router.js').Router;
var Messages = require('./messages.js').Messages;


var View = {
  //first render
  init: (model) => {
    View.vtree = h('div.container-fluid');
    View.rootNode = createElement(View.vtree);
    document.body.appendChild(View.rootNode);
  },
  render: (model) => {
    return new Promise((resolve, reject) => {
       Router.render(model).then( ptree => {
         let nvtree = h('div.container-fluid', ptree);
         var patches = diff(View.vtree, nvtree);
         patch(View.rootNode, patches);
         View.vtree = nvtree;
         Router.afterRender(model);
      });
    });
  },
};

module.exports = {
  View : View,
}
