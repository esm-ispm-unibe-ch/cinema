var Messages = require('../../messages.js').Messages;
var Update = require('./update.js')();
var View = require('./view.js')();
var Template = require('./template.js')();

var NetIndr = {
  //actions will trigered by hml actions and other msgs 
  actions: {
    resetNetIndr: () => {
      let [title,msg,successmsg] = NetIndr.model.getState().text.NetIndr.resetConfirm;
      Messages.alertify().confirm(title,msg,
        () => {
          Update(NetIndr.model).resetNetIndr();
          Messages.alertify().message(successmsg);
        },() => {});
    },
    selectRule: (rule) => {
      Update(NetIndr.model).selectRule(rule);
    },
    selectIndividual: (judgement) => {
      Update(NetIndr.model).selectIndividual(judgement);
    },
    proceed: () => {
      Actions.Router.gotoRoute('imprecision');
      NetIndr.model.persistToLocalStorage();
    },
  },
  view: {
    register: (model) => {
      NetIndr.model = model;
      model.Actions.NetIndr = NetIndr.actions;
    },
  },
  update: {
    updateState: (model) => {
      Update(NetIndr.model).updateState(model);
    },
  },
  render: (model) => {
    if(View(model).isReady()){
      let children = _.map(NetIndr.renderChildren, c => {return c.render(model);});
      return Template(model,children);
    }else{
    }
  },
  afterRender: () => {
    //hope won't need it!
  },
  renderChildren: [
  ],
}

module.exports = () => {
  return NetIndr;
}
