var ConChart = require('./conchart/conchart.js')();
var NetRob = require('./netrob/netrob.js')();
var clone = require('../lib/mixins.js').clone;
var deepSeek = require('safe-access');
var h = require('virtual-dom/h');

var RoB = {
  actions: {
    clickedMe: () => {
      Update(RoB.model).clickedMe();
    },
  },
  modelPosition: "getState().project.NetRob",
  view: {
    register: (model) => {
      RoB.model = model;
      _.map(RoB.renderChildren, c => {c.view.register(model)});
      model.Actions.RoB = RoB.actions;
    },
    isReady: (model) => {
      let isReady = false;
      if (! _.isUndefined(deepSeek(model, RoB.modelPosition))){
        isReady = true;
      }
      return isReady;
    },
    getState: () => {
      return deepSeek(model.getState(),RoB.modelPosition);
    },
  },
  update: {
    updateState: (model) => {
      if ( _.isUndefined(deepSeek(RoB.model,RoB.modelPosition))){
        RoB.model = model;
        RoB.update.setState(RoB.update.skeletonModel());
      }else{
        _.map(RoB.children, c => { c.update.updateState(model);});
      }
    },
    setState: (newState) => {
      let RoBstate = deepSeek(RoB.model,RoB.modelPosition);
      RoB.model.getState().project.NetRob = newState;
      RoB.update.saveState();
    },
    saveState: () => {
      RoB.model.saveState();
      _.map(RoB.children, c => { c.update.updateState(RoB.model);});
    },
    skeletonModel: () => {
      return { 
        status: 'ready'
      }
    },
    clickedMe: () => {
      console.log("clicked me");
    }
  },
  render: (model) => {
    if(RoB.view.isReady(model)){
      let children = _.map(RoB.renderChildren, c => {return c.render(model);});
      return h('div#contentStudyLimitations.row',children);
    }else{
      console.log('RoB not ready to render');
    }
  },
  afterRender: (model) => {
    _.map(RoB.renderChildren, c => {return c.afterRender(model);});
  },
  children : [
    ConChart,
    NetRob
  ],
  renderChildren: [
    ConChart,
    NetRob
  ],
}

module.exports = () => {
  return RoB;
}
