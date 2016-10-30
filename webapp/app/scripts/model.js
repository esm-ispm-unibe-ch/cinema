var md5 = require('../../bower_components/js-md5/js/md5.min.js');
var FR = require('./readFile.js').FR;
var Checker = require('./fileChecks.js').Checker;

var Model = {
  project: {},
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
  clearProject: () => {
    Model.project = {};
  },
  setProjectName: (title) =>{
    Model.project.title = title;
  },
  getProjectName: () =>{
    return Model.project.title;
  },
  getJSON: (evt) => {
   return FR.handleFileSelect(evt)
   .then(FR.convertCSVtoJSON)
   .then(Checker.checkColumnNames)
   .then(Checker.checkTypes)
   .then(Checker.checkMissingValues)
   .then(Checker.checkConsistency)
   .then(project => {
     Model.project = Model.createProject(project);
     return project;
   });
  },
};

module.exports = {
  Model: Model
};
