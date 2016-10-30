var Messages = require('./messages.js').Messages;
var Model = require('./model.js').Model;
var Router = require('./router.js').Router;

var PR = {
  bindControls: () => {
    //uploader Info button
    $('#prinfo').bind('click', function () {
      Messages.updateInfo(Messages.uploaderLong);
    });
    //cancel uploader
    $('#projectClear').bind('click', function () {
      var file = $('#files');
      file.val('');
      $('#filePreview').remove();
      $('#previewContainer').append('<div id="filePreview"></div>');
      document.getElementById('proceed-btn').setAttribute('disabled',true);
      $('#project-name').val('');
      $('#files').attr('disabled',false);
      Model.clearProject();
      Messages.updateInfo(Messages.projectRoute);
    });
    $('#project-name').on('change paste keyup', () =>{
      PR.enableProceedBtn();
    });
    $('#proceed-btn').click(() => {
      Model.setProjectName($('#project-name').val());
      Router.gotoRoute('tools');
    });
    $('#project-name').keypress(function (e) {
      if (e.which == 13) {
        $('#proceed-btn').click();
      }
    });
  },
  bindFileUploader: () => {
    document.getElementById('files').addEventListener('change',
     PR.getProject , false);
  },
  getProject: (evt) => {
    Model.getJSON(evt).then(project => {
      Messages.updateInfo(Messages.longFileUpload,' csv format '+project.format+" "+project.type);
      $('#files').attr('disabled',true);
      PR.showPreview(Model.project);
      PR.enableProceedBtn();
    })
    .catch( err => {
      Messages.updateInfo(Messages.wrongFileFormat,err);
    });
  },
  enableProceedBtn: () => {
    let pb = $('#proceed-btn');
    let modelOk = _.isEmpty(Model.project)?false:true;
    let nameOk = $('#project-name').val()===''?false:true;
    if(modelOk && nameOk){
      pb.removeAttr('disabled');
    }
  },
  showPreview: (project) => {
    var container = document.getElementById('filePreview');
    var hot = new Handsontable(container, {
      data: project.model,
      renderAllRows:true,
      rowHeights: 23,
      colHeaders: Object.keys(project.model[0]),
      columns: _.map(Object.keys(project.model[0]), k => {
        return { data: k, readOnly: true}
      })
    });
  },
  init: () => {
    var projectstmpl = Netplot.templates.projects();
    $('#projects').html(projectstmpl);
    PR.bindControls();
    PR.bindFileUploader();
  }
};



module.exports = () => {
  return PR;
}
