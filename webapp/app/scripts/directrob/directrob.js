var Messages = require('../messages.js').Messages;
var Update = require('./update.js')();
var View = require('./view.js')();
var Template = require('./template.js')();

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
    },
  },
  update: {
    updateState: (model) => {
        Update(model).updateState();
    },
  },
  render: (model) => {
    if(View(model).isReady()){
      let children = _.map(DirectRob.renderChildren, c => { c.render(model);});
      return Template(model,children);
    }else{
      console.log('DirectRob not ready to render');
    }
  },
  afterRender: () => {
    //hope won't need it!
  },
  renderChildren: [
  ],
}

module.exports = () => {
  return DirectRob;
}
