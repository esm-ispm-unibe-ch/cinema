var deepSeek = require('safe-access');
var uniqId = require('../../lib/mixins.js').uniqId;


var View = (model) => {
  let modelPosition = 'getState().project.indirectness.IndrChart';
  let viewers = {
    dirsReady: () => {
      let isready = false;
      if (deepSeek(model,'getState().project.indirectness.directs.status')==="ready"){
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
      let comps = deepSeek(model,'getState().project.indirectness.directs.directBoxes');
      let levels = deepSeek(model,'getState().project.indirectness.netindr.levels');
      let cc = _.map(colNames, cn =>{
        let dc = _.find(comps, c => {
          let cid = uniqId([c.t1.toString(),c.t2.toString()]);
          let cnid = uniqId(cn.split(':'));
          return _.isEqual(cid,cnid);
        });
        return {id:cn, indr:dc.judgement};
      });
      let ccm = _.object(rowNames,_.map(pers,per=>{
        let a = _.zip(_.map(cc,cdc=>{return {comp:cdc.id,indr:cdc.indr};}),
        _.map(per,p=>{return {cont:p};}));
        a = _.map(a, aa =>{
          return _.extend(aa[0],aa[1]);
        });
        return a;
      }));
      let dts = _.map(ccm, r => {
        return _.sortBy(r, c => {
          return c.indr;
        });
      });
      let dtsps = _.map(dts[0], (r,i) => {
        return _.map(dts,c=>{return c[i].cont});
      });
      let dtsts = _.map(dts[0], (c,i) => {
        let dt = {};
        switch(parseInt(c.indr)){
          case 1:
            dt.backgroundColor = levels[0].color;
          break;
          case 2:
            dt.backgroundColor = levels[1].color;
          break;
          case 3:
            dt.backgroundColor = levels[2].color;
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
