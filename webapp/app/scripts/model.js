var Locales = require('./translations.json');
var View = require('./view.js').View;
var clone = require('./mixins.js').clone;
var accumulate = require('./mixins.js').accumulate;
var sumBy = require('./mixins.js').sumBy;
var Router = require('./router.js').Router;
var Project = require('./project.js')();

var Model = {
  defaults: {
    lowrobcolor: '#7CC9AE',
    unclearrobcolor: '#FBBC05',
    highrobcolor: '#E0685C',
    locale: 'EN',
  },
  initState: () => {
    if (typeof localStorage.state === 'undefined'){
      console.log('no cached state');
      Model.setState({
        text : Locales[Model.defaults.locale],
        defaults: Model.defaults,
      });
    }else{
      Model.setState(JSON.parse(localStorage.state));
      console.log("found cache state",Model.getState());
    }
    _.map(Model.children, c => {c.update.updateState()});
  },
  setState: (state) => {
    Model.state = state;
    Model.saveState();
  },
  saveState: () => {
    localStorage.clear();
    localStorage.setItem('state', JSON.stringify(Model.getState()));
    console.log('saving state');
    console.log('rendering');
    View.render(Model).then(
      out =>{console.log("rendered success!!",out);}
    ).catch(err =>{
      $("#errormsg").text(err);
      console.log('error rendering view',err);
    });
  },
  getState: () => {
    return Model.state;
  },
  compareCM: (cm1, cm2) =>{
    if ((cm1.MAModel === cm2.MAModel)&&(cm1.sm===cm2.sm)&&(cm1.tau===cm2.tau)){
      return true;
    }else{
      return false;
    }
  },
  findConMatInCache: (params) => {
    let prj = Model.getState().project;
    let cms = prj.contributionMatrices;
    let foundCM = _.find(cms, cm => {
        return Model.compareCM(cm,params);
    });
    if (typeof foundCM === 'undefined'){
      return false;
    }else{
      return foundCM;
    }
  },
  updateContributionCache: (inconnma) => {
    let connma = clone(inconnma);
    let prj = Model.getState().project;
    let cms = prj.contributionMatrices;
    let foundCM = Model.findConMatInCache(connma);
    if ( foundCM !== false ){
      Model.getState().project.contributionMatrices = _.reject(cms, cm => {return Model.compareCM(cm,connma);})
    }
    Model.getState().project.contributionMatrices.push(connma);
    Model.makeCurrentCM(connma);
  },
  clearCurrentCM: () =>{
    Model.getState().project.currentCM = {};
    Model.saveState();
    View.updateConChart();
  },
  makeCurrentCM: (cm) =>{
    let cms = Model.getState().project.contributionMatrices;
    // console.log('making current cms', cms);
    _.map(cms, c => {
      if(Model.compareCM(c,cm)){
        c.isDefault = true;
        c = cm;
        Model.getState().project.currentCM = c;
      }else{
        c.isDefault = false;
      }
    });
    Model.saveState();
    View.updateConChart();
  },
  setCMParams: (params) => {
    let project = Model.geState().project;
    project.CMparams = params;
  },
  getCMParams: () => {
    let project = Model.getState().project;
    return project.CMparams;
  },
  fetchContributionMatrix: () => {
    return new Promise((resolve, reject) => {
    // ocpu.seturl('//localhost:8004/ocpu/library/contribution/R');
    ocpu.seturl('http://ec2-35-156-97-18.eu-central-1.compute.amazonaws.com:8004/ocpu/library/contribution/R');
      var project = Model.getState().project;
      project.cancelCM = false;
      var cms = project.contributionMatrices;
      var result = {};
      var foundCM = {};
      // Important params being a variable not a link to params
      let params = (Model.getCMParams)();
      //check if the matrix is in the model;
      if(! _.isEmpty(cms)){
        foundCM = Model.findConMatInCache(params);
      }
      if(foundCM !== false){
        params.savedComparisons = clone(foundCM.savedComparisons);
        params.hatmatrix = foundCM.hatmatrix;
      }else{
        params.hatmatrix = {};
        params.savedComparisons = {};
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
      let filterRows = (rows,intvs,rule) =>{
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
      };
      //comment to deploy just for dev

      let fetchRows = (hatmatrix, prams) => {
          return new Promise((rslv, rjc) => {
          // var prams = (Model.getCMParams();
          let comparisons = filterRows(hatmatrix.rowNames,prams.intvs,prams.rule);
          let sequencePromises = (rows, savedComparisons) => {
            return new Promise((reslve, rjct) => {
              if (Model.getState().project.cancelCM !== true) {
                if (rows.length !== 0){
                  let row = _.first(rows);
                  let rest = _.rest(rows);
                  let done = Math.round(100 * (1 - (rest.length / comparisons.length)));
                  View.updateCMLoader([row,done.toString()+'%']);
                  let foundComp = _.find(savedComparisons, sc => {
                    return (sc.rowname === row);
                  });
                  if(typeof foundComp != 'undefined'){
                    // console.log("found row ",row," in saved");
                    let savedRow = {names: hatmatrix.colNames, row:foundComp.rowname, contribution:foundComp.contributions};
                    sequencePromises(rest,savedComparisons).then( nextrow => {
                      reslve(_.flatten([_.flatten(nextrow)].concat([savedRow])));
                    });
                  }else{
                    let gmr = ocpu.call('getComparisonContribution',{
                      c1: hatmatrix,
                      comparison: row
                    }, (sessionr) => {
                      sessionr.getObject( (rowback) => {
                        // console.log("row ",row," came back ",rowback);
                        rowback.row = row;
                        sequencePromises(rest,savedComparisons).then( nextrow => {
                          reslve(_.flatten([_.flatten(nextrow)].concat(rowback)));
                        });
                      });
                    });
                    gmr.fail( () => {
                      reject('R returned an error: ' + gmr.responseText);
                    });
                  }
                }else{
                  reslve([]);
                }
              }else{
                reject('Computation canceled');
              }
            });
          };
         return sequencePromises(comparisons, prams.savedComparisons).then(output => {
            // console.log('Server response', output);
            let connma = prams;
            connma.savedComparisons = prams.savedComparisons;
            connma.colNames = output[0].names;
            let rows = _.reduceRight(output, (mem ,row) => {
              return mem.concat(
                { rowname: row.row, 
                  contributions: row.contribution
                });
            },[]);
            let updateSavedComparisons = (saved, rows) => {
              let uniqSaved = _.reduce(saved, (memo, comp) => {
                let out = memo;
                if(typeof _.find(rows,r=>{return r.rowname === comp.rowname;}) === 'undefined'){
                  return memo.concat(comp);
                }
                return memo;
              },[]);
              return _.union(uniqSaved, rows);
            }
            connma.savedComparisons = updateSavedComparisons(connma.savedComparisons,rows);
            connma.selectedComparisons = _.map(rows, row => {return row.rowname});
            // console.log('the ocpu result',connma,'pushing to project');
            let result = Model.formatMatrix(connma);
            // console.log('RESULTS FROM SERVER',result);
            Model.updateContributionCache(result);
            resolve(result);
         });
        });
      };
      if(_.isEmpty(params.hatmatrix)){
        View.updateCMLoader(['Hat Matrix','']);
        let hmc = ocpu.call('getHatMatrix',{
            indata: project.model.wide,
            type: rtype,
            model: params.MAModel,
            sm: params.sm,
          }, (sessionh) => {
        sessionh.getObject( (hatmatrix) => {
          params.hatmatrix = hatmatrix;
          fetchRows(hatmatrix,params);
        })
       });
       hmc.fail( () => {
         reject('R returned an error: ' + hmc.responseText);
      });
      }else{
        // console.log("found hatmatrix", params.hatmatrix);
        fetchRows(params.hatmatrix,params);
     }
   })
  },
  formatMatrix(res){
    let directs = Model.project.model.directComparisons;
    let indirects = Model.project.model.indirectComparisons;
    let cm = res;
    let cw = cm.colNames.length;
    let rows = _.filter(cm.savedComparisons, sr => {return _.contains(cm.selectedComparisons, sr.rowname)});
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
        // return r[0].replace(':',',')===d});
    });
    res.directRowNames = _.map(directRows,row=>{return row.rowname});
    res.directStudies = _.map(directRows,row=>{return row.contributions});
    res.indirectRowNames = _.map(indirectRows,row=>{return row.rowname});
    res.indirectStudies = _.map(indirectRows,row=>{return row.contributions});
    return (res);
  },
  cancelCM : () => {
    let project = Model.getState().project;
    project.cancelCM = true;
    // View.cancelCM();
  },
  makeNodes: (type, model) => {
    var grouped = _.groupBy(model, tr => {return tr.t});
    var verticeFromGroup = (group) =>{
      var vertex = {id:'', name:'', numStudies:0, sampleSize:0, rSum:0};
      vertex.type='node';
      vertex.id = group[0].t;
      vertex.name = group[0].tn;
      vertex.label = _.isEmpty(group[0]['tn'])?group[0]['t']:group[0]['tn'];
      vertex.studies = accumulate(group,'id');
      vertex.numStudies = group.length;
      if(type!=='iv'){
      vertex.sampleSize = sumBy(group,'n');
      }
      //vertex.rSum = _.reduce(group, function (memo, row){ return memo + row.r},0);
      vertex.rob = accumulate(group,'rob');
      vertex.low = _.filter(vertex.rob, r => {return r===1}).length/vertex.numStudies*100;
      vertex.unclear = _.filter(vertex.rob, r => {return r===2}).length/vertex.numStudies*100;
      vertex.high = _.filter(vertex.rob, r => {return r===3}).length/vertex.numStudies*100;
      return vertex;
    };
    let res = _.map(_.toArray(grouped), (grp) => verticeFromGroup(grp));
    return res;
  },
  selectRobs: (sels) => {
    let prj = Model.getState().project;
    _.map(prj.model.directComparisons, c => {
      c.selectedrob = sels[c.id];
    });
    prj.hasSelectedRob = true;
    Model.saveState();
    // View.updateSelections();
  },
  unselectRobs: () => {
    let prj = Model.getState().project;
    _.map(prj.model.directComparisons, c => {
      c.selectedrob = '';
    });
    prj.hasSelectedRob = false;
    Model.saveState();
    // View.updateSelections();
  },
  init: () => {
    Router.view.register(Model);
    Router.init(Model);
    Model.initState();
  },
  children: [
    Router,
    Project,
  ],
};

module.exports = {
  Model: Model,
};
