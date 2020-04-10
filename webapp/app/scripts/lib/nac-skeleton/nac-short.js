var clone = require('../lib/mixins.js').clone;
var deepSeek = require('safe-access');
var h = require('virtual-dom/h');

var NAC = {
  //actions will trigered by hml actions and other msgs 
  actions: {
    clickedMe: () => {
      Update(NAC.model).clickedMe();
    },
  },
  modelPosition: 'model position of NAC',
  view: {
    register: (model) => {
      NAC.model = model;
      model.Actions.NAC = NAC.actions;
    },
    isReady: (model) => {
      let isReady = false;
      if (! _.isUndefined(deepSeek(model, NAC.modelPosition))){
        isReady = true;
      }
      return isReady;
    },
    getState: () => {
      return deepSeek(model.getState(),NAC.modelPosition);
    },
  },
  update: {
    updateState: (model) => {
      if ( _.isUndefined(deepSeek(NAC.model,NAC.modelPosition))){
        NAC.model = model;
        NAC.update.setState(NAC.update.skeletonModel());
      }else{
        console.log('NAC model ready');
        _.map(children, c => { c.update.updateState(model);});
      }
    },
    setState: (newState) => {
      let NACstate = NAC.model[NAC.modelPosition];
      NACstate = newState;
      NAC.update.saveState();
    },
    saveState: () => {
      NAC.model.saveState();
      _.map(NAC.children, c => { c.update.updateState();});
    },
    skeletonModel: () => {
      return { 
        //default properties go here
      }
    },
    clickedMe: () => {
      console.log('clicked me');
    }
  },
  render: (model) => {
    if(NAC.view.isReady(model)){
      let children = _.map(NAC.renderChildren, c => {return c.render(model);});
      return h('div.menu', [
        h('ul', [
          h('li', 'option #1'),
          h('a', {
            'attributes': {
              'onclick': 'Actions.NAC.clickedMe()'
            }
          }, 'Click'),
          h('li', 'option #2')
        ])
      ])
    }else{
      console.log('NAC not ready to render');
    }
  },
  afterRender: () => {
    //hope won't need it!
     _.map(NAC.renderChildren, c => {return c.afterRender(model);});
  },
  children : [
  ],
  renderChildren: [
  ],
}

module.exports = () => {
  return NAC;
}

