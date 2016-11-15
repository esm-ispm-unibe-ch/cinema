var Messages = require('./messages.js').Messages;
var htmlEntities = require('./mixins.js').htmlEntities;

var PR = {
  setModel:(model)=>{
    PR.Model = model;
  },
  getModel:(model)=>{
    return PR.Model;
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
      PR.Model.clearProject();
    });
  },
  bindFileUploader: () => {
    document.getElementById('files').addEventListener('change',
     PR.getProject , false);
  },
  getProject: (evt) => {
      $('#files').attr('disabled',true);
      var filename = htmlEntities($('#files').val().replace(/C:\\fakepath\\/i, '')).slice(0, -4);
    PR.Model.getJSON(evt,filename).then(project => {
      // alertify.success(Messages.longFileUpload,' csv format '+project.format+' '+project.type);
    })
    .catch( err => {
      Messages.updateInfo(Messages.wrongFileFormat,err);
    });
  },
  disableUpload: () => {
    $('#project-name').attr('disabled',true);
    $('#files').attr('disabled',true);
  },
  enableUpload: () => {
    $('#project-name').attr('disabled',false);
    $('#files').attr('disabled',false);
  }
};



module.exports = {
  PR: PR
}
