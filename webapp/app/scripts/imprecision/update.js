var deepSeek = require('safe-access');
var clone = require('../lib/mixins.js').clone;
var uniqId = require('../lib/mixins.js').uniqId;
var sortStudies = require('../lib/mixins.js').sortStudies;
var Messages = require('../messages.js').Messages;
var Report = require('../purescripts/output/Report');
Report.view = require('../purescripts/output/Report.View');
Report.update = require('../purescripts/output/Report.Update');
var Rules = require('../purescripts/output/Imprecision.Rules');
var ClinImp = require('../purescripts/output/ClinImp');
ClinImp.update = require('../purescripts/output/ClinImp.update');
var ComparisonModel = require('../purescripts/output/ComparisonModel');

var children = [
  Report
  ];

var Update = (model) => {
  let modelPosition = 'project.imprecision';
  let ImprecisionLevels = [
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
      if (deepSeek(model, 'getState().project.CM.currentCM.status')==='ready'){
        isready = true;
      }
      return isready;
    },
    clinImpReady: () => {
      let isready = false;
      if (deepSeek(model, 'getState().project.clinImp.status')==='ready'){
        isready = true;
      }
      return isready;
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
        }
    },
    imprecisionReady: () => {
      return (deepSeek(model,'getState().project.imprecision.status')==='ready');
    },
    updateState: (model) => {
      let mdl = model.getState();
      if (updaters.cmReady() && updaters.clinImpReady()) {
        if (updaters.imprecisionReady()){
        }else{
          updaters.setState(updaters.skeletonModel());
        }
      }else{
        model.getState().project.imprecision = {};
        updaters.setState(updaters.emptyModel());
      }
      _.map(children, c => {
        c.update.updateState(mdl)(mdl);
      });
    },
    setState: (newState) => {
      model.getState().project.imprecision = newState;
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
      let NMAs = model.getState().project.CM.currentCM.hatmatrix.NMAresults;
      //let NMANames =  model.getState().project.CM.currentCM.hatmatrix.rowNamesNMAresults;
      //let NMAs = _.zip(NMANames,NMAValues);
      let makeBoxes = (studies) => {
        let res = _.map(studies, s => {
          let pairRow = _.find(pairWises, pw => {
            return _.isEqual(uniqId(s[0].split(':')),uniqId(pw[0].split(' : ')));
          });
          let nmaRow = _.find(NMAs, nma => {
            return _.isEqual(uniqId(nma["_row"].split(':')),uniqId(s[0].split(':')));
          });
          let sm = model.getState().project.CM.currentCM.params.sm;
          let useExps =  ((sm === 'OR') || (sm === 'RR'));
          let CIf = useExps ? Math.exp(nmaRow["lower CI"]) : nmaRow["lower CI"];
          let CIs = useExps ? Math.exp(nmaRow["upper CI"]) : nmaRow["upper CI"];
          let contents = {}
            // console.log("BOX id",s[0]);
            contents =  {
                id: nmaRow["_row"],
                CIf: CIf.toFixed(3), 
                CIs: CIs.toFixed(3)
            }
          if(_.isUndefined(pairRow)){
            _.extend(contents,{
                isMixed: false,
            })
          }else{
            _.extend(contents,{
                isMixed: true,
            })
          }
          contents.levels = deepSeek(model,'getState().project.imprecision.levels');
          let clinImp = deepSeek(model,'getState().project.clinImp');
          let crossParams = [contents.CIf,contents.CIs,clinImp.lowerBound,clinImp.upperBound].map(n => {return Number(n)});
          contents.ruleLevel = updaters.getRuleLevel(...crossParams);
          contents.crosses = updaters.getNumberOfCrosses(...crossParams);
          contents.judgement = contents.ruleLevel;
          return contents;
        });
        return res;
      };
      let mixed = makeBoxes(
        sortStudies(cm.directRowNames,cm.directStudies));
      let indirect = makeBoxes(sortStudies(cm.indirectRowNames,cm.indirectStudies));
       //console.log("BOXES Names naoume",mixed,indirect);
      return _.union(mixed,indirect);
    },
    getRuleLevel: (CIf,CIs,lowerBound,upperBound) => {
      let ciCrosses = Rules.numberOfCrosses(CIf)(CIs)(lowerBound)(upperBound);
      let result = parseInt(ciCrosses) + 1;
      return result;
    },
    getNumberOfCrosses: (CIf,CIs,lowerBound,upperBound) => {
      let ciCrosses = Rules.numberOfCrosses(CIf)(CIs)(lowerBound)(upperBound);
      let result = parseInt(ciCrosses);
      return result;
    },
    resetBoxes: () => {
      updaters.setState(updaters.skeletonModel());
    },
    getOutcomeType: () => {
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
    emptyModel: () => {
      let boxes = [];
      return { 
        status: 'not-ready',
        boxes,
        levels: ImprecisionLevels
      }
    },
    skeletonModel: () => {
      let boxes = [];
      if(updaters.clinImpReady()){
        boxes = updaters.createEstimators();
      }else{
        boxes = [];
      }
      return { 
        status: 'ready',
        boxes,
        levels: ImprecisionLevels

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
    selectIndividual: (value) => {
      let [tid,tv] = value.value.split('σδel');
      let boxes = updaters.getState().boxes;
      let tbc = _.find(boxes, m => {
        return Rules.isTheSameComparison(m.id)(tid);
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
