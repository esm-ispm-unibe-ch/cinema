var View = require('./view.js').View;
var md5 = require('../../bower_components/js-md5/js/md5.min.js');
var FR = require('./readFile.js').FR;
var Checker = require('./fileChecks.js').Checker;
var Reshaper = require('./reshaper.js').Reshaper;
var uniqId = require('./mixins.js').uniqId;
var accumulate = require('./mixins.js').accumulate;
var sumBy = require('./mixins.js').sumBy;


var Model = {
  createProject: (pr) =>{
    var date = Number(new Date());
    var id = md5(date+Math.random());
    return {
      id: id,
      model: pr.model,
      format: pr.format,
      type: pr.type,
      creationDate: date,
      accessDate: date,
      state: {},
    };
  },
  readLocalStorage: () => {
    if (_.isEmpty(localStorage.project)){
      Model.setProject({});
    }else{
      Model.setProject(JSON.parse(localStorage.project));
    }
  },
  emptyProject: () => {
    return _.isEmpty(Model.project);
  },
  clearProject: () => {
    Model.project = {};
    localStorage.clear();
    View.gotoRoute('projects',false);
  },
  setProjectName: (title) =>{
    Model.project.title = title;
  },
  getProjectName: () =>{
    return Model.project.title;
  },
  setProjectFileName: (filename) =>{
    Model.project.fileName = filename;
  },
  getProjectFileName: () =>{
    return Model.project.fileName;
  },
  getProject: () => {
    return Model.project;
  },
  setProject: (project) => {
    console.log('setting project');
    Model.project = project;
    View.updateProject();
    Model.saveProject();
  },
  saveProject: () => {
    localStorage.clear();
    localStorage.setItem('project', JSON.stringify(Model.getProject()));
  },
  makeDirectComparisons: (type,model) => {
    let comparisons = _.groupBy(model, row => {
        return uniqId([row.t1, row.t2]).toString();
      });
    var edges = _.map( _.toArray(comparisons), comp => {
      let row = {
        type:'edge',
        id: uniqId([comp[0].t1,comp[0].t2]).toString(),
        studies: accumulate(comp,'id'),
        t1: uniqId([comp[0].t1,comp[0].t2])[0],
        t2: uniqId([comp[0].t1,comp[0].t2])[1],
        source: uniqId([comp[0].t1,comp[0].t2])[0],
        target: uniqId([comp[0].t1,comp[0].t2])[1],
        numStudies: comp.length,
        rob: accumulate(comp,'rob'),
      };
      row.tn1 = row.t1===comp[0].t1?comp[0].tn1:comp[0].tn2;
      row.tn2 = row.t2===comp[0].t2?comp[0].tn2:comp[0].tn1;
      let majrob = _.first(
          _.sortBy(
            _.sortBy(
              _.groupBy(row.rob, rob => {return rob}),
              robs => {
                return -robs[0];
              }
            ),
            robs => {
              return -robs.length;
            }
          )
        )[0];
      row.majrob = majrob;
      let meanrob = _.reduce(row.rob, (memo,rob) => {
        return memo + rob;
      },0) / row.rob.length;
      meanrob = Math.round(meanrob);
      row.meanrob = meanrob;
      let maxrob = _.reduce(row.rob, (memo,rob) => {
        return memo > rob ? memo : rob;
      },0);
      row.maxrob = maxrob;
      if(type !== 'iv'){
        row.sampleSize = sumBy(comp,['n1','n2']);
      }else{
        row.iv = _.reduce(comp, (iv,s) => {
          let au = Math.pow(1/s.se,2);
          return iv + au;
        },0);
      }
      return row;
      });
    return _.sortBy(edges,e =>{return e.id});
  },
  selectRobs: (sels) => {
    let prj = Model.getProject();
    _.map(prj.model.directComparisons, c => {
      c.selectedrob = sels[c.id];
    });
    prj.hasSelectedRob = true;
    Model.saveProject();
    View.updateSelections();
  },
  unselectRobs: () => {
    let prj = Model.getProject();
    _.map(prj.model.directComparisons, c => {
      c.selectedrob = '';
    });
    prj.hasSelectedRob = false;
    Model.saveProject();
    View.updateSelections();
  },
  getJSON: (evt, filename) => {
    return FR.handleFileSelect(evt)
    .then(FR.convertCSVtoJSON)
    .then(Checker.checkColumnNames)
    .then(Checker.checkTypes)
    .then(Checker.checkMissingValues)
    .then(Checker.checkConsistency)
    .then(project => {
      let prj = project;
      let mdl = {};
      if(project.format === 'long'){
        mdl.long = project.model;
        mdl.wide = Reshaper.longToWide(project.model,project.type);
      }else{
        mdl.long = Reshaper.wideToLong(project.model,project.type);
        mdl.wide = project.model;
      }
      mdl.directComparisons = Model.makeDirectComparisons(project.type, mdl.wide);
      prj.model = mdl;
      prj.title = filename;
      prj.filenmae = filename;
      Model.setProject(Model.createProject(prj));
      return prj;
    });
  },
  init: () => {
    View.init(Model);
    Model.readLocalStorage();
  }
};

module.exports = {
  Model: Model,
};
