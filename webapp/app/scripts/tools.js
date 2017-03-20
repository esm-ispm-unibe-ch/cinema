var Netplot = require('./netplot.js')();
var ConMat = require('./conmat/conmat.js')();
var Evaluator = require('./evaluator.js')();

var Tools = {
  // NP : Netplot,
  // CM : ConMat,
  // EV : Evaluator,
  // projectId:0,
  // init: (model) => {
  //   let project = model.getProject();
  //   //to be moved to View
  //   Netplot.init(model);
  //   Evaluator.init(model);
  // },
  // bindAction: () => {
  //   NP.bindActions();
  //   CM.bindActions();
  //   CC.bindActions();
  // }
}

module.exports = () => {
  return Tools;
}
