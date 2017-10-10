var deepSeek = require('safe-access');
var clone = require('../../lib/mixins.js').clone;

var children = [
  ];

var Update = (model) => {
  //update functions will only change state in that node of the model DAG
  let modelPosition = 'getState().project.indirectness.IndrChart';
  let updaters = {
    getState: () => {
      return deepSeek(model,modelPosition);
    },
    dirsReady: () => {
      let isready = false;
      if (deepSeek(model,'getState().project.indirectness.directs.status')==='ready'){
        isready = true;
      }
      return isready;
    },
    updateState: () => {
      if ( updaters.dirsReady() ){
        updaters.setState(updaters.skeletonModel());
      }
      _.map(children, c => { c.update.updateState(model);});
    },
    // this affects the whole node in the state.
    setState: (newState) => {
      model.getState().project.indirectness.IndrChart = newState;
      updaters.saveState();
    },
    saveState: () => {
      model.saveState();
      _.map(children, c => { c.update.updateState();});
    },
    skeletonModel: () => {
      return { 
        status: 'loading' // loading ready
      }
    },
    save: () => {
      //$('#IndrChartPrinterFriendly').get(0).toBlob(function(blob) {
      $('#IndrChart').get(0).toBlob(function(blob) {
        saveAs(blob, model.getState().project.filename+'_indirectness_chart.png');
      });
    }
  }
  return updaters;
};


module.exports = () => {
  return Update;
}
