var deepSeek = require('safe-access');
var uniqId = require('../../lib/mixins.js').uniqId;


var View = (model) => {
  let modelPosition = 'getState().project.indirectness.IndrChart';
  let viewers = {
    dirsReady: () => {
      let isready = false;
      let studycontrs = deepSeek(model,'getState().project.CM.currentCM.studycontributions');
      if (typeof studycontrs !== 'undefined'){
        isready = true;
      }
      return isready;
    },
    isReady: () => {
      let isready = false;
      if (viewers.dirsReady()){
        isready = true;
      }
      return isready;
    },
    createChart: () => {
      let m = model.getState().project;
      let cm = m.CM.currentCM;
      //let colNames = cm.colNames;
      let studycontrs = cm.studycontributions;
      let indrs = m.studies.indrs;
      let studies = 
        _.map(
          _.sortBy(
            _.pairs(indrs), a => {return a[1]})
          , b => {return b[0]});
      let colNames = studies;
      let cw = colNames.length;
        //Filter rows
        let numDirects = cm.directStudies.length;
        let numIndirects = cm.indirectStudies.length;
        let pers = cm.directStudies;
        if(numIndirects!==0){
          pers = pers.concat(cm.indirectStudies);
        }
        // pers = pers.concat(cm.impD);
        let rowNames = cm.directRowNames;
        if(numIndirects!==0){
          rowNames = rowNames.concat(cm.indirectRowNames);
        }
      let dtsts = _.map(studies, st => {
          let dt = {};
              dt.label = st;
              dt.data = _.map(rowNames, r => {
                return studycontrs[r][st].toFixed(2);
              })
              switch(indrs[st]){
                case 1:
                  dt.backgroundColor = m.robLevels[0].color;
                break;
                case 2:
                  dt.backgroundColor = m.robLevels[1].color;
                break;
                case 3:
                  dt.backgroundColor = m.robLevels[2].color;
                break;
              }
              dt.borderColor = _.reduce(dt.data, (memo, d)=> {
                return memo.concat('rgba(255,254,253,0.9)');
              },[]);
              dt.borderWidth = 1;
              return dt;
      });
      let chartData={
          labels: rowNames,
          datasets: dtsts
      };
      return chartData;
    },
  }
  return viewers;
}

module.exports = () => {
  return View;
}
