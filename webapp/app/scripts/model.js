var md5 = require('../../bower_components/js-md5/js/md5.min.js');
var FR = require('./readFile.js').FR;
var Checker = require('./fileChecks.js').Checker;
var Reshaper = require('./reshaper.js').Reshaper;
var htmlEntities = (str) => {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
};

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
  },
  setProjectName: (title) =>{
    Model.project.title = title;
    Model.saveProject();
  },
  getProjectName: () =>{
    return Model.project.title;
  },
  setProjectFileName: (filename) =>{
    Model.project.fileName = filename;
    Model.saveProject();
  },
  getProjectFileName: () =>{
    return Model.project.fileName;
  },
  getProject: () => {
    return Model.project;
  },
  setProject: (project) => {
    Model.project = project;
  },
  saveProject: () => {
    localStorage.clear();
    localStorage.setItem('project', JSON.stringify(Model.getProject()));
  },
  getJSON: (evt) => {
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
      prj.model = mdl;
      Model.setProject(Model.createProject(prj));
      return project;
    });
  },
};

module.exports = {
  Model: Model,
  htmlEntities: htmlEntities
};
