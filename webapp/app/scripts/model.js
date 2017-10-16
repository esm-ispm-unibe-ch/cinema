var Locales = require('./translations.json');
var View = require('./view.js').View;
var clone = require('./lib/mixins.js').clone;
var accumulate = require('./lib/mixins.js').accumulate;
var sumBy = require('./lib/mixins.js').sumBy;
var Router = require('./router.js').Router;
var Project = require('./project.js')();

var Model = {
  Actions: {}
  ,
  defaults: {
    robLevels: [
      { id: 1,
        color: '#7CC9AE'
      },
      { id: 2,
        color: '#FBBC05'
      },
      { id: 3,
        color: '#E0685C'
    }],
    studyLimitationLevels: [
      { id: 1,
        color: '#7CC9AE'
      },
      { id: 2,
        color: '#FBBC05'
      },
      { id: 3,
        color: '#E0685C'
      }],
    indrLevels: [
      { id: 1,
        color: '#7CC9AE'
      },
      { id: 2,
        color: '#FBBC05'
      },
      { id: 3,
        color: '#E0685C'
    }],
    netIndrLevels: [
      { id: 1,
        color: '#7CC9AE'
      },
      { id: 2,
        color: '#FBBC05'
      },
      { id: 3,
        color: '#E0685C'
    }],
    pubbiasLevels: [
      { id: 1,
        color: '#7CC9AE'
      },
      { id: 2,
        color: '#E0685C'
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
  saveState: () => {
    localStorage.clear();
    let wt = document.documentElement.scrollTop || document.body.scrollTop;
    Model.state.wt = wt;
    localStorage.setItem('state', JSON.stringify(Model.getState()));
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
  init: (version) => {
    Router.register(Model);
    View.init(Model);
    // localStorage.clear();
    if (typeof localStorage.state === 'undefined'){
      // console.log('no cached state');
      Model.setState(Model.skeletonModel(version));
    }else{
      let savedModel = JSON.parse(localStorage.state);
      if ((typeof savedModel.version !== 'undefined') && (savedModel.version === version)){
        // comply with EU cookie law
        if(Model.hasExpired(savedModel.timestamp)){
          Model.setState(Model.skeletonModel(version));
        }else{
          Model.setState(savedModel);
        }
      }else{
        Model.setState(Model.skeletonModel(version));
      }
    }
  },
  hasExpired: (date) => {
    let current = new Date();
    let modelDate = Date(date);
    //one year expiration perios is set
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
