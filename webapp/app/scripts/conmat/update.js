var RoB = require('../rob/rob.js')();
var Inconsistency = require('../inconsistency/inconsistency.js')();
var deepSeek = require('safe-access');
var Messages = require('../messages.js').Messages;
var clone = require('../lib/mixins.js').clone;
var json2csv = require('json2csv');
var download = require('downloadjs');

var Update = (model) => {
  let project = deepSeek(model,'getState().project');
  let cm = deepSeek(model,'getState().project.CM');
  let cmc = deepSeek(cm,'currentCM');
  let params = deepSeek(cmc,'params');
  let updaters = {
    setState: (incm) => {
      model.getState().project.CM = incm;
      updaters.saveState();
    },
    setCurrentCM: (k,v) => {
      updaters.getCM()[k]=v;
      updaters.saveState();
    },
    getCM: () => {
      return model.getState().project.CM.currentCM;
    },
    cancelMatrix: () => {
      console.log('canceling matrix');
      updaters.setCurrentCM('status','canceling');
      updaters.saveState();
    },
    clearMatrix: () => {
      console.log('clearing matrix');
      updaters.setCurrentCM('status','empty');
      let params = updaters.getCM().params;
      project.CM.currentCM = updaters.emptyCM();
      updaters.setCurrentCM('params',params);
      updaters.saveState();
    },
    createMatrix: () => {
      // console.log('creating matrix');
      updaters.setCurrentCM('status','loading');
      updaters.fetchContributionMatrix(cmc).then(ncm => {
        // console.log('matrix loaded ok!!!!!');
        updaters.setCurrentCM('status','ready');
        updaters.showTable();
        updaters.updateContributionCache();
        Messages.alertify().success(model.getState().text.CM.downloadSuccess);
      })
      .catch(err => {
        updaters.updateContributionCache();
        let msg = _.isUndefined(err)?'':" "+err;
        Messages.alertify().error(model.getState().text.CM.downloadError + msg);
        updaters.clearMatrix();
      });
    },
    emptyCM: () => {
      return  {
            hatmatrix:[],
            savedComparisons: [],
            params: {
              MAModel: {},
              sm: {},
              intvs: [],
              rule: {},
              tau: 0
            },
            status: "empty", //empty, loading, canceling, ready
            progress: 0,
            currentRow: 'Hat Matrix'
          };
      updaters.saveState();
    },
    selectParams: (params) => {
      updaters.setCurrentCM('params',params);
      updaters.saveState();
    },
    compareCM: (cm1, cm2) =>{
      if ((cm1.params.MAModel === cm2.params.MAModel)&&(cm1.params.sm===cm2.params.sm)&&(cm1.params.tau===cm2.params.tau)){
        return true;
        // console.log(cm1,"and",cm2,"are the same");
      }else{
        return false;
      }
    },
    findConMatInCache: (ncm) => {
      let cms = model.getState().project.CM.contributionMatrices;
      let foundCM = _.find(cms, c => {
          return updaters.compareCM(c,ncm);
      });
      // console.log('trying to find ',ncm, 'in ',cms);
      if (_.isUndefined(foundCM)){
        // console.log("found nothing");
        return {};
      }else{
        // console.log("found", foundCM);
        return foundCM;
      }
    },
    checkAllIntvs: () => {
      let project = model.getState().project;
      let intvs = _.map(project.studies.nodes, pn => {
        return pn.id;
      });
      model.getState().project.CM.currentCM.params.intvs = intvs;
      updaters.saveState();
    },
    uncheckAllIntvs: () => {
      model.getState().project.CM.currentCM.params.intvs = [];
      updaters.saveState();
    },
    saveState: () => {
      model.saveState();
      updaters.updateChildren();
      // console.log("the CM now after saving",model.getState().project.CM);
    },
    updateChildren: () => {
      _.map(children, c => {c.update.updateState(model)});
    },
    fetchContributionMatrix: (ncm) => {
      return new Promise((resolve, reject) => {
      // ocpu.seturl('http://ec2-35-156-97-18.eu-central-1.compute.amazonaws.com:8004/ocpu/library/contribution/R');
      ocpu.seturl('http://localhost:8004/ocpu/library/contribution/R');
        let cms = model.getState().project.CM.contributionMatrices;
        var result = {};
        let ncmparams = params;
        let cm = ncm;
        console.log("CCCCCCTRRRRRRREEEEAAAAATTTIIIIIINNGGGGGGGG MMMMMAAATTTTTRIXXXXX");
        //check if the matrix is in the model;
        let foundCM = updaters.findConMatInCache(cm);
        if(_.isEmpty(foundCM) === false){
          // console.log('found cm',params);
          foundCM.params = params;
          foundCM.status = 'loading';
          model.getState().project.CM.currentCM = clone(foundCM);
          cm = model.getState().project.CM.currentCM;
          updaters.saveState();
        }else{
          // console.log("did'nt find cm",clone(cm)," in cms",cms);
        }
        let rtype = '';
        switch(project.type){
          case 'binary':
          rtype = 'netwide_binary';
          break;
          case 'continuous':
          rtype = 'netwide_continuous';
          break;
          case 'iv':
          rtype = 'iv';
          break;
        }
        if(_.isEmpty(cm.hatmatrix)){
          let hmc = ocpu.call('getHatMatrix',{
              indata: project.studies.wide,
              type: rtype,
              model: cm.params.MAModel,
              sm: cm.params.sm,
            }, (sessionh) => {
          sessionh.getObject( (hatmatrix) => {
            // console.log('the hatmatrix returned ',hatmatrix);
            cm.hatmatrix = hatmatrix;
            updaters.saveState();
            updaters.fetchRows(ncm).then(res => {
              resolve(res);
            }).catch(err => {reject(err)});
          })
         });
         hmc.fail( () => {
           reject('R returned an error: ' + hmc.responseText);
        });
        }else{
            // console.log("found hatmatrix", cm.hatmatrix);
            updaters.fetchRows(cm).then(res => {
              resolve(res);
            }).catch(err => {reject(err)});
       }
     });
    },
    filterRows : (rows,intvs,rule) =>{
      let res = [];
      switch(rule){
        case 'every':
          res = _.filter(rows, r =>{
            let [t1,t2] = r.split(':');
            return (_.contains(intvs,t1)||_.contains(intvs,t2));
          });
          break;
        case 'between':
          res = _.filter(rows, r =>{
            let [t1,t2] = r.split(':');
            return (_.contains(intvs,t1)&&_.contains(intvs,t2));
          });
          break;
      }
      return res;
    },
    fetchRows : (cmc) => {
      let hatmatrix = cmc.hatmatrix;
      let params = cmc.params;
        return new Promise((rslv, rjc) => {
        let comparisons = updaters.filterRows(hatmatrix.rowNames, params.intvs,params.rule);
        updaters.getCM().selectedComparisons = comparisons;
        updaters.saveState();

        let sequencePromises = (rows, savedComparisons) => {
          return new Promise ((reslve, rjct) => {
            if (updaters.getCM().status !== 'canceling') {
              if (rows.length !== 0){
                let row = _.first(rows);
                let rest = _.rest(rows);
                let done = Math.round(100 * (1 - (rest.length / comparisons.length)));
                updaters.setCurrentCM('progress',done);
                let foundComp = _.find(savedComparisons, sc => {
                  return (sc.rowname === row);
                });
                if(typeof foundComp !== 'undefined'){
                  // console.log("found row ",row," in saved");
                  let savedRow = {names: hatmatrix.colNames, row:foundComp.rowname, contribution:foundComp.contributions};
                  sequencePromises(rest,savedComparisons).then( nextrow => {
                    reslve(_.flatten([_.flatten(nextrow)].concat([savedRow])));
                  }).catch(err=>{rjct(err)});
                }else{
                  let gmr = ocpu.call('getComparisonContribution',{
                    c1: hatmatrix,
                    comparison: row
                  }, (sessionr) => {
                    sessionr.getObject( (rowback) => {
                      // console.log("currentCM",updaters.getCM(),"row ",row," came back ",rowback);
                      updaters.getCM().savedComparisons.push({
                        rowname:row,
                        comparisons:rowback.contribution
                      });
                      updaters.getCM().currentRow = row;
                      updaters.saveState();
                      // console.log("savedRows",updaters.getCM().savedComparisons);
                      rowback.row = row;
                      sequencePromises(rest,savedComparisons).then( nextrow => {
                        reslve(_.flatten([_.flatten(nextrow)].concat(rowback)));
                      }).catch(err => {rjct(err)});
                    });
                  });
                  gmr.fail( () => {
                    rjct('R returned an error: ' + gmr.responseText);
                  });
                }
              }else{
                reslve([]);
              }
            }else{
              rjct('Computation canceled');
            }
          });
        };
       return sequencePromises(comparisons, updaters.getCM().savedComparisons).then(output => {
         // console.log("Server output",output);
          updaters.getCM().colNames = output[0].names;
          let rows = _.reduceRight(output, (mem ,row) => {
            return mem.concat(
              { rowname: row.row, 
                contributions: row.contribution
              });
          },[]);
         updaters.setCurrentCM('status','ready')
          updaters.saveState();
          // console.log('the ocpu result',connma,'pushing to project');
          let cm = updaters.getCM();
          let result = updaters.formatMatrix(cm);
          // console.log('RESULTS FROM SERVER',result);
          rslv(result);
       }).catch(err => {console.log('caugth error',err);rjc(err);});
      });
    },
    updateContributionCache: () => {
      let cms = model.getState().project.CM.contributionMatrices;
      let connma = clone(updaters.getCM());
      let ncms = [];
      if (_.isEmpty(cms) === false){
        model.getState().project.CM.contributionMatrices = 
        _.reject(cms, cm => {return updaters.compareCM(cm,connma);});
      }
      model.getState().project.CM.contributionMatrices.push(connma);
      updaters.saveState();
    },
    makeCurrentCM: (incm) =>{
      model.getState().project.CM.currentCM = clone(incm);
      updaters.saveState();
    },
    formatMatrix(ncm){
      let cm = ncm
      let directs = project.studies.directComparisons;
      let indirects = project.studies.indirectComparisons;
      let cw = cm.colNames.length;
      let rows = _.filter(cm.savedComparisons, sr => {
        return _.contains(cm.selectedComparisons, sr.rowname)});
      let directRows = _.filter(rows, r=>{
        return _.find(directs, d=>{
          return r.rowname.replace(':',',')===d.id});
      });
      let indirectRows = _.filter(rows, r=>{
        return _.find(indirects, d=>{
          let aresame = (
            ( (r.rowname.split(':')[0]===d.split(',')[0]) &&
            (r.rowname.split(':')[1]===d.split(',')[1])) || 
            ( (r.rowname.split(':')[1]===d.split(',')[0]) &&
            (r.rowname.split(':')[0]===d.split(',')[1]))
          );
          return aresame});
      });
      cm.directRowNames = _.map(directRows,row=>{return row.rowname});
      cm.directStudies = _.map(directRows,row=>{return row.comparisons});
      cm.indirectRowNames = _.map(indirectRows,row=>{return row.rowname});
      cm.indirectStudies = _.map(indirectRows,row=>{return row.comparisons});
      return (cm);
    },
    showTable: () => {
      if (model.getState().router.currentRoute === 'general'){
        return new Promise((resolve,reject) => {
          let params = updaters.getCM().params;
          let cm = updaters.getCM();
          let cont = document.getElementById('cm-table');
          let cw = cm.colNames.length;
          //Filter rows
          let numDirects = cm.directStudies.length;
          let numIndirects = cm.indirectStudies.length;
          let studies = [];
          let rowNames = [];
          let mergeCells = [];
          mergeCells = mergeCells.concat({row: 0, col: 0, rowspan: 1, colspan: cw});
          if (numDirects !== 0){
            studies = 
            studies.concat([Array(cw).fill()])
              .concat(cm.directStudies);
            rowNames = rowNames.concat(['Mixed <br> estimates'])
              .concat(cm.directRowNames);
          }
          if(numIndirects!==0){
            studies = studies
              .concat([Array(cw).fill()])
              .concat(cm.indirectStudies);
            rowNames = rowNames
              .concat(['Indirect <br> estimates'])
              .concat(cm.indirectRowNames);
            mergeCells = numDirects===0?mergeCells:mergeCells.concat({row: numDirects+1, col: 0, rowspan: 1, colspan: cw});
          }
          let cols = cm.colNames;
          var setBackground = (percentage) => {
            return `
              linear-gradient(
              to right,
              rgba(238,238,238,0.83) `+percentage+`%,
              white `+percentage+`%
            )`;
          };
          function makeBars(instance, td, row, col, prop, value, cellProperties) { Handsontable.renderers.TextRenderer.apply(this, arguments);
            td.style.background = setBackground(value);
          };
          let lastRow = rowNames.length;
          var rendered = false;
          //show only 1 decimal in matrix
          let hotStudies = studies.map( r => {
            return r.map( c => {
              let out = '';
              if (isNaN(c) || c===100){
                out = c;
              }else{
                if(c<0.1){
                  if(c<0.05){
                    out = 0.0;
                  }else{
                    out = 0.1;
                  }
                }else{
                  if(c<1){
                    out = c.toPrecision(1);
                  }else{
                    if(c<10){
                      out = c.toPrecision(2);
                    }else{
                      out = c.toPrecision(3);
                    }
                  }
                }
              }
              return out;
            })
          });
          var hot = new Handsontable(cont, {
            data: hotStudies,
            renderAllRows:true,
            renderAllColumns:true,
            rowHeights: 23,
            columnWidth: 200,
            rowHeaders: rowNames,
            colHeaders: true,
            colHeaders: cols,
            mergeCells: mergeCells,
            manualColumnResize: true,
            strechH: 'all',
            rendered: false,
            width: $('#cm-table-container').width(),
            height: $('#cm-table-container').height(),
            afterRender: () => {
              if(rendered===false){
                rendered=true;
                // $(`.ht_master tr:nth-child('+numDirects+') > td`).style('horizontal-align','middle');
              }
            },
          });
          hot.updateSettings({
            cells: function (row, col, prop) {
              var cellProperties = {};
              cellProperties.renderer = makeBars;
              cellProperties.readOnly = true;
              // if(row===lastRow-1){
                // cellProperties.className = 'htMiddle h5';
              // }
              return cellProperties;
            }
          });
          resolve(hot);
        });
      }
    },
    makeDownloader: (res) => {
      return new Promise((resolve,reject) => {
        let cm = res;
        let cw = cm.colNames.length;
        cm.sortedStudies = [];
        if(res.directStudies.length !== 0){
          cm.sortedStudies = 
          cm.sortedStudies.concat([Array(cw).fill()])
          .concat(res.directStudies);
        }
        if(res.indirectStudies.length !== 0){
          cm.sortedStudies = 
          cm.sortedStudies.concat([Array(cw).fill()])
          .concat(res.indirectStudies);
        }
        // .concat(cm.impD);
        cm.sortedRowNames = [];
        if(res.directStudies.length !== 0){
          cm.sortedRowNames =
          cm.sortedRowNames.concat(['Mixed estimates'])
          .concat(cm.directRowNames);
        }
        if(res.indirectStudies.length !== 0){
          cm.sortedRowNames =
          cm.sortedRowNames
          .concat(['Indirect estimates'])
          .concat(cm.indirectRowNames);
        }
        // .concat(['','Entire network']);
        let studies = cm.sortedStudies;
        let cols = cm.colNames;
        let rows = cm.sortedRowNames;
        let fcols = [params.MAModel+' '+params.sm].concat(cols);
        let fstudies = _.map(_.zip(rows, studies), r=>{
          return [r[0]].concat(r[1]);
        });
        fstudies = _.map(fstudies,st=>{return _.object(fcols,st);});
        let csvTable = json2csv({
          data: fstudies,
          fields: fcols,
        });
        let csvContent = 'data:text/csv;charset=utf-8,'+csvTable;
        var encodedUri = encodeURI(csvContent);
        let cmfilename = (project.title+'_'+cm.params.MAModel+'_'+cm.params.sm).replace(/\,/g,'_')+'.csv';
        resolve([encodedUri,cmfilename]);
      });
    },
    downloadCSV: () => {
      updaters.makeDownloader(updaters.getCM()).then( zfile => {
        let [blob,filename] = zfile;
        download(blob,filename);
      });
    },
  }
  return updaters;
};

var children = [
  RoB,
  Inconsistency
  ];

module.exports = () => {
  return Update;
}
