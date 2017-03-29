var deepSeek = require('safe-access');
var Messages = require('../../messages.js').Messages;
var Update = require('./update.js')();
var View = require('./view.js')();
var Template = require('./template.js')();

var Heterogeneity = {
  //actions will trigered by hml actions and other msgs 
  actions: {
    selectRFVparam: (param) => {
      Update(Heterogeneity.model).selectRFVparam(param);
    },
    fetchRFV: () => {
      Update(Heterogeneity.model).fetchRFV();
    },
    resetRFV: () => {
      let [title,msg,successmsg] = Heterogeneity.model.getState().text.Heterogeneity.resetConfirm;
      Messages.alertify().confirm(title,msg,
        () => {
          Update(Heterogeneity.model).resetRFV();
          Messages.alertify().message(successmsg);
        },() => {});
    },
    selectHetersRule: (rule) => {
      Update(Heterogeneity.model).selectHetersRule(rule);
    },
    resetHeters: (rule) => {
    let [title,msg,successmsg] = Heterogeneity.model.getState().text.Heterogeneity.resetConfirm;
      Messages.alertify().confirm(title,msg,
        () => {
        Update(Heterogeneity.model).resetHeters(rule);
          Messages.alertify().message(successmsg);
        },() => {});
    },
  },
  view: {
    register: (model) => {
      Heterogeneity.model = model;
      model.Actions.Heterogeneity = Heterogeneity.actions;
    },
  },
  update: {
    updateState: (model) => {
        Update(model).updateState(model);
    },
  },
  render: (model) => {
    if(View(model).isReady()){
      let children = _.map(Heterogeneity.renderChildren, c => { c.render(model);});
      return Template(model,Heterogeneity.renderChildren);
    }else{
      console.log('Heterogeneity not ready to render');
    }
  },
  afterRender: () => {
    _.map(Heterogeneity.renderChildren, c => {return c.afterRender(model);});
    //hope won't need it!
  },
  renderChildren: [
  ],
}

module.exports = () => {
  return Heterogeneity;
}
