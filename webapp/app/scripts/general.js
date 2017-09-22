var h = require('virtual-dom/h');
var Netplot = require('./netplot.js')();
var ConMat = require('./conmat/conmat.js')();

var General = {
  view: {
    register: (model) => {
      _.map(General.renderChildren, c => {
        c.view.register(model);
      });
    }
  },
  render: (model) => {
    return h('div#contentGeneral.row',
      _.map(General.renderChildren, c => {
         return c.render(model);
        })
     );
  },
  afterRender: () => {
    _.map(General.renderChildren, c => {
      c.afterRender();
    });
  },
  renderChildren: [
    Netplot,
    ConMat,
  ]
}

module.exports = () => {
  return General;
}
