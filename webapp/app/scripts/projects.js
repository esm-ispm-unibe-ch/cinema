var Messages = require('./Messages.js')();
var model = require('./model.js')();

var PR = {
  table: {},
  getModel: () => {
    return localStorage.projects;
  },
  bindControls: () => {
    //uploader Info button
    $('.control').bind('click', function () {
      Messages.updateInfo(Messages.projectRoute);
    });
    $('#prinfo').bind('click', function () {
      Messages.updateInfo(Messages.uploaderLong);
    });
    //cancel uploader
    $('#projectClear').bind('click', function () {
      var file = $('#files');
      file.val('');
      $('#filePreview').empty();
      $('#project-name').val('');
      $('#files').attr('disabled',false);
    });
  },
  bindFileUploader: () => {
    document.getElementById('files').addEventListener('change',
     PR.getProject , false);
  },
  getProject: (evt) => {
    model.getJSON(evt).then(project => {
      Messages.updateInfo(Messages.longFileUpload,' csv format '+project.format);
      $('#files').attr('disabled',true);
      console.log(project);
      return project;
    })
    .catch( err => {
      Messages.updateInfo(Messages.wrongFileFormat,err);
    });
  },
  showPreview: (data) => {
    var container = document.getElementById('filePreview');
    var hot = new Handsontable(container, {
      table: data,
      rowHeaders: true,
      colHeaders: true
    });
  },
  init: () => {
    $(document).ready(function () {
      PR.bindControls();
      PR.bindFileUploader();
    });
  }
};



module.exports = () => {
  return PR;
}
