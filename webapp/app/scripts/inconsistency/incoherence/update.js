var deepSeek = require('safe-access');
var clone = require('../../lib/mixins.js').clone;
var uniqId = require('../../lib/mixins.js').uniqId;
var sortStudies = require('../../lib/mixins.js').sortStudies;
var Messages = require('../../messages.js').Messages;
var ClinImp = require('../../purescripts/output/ClinImp');
ClinImp.update = require('../../purescripts/output/ClinImp.Update');
var ComparisonModel = require('../../purescripts/output/ComparisonModel');
var Report = require('../../purescripts/output/Report');
Report.view = require('../../purescripts/output/Report.View');
Report.update = require('../../purescripts/output/Report.Update');

var children = [
  Report
  ];

var Update = (model) => {
  //update functions will only change state in that node of the model DAG
  let modelPosition = 'project.incoherence';
  let IncoherenceLevels = [
    { id: 1,
      color: '#02c000'
    },
    { id: 2,
      color: '#e0df02'
    },
    { id: 3,
      color: '#c00000'
  }];
  let updaters = {
    getState: () => {
      return deepSeek(model.getState(),modelPosition);
    },
    cmReady: () => {
      let isready = false;
      if (deepSeek(model.getState(),'project.CM.currentCM.status') === 'ready'){
        isready = true;
      }
      return isready;
    },
    statusReady: () => {
      return  (updaters.getState().status === 'ready');
    },
    clinImpReady: () => {
      let isready = false;
      if (deepSeek(model,'getState().project.clinImp.status')==='ready'){
        isready = true;
      }
      return isready;
    },
    clinImp: () => {
      return model.getState().project.clinImp.baseValue;
    },
    clinImpLow: () => {
      return model.getState().project.clinImp.lowerBound.toFixed(3);
    },
    clinImpHigh: () => {
      return model.getState().project.clinImp.upperBound.toFixed(3);
    },
    updateState: (model) => {
      let cm = deepSeek(model,"getState().project.CM.currentCM");
      if (updaters.cmReady() && updaters.clinImpReady()){
        if (updaters.getState().status === 'ready'){
        }else{
          updaters.setState(updaters.skeletonModel());
        }
      }else{
        model.getState().project.incoherence = {};
        updaters.setState(updaters.emptyModel());
      }
      let mdl = model.getState();
      _.map(children, c => {
        c.update.updateState(mdl)(mdl);
      });
    },
    setState: (newState) => {
      model.getState().project.incoherence = newState;
      updaters.saveState();
    },
    saveState: () => {
      model.saveState();
      let mdl = model.getState();
      _.map(children, c => {
        c.update.updateState(mdl)(mdl);
      });
    },
    isRatio: () => {
      let sm = model.getState().project.CM.currentCM.params.sm;
      let res = false;
      if((sm === "OR")||(sm==="RR")){
        res = true;
      }
      return res;
    },
    expIt: (value) => {
      let out = value;
      if(updaters.isRatio()){
        out = Math.exp(value);
      }
      return out.toFixed(3);
    },
    createEstimators: () => {
      let cm = model.getState().project.CM.currentCM;
      let NMAs = model.getState().project.CM.currentCM.hatmatrix.NMAresults;
      let levels = IncoherenceLevels;
      let makeBoxes = (studies) => {
        let res = _.map(studies, s => {
          let nmaRow = _.find(NMAs, nma => {
            return _.isEqual(uniqId(nma["_row"].split(':')),uniqId(s[0].split(':')));
          });
          let contents = {}
            contents =  {
                id: nmaRow["_row"],
                levels
            }
          if(_.isUndefined(nmaRow["Direct"])){
            if(_.isUndefined(nmaRow["Indirect"])){
              console.log("ERRROORRR indirect direct in Incohrence");
            }else{
              _.extend(contents,{
                  isMixed: false,
                  isDirect: false,
                  isIndirect: true,
                  indirect: updaters.expIt(nmaRow.Indirect),
                  indirectL: updaters.expIt(nmaRow.IndirectL),
                  indirectU: updaters.expIt(nmaRow.IndirectU),
              })
            }
          }else{
            if(_.isUndefined(nmaRow["Indirect"])){
              _.extend(contents,{
                  isMixed: false,
                  isDirect: true,
                  isIndirect: false,
                  direct: updaters.expIt(nmaRow.Direct),
                  directL: updaters.expIt(nmaRow.DirectL),
                  directU: updaters.expIt(nmaRow.DirectU),
              })
            }else{
              _.extend(contents,{
                  isMixed: true,
                  isDirect: false,
                  isIndirect: false,
                  sideIF: updaters.expIt(nmaRow.SideIF),
                  sideIFLower: updaters.expIt(nmaRow.SideIFlower),
                  sideIFUpper: updaters.expIt(nmaRow.SideIFupper),
                  Ztest: nmaRow.SideZ.toFixed(3),
                  pvalue: nmaRow.SidePvalue.toFixed(3),
                  directContribution: nmaRow.PropDir,
                  nma: updaters.expIt(nmaRow["NMA treatment effect"]),
                  nmaL: updaters.expIt(nmaRow["lower CI"]),
                  nmaU: updaters.expIt(nmaRow["upper CI"]),
                  direct: updaters.expIt(nmaRow.Direct),
                  directL: updaters.expIt(nmaRow.DirectL),
                  directU: updaters.expIt(nmaRow.DirectU),
                  indirect: updaters.expIt(nmaRow.Indirect),
                  indirectL: updaters.expIt(nmaRow.IndirectL),
                  indirectU: updaters.expIt(nmaRow.IndirectU),
              })
            }
          }
          contents.ruleJudgement = 
            updaters.getRuleJudgement(contents);
          contents.judgement = contents.ruleJudgement;
          contents.customized = false;
          return contents;
        });
        return res;
      };
      let mixed = makeBoxes(sortStudies(cm.directRowNames,cm.directStudies));
      let indirect = makeBoxes(sortStudies(cm.indirectRowNames,cm.indirectStudies));
      return _.union(mixed, indirect);
    },
    selectIndividual: (value) => {
      let [tid,tv] = value.value.split('σδel');
      let boxes = updaters.getState().boxes
      let tbc = _.find(boxes, m => {
        return m.id === tid;
      });
      let rulevalue = tbc.ruleJudgement
      tbc.judgement = parseInt(tv);
      tbc = updaters.updateBox(tbc, parseInt(tv));
      updaters.saveState();
      Messages.alertify().success(model.getState().text.Incoherence.IncoherenceSet);
    },
    updateBox: (box) => {
      let levels = _.map(box.levels, l => {
        let level = clone(l);
        let label = model.getState().text.Incoherence.levels[level.id-1];
        let name = {};
        let isActive = parseInt(box.judgement) === parseInt(level.id);
        if (isActive) {
          box.label = label; 
        }
        name = {
          isActive,
          label,
        }
        return _.extend(level, name);
      });
      box.levels = levels;
      box.customized = box.ruleJudgement !== box.judgement;
      box.color = _.find(box.levels, l => {return l.id === box.judgement}).color;
      return box;
    },
    updateBoxes: (boxes) => {
      return _.map(boxes, box => {
        return updaters.updateBox(box);
      });
    },
    mixedRuleTable : [
      [1,1,2],
      [2,2,3],
      [2,3,3]
    ],
    getRuleJudgement : (comparison) => {
      let netpvalue = updaters.rfvs()[2];
      let sidepvalue = comparison.pvalue;
      let level = 0; 
      let pindex = (pv) => {
        let xr = -1;
        if (pv > 0.1){
          xr = 0;
        }else{
          if ((pv <= 0.1) && (pv > 0.01)){
            xr = 1;
          }else{
            xr = 2;
          }
        }
        return xr;
      };
      let lowClin = parseFloat(updaters.clinImpLow());
      let highClin = parseFloat(updaters.clinImpHigh());
      let lowDir = parseFloat(comparison.directL);
      let highDir = parseFloat(comparison.directU);
      let lowIndir = parseFloat(comparison.indirectL);
      let highIndir = parseFloat(comparison.indirectU);
      // boolean tuple is in area Left Inside to the Right of the Clinically
      // important zone
      let makeVector = (l, h) => {
        let lowest = parseFloat(l);
        let highest = parseFloat(h);
        // left of clin imp
        let areaA = false;
        // inside clin imp zone
        let areaB = false;
        // right of clin imp zone
        let areaC = false;
        if (lowest < lowClin){
          areaA = true;
        }
        if ((lowest < highClin) && (highest > lowClin)){
          areaB = true;
        }
        if (highest > highClin){
          areaC = true;
        }
        let vec = [areaA, areaB, areaC];
        //console.log("areas vectors",[lowest,highest], vec,[lowClin,highClin]);
        return vec;
      }
      if (comparison.isMixed) {
        // common areas
        if(sidepvalue>=0.1){
          level = 1;
        }else{
          let rule = { 0: 3
                     , 1: 3
                     , 2: 2
                     , 3: 1};
          let dirv = makeVector(lowDir, highDir);
          let indirv = makeVector(lowIndir, highIndir); 
          let vsum = _.reduce(_.map(_.zip(dirv,indirv), 
            a => {let [f,s] = a; return f === s?1:0}),
            (acc,r) => {return acc + r},0);
          level = rule[vsum];
        }
      }else{
        if (comparison.isDirect) {
          level = 1;
        }else{
          if (comparison.isIndirect) {
            let rule = [1,2,3];
            level = rule[pindex(netpvalue)];
          }else{
            level = 0;
          }
        }
      }
      return level;
    },
    rfvs : () => {
      let dbt = [];
      if(! _.isUndefined(deepSeek(model.getState(),'project.CM.currentCM.hatmatrix.dbt[0]'))){
        dbt = _.map(model.getState().project.CM.currentCM.hatmatrix.dbt[0], d => {
          return d.toFixed(3);
        });
        dbt[1]=parseInt(dbt[1]);
      }
      return dbt;
    },
    skeletonModel: () => {
      let out = {};
      let boxes = updaters.createEstimators();
      boxes = updaters.updateBoxes(boxes);
      out = { 
        status: 'ready',
        referenceValues: updaters.rfvs(),
        boxes,
      }
      return out;
    },
    emptyModel: () => {
      return {
        status: "empty",
        boxes: [],
        referenceValues: []
      }
    },
    setClinImp: () => {
        let mdl = model.getState();
        let clinImp = Number(document.getElementById('clinImpInput').value);
        ClinImp.showValid(model.getState().project.clinImp)(clinImp)();
        let isValid = ClinImp.isValid(model.getState().project.clinImp)(clinImp);
        if(! isValid.value1){
          Messages.alertify().error('Error in setting Clinically Important value: '+isValid.value0);
        }else{
          ClinImp.update.set(model.getState().project.clinImp)(Number(clinImp))();
          updaters.updateState(model);
        }
    },
    resetClinImp: (emtype) => {
      let [title,msg,successmsg] = model.getState().text.ClinImp.reset;
      return new Promise (function(resolve,reject) {
        Messages.alertify().confirm
          ( title
          , msg
          , function () {
            ClinImp.update.reSet(emtype)();
            Messages.alertify().message(successmsg);
            resolve(true);
        }, function () {reject(false);});
        }).then(function(res){
      }).catch(function(reason){
      })
    },
    resetIncoherence: () => {
      updaters.setState(updaters.skeletonModel());
      updaters.saveState();
    },
  }
  return updaters;
};


module.exports = () => {
  return Update;
}
