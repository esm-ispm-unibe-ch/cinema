var RoB = require('../rob/rob.js')();
var deepSeek = require('safe-access');
var clone = require('../lib/mixins.js').clone;
var Messages = require('../messages.js').Messages;

var children = [
  RoB
  ];

var Update = (model) => {
  //update functions will only change state in that node of the model DAG
  let modelPosition = "project.DirectRob";
  let directComparisons = deepSeek(model.getState(),'project.studies.directComparisons');
  let updaters = {
    getState: () => {
      return deepSeek(model.getState(),modelPosition);
    },
    updateState: () => {
      console.log("updating state form directrob");
      let isReady = _.any(directComparisons, dc => {
        return _.isUndefined(dc.directRob);
      });
      if ((isReady===true)|| _.isUndefined(updaters.getState())){
        updaters.resetDirectRob();
      }else{
        console.log("DirectRob model ready");
        _.map(children, c => { c.update.updateState(model);});
      }
    },
    resetDirectRob: () => {
      _.map(directComparisons, dc => {
        dc.directRob = 'nothing';
      });
      updaters.setState(updaters.skeletonModel());
    },
    setState: (newState) => {
      // this affects the whole node in the state.
      let  DirectRobState = deepSeek(model.getState(),"project");
      DirectRobState.DirectRob = newState;
      updaters.saveState();
    },
    selectrob: (rule) => {
      let drstate = updaters.getState();
      drstate.rule = rule.value;
      drstate.status = 'ready';
      _.map(deepSeek(model.getState(),'project.studies.directComparisons'), dc => {
        dc.directRob = dc[rule.value];
      });
      updaters.saveState();
      Messages.alertify().success(model.getState().text.directRob.directRobSet);
      console.log('the rule you picked was', rule.value);
    },
    selectIndividual: (value) => {
      let [tid,tv] = value.value.split('σδel');
      let tbc = _.find(directComparisons, dc => {
        return dc.id === tid;
      });
      if(parseInt(tv) !== tbc[updaters.getState().rule]){
        if((tbc.directRob === 'nothing')||(tbc.directRob === tbc[updaters.getState().rule])){
          updaters.getState().customized += 1;
        }      
      }else{
        updaters.getState().customized -= 1;
      }
      tbc.directRob = parseInt(tv);
      updaters.getState().status = 'selecting';
      updaters.saveState();
      updaters.getState().status = 'ready';
      Messages.alertify().success(tid.replace(",",":")+" "+model.getState().text.directRob.directRobSet);
      updaters.saveState();
    },
    saveState: () => {
      model.saveState();
      _.map(children, c => { c.update.updateState(model);});
    },
    skeletonModel: () => {
      return { 
        status: 'norob',// norob, editing, ready
        rule: 'norob', // norob, majrob, meanrob, maxrob
        customized: 0
      }
    },
    clickedMe: () => {
      console.log("clicked me");
    }
  }
  return updaters;
};


module.exports = () => {
  return Update;
}
