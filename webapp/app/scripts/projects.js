
var PR = {
  getModel: () => {
    return localStorage.projects;
  },
  bindInfos: () => {
    $('#prinfo').bind('click', function () {
      GR.updateInfo({title:'Upload Instructions', cont:PR.infos.fileInstructions});
    });
  },
  init: () => {
    $(document).ready(function () {
      PR.bindInfos();
      PR.fileUploader.bindFileUploader();
    });
  },
  infos : {
    fileInstructions: "Only .csv files are supported <br> The column names should follow the following naming convension <br>",
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
      var progress = PR.fileUploader.progress;
      var reader = PR.fileUploader.reader;
      progress.style.width = '0%';
      progress.textContent = '0%';

      reader = new FileReader();
      reader.onerror = PR.fileUploader.errorHandler;
      reader.onprogress = PR.fileUploader.updateProgress;
      reader.onabort = function(e) {
        alert('File read cancelled');
      };
      reader.onloadstart = function(e) {
        document.getElementById('progress_bar').className = 'loading';
      };
      reader.onload = function(e) {
        // Ensure that the progress bar displays 100% at the end.
        progress.style.width = '100%';
        progress.textContent = '100%';
        setTimeout("document.getElementById('progress_bar').className='';", 2000);
      }

      reader.onloadend = function(evt) {
          if (evt.target.readyState == FileReader.DONE) { // DONE == 2
            PR.rawdata = evt.target.result;
            var data =_.map(PR.rawdata.split('\n'),r=>{return r.split(',')}) ;
            PR.data = data;
            var container = document.getElementById('byte_content');
            var hot = new Handsontable(container, {
              data: data,
              rowHeaders: true,
              colHeaders: true
            });
            //document.getElementById('byte_content').textContent = evt.target.result;
          }
        };

      // Read in the image file as a binary string.
      reader.readAsBinaryString(evt.target.files[0]);
    },
    bindFileUploader: () => {
      PR.fileUploader.progress = document.querySelector('.percent');
      document.getElementById('files').addEventListener('change', PR.fileUploader.handleFileSelect, false);
    }
  },
}
