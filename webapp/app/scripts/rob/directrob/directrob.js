var Messages = require('../../messages.js').Messages;
var Update = require('./update.js')();
var View = require('./view.js')();
var Template = require('./template.js')();
var RoB = require('../rob.js')();

var DirectRob = {
  //actions will trigered by hml actions and other msgs 
  actions: {
    resetDirectRob: () => {
      let [title,msg] = DirectRob.model.getState().text.directRob.resetConfirm;
      Messages.alertify().confirm(title,msg,
        () => {
          Update(DirectRob.model).resetDirectRob();
          Messages.alertify().message('selections cleared');
        },() => {});
    },
    selectrob: (rule) => {
      Update(DirectRob.model).selectrob(rule);
    },
    selectIndividual: (rule) => {
      Update(DirectRob.model).selectIndividual(rule);
    },
  },
  view: {
    register: (model) => {
      DirectRob.model = model;
      model.Actions.DirectRob = DirectRob.actions;
      _.map(DirectRob.renderChildren, c => {c.view.register(model)});
      RoB.view.register(model);
    },
  },
  update: {
    updateState: (model) => {
        Update(model).updateState(model);
    },
  },
  render: (model) => {
    if(View(model).isReady()){
      return Template(model,DirectRob.renderChildren);
    }else{
    }
  },
  afterRender: (model) => {
    _.map(DirectRob.renderChildren, c => {return c.afterRender(model);});
  },
  renderChildren: [
    RoB
  ],
}

module.exports = () => {
  return DirectRob;
}
