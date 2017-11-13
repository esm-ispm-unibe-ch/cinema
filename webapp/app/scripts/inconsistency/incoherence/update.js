var deepSeek = require('safe-access');
var clone = require('../../lib/mixins.js').clone;
var uniqId = require('../../lib/mixins.js').uniqId;
var sortStudies = require('../../lib/mixins.js').sortStudies;
var Messages = require('../../messages.js').Messages;
var Report = require('../../purescripts/output/Report');
Report.view = require('../../purescripts/output/Report.View');
Report.update = require('../../purescripts/output/Report.Update');

var children = [
  Report
  ];

var Update = (model) => {
  //update functions will only change state in that node of the model DAG
  let modelPosition = 'project.inconsistency.incoherence';
  let IncoherenceLevels = [
    { id: 1,
      color: '#7CC9AE'
    },
    { id: 2,
      color: '#FBBC05'
    },
    { id: 3,
      color: '#E0685C'
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
    updateState: (model) => {
      let cm = model.getState().project.CM.currentCM;
      if (updaters.cmReady()){
        if (updaters.getState().status === 'ready'){
        }else{
          updaters.setState(updaters.skeletonModel());
        }
      }else{
        model.getState().project.inconsistency.incoherence = {};
        updaters.setState(updaters.emptyModel());
      }
      let mdl = model.getState();
      _.map(children, c => {
        c.update.updateState(mdl)(mdl);
      });
    },
    setState: (newState) => {
      model.getState().project.inconsistency.incoherence = newState;
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
      if (comparison.isMixed) {
        let dcont = comparison.directContribution;
        if (dcont > 0.9){
          level = 1;
        }else{
          level = updaters.mixedRuleTable[pindex(sidepvalue)][pindex(netpvalue)];
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
