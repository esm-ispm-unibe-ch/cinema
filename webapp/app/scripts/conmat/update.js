var deepSeek = require('safe-access');
var Update = (model) => {
  let cm = deepSeek(model,'getState().project.CM');
  let cmc = deepSeek(cm,'currentCM');
  let params = deepSeek(cmc,'params');
  let updaters = {
    setState: (incm) => {
      model.getState().project.CM = incm;
      updaters.saveState();
    },
    createMatrix: () => {
      updaters.update.fetchCM()
        .then(updaters.removeLoader)
        .then(updaters.makeDownloader)
        .then(updaters.showTable)
        .then(hot => {
          bindTableResize(hot, 'cm-table-container');
        }).catch( err => {
          CM.removeLoader();
          Messages.alertify().error(Messages.ocpuError + err);
          CM.checkInputs();
      });
    },
    selectParams: (params) => {
      model.getState().project.CM.currentCM.params = params;
      updaters.saveState();
    },
    checkAllIntvs: () => {
      let project = model.getState().project;
      let intvs = _.map(project.studies.nodes, pn => {
        return pn.id;
      });
      model.getState().project.CM.currentCM.params.intvs = intvs;
      updaters.saveState();
    },
    uncheckAllIntvs: () => {
      model.getState().project.CM.currentCM.params.intvs = [];
      updaters.saveState();
    },
    checkInputs: () => {
      return true;
    },
    saveState: () => {
      model.saveState();
      updaters.updateChildren();
    },
    updateChildren: () => {
      _.map(children, c => {c.update.updateState()});
    }
  }
  return updaters;
};

var children = [
  ];

module.exports = () => {
  return Update;
}
