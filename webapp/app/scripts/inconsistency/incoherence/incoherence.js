var deepSeek = require('safe-access');
var Messages = require('../../messages.js').Messages;
var Update = require('./update.js')();
var View = require('./view.js')();
var Template = require('./template.js')();

var Incoherence = {
  //actions will trigered by hml actions and other msgs 
  actions: {
    resetIncoherence: () => {
      let [title,msg,successmsg] = Incoherence.model.getState().text.Incoherence.resetConfirm;
      Messages.alertify().confirm(title,msg,
        () => {
          Update(Incoherence.model).resetIncoherence();
          Messages.alertify().message(successmsg);
        },() => {});
    },
  },
  view: {
    register: (model) => {
      Incoherence.model = model;
      model.Actions.Incoherence = Incoherence.actions;
    },
  },
  update: {
    updateState: (model) => {
        Update(model).updateState(model);
    },
  },
  render: (model) => {
    if(View(model).isReady()){
      let children = _.map(Incoherence.renderChildren, c => { c.render(model);});
      return Template(model,Incoherence.renderChildren);
    }else{
      console.log('Incoherence not ready to render');
    }
  },
  afterRender: () => {
    _.map(Incoherence.renderChildren, c => {return c.afterRender(model);});
    //hope won't need it!
  },
  renderChildren: [
  ],
}

module.exports = () => {
  return Incoherence;
}