var Netplot = require('./netplot.js')();
var RobSelect = require('./robSelector.js')();
var ConMat = require('./conmatrix.js')();
var ConChart = require('./conchart.js')();

var Tools = {
  NP : Netplot,
  RS : RobSelect,
  CM : ConMat,
  CC : ConChart,
  projectId:0,
  init: (model) => {
    let project = model.getProject();
    //to be moved to View
    Netplot.init(model);
    RobSelect.init(model);
    ConMat.init(model.project);
  }
}

module.exports = () => {
  return Tools;
}
