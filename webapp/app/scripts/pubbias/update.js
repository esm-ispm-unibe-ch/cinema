var deepSeek = require('safe-access');
var clone = require('../lib/mixins.js').clone;
var uniqId = require('../lib/mixins.js').uniqId;
var sortStudies = require('../lib/mixins.js').sortStudies;
var Messages = require('../messages.js').Messages;
var Report = require('../purescripts/output/Report');
var Rules = require('../purescripts/output/Imprecision.Rules');
var FR = require('../lib/readFile.js').FR;
var htmlEntities = require('../lib/mixins.js').htmlEntities;
var Checker = require('../lib/fileChecks.js').Checker;
Report.view = require('../purescripts/output/Report.View');
Report.update = require('../purescripts/output/Report.Update');
var ComparisonModel = require('../purescripts/output/ComparisonModel');

var children = [
  Report
  ];

var Update = (model) => {
  let modelPosition = 'project.pubbias';
  let PubbiasLevels = model.getState().defaults.pubbiasLevels;
  let updaters = {
    getState: () => {
      return deepSeek(model.getState(),modelPosition);
    },
    cmReady: () => {
      let isready = false;
      if (deepSeek(model,'getState().project.CM.currentCM.status')==='ready'){
        isready = true;
      }
      return isready;
    },
    pubbiasReady: () => {
      return (deepSeek(model,'getState().project.pubbias.status')==='ready');
    },
    allLow: () => {
      _.map(updaters.getState().boxes,b=>{
        b.judgement = 1;
      });
      updaters.getState().status = 'ready';
      updaters.saveState();
    },
    allSome: () => {
      _.map(updaters.getState().boxes,b=>{
        b.judgement = 2;
      });
      updaters.getState().status = 'ready';
      updaters.saveState();
    },
    allHigh: () => {
      _.map(updaters.getState().boxes,b=>{
        b.judgement = 3;
      });
      updaters.getState().status = 'ready';
      updaters.saveState();
    },
    uploadTable2: (evt) => {
      return new Promise((resolve,reject) => {
       function checkFile(json) {
         return new Promise((resolve,reject) => {
           let requiredColumns = ['comparison','treat1','treat2','final'];
           //Check column names
           let titles = Object.keys(json[0]);
           let isTable2 = _.isEqual(requiredColumns,_.intersection(requiredColumns,titles))
           if(!isTable2){
             let err = "Columns not correct. Need:".concat(requiredColumns);
             reject(err);
           }
           let boxes = updaters.getState().boxes;
           let selectedRows = _.filter(json, function(r){
             let comp1 = r.treat1+":"+r.treat2;
             let comp2 = r.treat2+":"+r.treat1;
             let fnd = _.find(boxes, (b)=>{return(b.id===comp1||b.id===comp2)});
             let isSelectedRow = !_.isUndefined(fnd);
             return isSelectedRow;
           });
           if(selectedRows.length !== boxes.length){
             reject("comparisons are missing from file");
           }
           _.map(selectedRows, r => {
             if(!((r.final === 1 || r.final === 2 ) || r.final === 3)){
               console.log("r.final",r.final);
               reject("final judgement in file not 1 2 or 3, found: "+r.final);
             }
           });
           resolve(selectedRows);
          });
       };

      console.log("uploading table2 from Robmen");
      var filename = htmlEntities($('#table2Uploader').val().replace(/C:\\fakepath\\/i, '')).slice(0, -4);
        console.log("filename",filename);
       FR.handleFileSelect(evt)
        .then(FR.convertCSVtoJSON)
        .then(checkFile)
        .then(table2 => {
          console.log("Answer",table2);
          _.map(table2, r=>{updaters.selectIndividualInternal(r.comparison,r.final)})
          updaters.getState().hasUploaded = 'true';
          updaters.getState().status = 'ready';
          updaters.saveState();
        })
        .catch( err => {
            Messages.alertify().error(err);
        })
      })
    },
    updateState: (model) => {
      let mdl = model.getState();
      if (updaters.cmReady()) {
        if (updaters.pubbiasReady()){
        }else{
          updaters.setState(updaters.skeletonModel());
        }
      }else{
        model.getState().project.pubbias = {};
        updaters.setState(updaters.skeletonModel());
      }
      _.map(children, c => {
        c.update.updateState(mdl)(mdl);
      });
    },
    setState: (newState) => {
      model.getState().project.pubbias = newState;
      updaters.saveState();
    },
    saveState: () => {
      model.saveState();
      let mdl = model.getState();
      _.map(children, c => { c.update.updateState(mdl)(mdl);});
    },
    createEstimators: () => {
      let cm = model.getState().project.CM.currentCM;
      let NMAs = model.getState().project.CM.currentCM.hatmatrix.NMAresults;
      let makeBoxes = (studies) => {
        let res = _.map(studies, s => {
          let nmaRow = _.find(NMAs, nma => {
            return _.isEqual(uniqId(nma["_row"].split(':')),uniqId(s[0].split(':')));
          });
          let contents = {}
            contents =  {
                id: nmaRow["_row"],
            }
          if(_.isUndefined(nmaRow["Direct"])){
            if(_.isUndefined(nmaRow["Indirect"])){
              console.log("ERRROORRR indirect direct in Incohrence");
            }else{
              _.extend(contents,{
                  isMixed: false,
                  isDirect: false,
                  isIndirect: true,
              })
            }
          }else{
            if(_.isUndefined(nmaRow["Indirect"])){
              _.extend(contents,{
                  isMixed: false,
                  isDirect: true,
                  isIndirect: false,
              })
            }else{
              _.extend(contents,{
                  isMixed: true,
                  isDirect: false,
                  isIndirect: false,
              })
            }
          }
          contents.levels = deepSeek(model,'getState().project.pubbias.levels');
          contents.judgement = 1;
          return contents;
        });
        return res;
      };
      let mixed = makeBoxes(
        sortStudies(cm.directRowNames,cm.directStudies));
      let indirect = makeBoxes(sortStudies(cm.indirectRowNames,cm.indirectStudies));
      return _.union(mixed,indirect);
    },
    resetBoxes: () => {
      updaters.setState(updaters.skeletonModel());
    },
    skeletonModel: () => {
      let boxes = updaters.createEstimators();
      return { 
        status: 'not-ready',
        hasUploaded: 'false',
        boxes,
        levels: PubbiasLevels
      }
    },
    selectIndividualInternal: (tid, tv) => {
      let boxes = updaters.getState().boxes;
      let tbc = _.find(boxes, m => {
        return Rules.isTheSameComparison(m.id)(tid);
      });
      tbc.judgement = parseInt(tv);
      updaters.getState().status = 'selecting';
      updaters.saveState();
      updaters.getState().status = 'ready';
      updaters.saveState();
    },
    selectIndividual: (value) => {
      let [tid,tv] = value.value.split('σδel');
      updaters.selectIndividualInternal(tid,tv);
    },
  }
  return updaters;
};


module.exports = () => {
  return Update;
}
