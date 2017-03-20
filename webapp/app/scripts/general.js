var h = require('virtual-dom/h');
var diff = require('virtual-dom/diff');
var patch = require('virtual-dom/patch');
var createElement = require('virtual-dom/create-element');
var Netplot = require('./netplot.js')();
var Evaluator = require('./evaluator.js')();
var ConMat = require('./conmat/conmat.js')();
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
