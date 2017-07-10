var deepSeek = require('safe-access');
var clone = require('../../lib/mixins.js').clone;
var uniqId = require('../../lib/mixins.js').uniqId;
var sortStudies = require('../../lib/mixins.js').sortStudies;
var Messages = require('../../messages.js').Messages;
var Report = require('../../purescripts/output/Report');
Report.view = require('../../purescripts/output/Report.View');
Report.update = require('../../purescripts/output/Report.Update');
Report.Actions = require('../../purescripts/output/Report.Actions');
var Nodes = require('../../purescripts/output/Heterogeneity.Nodes');
var ClinImp = require('../../purescripts/output/ClinImp');
ClinImp.update = require('../../purescripts/output/ClinImp.update');
var ComparisonModel = require('../../purescripts/output/ComparisonModel');
var InconsistencyModel = require('../../purescripts/output/InconsistencyModel');
//

var children = [
  Report
  ];

var Update = (model) => {
  //update functions will only change state in that node of the model DAG
  let modelPosition = 'project.inconsistency.heterogeneity';
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
  let HeterogeneityThresholds = [
    { id: 'first',
    },
    { id: 'median',
    },
    { id: 'third',
    }
  ];
  let HeterogeneityRule = [[[3,2],
                            [2,1]], 
                           [[3,3],
                            [3,2]]];
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
    clinImpReady: () => {
      let isready = false;
      if (deepSeek(model,'getState().project.clinImp.status')==='ready'){
        isready = true;
        // console.log('contribution matrix ready');
      }
      return isready;
    },
    fetchRFV: () => {
      return new Promise((resolve, reject) => {
        let mdl = model.getState();
        let clinImp = Number(document.getElementById('clinImpInput').value);
        ClinImp.showValid(model.getState().project.clinImp)(clinImp)();
        let isValid = ClinImp.isValid(model.getState().project.clinImp)(clinImp);
        if(! isValid.value1){
          reject('Error in setting Clinically Important value: '+isValid.value0);
        }else{
          ClinImp.update.set(model.getState().project.clinImp)(Number(clinImp))();
          ocpu.seturl('http://ec2-52-28-232-32.eu-central-1.compute.amazonaws.com:8004/ocpu/library/contribution/R');
          // ocpu.seturl('http://localhost:8004/ocpu/library/contribution/R');
          let params = updaters.getState().referenceValues.params;

          updaters.getState().referenceValues.status = 'loading';
          let res = {
            tauSquareNetwork: model.getState().project.CM.currentCM.hatmatrix.NMAheterResults[0][0].toFixed(3),
            rfvs : []
          }
          let cm = model.getState().project.CM.currentCM;
          let studies = cm.selectedComparisons;
          let ocpuPromises = () => {
            return _.map(studies, sid => {
              return new Promise((oresolve, oreject) => {
                let comparisonType = Nodes.getComparisonType(mdl)(sid);
                if (comparisonType === "") {
                  console.log("Didn't get comparison type");
                  oreject("Didn't get comparison type");
                }else{
                  // console.log("CCOCCOCOCOCOMMMMarison type", comparisonType);
                }
                params.InterventionComparisonType = comparisonType;
                let hmc = ocpu.call('ReferenceValues', params, (sessionh) => {
                  sessionh.getObject( (rfv) => {
                    // console.log('server returned ',rfv);
                    res.rfvs.push({
                      id: sid,
                      first: rfv.quantiles[0][0].toFixed(3),
                      median: rfv.quantiles[0][1].toFixed(3),
                      third: rfv.quantiles[0][2].toFixed(3),
                    });
                    oresolve("success");
                });
                  hmc.fail( () => {
                    updaters.getState().referenceValues.status = 'editing';
                    Messages.alertify().error(hmc.responseText);
                    oreject('R returned an error: ' + hmc.responseText);
                  });
                });
              })
            });
          };
          Promise.all(ocpuPromises()).then(() => {
            updaters.getState().referenceValues.results = res;
            updaters.getState().referenceValues.status = 'ready';
            updaters.setHetersState(updaters.hetersSkeletonModel());
            updaters.saveState();
            resolve(res);
          }).catch(reason => {
            reject(reason);
          });
        }
      }).catch(reason => {
        Messages.alertify().error(reason);
      });
    },
    treatments: () => {
      let mdl = model.getState();
      // Nodes.getState(mdl)();
      return Nodes.setNodes(mdl);
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
      let cm = model.getState().project.CM.currentCM;
      if (updaters.cmReady()) {
        if ((updaters.getState().referenceValues.status === 'ready') 
        || (updaters.getState().referenceValues.status === 'edited')){
          if ((updaters.clinImpReady())) {
          }else{
            if (updaters.getState().referenceValues.status === 'ready'){
              updaters.getState().referenceValues.status = 'edited';
            }
            updaters.setHetersState(updaters.hetersSkeletonModel());
          }
        }else{
          updaters.setRFVState(updaters.rfvEmptyModel());
        }
        if (updaters.getState().heters.status === 'ready'){
        }else{
          updaters.setHetersState(updaters.hetersSkeletonModel());
        }
      }else{
        model.getState().project.inconsistency.heterogeneity = {};
        updaters.setRFVState(updaters.rfvEmptyModel());
        updaters.setHetersState(updaters.hetersEmptyModel());
      }
      let mdl = model.getState();
      _.map(children, c => {
        c.update.updateState(mdl)(mdl);
      });
    },
    setRFVState: (newState) => {
      model.getState().project.inconsistency.heterogeneity.referenceValues = newState;
      updaters.saveState();
    },
    setHetersState: (newState) => {
      model.getState().project.inconsistency.heterogeneity.heters = newState;
      updaters.saveState();
    },
    saveState: () => {
      model.saveState();
      let mdl = model.getState();
      _.map(children, c => { c.update.updateState(mdl)(mdl);});
    },
    createEstimators: () => {
      let cm = model.getState().project.CM.currentCM;
      let pairWiseValues = model.getState().project.CM.currentCM.hatmatrix.Pairwise;
      let pairWiseNames = model.getState().project.CM.currentCM.hatmatrix.rowNamesPairwise;
      let pairWises = _.zip(pairWiseNames,pairWiseValues);
      let NMAValues =  model.getState().project.CM.currentCM.hatmatrix.NMA;
      let NMANames =  model.getState().project.CM.currentCM.hatmatrix.rowNamesNMA;
      let NMAs = _.zip(NMANames,NMAValues);
      let references = updaters.getState().referenceValues.results.rfvs;
      let makeBoxes = (studies) => {
        let res = _.map(studies, s => {
          let pairRow = _.find(pairWises, pw => {
            return _.isEqual(uniqId(s[0].split(':')),uniqId(pw[0].split(' vs ')));
          });
          let nmaRow = _.find(NMAs, nma => {
            return _.isEqual(uniqId(nma[0].split(':')),uniqId(s[0].split(':')));
          });
          let CI = [nmaRow[1][2].toFixed(3), nmaRow[1][3].toFixed(3)];
          let PrI = [nmaRow[1][4].toFixed(3), nmaRow[1][5].toFixed(3)];
          let tauSquare = 'nothing';
          let useExps = (updaters.getState().referenceValues.params.measurement === 'binary') && (
            (model.getState().project.CM.currentCM.params.sm === 'OR') ||
            (model.getState().project.CM.currentCM.params.sm === 'RR')
          );
          let contents = {}
            // console.log("BOX id",s[0]);
            let quantiles = _.find(references, (ref) => {
              let res = false;
              if (typeof ref.id !== 'undefined'){
                let nres = Nodes.isTheSameComparison(ref.id)(s[0]);
                return nres;
              }else{
                res = false;
              }
              return false;
            });
            contents =  {
                id: s[0],
                CI,
                PrI,
                CIf: useExps?Math.exp(CI[0]).toFixed(3):CI[0],
                CIs: useExps?Math.exp(CI[1]).toFixed(3):CI[1],
                PrIf: useExps?Math.exp(PrI[0]).toFixed(3):PrI[0],
                PrIs: useExps?Math.exp(PrI[1]).toFixed(3):PrI[1],
            }
          if(_.isUndefined(pairRow)){
            _.extend(contents,{
                isMixed: false,
            })
          }else{
            tauSquare = pairRow[1][6];
            let ISquare = pairRow[1][7];
            if(! isNaN(tauSquare)){
              tauSquare = pairRow[1][6].toFixed(3);
              ISquare = pairRow[1][7].toFixed(3);
            }
            _.extend(contents,{
                isMixed: true,
                tauSquare,
                ISquare
            })
          }
          contents.quantiles = [{ label: "first quantile"
                                  ,value: quantiles.first
                                },
                                { label: "median"
                                  ,value: quantiles.median
                                },
                                { label: "third quantile"
                                  ,value: quantiles.third
                                }
                               ];
          contents.levels = updaters.getState().heters.levels;
          let clinImp = deepSeek(model,'getState().project.clinImp');
          let crossParams = [contents.CIf,contents.CIs,contents.PrIf,contents.PrIs,clinImp.lowerBound,clinImp.upperBound].map(n => {return Number(n)});
          contents.ruleLevel = updaters.getRuleLevel(...crossParams);
          contents.judgement = contents.ruleLevel;
          return contents;
        });
        return res;
      };
      // let mixed = InconsistencyModel.sortByComparison(
      //   makeBoxes(_.zip(cm.directRowNames,cm.directStudies)));
      console.log('directRownames,studies',cm.directRowNames,cm.directStudies);
      let mixed = makeBoxes(
        sortStudies(cm.directRowNames,cm.directStudies));
      let indirect = makeBoxes(sortStudies(cm.indirectRowNames,cm.indirectStudies));
      console.log("BOXES Names naoume",mixed,indirect);
      return _.union(mixed,indirect);
    },
    getRuleLevel: (CIf,CIs,PrIf,PrIs,lowerBound,upperBound) => {
      let ciCrosses = Nodes.numberOfCrosses(CIf)(CIs)(lowerBound)(upperBound);
      let priCrosses = Nodes.numberOfCrosses(PrIf)(PrIs)(lowerBound)(upperBound);
      let result = Nodes.ruleLevel(parseInt(ciCrosses))(parseInt(priCrosses));
      return result;
    },
    resetHeters: () => {
      updaters.setHetersState(updaters.hetersSkeletonModel());
    },
    getMeasureType: () => {
      let mdl = model.getState();
      let mt = deepSeek(mdl,'project.type');
      let result = "nothing";
      if (typeof mt === 'undefined'){
        result = "nothing";
      }else{
        switch(mt) {
          case "binary":
              result = "binary";
              break;
          case "continuous":
              result = "continuous";
              break;
        } 
      }
      return result;
    },
    rfvEmptyModel: () => {
      return {
        status: 'empty',
        params: {
          measurement: updaters.getMeasureType(),
          OutcomeType: 'nothing'
        },
        treatments: updaters.treatments()
      };
    },
    hetersEmptyModel: () => {
      let boxes = [];
      return { 
        levels: HeterogeneityLevels,
        status: 'not-ready',
        boxes,
      }
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
        status: 'ready',
        boxes,
      }
    },
    selectRFVparam: (param) => {
      // console.log('picked',param.value,param.getAttribute('data-id'),param);
      let paramkey = param.getAttribute('data-id');
      updaters.getState().referenceValues.params[paramkey] = param.value;
      updaters.getState().referenceValues.status = 'edited';
      updaters.saveState();
    },
    resetRFV: () => {
      updaters.setRFVState(updaters.rfvEmptyModel());
      updaters.setHetersState(updaters.hetersSkeletonModel());
      updaters.saveState();
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
    selectAllInterventionTypes: (itv) => {
      console.log("selecting all to" + itv);
      let mdl = model.getState();
      Nodes.setAllNodesIntType(mdl)(itv)();
    },
    deselectIntTypes: () => {
      let mdl = model.getState();
      console.log("deselecting everything");
      Nodes.deselectIntTypes(mdl)();
    },
    selectIntervensionType: (value) => {
      let mdl = model.getState();
      let [node_label, itv] = value.value.split('σδel');
      console.log('selecting',node_label,itv);
      Nodes.setNodeIntType(mdl)(node_label)(itv)();
    },
    selectIndividual: (value) => {
      let [tid,tv] = value.value.split('σδel');
      let boxes = updaters.getState().heters.boxes;
      let tbc = _.find(boxes, m => {
        return Nodes.isTheSameComparison(m.id)(tid);
      });
      let rulevalue = tbc.ruleLevel;
      tbc.judgement = parseInt(tv);
      updaters.getState().status = 'selecting';
      updaters.saveState();
      updaters.getState().status = 'ready';
      updaters.saveState();
    },
  }
  return updaters;
};


module.exports = () => {
  return Update;
}
