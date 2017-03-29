var deepSeek = require('safe-access');
var clone = require('../lib/mixins.js').clone;

var children = [
  ];

var Update = (model) => {
  //update functions will only change state in that node of the model DAG
  let modelPosition = 'model position of NAC';
  let updaters = {
    getState: () => {
      return deepSeek(model.getState(),modelPosition);
    },
    updateState: (model) => {
      if ( _.isUndefined(updaters.getState())){
        updaters.setState(updaters.skeletonModel());
      }else{
        console.log('NAC model ready');
        _.map(children, c => { c.update.updateState(model);});
      }
    },
    setState: (newState) => {
    // Edit it to much NAC's model object
      model.getState().modelPosition = newState;
      updaters.saveState();
    },
    saveState: () => {
      model.saveState();
      _.map(children, c => { c.update.updateState();});
    },
    skeletonModel: () => {
      return { 
        //default properties go here
      }
    },
    clickedMe: () => {
      console.log('clicked me');
    }
  }
  return updaters;
};


module.exports = () => {
  return Update;
}
