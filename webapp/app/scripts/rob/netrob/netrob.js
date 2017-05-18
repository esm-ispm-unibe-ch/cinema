var Messages = require('../../messages.js').Messages;
var Update = require('./update.js')();
var View = require('./view.js')();
var Template = require('./template.js')();

var NetRob = {
  //actions will trigered by hml actions and other msgs 
  actions: {
    resetNetRob: () => {
      let [title,msg,successmsg] = NetRob.model.getState().text.NetRob.resetConfirm;
      Messages.alertify().confirm(title,msg,
        () => {
          Update(NetRob.model).resetNetRob();
          Messages.alertify().message(successmsg);
        },() => {});
    },
    selectRule: (rule) => {
      Update(NetRob.model).selectRule(rule);
    },
    selectIndividual: (judgement) => {
      Update(NetRob.model).selectIndividual(judgement);
    },
  },
  view: {
    register: (model) => {
      NetRob.model = model;
      model.Actions.NetRob = NetRob.actions;
    },
  },
  update: {
    updateState: (model) => {
        Update(NetRob.model).updateState(model);
    },
  },
  render: (model) => {
    if(View(model).isReady()){
      let children = _.map(NetRob.renderChildren, c => { c.render(model);});
      return Template(model,children);
    }else{
      console.log('NetRob not ready to render');
    }
  },
  afterRender: () => {
    //hope won't need it!
  },
  renderChildren: [
  ],
}

module.exports = () => {
  return NetRob;
}
