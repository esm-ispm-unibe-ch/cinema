var Netplot = require('./netplot.js')();
var Evaluator = require('./evaluator.js')();
var ConMat = require('./conmatrix.js')();
var ConChart = require('./conchart.js')();

var Tools = {
  NP : Netplot,
  CM : ConMat,
  CC : ConChart,
  EV : Evaluator,
  projectId:0,
  init: (model) => {
    let project = model.getProject();
    //to be moved to View
    Netplot.init(model);
    Evaluator.init(model);
    ConMat.init(model);
  }
}

module.exports = () => {
  return Tools;
}
