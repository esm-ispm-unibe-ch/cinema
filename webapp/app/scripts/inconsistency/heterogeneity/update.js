var deepSeek = require('safe-access');
var clone = require('../../lib/mixins.js').clone;
var uniqId = require('../../lib/mixins.js').uniqId;
var Messages = require('../../messages.js').Messages;

var children = [
  ];

var Update = (model) => {
  //update functions will only change state in that node of the model DAG
  let modelPosition = 'project.Inconsistency.Heterogeneity';
  let HeterogeneityLevels = [
    { id: 1,
      color: '#7CC9AE'
    },
    { id: 2,
      color: '#FBBC05'
    },
    { id: 3,
      color: '#E0685C'
  }];
  let HeterogeneityRules = [
    { id: 'first',
    },
    { id: 'median',
    },
    { id: 'third',
    }
  ];
  let updaters = {
    getState: () => {
      return deepSeek(model.getState(),modelPosition);
    },
    cmReady: () => {
      let isready = false;
      if (deepSeek(model,'getState().project.CM.currentCM.status')==='ready'){
        isready = true;
        // console.log('contribution matrix ready');
      }
      return isready;
    },
    fetchRFV: () => {
      return new Promise((resolve, reject) => {
      // ocpu.seturl('http://ec2-35-156-97-18.eu-central-1.compute.amazonaws.com:8004/ocpu/library/contribution/R');
      ocpu.seturl('http://localhost:8004/ocpu/library/contribution/R');
      let params = updaters.getState().referenceValues.params;
      updaters.getState().referenceValues.status = 'loading';
      let hmc = ocpu.call('ReferenceValues',params, (sessionh) => {
        sessionh.getObject( (rfv) => {
          console.log('server returned ',rfv);
          let res = {
            tauSquareNetwork: model.getState().project.CM.currentCM.hatmatrix.NMAheterResults[0][0],
            first: rfv.quantiles[0][0],
            median: rfv.quantiles[0][1],
            third: rfv.quantiles[0][2],
          };
          updaters.getState().referenceValues.results = res;
          updaters.getState().referenceValues.status = 'ready';
          updaters.setHetersState(updaters.hetersSkeletonModel());
          updaters.saveState();
          resolve(res);
      });
        hmc.fail( () => {
          updaters.getState().referenceValues.status = 'editing';
          Messages.alertify().error(hmc.responseText);
          reject('R returned an error: ' + hmc.responseText);
        });
      });
      });
    },
    rfvChanged: () => {
      return  (updaters.getState().referenceValues.status !== 'empty');
    },
    hetersChanged: () => {
      return (updaters.getState().heters.status !== 'empty');
    },
    rfvReady: () => {
      return  (updaters.getState().referenceValues.status === 'ready');
    },
    hetersReady: () => {
      return  (updaters.getState().heters.status === 'ready');
    },
    updateState: (model) => {
      if (updaters.cmReady()){
        _.map(children, c => { c.update.updateState();});
        //HAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAASSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSTOOOOOOOOOOOOBBER~D~ELELTLELTLLETLELLTLETED
          updaters.setHetersState(updaters.hetersSkeletonModel());
      }else{
        model.getState().project.Inconsistency.Heterogeneity = {};
        updaters.setRFVState(updaters.rfvSkeletonModel());
        updaters.setHetersState(updaters.hetersSkeletonModel());
      }
    },
    setRFVState: (newState) => {
      model.getState().project.Inconsistency.Heterogeneity.referenceValues = newState;
      updaters.saveState();
    },
    setHetersState: (newState) => {
      model.getState().project.Inconsistency.Heterogeneity.heters = newState;
      updaters.saveState();
    },
    saveState: () => {
      model.saveState();
      _.map(children, c => { c.update.updateState();});
    },
    createEstimators: () => {
      let cm = model.getState().project.CM.currentCM;
      let pairWiseValues = model.getState().project.CM.currentCM.hatmatrix.Pairwise;
      let pairWiseNames = model.getState().project.CM.currentCM.hatmatrix.rowNamesPairwise;
      let pairWises = _.zip(pairWiseNames,pairWiseValues);
      let NMAValues =  model.getState().project.CM.currentCM.hatmatrix.NMA;
      let NMANames =  model.getState().project.CM.currentCM.hatmatrix.rowNamesNMA;
      let NMAs = _.zip(NMANames,NMAValues);
      let ruleLevel = (argsss) => {
        let [rule,CI,PrI,tauSquare] = argsss;
        let baseValue = updaters.getState().referenceValues.results[rule.id];
        console.log('baseValue',rule,baseValue);
        let tauExists = () => {
          return ! isNaN(tauSquare);
        };
        let tauBigger = () => {
          return tauSquare > baseValue;
        };
        let prProblem = () => {
          let CIcrosses = CI[0] * CI[1] < 0;
          let PrIcrosses = PrI[0] * PrI[1] < 0;
          return !((CIcrosses && PrIcrosses) || (! CIcrosses && ! PrIcrosses));
        };
        let res = 0;
        if(tauExists()) {
          res = tauBigger();
        }else{
          if(prProblem()){
            res = 2;
          }else{
            res = 1;
          }
        }
        return res;
      };
      let makeBoxes = (studies) => {
        let res = _.map(studies, s => {
          let pairRow = _.find(pairWises, pw => {
            return _.isEqual(uniqId(s[0].split(':')),uniqId(pw[0].split(' vs ')));
          });
          let nmaRow = _.find(NMAs, nma => {
            return _.isEqual(uniqId(nma[0].split(':')),uniqId(s[0].split(':')));
          });
          let CI = [nmaRow[1][2], nmaRow[1][3]];
          let PrI = [nmaRow[1][4], nmaRow[1][5]];
          let tauSquare = 'nothing';
          let useExps = (updaters.getState().referenceValues.params.measurement === 'binary') && (
            (model.getState().project.CM.currentCM.params.sm === 'OR') ||
            (model.getState().project.CM.currentCM.params.sm === 'RR')
          );
          let contents = {}
            contents =  {
                id: s[0],
                CIf: useExps?Math.exp(CI[0]).toFixed(4):CI[0],
                CIs: useExps?Math.exp(CI[1]).toFixed(4):CI[1],
                PrIf: useExps?Math.exp(PrI[0]).toFixed(4):PrI[0],
                PrIs: useExps?Math.exp(PrI[1]).toFixed(4):PrI[1],
                judgement: 'nothing'
            }
          if(_.isUndefined(pairRow)){
            _.extend(contents,{
                isMixed: false,
            })
          }else{
            tauSquare = pairRow[1][6];
            let ISquare = pairRow[1][7];
            _.extend(contents,{
                isMixed: true,
                tauSquare,
                ISquare
            })
          }
          let boxrules = _.map(updaters.getState().heters.availablerules, rule => {
            if(tauSquare === 'nothing'){
              return {
                id: rule.id,
                level: ruleLevel([rule,CI,PrI])
              }
            }else{
              return {
                id: rule.id,
                level: ruleLevel([rule,CI,PrI,tauSquare])
              }
            }
          });
          contents.rules = boxrules;
          let levels = _.union([{
            id:'nothing',
            label: '--',
            isDisabled: true
          }],updaters.getState().heters.levels);
          contents.levels = levels;
          return contents;
        });
        return res;
      };
      let mixed = makeBoxes(_.zip(cm.directRowNames,cm.directStudies));
      let indirect = makeBoxes(_.zip(cm.indirectRowNames,cm.indirectStudies));
      // console.log('mixed',mixed);
      return _.union(mixed,indirect);
    },
    selectHetersRule: (rule) => {
      let hstate = updaters.getState().heters;
      hstate.rule = rule.value;
      hstate.status = 'ready';
      let boxes = updaters.getState().boxes; 
      _.map(boxes, m => {
        m.judgement = _.find(m.rules,mr =>{return mr.id===rule.value}).value;
      });
      updaters.saveState();
      Messages.alertify().success(model.getState().text.Heterogeneity.HeterogeneitySet);
    },
    resetHeters: () => {
      updaters.setHetersState(updaters.hetersSkeletonModel());
    },
    rfvSkeletonModel: () => {
      return {
        status: 'empty',
        params: {
          measurement: 'nothing',
          OutcomeType: 'nothing',
          InterventionComparisonType: 'nothing'
        }
      };
    },
    setRule: (rule) => {
      model.getState().project.Inconsistency.Heterogeneity.heters.rule = rule;
    },
    hetersSkeletonModel: () => {
      let boxes = [];
      if(updaters.rfvReady()){
        boxes = updaters.createEstimators();
      }else{
        boxes = [];
      }
      return { 
        levels: HeterogeneityLevels,
        availablerules: HeterogeneityRules,
        rule: 'noRule',
        status: 'noRule',
        boxes,
      }
    },
    selectRFVparam: (param) => {
      console.log('picked',param.value,param.getAttribute('data-id'),param);
      let paramkey = param.getAttribute('data-id');
      updaters.getState().referenceValues.params[paramkey] = param.value;
      updaters.getState().referenceValues.status = 'edited';
      updaters.saveState();
    },
    resetRFV: () => {
      updaters.setRFVState(updaters.rfvSkeletonModel());
      updaters.setHetersState(updaters.hetersSkeletonModel());
      updaters.saveState();
    },
  }
  return updaters;
};


module.exports = () => {
  return Update;
}
