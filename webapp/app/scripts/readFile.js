// var Converter = require('csvtojson').Converter;
const Converter = require('csvtojson');

var FR = {
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
      var reader = FR.reader;
      reader = new FileReader();
      reader.onerror = FR.errorHandler;
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
  },
  convertCSVtoJSON: (stri) =>{
    return new Promise( (res, rej) => {
      Converter({delimiter:[',',';'],trim:true,checkColumn:true,checkType:true})
      .fromString(stri)
      .on('end_parsed', (jsonData) => {
//        trimming keys and values!!
        let newjson = _.reduce(jsonData,(memo, json)=> {
          let keys = Object.keys(json);
          let nkv = _.map(keys,k=>{
            let value = typeof json[k] === 'string'?json[k].trim():json[k];
            return [k.trim(),value];
          });
          let nrow = _.object(nkv);
          return memo.concat([nrow]);
        },[]);
        res(newjson);
      })
      .on('error',function(errMsg,errData){
        rej(errMsg+errData);
      });
    });
  },
};

module.exports = {
  FR: FR
};
