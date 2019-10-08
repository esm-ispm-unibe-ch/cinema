var deepSeek = require('safe-access');
var clone = require('../../lib/mixins.js').clone;

var children = [
  ];

var Update = (model) => {
  //update functions will only change state in that node of the model DAG
  let modelPosition = 'getState().project.netRob.ConChart';
  let updaters = {
    getState: () => {
      return deepSeek(model,modelPosition);
    },
    drobReady: () => {
      let isready = false;
      if (deepSeek(model,'getState().project.DirectRob.status')==='ready'){
        isready = true;
      }
      return isready;
    },
    updateState: () => {
      if ( updaters.drobReady() ){
        updaters.setState(updaters.skeletonModel());
      }
      _.map(children, c => { c.update.updateState(model);});
    },
    // this affects the whole node in the state.
    setState: (newState) => {
      model.getState().project.netRob.ConChart = newState;
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
      $('#barChart').get(0).toBlob(function(blob) {
        saveAs(blob, model.getState().project.filename+'_RoB_chart.png');
      });
    }
  }
  return updaters;
};


module.exports = () => {
  return Update;
}
