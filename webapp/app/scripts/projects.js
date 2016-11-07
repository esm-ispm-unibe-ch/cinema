var Messages = require('./messages.js').Messages;
var Model = require('./model.js').Model;
var htmlEntities = require('./model.js').htmlEntities;

var PR = {
  rendered:false,
  getRouter: () => {
    return PR.Router;
  },
  bindControls: () => {
    //uploader Info button
    $('#popoverData').popover({trigger:'hover',container:'body'});
    $('#prinfo').bind('click', function () {
      Messages.updateInfo(Messages.uploaderLong);
      $('html, body').animate({
        scrollTop: 0
      }, 300);
    });
    //cancel uploader
    $('#projectClear').bind('click', function () {
      var file = $('#files');
      file.val('');
      $('#filePreview').remove();
      $('#previewContainer').append('<div id="filePreview"></div>');
      // $('#project-name').val('');
      PR.enableUpload();
      Model.clearProject();
      Messages.updateInfo(Messages.projectRoute);
      PR.getRouter().disableRoute('tools');
    });
  },
  bindFileUploader: () => {
    document.getElementById('files').addEventListener('change',
     PR.getProject , false);
  },
  getProject: (evt) => {
    Model.getJSON(evt).then(project => {
      $('#files').attr('disabled',true);
      PR.showPreview(Model.getProject());
      var filename = htmlEntities($('#files').val().replace(/C:\\fakepath\\/i, '')).slice(0, -4);
      Model.setProjectName(filename);
      Model.setProjectFileName(filename);
      PR.enableProceedBtn(Model.getProjectName());
      Messages.updateInfo(Messages.longFileUpload,' csv format '+project.format+' '+project.type);
      PR.Router.gotoRoute('tools');
    })
    .catch( err => {
      Messages.updateInfo(Messages.wrongFileFormat,err);
    });
  },
  enableProceedBtn: (filename) => {
    let modelOk = Model.emptyProject()?false:true;
    // let nameOk = $('#project-name').val()===''?false:true;
    if(modelOk){
      PR.Router.enableRoute('tools');
      $('#popoverData').popover('disable');
    };
  },
  disableUpload: () => {
    $('#project-name').attr('disabled',true);
    $('#files').attr('disabled',true);
  },
  enableUpload: () => {
    $('#project-name').attr('disabled',false);
    $('#files').attr('disabled',false);
  },
  showPreview: (project) => {
    var container = document.getElementById('filePreview');
    var hot = new Handsontable(container, {
      data: project.model.wide,
      renderAllRows:true,
      rowHeights: 23,
      rowHeaders: true,
      manualColumnMove: true,
      colHeaders: Object.keys(project.model.wide[0]),
      columns: _.map(Object.keys(project.model.wide[0]), k => {
        return { data: k, readOnly: true}
      })
    });
  },
  init: (router) => {
    if(!PR.rendered){
      PR.Router = router;
      var projectstmpl = GRADE.templates.projects();
      $('#projects').html(projectstmpl);
      PR.bindControls();
      PR.bindFileUploader();
      PR.rendered = true;
      if(Model.emptyProject()===false){
        PR.showPreview(Model.getProject());
        PR.getRouter().enableRoute('tools');
        $('#popoverData').popover('disable');
      }
    }
    if(Model.emptyProject()===false){
      PR.getRouter().enableRoute('tools');
      PR.disableUpload();
    }else{
      PR.getRouter().disableRoute('tools');
    }
  }
};



module.exports = () => {
  return PR;
}
