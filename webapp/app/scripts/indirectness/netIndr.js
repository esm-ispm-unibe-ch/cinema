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
  modelPosition: 'getState().project.netRob',
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
  },
  update: {
    updateState: (model) => {
      if ( _.isUndefined(deepSeek(RoB.model,RoB.modelPosition))){
        RoB.model = model;
        RoB.update.setState(RoB.update.skeletonModel());
      }else{
      }
      _.map(RoB.children, c => { c.update.updateState(model);});
    },
    setState: (newState) => {
      let RoBstate = deepSeek(RoB.model,RoB.modelPosition);
      RoB.model.getState().project.netRob = newState;
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
  },
  render: (model) => {
    if(RoB.view.isReady(model)){
      let children = _.map(RoB.renderChildren, c => {return c.render(model);});
      return h('div#contentStudyLimitations.row',children);
    }else{
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
