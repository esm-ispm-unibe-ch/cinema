var Netplot = require('./netplot.js')();
var Evaluator = require('./evaluator.js')();
var ConMat = require('./conmatrix.js')();
var ConChart = require('./conchart.js')();

var General = {
  view: {
    register: (model) => {
      _.map(General.renderChildren, c => {
        c.view.register(model);
      });
    }
  },
  render: (model,container) => {
    var tmpl = GRADE.templates.general();
    $(container).html(tmpl);
    _.map(General.renderChildren, c => {
      c.render(model);
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
