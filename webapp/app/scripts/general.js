var h = require('virtual-dom/h');
var Netplot = require('./netplot.js')();
var ConMat = require('./conmat/conmat.js')();
var ConChart = require('./conchart.js')();
var DirectRob = require('./directrob/directrob.js')();

var General = {
  view: {
    register: (model) => {
      _.map(General.renderChildren, c => {
        c.view.register(model);
      });
    }
  },
  render: (model) => {
    return h('div#content.row',
      [
      _.map(General.renderChildren, c => {
         return c.render(model);
        })
      ]);
  },
  afterRender: () => {
    _.map(General.renderChildren, c => {
      c.afterRender();
    });
  },
  renderChildren: [
    Netplot,
    DirectRob,
    ConMat,
  ]
}

module.exports = () => {
  return General;
}
