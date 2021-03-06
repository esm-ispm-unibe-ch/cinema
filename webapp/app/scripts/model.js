var Locales = require('./translations.json');
var View = require('./view.js').View;
var clone = require('./lib/mixins.js').clone;
var accumulate = require('./lib/mixins.js').accumulate;
var sumBy = require('./lib/mixins.js').sumBy;
var Router = require('./router.js').Router;
var Project = require('./project.js')();
var Messages = require('./messages.js');
var download = require('downloadjs');
const json2csv = require('json2csv');

var Model = {
  Actions: 
  { alertify: Messages.Messages.alertify
  , download: download
  , json2csv: json2csv
  },
  defaults: {
    robLevels: [
      { id: 1,
        color: '#02c000'
      },
      { id: 2,
        color: '#e0df02'
      },
      { id: 3,
        color: '#c00000'
    }],
    studyLimitationLevels: [
      { id: 1,
        color: '#02c000'
      },
      { id: 2,
        color: '#e0df02'
      },
      { id: 3,
        color: '#c00000'
      }],
    indrLevels: [
      { id: 1,
        color: '#02c000'
      },
      { id: 2,
        color: '#e0df02'
      },
      { id: 3,
        color: '#c00000'
    }],
    netIndrLevels: [
      { id: 1,
        color: '#02c000'
      },
      { id: 2,
        color: '#e0df02'
      },
      { id: 3,
        color: '#c00000'
    }],
    pubbiasLevels: [
      { id: 1,
        color: '#02c000'
      },
      { id: 2,
        color: '#e0df02'
      },
      { id: 3,
        color: '#c00000'
    }],
    locale: 'EN',
  },
  setState: (state) => {
    Model.state = state;
    _.map(Model.children, c => {
      c.update.updateState(Model);
    });
    Model.saveState();
  },
  persistToLocalStorage: () => {
    localStorage.clear();
    try {
      localStorage.setItem('state', JSON.stringify(Model.getState()));
      console.log('saved to localstorage');
    } catch (e) {
        //data wasn't successfully saved due to quota exceed so throw an error
        console.log('Quota exceeded!',e); 
    }
  },
  saveState: () => {
    let wt = document.documentElement.scrollTop || document.body.scrollTop;
    Model.state.wt = wt;
    // console.log('saving state');
    // console.log('rendering');
    View.render(Model).then(
      out =>{
        window.scrollTo(0,Model.state.wt);
        // console.log('rendered success!!',out);
        }
    ).catch(err =>{
      $('#errormsg').text(err);
      // console.log('error rendering view',err);
    });
    // console.log('the state', Model.getState());
  },
  factorySettings: () => {
    let v = Model.getState().version;
    Model.setState(Model.skeletonModel(v));
  },
  getState: () => {
    return Model.state;
  },
  makeNodes: (type, model) => {
    var grouped = _.groupBy(model, tr => {return tr.t});
    var verticeFromGroup = (group) =>{
      var vertex = {id:'', name:'', numStudies:0, sampleSize:0, rSum:0};
      vertex.type='node';
      vertex.id = group[0].t;
      vertex.name = group[0].tn;
      vertex.label = _.isEmpty(group[0]['tn'])?group[0]['t']:group[0]['tn'];
      vertex.studies = accumulate(group,'id');
      vertex.numStudies = group.length;
      if(type!=='iv'){
        vertex.sampleSize = sumBy(group,'n');
      }
      //vertex.rSum = _.reduce(group, function (memo, row){ return memo + row.r},0);
      vertex.rob = accumulate(group,'rob');
      vertex.low = _.filter(vertex.rob, r => {return r===1}).length/vertex.numStudies*100;
      vertex.unclear = _.filter(vertex.rob, r => {return r===2}).length/vertex.numStudies*100;
      vertex.high = _.filter(vertex.rob, r => {return r===3}).length/vertex.numStudies*100;
      vertex.indirectness = accumulate(group,'indirectness');
      vertex.indrlow = _.filter(vertex.indirectness, r => {return r===1}).length/vertex.numStudies*100;
      vertex.indrunclear = _.filter(vertex.indirectness, r => {return r===2}).length/vertex.numStudies*100;
      vertex.indrhigh = _.filter(vertex.indirectness, r => {return r===3}).length/vertex.numStudies*100;
      return vertex;
    };
    let res = _.map(_.toArray(grouped), (grp) => verticeFromGroup(grp));
    return res;
  },
  selectRobs: (sels) => {
    let prj = Model.getState().project;
    _.map(prj.model.directComparisons, c => {
      c.selectedrob = sels[c.id];
    });
    prj.hasSelectedRob = true;
    Model.saveState();
    // View.updateSelections();
  },
  unselectRobs: () => {
    let prj = Model.getState().project;
    _.map(prj.model.directComparisons, c => {
      c.selectedrob = '';
    });
    prj.hasSelectedRob = false;
    Model.saveState();
    // View.updateSelections();
  },
  loadCachedModel: () => {
    let savedModel = JSON.parse(localStorage.state);
    Model.setState(savedModel);
  },
  versionsAreCompatible: (v1,v2) => {
    return v1.split(".").slice(0,2).toString() === v2.split(".").slice(0,2).toString();
  },
  checkSavedProject: (state) => {
    return new Promise((resolve,reject) => {
      let cinv = Model.getState().version;
      if(Model.versionsAreCompatible(state.version,cinv)){
        resolve(state);
      }else{
        reject("Unfortunately cannot upload, the file's version ("+state.version+") is not compatible with CINeMA v:"+cinv);
      }
    })
  },
  loadSavedProject: (state) => {
    Model.setState(state);
  },
  initializeModel: (version) => {
    Model.setState(Model.skeletonModel(version));
  },
  clearCachedModel: () => {
    localStorage.clear();
  },
  cachedModel: () =>{
    let out = "Maybe state";
    if (typeof localStorage.state === 'undefined'){
      out = "Nothing"
    }else{
      out = JSON.parse(localStorage.state);
    }
    return out;
  },
  checkCachedModel: (version) => {
    let savedModel = Model.cachedModel();
    if (savedModel === 'Nothing'){
      Model.clearCachedModel();
    }else{
      if ((typeof savedModel.version !== 'undefined') && Model.versionsAreCompatible(version,savedModel.version)){
        // comply with EU cookie law
        if(Model.hasExpired(savedModel.timestamp)){
          Model.clearCachedModel();
        }else{
          console.log("cachedStorage ok");
        }
      }else{
        Model.clearCachedModel();
      }
    }
  },
  init: (version) => {
    Router.register(Model);
    View.init(Model);
    Model.checkCachedModel(version);
    Model.initializeModel(version);
  },
  hasExpired: (date) => {
    let current = new Date();
    let modelDate = Date(date);
    //one year expiration period  is set for cached projects
    let timeDiff = Math.abs(Date.parse(date) - current.getTime())/ 1000 / 60 / 60 / 24 / 365;
    let res = false;
    if (timeDiff > 1) {
      res = true;
    }
    return res;
  },
  skeletonModel: (version) => {
    let timestamp = new Date()
    return {
      version: version,
      text: Locales[Model.defaults.locale],
      defaults: Model.defaults,
      timestamp
    }
  },
  children: [
    Router,
    Project,
  ],
};

module.exports = {
  Model: Model,
};
