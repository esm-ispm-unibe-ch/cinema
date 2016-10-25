var md5 = require('../../bower_components/js-md5/js/md5.min.js');
var Converter = require('csvtojson').Converter;

var Model = {
  projects: localStorage.projects,
  createProject: (name, model, format) =>{
    var date = Number(new Date());
    var id = md5(date+name+Math.random());
    return {
      id: id,
      name: name,
      model: model,
      format: format,
      creationDate: date,
      accessDate: date,
      state: {},
    };
  },
  fileReader: {
    reader: {},
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
    handleFileSelect: (evt) => {
        var reader = Model.fileReader.reader;
        reader = new FileReader();
        reader.onerror = Model.fileReader.errorHandler;
        return new Promise( (resolve, reject ) => {
            reader.onloadend = function(evt) {
              if (evt.target.readyState == FileReader.DONE) { // DONE == 2
                resolve(evt.target.result);
                }else{
                reject(evt.target.error);
              }
        };
        reader.readAsBinaryString(evt.target.files[0]);
      });
    }
  },
  convertCSVtoJSON: (stri) =>{
    var converter = new Converter({checkColumn:true,});
    return new Promise( (res, rej) => {
      converter.fromString(stri);
      converter.on("end_parsed", (jsonData) => {
        res(jsonData);
      });
      converter.on("error",function(errMsg,errData){
        rej(errMsg+errData);
      });
    });
  },
  getJSON: (evt) => {
   return Model.fileReader.handleFileSelect(evt)
   .then(Model.convertCSVtoJSON);
  }
}

module.exports = () => {
  return Model;
}

      //checkFormat(table);
      //checkTypes(table);
      //checkMissingValues(table);
