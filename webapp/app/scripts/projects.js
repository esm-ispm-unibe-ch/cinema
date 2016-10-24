var Messages = require('./Messages.js')();
var updateInfo = require('./info.js');
var Converter = require("csvtojson").Converter;

var PR = {
  table: {},
  getModel: () => {
    return localStorage.projects;
  },
  bindControls: () => {
    //uploader Info button
    $('.control').bind('click', function () {
      updateInfo(Messages.projectRoute);
    });
    $('#prinfo').bind('click', function () {
      updateInfo(Messages.uploaderLong);
    });
    //cancel uploader
    $('#projectClear').bind('click', function () {
      var file = $('#files');
      file.val('');
      PR.fileUploader.deletePreview();
      $('#project-name').val('');
      $('#files').attr('disabled',false);
    });
  },
  init: () => {
    $(document).ready(function () {
      PR.bindControls();
      PR.fileUploader.bindFileUploader();
    });
  },

  fileUploader: {
    reader: {},
    progress: {},
    abortRead: () => {
      reader.abort();
    },
    errorHandler: (evt) => {
      switch(evt.target.error.code) {
        case evt.target.error.NOT_FOUND_ERR:
          alert('File Not Found!');
          break;
        case evt.target.error.NOT_READABLE_ERR:
          alert('File is not readable');
          break;
        case evt.target.error.ABORT_ERR:
          break; // noop
        default:
          alert('An error occurred reading this file.');
      };
    },
    updateProgress: (evt) => {
      // evt is an ProgressEvent.
      if (evt.lengthComputable) {
        var percentLoaded = Math.round((evt.loaded / evt.total) * 100);
        // Increase the progress bar length.
        if (percentLoaded < 100) {
          progress.style.width = percentLoaded + '%';
          progress.textContent = percentLoaded + '%';
        }
      }
    },
    handleFileSelect: (evt) => {
      // Reset progress indicator on new file selection.
    //  var progress = PR.fileUploader.progress;
    //  progress.style.width = '0%';
    //  progress.textContent = '0%';
      var reader = PR.fileUploader.reader;

      reader = new FileReader();
      reader.onerror = PR.fileUploader.errorHandler;
      reader.onprogress = PR.fileUploader.updateProgress;
      reader.onabort = function(e) {
        alert('File read cancelled');
      };
      // reader.onloadstart = function(e) {
      //   document.getElementById('progress_bar').className = 'loading';
      // };
      // reader.onload = function(e) {
      //   // Ensure that the progress bar displays 100% at the end.
      //   progress.style.width = '100%';
      //   progress.textContent = '100%';
      //   setTimeout("document.getElementById('progress_bar').className='';", 2000);
      // }

      reader.onloadend = function(evt) {
          if (evt.target.readyState == FileReader.DONE) { // DONE == 2
            PR.rawdata = evt.target.result;
            var outCome = processData(PR.rawdata);
            updateInfo(outCome.msg);
            if(outCome.success){
              var table = outCome.table;
              PR.fileUploader.showPreview(table);
              $('#files').attr('disabled',true);
              PR.table = table;
            }else{
              var file = $('#files');
              file.val('');
            }
          }
        };

      // Read in the image file as a binary string.
      reader.readAsBinaryString(evt.target.files[0]);
    },
    bindFileUploader: () => {
      //PR.fileUploader.progress = document.querySelector('.percent');
      document.getElementById('files').addEventListener('change', PR.fileUploader.handleFileSelect, false);
    },
    showPreview: (data) => {
      var container = document.getElementById('filePreview');
      var hot = new Handsontable(container, {
        table: data,
        rowHeaders: true,
        colHeaders: true
      });
    },
    deletePreview: () =>{
      $('#filePreview').empty();
    },
  },
}

var processData = (rawData) =>{
  //check if result is rectangular
  var delimiters =[',',';','\t',':'];
  var rows = rawData.split('\n');
  var converter = new Converter({});

  converter.fromString(rawData, function(err,result){
    if(err == null){
      console.log(result);
    }else{
      console.log(err);
      updateInfo(Messages.wrongFileFormat);
    }
  });

  rows.pop();
  var table = _.reduce(delimiters, (memo, d) => {
    var dt = _.map(
      rows , r=>{
        return r.split(d); }
    );
    return memo.concat([dt]);},[]
  );

  var result = {};

  var rectangular = _.filter(table, dt => {
    var rowLengths = _.reduce(dt,(memo,r) =>{return memo.concat([r.length]);},[]);
      if(_.reduce(rowLengths,(memo,rl) =>{return rl===rowLengths[0]&&rl>=7},false)){
        return true;
      }else{
        return false;
      }
    });
  if(rectangular.length!==1){
    result.success = false;
    result.msg = Messages.wrongFileFormat;
    result.table = [];
  }else{
    result = checkNames(rectangular[0]);
  }
  return result;
};

var checkNames = (table, options) => {
  var res = {};
  res.success= true;
  res.error= '';
  res.table=table;
  return res;
}

module.exports = () => {
  return PR;
}
