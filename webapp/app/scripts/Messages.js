var Model = require('./model.js').Model;
var htmlEntities = require('./model.js').htmlEntities;

var Messages = {
  uploaderShort:{
    title: 'Upload project',
    info: 'You can upload a project as a csv and save it in your saved collection bellow.',
  },
  uploaderLong:{
    title: 'Instructions for uploading a project',
    info: 'Only .csv files are supported <br> The column names should follow the following naming convension <br> For a Long formated file the .... lskf',
  },
  wrongFileFormat: {
    title:'Unable to Read File',
    error:'Wrong file format or missing values.'
  },
  ocpuError: {
    title:'Unable to process data',
    error:'NMA function execution error.'
  },
  projectRoute:{
    title: 'My Projects',
    info: 'Welcome to our App, please browse your projects or upload a new one!',
  },
  toolsRoute: {
    title: 'Visualization Tools',
    info: 'You now can use the tools provided for your project!',
  },
  aboutRoute: {
    title: 'The GRADE NMA project',
    info: 'PLOS paper Abstract',
  },
  longFileUpload: {
    title: 'File seems ok!',
    success: 'Fill in a project name and click proceed to the tools.',
  },
  updateInfo : (infos,extra) => {
    Messages.extra = extra;
    let aux = infos;
    aux.projectName = Model.getProjectName();
    if(extra){
      aux.extra = extra;
    }
    var infotmpl = GRADE.templates.messages(aux);
    $('#info').html(infotmpl);
    if(aux.projectName){
      Messages.bindNameEditor();
    }
  },
  bindNameEditor: () => {
    $('.pn').unbind();
    $('.project-name-edit').unbind();
    $('.project-name').bind('click',() => {
      $('.pn').toggle();
      $('.project-name-edit').focus();
    });
    $('.project-name-edit').blur( () => {
      let name = $('.project-name-edit').val().trim();
      setName(name);
    });
    $('.project-name-edit').keyup(function(e){
      if(e.keyCode == 13)
      {
        $(this).blur();
      }
    });
    let setName = (name) => {
      $('.pn').toggle();
      if(name===''){
        name = Model.getProjectFileName();
      }
      $('.project-name').text(name);
      Model.setProjectName(name);
    }
  },
};

module.exports =  {
  Messages: Messages
};
