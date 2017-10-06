var deepSeek = require('safe-access');
var clone = require('../../lib/mixins.js').clone;
var Messages = require('../../messages.js').Messages;
//var NetIndr = require('../netIndr.js')();

var children = [
  //NetRoB
  ];

var Update = (model) => {
  //update functions will only change state in that node of the model DAG
  let modelPosition = 'project.indirectness';
  let directComparisons = deepSeek(model.getState(),'project.studies.directComparisons');
  let updaters = {
    getState: () => {
      return deepSeek(model,'getState().project.indirectness');
    },
    updateState: (model) => {
      //console.log('updating state form directindr');
      if (deepSeek(model,'getState().project.CM.currentCM.status') !== 'ready'){
	updaters.setState(updaters.skeletonModel());
        console.log('updating state indir',updaters.getState());
      }else{
	let isReady = _.any(directComparisons, dc => {
	  return _.isUndefined(dc.directIndr);
	});
	if ((isReady===true)|| _.isUndefined(updaters.getState())){
	  updaters.resetindirectness();
	}else{
	  //console.log('indirectness model ready');
	}
      }
      _.map(children, c => { c.update.updateState(model);});
    },
    indrLevels: () => {
      let indrs = model.defaults.indrLevels;
      _.map(indrs, i => {
        return i.label = model.getState().text.indrLevels[i.id-1];
      });
      return indrs;
    },
    resetindirectness: () => {
      _.map(directComparisons, dc => {
        dc.directIndr = 'nothing';
      });
      updaters.setState(updaters.skeletonModel());
    },
    setState: (newState) => {
      if(typeof deepSeek(model,'getState().project') !== 'undefined'){
        model.getState().project.indirectness = newState;
        updaters.saveState();
      }else{
        console.log("lathos!!")
      }
    },
    selectindr: (rule) => {
      let drstate = updaters.getState();
      drstate.rule = rule.value;
      drstate.status = 'ready';
      _.map(deepSeek(model.getState(),'project.studies.directComparisons'), dc => {
        dc.directIndr = dc[rule.value];
      });
      updaters.saveState();
      Messages.alertify().success(model.getState().text.directIndr.directIndrSet);
      //console.log('the rule you picked was', rule.value);
    },
    selectAll: value => {
      console.log("you have selected all to be", value);
    },
    selectIndividual: (value) => {
      let [tid,tv] = value.value.split('σδel');
      let tbc = _.find(directComparisons, dc => {
        return dc.id === tid;
      });
      if(parseInt(tv) !== tbc[updaters.getState().rule]){
        if((tbc.directIndr === 'nothing')||(tbc.directIndr === tbc[updaters.getState().rule])){
          updaters.getState().customized += 1;
        }      
      }else{
        updaters.getState().customized -= 1;
      }
      tbc.directIndr = parseInt(tv);
      updaters.getState().status = 'selecting';
      updaters.saveState();
      updaters.getState().status = 'ready';
      Messages.alertify().success(tid.replace(',',':')+' '+model.getState().text.directIndr.directIndrSet);
      updaters.saveState();
    },
    saveState: () => {
      model.saveState();
      _.map(children, c => { c.update.updateState(model);});
    },
    skeletonModel: () => {
      let levels = updaters.indrLevels();
      return { 
        status: 'noindr',// noindr, editing, ready
        rule: 'noindr', // noindr, majindr, meanindr, maxindr
        levels,
        customized: 0
      }
    },
    clickedMe: () => {
      //console.log('clicked me');
    }
  }
  return updaters;
};


module.exports = () => {
  return Update;
}
