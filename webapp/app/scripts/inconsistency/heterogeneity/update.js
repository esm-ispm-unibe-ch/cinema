var deepSeek = require('safe-access');
var clone = require('../../lib/mixins.js').clone;
var uniqId = require('../../lib/mixins.js').uniqId;
var sortStudies = require('../../lib/mixins.js').sortStudies;
var Messages = require('../../messages.js').Messages;
var Report = require('../../purescripts/output/Report');
Report.view = require('../../purescripts/output/Report.View');
Report.update = require('../../purescripts/output/Report.Update');
var Nodes = require('../../purescripts/output/Heterogeneity.Nodes');
var ClinImp = require('../../purescripts/output/ClinImp');
ClinImp.update = require('../../purescripts/output/ClinImp.Update');
var ComparisonModel = require('../../purescripts/output/ComparisonModel');
var InconsistencyModel = require('../../purescripts/output/InconsistencyModel');
var RFVQ = require('../../purescripts/output/Heterogeneity.ReferenceValues');
let referenceValues = require('./reference.json');
//

var children = [
  Report
  ];

var Update = (model) => {
  let modelPosition = 'project.inconsistency.heterogeneity';
  let availableParameters =  [
    {
      id: 'measurement',
      label: 'Measurement',// from text file
      selections: [
        { id : 'nothing',
          label: '--',
          isAvailable: true,
          isDisabled: true
        },
        { id :'binary',
          label: 'binary',
          isAvailable: true
        },
        { id :'continuous',
          label: 'continuous',
          isAvailable: true
        }
      ]
    },
    {
      id: "InterventionType",
      label: "Intervention Type",
      selections: []
    },
    {
      id: 'InterventionComparisonType',
      label: 'Intervention comparison type',
      isAvailable: true,
      selections: [
        { id : 'nothing',
          label: '--',
          isDisabled: true,
          isAvailable: true
        },
        { id : 'Pharmacological vs Placebo/Control',
          label: 'Pharmacological vs Placebo/Control',
          isAvailable: true
        },
        { id :'Pharmacological vs Pharmacological',
          label: 'Pharmacological vs Pharmacological',
          isAvailable: true
        },
        { id : 'Non-pharmacological vs any',
          label: 'Non-pharmacological vs any',
          isAvailable: true
        }
      ]
    },
    {
        id: 'OutcomeType',
        label: 'Outcome type',
        options: {
          binaryOptions : ['Objective','Semi-objective','Subjective'],
          continuousOptions : ['Obstetric outcome', 
                'Resource use and hospital stay/process', 
                'Internal and external structure-related outcome',
                'General physical health and adverse event and pain and quality of life/functioning',
                'Signs/symptoms reflecting continuation/end of condition and infection/onset of new acute/chronic disease',
                'Mental health outcome',
                'Biological marker',
                'Various subjectively measured outcomes']
        }
      }
  ];
  let HeterogeneityLevels = [
    { id: 1,
      color: '#02c000'
    },
    { id: 2,
      color: '#e0df02'
    },
    { id: 3,
      color: '#c00000'
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
      }
      return isready;
    },
    makeReferenceTable: () => {
      let params = _.filter(availableParameters,
        p => {
          return p.id !== "InterventionType";
        }
      );
      let par = _.reduce(params, (m,p) => {
        let ob = {};
        let sels = [];
        if (p.id === "OutcomeType"){
          sels = _.union(p.options.binaryOptions, p.options.continuousOptions);
        }else{
          sels = _.filter(_.map(p.selections, s => {return s.id}),
            f => {
             return f !== "nothing";
            });
        }
        ob[p.id] = sels;
        return _.extend(m, ob); 
      },{});
      let combs = RFVQ.makeQueries(par);
      // console.log("available parameters",par,combs);
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
          updaters.setHetersState(updaters.hetersSkeletonModel());
        }
    },
    fetchRFV: () => {
      return new Promise((resolve, reject) => {
        let mdl = model.getState();
          let params = updaters.getState().referenceValues.params;

          updaters.getState().referenceValues.status = 'loading';
          let res = {
            rfvs : []
          }
          let cm = model.getState().project.CM.currentCM;
          let studies = cm.selectedComparisons;
          let refPromises = () => {
            return _.map(studies, sid => {
              return new Promise((oresolve, oreject) => {
                let comparisonType = Nodes.getComparisonType(mdl)(sid);
                if (comparisonType === "") {
                  oreject("Didn't get comparison type");
                }else{
                  //console.log("CCOCCOCOCOCOMMMMarison type", sid, comparisonType);
                }
                params.InterventionComparisonType = comparisonType;
                let prms = params.measurement + "." +params.OutcomeType +"."+ comparisonType;
                let rfv = deepSeek(referenceValues, prms);
                if (typeof rfv == 'undefined'){
                  oreject("Reference Values not found"+params);
                }
                res.rfvs.push({
                  id: sid,
                  first: rfv.first.toFixed(3),
                  median: rfv.median.toFixed(3),
                  third: rfv.third.toFixed(3),
                });
                oresolve("success");
              })
            });
          };
          Promise.all(refPromises()).then(() => {
            updaters.getState().referenceValues.results = res;
            updaters.getState().referenceValues.status = 'ready';
            updaters.saveState();
            resolve(res);
          }).catch(reason => {
            reject(reason+"lkj"+res);
          });
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
        if ((updaters.clinImpReady())) {
          if (updaters.getState().heters.status === 'ready'){
              let mdl = model.getState();
              _.map(children, c => {
                c.update.updateState(mdl)(mdl);
              });
          }else{
            updaters.setHetersState(updaters.hetersSkeletonModel());
          }
        }else{
          model.getState().project.inconsistency.heterogeneity = {};
          updaters.setRFVState(updaters.rfvEmptyModel());
          updaters.setHetersState(updaters.hetersEmptyModel());
        }
        if ((updaters.getState().referenceValues.status === 'ready') 
        || (updaters.getState().referenceValues.status === 'edited')){
              let mdl = model.getState();
              _.map(children, c => {
                c.update.updateState(mdl)(mdl);
              });
        }else{
          updaters.setRFVState(updaters.rfvEmptyModel());
          updaters.saveState();
        }
      }else{
        model.getState().project.inconsistency.heterogeneity = {};
        updaters.setRFVState(updaters.rfvEmptyModel());
        updaters.setHetersState(updaters.hetersEmptyModel());
      }
    },
    setRFVState: (newState) => {
      model.getState().project.inconsistency.heterogeneity.referenceValues = newState;
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
      let pairWises = model.getState().project.CM.currentCM.hatmatrix.Pairwise;
      let NMAs = model.getState().project.CM.currentCM.hatmatrix.NMAresults;
      let makeBoxes = (studies) => {
        let res = _.map(studies, s => {
          let pairRow = _.find(pairWises, pw => {
            return _.isEqual(uniqId(s[0].split(':')),uniqId(pw["_row"].split(' : ')));
          });
          let nmaRow = _.find(NMAs, nma => {
            return _.isEqual(uniqId(nma["_row"].split(':')),uniqId(s[0].split(':')));
          });
          let sm = model.getState().project.CM.currentCM.params.sm;
          let useExps =  ((sm === 'OR') || (sm === 'RR'));
          let tauSquare = 'nothing';
          let CIf = useExps 
            ? Math.exp(nmaRow["lower CI"]) : nmaRow["lower CI"];
          let CIs = useExps 
            ? Math.exp(nmaRow["upper CI"]) : nmaRow["upper CI"];
          let PrIf = useExps 
            ? Math.exp(nmaRow["lower PrI"]) : nmaRow["lower PrI"];
          let PrIs = useExps 
            ? Math.exp(nmaRow["upper PrI"]) : nmaRow["upper PrI"];
          let contents = {}
            // console.log("BOX id",s[0]);
            contents =  {
                id: nmaRow["_row"],
                CIf: CIf.toFixed(3), 
                CIs: CIs.toFixed(3),
                PrIf: PrIf.toFixed(3), 
                PrIs: PrIs.toFixed(3)
            }
          if(_.isUndefined(pairRow)){
            _.extend(contents,{
                isMixed: false,
            })
          }else{
            tauSquare = pairRow.tau2;
            let ISquare = pairRow.I2;
            if((typeof tauSquare !== 'undefined') && (! isNaN(tauSquare))){
              tauSquare = tauSquare.toFixed(3);
              ISquare = ((ISquare * 100).toFixed(1)).toString()+"%";
            }
            _.extend(contents,{
                isMixed: true,
                tauSquare,
                ISquare
            })
          }
          contents.levels = updaters.getState().heters.levels;
          let clinImp = deepSeek(model,'getState().project.clinImp');
          let crossParams = [contents.CIf,contents.CIs,contents.PrIf,contents.PrIs,clinImp.lowerBound,clinImp.upperBound].map(n => {return Number(n)});
          contents.ruleLevel = updaters.getRuleLevel(...crossParams);
          contents.crosses = updaters.getNumberOfCrosses(...crossParams);
          contents.judgement = contents.ruleLevel;
          return contents;
        });
        return res;
      };
      // let mixed = InconsistencyModel.sortByComparison(
      //   makeBoxes(_.zip(cm.directRowNames,cm.directStudies)));
      // console.log('directRownames,studies',cm.directRowNames,cm.directStudies);
      let mixed = makeBoxes(
        sortStudies(cm.directRowNames,cm.directStudies));
      let indirect = makeBoxes(sortStudies(cm.indirectRowNames,cm.indirectStudies));
      // console.log("BOXES Names naoume",mixed,indirect);
      return _.union(mixed,indirect);
    },
    getRuleLevel: (CIf,CIs,PrIf,PrIs,lowerBound,upperBound) => {
      let ciCrosses = Nodes.numberOfCrosses(CIf)(CIs)(lowerBound)(upperBound);
      let priCrosses = Nodes.numberOfCrosses(PrIf)(PrIs)(lowerBound)(upperBound);
      let result = Nodes.ruleLevel(parseInt(ciCrosses))(parseInt(priCrosses));
      return result;
    },
    getNumberOfCrosses: (CIf,CIs,PrIf,PrIs,lowerBound,upperBound) => {
      let ciCrosses = Nodes.numberOfCrosses(CIf)(CIs)(lowerBound)(upperBound);
      let priCrosses = Nodes.numberOfCrosses(PrIf)(PrIs)(lowerBound)(upperBound);
      let result = [parseInt(ciCrosses),parseInt(priCrosses)];
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
    tauSquareNetwork: () => {
      let tauSquareNetwork = 0;
      if (deepSeek(model,"getState().project.CM.currentCM.hatmatrix.NMAheterResult") !== undefined){
        tauSquareNetwork = model.getState().project.CM.currentCM.hatmatrix.NMAheterResults[0][0].toFixed(3);
      }
      return tauSquareNetwork;
    },
    rfvEmptyModel: () => {
      return {
        status: 'empty',
        availableParameters: availableParameters,
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
      if(updaters.clinImpReady()){
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
      // console.log("selecting all to" + itv);
      let mdl = model.getState();
      Nodes.setAllNodesIntType(mdl)(itv)();
    },
    deselectIntTypes: () => {
      let mdl = model.getState();
      // console.log("deselecting everything");
      Nodes.deselectIntTypes(mdl)();
    },
    selectIntervensionType: (value) => {
      let mdl = model.getState();
      let [node_label, itv] = value.value.split('σδel');
      // console.log('selecting',node_label,itv);
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
