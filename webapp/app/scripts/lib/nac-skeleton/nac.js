var deepSeek = require('safe-access');
var Update = require('./update.js')();
var View = require('./view.js')();
var Template = require('./template.js')();

var NAC = {
  //actions will trigered by hml actions and other msgs 
  actions: {
    clickedMe: () => {
      Update(NAC.model).clickedMe();
    },
  },
  view: {
    register: (model) => {
      NAC.model = model;
      model.Actions.NAC = NAC.actions;
    },
  },
  update: {
    updateState: (model) => {
        Update(model).updateState(model);
    },
  },
  render: (model) => {
    if(View(model).isReady()){
      let children = _.map(NAC.renderChildren, c => { c.render(model);});
      return Template(model,NAC.renderChildren);
    }else{
      console.log('NAC not ready to render');
    }
  },
  afterRender: () => {
    _.map(NAC.renderChildren, c => {return c.afterRender(model);});
    //hope won't need it!
  },
  renderChildren: [
  ],
}

module.exports = () => {
  return NAC;
}
