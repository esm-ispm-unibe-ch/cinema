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
      let isdisabled = $('#projectClear').attr('disabled');
      console.log('project clear is disabled',isdisabled);
      if(isdisabled !== 'disabled'){
        Messages.alertify().confirm('Clear Project?','All changes will be lost',
          () => {
            $('#project-name').val('');
            Messages.alertify().message('Project cleared');
            PR.Model.clearProject();
        },()=>{});
      }
    });
  },
  bindFileUploader: () => {
    document.getElementById('files').addEventListener('change',
     PR.getProject , false);
  },
  getProject: (evt) => {
      var filename = htmlEntities($('#files').val().replace(/C:\\fakepath\\/i, '')).slice(0, -4);
    PR.Model.getJSON(evt,filename).then(project => {
      Messages.alertify().success(Messages.longFileUpload,' csv format '+project.format+' '+project.type);
    })
    .catch( err => {
      Messages.updateInfo(Messages.wrongFileFormat,err);
    });
  },
  disableUpload: () => {
    console.log('disabling upload');
    $('#projectClear').attr('disabled',false);
    $('#files').attr('disabled',true);
  },
  enableUpload: () => {
    console.log('enabling upload');
    $('#projectClear').attr('disabled', 'disabled');
    $('#files').attr('disabled',false);
    $('#files').val('');
  }
};

module.exports = {
  PR: PR
}
