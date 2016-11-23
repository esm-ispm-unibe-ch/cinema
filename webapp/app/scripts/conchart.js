var Messages = require('./messages.js').Messages;
var uniqId = require('./mixins.js').uniqId;


var CC = {
  bindActions: () => {
  },
  updateChart: (m) => {
    if(m.project.hasSelectedRob && !_.isEmpty(m.project.currentCM)){
      m.project.chartReady = true;
    }else{
      m.project.chartReady = false;
    }
    var tmpl = GRADE.templates.conchart(m.project);
    $('#conChart').html(tmpl);
      if(m.project.chartReady){
        $(document).ready( () => {
          CC.createMatrix(m);
        });
      }
  },
  createMatrix: (m) => {
    let params = m.project.currentCM;
    let cm = m.project.currentCM.matrix;
    let cw = cm.colNames.length;
      //Filter rows
      let directRowStudies = _.zip(cm.directRowNames,cm.directStudies);
      let directFilteredRows = _.filter(directRowStudies, r => {
        return _.find(params.intvs, intv => {
          return _.find(r[0].split(':'), ri => {
            return ri === intv;
          })
        })
      });
      let indirectRowStudies = _.zip(cm.indirectRowNames,cm.indirectStudies);
      let indirectFilteredRows = _.filter(indirectRowStudies, r => {
        return _.find(params.intvs, intv => {
          return _.find(r[0].split(':'), ri => {
            return ri === intv;
          })
        })
      });
      let directRowNames = _.unzip(directFilteredRows)[0];
      let directStudies = _.unzip(directFilteredRows)[1];
      let indirectRowNames = _.unzip(indirectFilteredRows)[0];
      let indirectStudies = _.unzip(indirectFilteredRows)[1];
      let numDirects = directFilteredRows.length;
      let numIndirects = indirectFilteredRows.length;
      let pers = directStudies;
      if(numIndirects!==0){
        pers = pers.concat(indirectStudies);
      }
      pers = pers.concat(cm.impD);
      let rowNames = directRowNames;
      if(numIndirects!==0){
        rowNames = rowNames.concat(indirectRowNames);
      }
      rowNames = rowNames.concat('Entire network');
    let colNames = m.project.currentCM.matrix.colNames;
    let comps = m.project.model.directComparisons;
    let cc = _.map(colNames, cn =>{
      let dc = _.find(comps, c => {
        let cid = uniqId([c.t1.toString(),c.t2.toString()]);
        let cnid = uniqId(cn.split(':'));
        return _.isEqual(cid,cnid);
      });
      return {id:cn, rob:dc.selectedrob};
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
        case '1':
          dt.backgroundColor = m.lowrobcolor;
        break;
        case '2':
          dt.backgroundColor = m.unclearrobcolor;
        break;
        case '3':
          dt.backgroundColor = m.highrobcolor;
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
    CC.barChart = new Chart($('#barChart'), {
      type: 'horizontalBar',
      data: {
        labels: rowNames,
        datasets: dtsts
      },
      options: {
        scales: {
          xAxes: [{
            stacked: true,
            ticks: {
                 min: 0,
                 max: 100
             }
          }],
          yAxes: [{
            stacked: true
          }]
        }
      }
    })
  },
  removeChart: () => {
  },
}

module.exports = () => {
  return CC;
}
