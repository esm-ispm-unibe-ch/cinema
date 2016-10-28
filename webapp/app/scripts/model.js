var md5 = require('../../bower_components/js-md5/js/md5.min.js');
var Converter = require('csvtojson').Converter;

var Settings = {
  longFormat: {
    required: ['sid','tid','r','n','ROB'],
    optional: ['sn','tfn','tn'],
  },
  wideFormat: {
    required: ['sid','tidA','rA','nA','tidB','rB','nB','ROB'],
    optional: ['sn','tfnA','tnA','tfnB','tnB'],
  },
};

var Model = {
  project: {},
  createProject: (title, model, format) =>{
    var date = Number(new Date());
    var id = md5(date+title+Math.random());
    return {
      id: id,
      title: title,
      model: model,
      format: format,
      creationDate: date,
      accessDate: date,
      state: {},
    };
  },
  clearProject: () => {
    Model.project = {};
  },
  setProjectName: (title) =>{
    Model.project.title = title;
  },
  getProjectName: () =>{
    return Model.project.title;
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
    return new Promise( (res, rej) => {
      var converter = new Converter({delimiter:[',',';'],trim:true,checkColumn:true});
      converter.fromString(stri);
      converter.on('end_parsed', (jsonData) => {
        //trimming keys and values!!
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
      });
      converter.on('error',function(errMsg,errData){
        rej(errMsg+errData);
      });
    });
  },
  checkColumnNames: (json) => {
    let longreq = Settings.longFormat.required;
    let widereq = Settings.wideFormat.required;
    let type = '';
    let checkNames = (titles, required) => {
      return _.reduce(titles,(memo, t) => {
        return _.without(memo, t);}
      ,required);
    };
    return new Promise ((resolve, reject) => {
      let titles = Object.keys(json[0]);
      if(checkNames(titles,longreq).length===0){
        resolve(Model.createProject ('', json, 'long'));
      }else{
        if(checkNames(titles,widereq).length===0){
          resolve(Model.createProject ('', json, 'wide'));
        }
      }
      reject('Wrong column names or missing columns');
    });
  },
  checkTypes: (project) => {
    //converts r, n ,ROB to numbers
    return new Promise((resolve, reject) => {
      _.map(project.model,r=>{
        if(project.format==='long'){
          if(isNaN(r.r)){reject('Missing Value or Wrong format in column <strong>r</strong>')};
          if(isNaN(r.n)){reject('Missing Value or Wrong format in column <strong>n</strong>')};
        }else{
          if(isNaN(r.rA)){reject('Missing Value or Wrong format in column <strong>rA</strong>')};
          if(isNaN(r.nA)){reject('Missing Value or Wrong format in column <strong>nA</strong>')};
          if(isNaN(r.rB)){reject('Missing Value or Wrong format in column <strong>rB</strong>')};
          if(isNaN(r.nB)){reject('Missing Value or Wrong format in column <strong>nB</strong>')};
        }
        if(r.ROB!==1&&r.ROB!==2&&r.ROB!==3){reject('<strong>ROB</strong> can only be 1, 2 or 3')};
      });
      resolve(project);
    });
  },
  checkMissingValues: (project) => {
    return new Promise((resolve, reject) => {
      //checks for missing values
      _.map(project.model,r=>{
        let rt = Object.keys(r);
        let cv = rt.map(c=>{
          if(r[c]===''){reject('At least one cell is empty in column <strong>'+c+'</strong>')};
        });
      });
      resolve(project);
    });
  },
  checkConsistency: (project) => {
    let pdata = project.model;
    return new Promise((resolve, reject) => {
      var checkCons = (pr, [id, idname, chks]) => {
        let gid = _.groupBy(pr, id);
        _.map(gid, row => {
          _.map(chks, key => {
            _.reduce(row, (memo, r) => {
              if (typeof r[key] !== 'undefined'){
                if(r[key]!==memo[key]){
                  reject('Inconsistency in data: multiple <strong> '+key+'</strong> in <strong>'+idname+' '+r[id]+'</strong>');
                }
              }
              return r;
            },row[0])
          })
        });
      }
      let st = Object.keys(pdata[0]);
      //check Inconsistency in the studies
      checkCons(pdata,['sid','study',['sn','ROB']]);
      if(project.format==='long'){
        checkCons(pdata,['tid','treatment',['tfn','tn']]);
        _.map(_.groupBy(pdata,'sid'),ss=>{
          //a comparison needs at least a pair of studies
          if (ss.length % 2){
            reject('Inconsistency in data: <strong> study '+ss[0].sid+'</strong> has odd number of studies');
          };
          if (ss.length !== 2){
            reject('Inconsistency in data: <strong> study '+ss[0].sid+'</strong> Only two studies per comparison are allowed');
          };
        });
      //check title id and name are consistent
      }else{
        //wideformat checks
        let comparisons = [['tidA','treatment A',['tfnA','tnA']],['tidB','treatment B',['tfnB','tnB']]];
        _.map(comparisons, comp => {checkCons(pdata,comp)});
        _.map(pdata,st=>{
          if (st.tidA>=st.tidB){
            reject('tidA must be lower than tidB in study '+st.sid);
          }
        });
      }
      resolve(project);
    });
  },
  getJSON: (evt) => {
   return Model.fileReader.handleFileSelect(evt)
   .then(Model.convertCSVtoJSON)
   .then(Model.checkColumnNames)
   .then(Model.checkTypes)
   .then(Model.checkMissingValues)
   .then(Model.checkConsistency)
   .then(project => {
     Model.project = project;
     return project;
   });
  },
};

module.exports = {
  Model: Model
};
