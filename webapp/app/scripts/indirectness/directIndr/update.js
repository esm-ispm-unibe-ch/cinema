var deepSeek = require('safe-access');
var clone = require('../../lib/mixins.js').clone;
var Messages = require('../../messages.js').Messages;
var NetIndr = require('../netboxes/netboxes.js')();
var IndrChart = require('../indrchart/indrchart.js')();

var children = [
    IndrChart
  , NetIndr
  ];

var Update = (model) => {
  //update functions will only change state in that node of the model DAG
  let modelPosition = 'project.indirectness.directs';
  let directComparisons = deepSeek(model.getState(),'project.studies.directComparisons');
  let updaters = {
    getState: () => {
      return deepSeek(model,'getState().project.indirectness.directs');
    },
    updateState: (model) => {
      if (deepSeek(model,'getState().project.CM.currentCM.status') !== 'ready'){
	updaters.setState(updaters.skeletonModel());
      }else{
	if (_.isUndefined(updaters.getState())){
          updaters.setState(updaters.skeletonModel());
	}else{
          //console.log("Direct indirectness READY");
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
    setState: (newState) => {
      if(typeof deepSeek(model,'getState().project') !== 'undefined'){
        model.getState().project.indirectness = {
          directs: newState
        };
        updaters.saveState();
      }else{
        console.log("lathos!! indirectness")
      }
    },
    selectindr: (rule) => {
      let drstate = updaters.getState();
      drstate.rule = rule.value;
      drstate.status = 'ready';
      _.map(updaters.getState().directBoxes, dc => {
        dc.directIndr = dc[rule.value];
      });
      updaters.saveState();
      Messages.alertify().success(model.getState().text.directIndr.directIndrSet);
      //console.log('the rule you picked was', rule.value);
    },
    setAll: value => {
      let v = value.value;
      let out = updaters.getState();
      let dcs = _.map(updaters.getState().directBoxes,box => {
        box.judgement = v;
        return box
      });
      out.directBoxes = dcs;
      out.status = "ready";
      updaters.setState(out);
    },
    selectIndividual: (value) => {
      let [tid,tv] = value.value.split('σδel');
      let tbc = _.find(updaters.getState().directBoxes, dc => {
        return dc.id.toString() === tid.toString();
      });
      if(parseInt(tv) !== tbc[updaters.getState().rule]){
        if((tbc.directIndr === 'nothing')||(tbc.directIndr === tbc[updaters.getState().rule])){
          updaters.getState().customized += 1;
        }      
      }else{
        updaters.getState().customized -= 1;
      }
      tbc.judgement = parseInt(tv);
      updaters.getState().status = 'selecting';
      updaters.saveState();
      updaters.getState().status = 'ready';
      Messages.alertify().success(tid.replace(',',':')+' '+model.getState().text.directIndr.directIndrSet);
      updaters.saveState();
    },
    resetDirectIndr: () => {
      updaters.setState(updaters.skeletonModel());
    },
    saveState: () => {
      model.saveState();
      _.map(children, c => { c.update.updateState(model);});
    },
    selectDirectRule: (rule) => {
      let ns = updaters.getState();
      let r = rule.value;
      let boxs = updaters.getState().directBoxes;
      let out = _.map(boxs, b => {
        b.judgement = b[r];
        return b;
      });
      ns.directBoxes = out;
      ns.status = 'ready';
      ns.rule = r;
      updaters.setState(ns);
    },
    skeletonModel: () => {
      let levels = updaters.indrLevels();
      let directBoxes = clone(deepSeek(model,'getState().project.studies.directComparisons'));
      _.map(directBoxes, box => {box.judgement = "nothing"; return box});
      let hd = (() => {
        let out = false;
        if (typeof deepSeek(directBoxes,'[0].majindr') !== 'undefined'){
          out = directBoxes[0].majindr !== -1;
        }else{
          out = false;
        }
        return out;
      })();
      return { 
        status: 'noindr',// noindr, editing, ready
        rule: 'noindr', // noindr, manual, majindr, meanindr, maxindr
        levels,
        //hasData: false, //
        hasData: hd, 
        directBoxes,
        customized: 0,
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
