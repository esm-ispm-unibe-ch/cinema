var Messages = require('../../messages.js').Messages;
var Update = require('./update.js')();
var View = require('./view.js')();
var Template = require('./template.js')();
//var NetIndr = require('../netIndr.js')();

var DirectIndr = {
  //actions will trigered by hml actions and other msgs 
  actions: {
    resetDirectIndr: () => {
      let [title,msg] = DirectIndr.model.getState().text.directRob.resetConfirm;
      Messages.alertify().confirm(title,msg,
        () => {
          Update(DirectIndr.model).resetDirectIndr();
          Messages.alertify().message('selections cleared');
        },() => {});
    },
    selectrob: (rule) => {
      Update(DirectIndr.model).selectrob(rule);
    },
    selectIndividual: (rule) => {
      Update(DirectIndr.model).selectIndividual(rule);
    },
    setAll: (value) => {
      Update(DirectIndr.model).setAll(value);
    },
  },
  view: {
    register: (model) => {
      DirectIndr.model = model;
      model.Actions.DirectIndr = DirectIndr.actions;
      _.map(DirectIndr.renderChildren, c => {c.view.register(model)});
      //NetIndr.view.register(model);
      console.log("uncomment directIndr line 30");
    },
  },
  update: {
    updateState: (model) => {
        Update(model).updateState(model);
    },
  },
  render: (model) => {
    if(View(model).isReady()){
      return Template(model,DirectIndr.renderChildren);
    }else{
    }
  },
  afterRender: (model) => {
    _.map(DirectIndr.renderChildren, c => {return c.afterRender(model);});
  },
  renderChildren: [
    //NetIndr
  ],
}

module.exports = () => {
  return DirectIndr;
}
