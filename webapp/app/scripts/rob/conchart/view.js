var deepSeek = require('safe-access');
var uniqId = require('../../lib/mixins.js').uniqId;


var View = (model) => {
  let modelPosition = 'getState().project.NetRob.ConChart';
  let viewers = {
    isReady: () => {
      let isReady = false;
      if (! _.isUndefined(deepSeek(model, modelPosition))){
        isReady = true;
      }
      return isReady;
    },
    createChart: () => {
      let m = model.getState().project;
      let cm = m.CM.currentCM;
      let colNames = cm.colNames;
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
        // rowNames = rowNames.concat('Entire network');
      let comps = m.studies.directComparisons;
      let cc = _.map(colNames, cn =>{
        let dc = _.find(comps, c => {
          let cid = uniqId([c.t1.toString(),c.t2.toString()]);
          let cnid = uniqId(cn.split(':'));
          return _.isEqual(cid,cnid);
        });
        return {id:cn, rob:dc.directRob};
      });
      let ccm = _.object(rowNames,_.map(pers,per=>{
        let a = _.zip(_.map(cc,cdc=>{return {comp:cdc.id,rob:cdc.rob};}),
        _.map(per,p=>{return {cont:p};}));
        a = _.map(a, aa =>{
          return _.extend(aa[0],aa[1]);
        });
        return a;
      }));
      let dts = _.map(ccm, r => {
        return _.sortBy(r, c => {
          return c.rob;
        });
      });
      let dtsps = _.map(dts[0], (r,i) => {
        return _.map(dts,c=>{return c[i].cont});
      });
      let dtsts = _.map(dts[0], (c,i) => {
        let dt = {};
        switch(c.rob){
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
        dt.label = c.comp;
        dt.data=dtsps[i];
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
