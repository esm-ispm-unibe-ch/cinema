var Messages = require('./messages.js').Messages;
var Netplot = require('./netplot.js')();
var RobSelect = require('./robSelector.js')();
var ConMat = require('./conmatrix.js')();

var Tools = {
  areRendered: false,
  projectId:0,
  init: (model) => {
    let project = model.getProject();
    if (Tools.projectId!==project.id){
      Tools.areRendered=false;
      Tools.projectId=project.id;
    }
    if (!(Tools.areRendered)){
      Netplot.init(model);
      RobSelect.init(model);
      ConMat.init(model.project);
      Tools.areRendered=true;
    }
  }
}

module.exports = () => {
  return Tools;
}
