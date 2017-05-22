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
    updateState: () => {
      if ( _.isUndefined(updaters.getState())){
        console.log('ConChart model not ready');
        updaters.setState(updaters.skeletonModel());
      }else{
        console.log('ConChart model ready');
        _.map(children, c => { c.update.updateState(model);});
      }
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
      $('#barChartPrinterFriendly').get(0).toBlob(function(blob) {
        saveAs(blob, model.getState().project.filename+'_chart.png');
      });
    }
  }
  return updaters;
};


module.exports = () => {
  return Update;
}
