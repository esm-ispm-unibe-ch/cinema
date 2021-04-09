var clone = require('../lib/mixins.js').clone;
var deepSeek = require('safe-access');
var Messages = require('../messages.js').Messages;
var View = require('./view.js')();
var Update = require('./update.js')();
var Template = require('./template.js')();
var h = require('virtual-dom/h');


var Pubbias = {
  actions: {
    reset: () => {
    let [title,msg,successmsg] = Pubbias.model.getState().text.Pubbias.resetConfirm;
      Messages.alertify().confirm(title,msg,
        () => {
        Update(Pubbias.model).resetBoxes();
          Messages.alertify().message(successmsg);
        },() => {});
    },
    selectIndividual: (value) => {
      let updated = Pubbias.model.getState().text.Pubbias.PubbiasSet;
      Messages.alertify().message(updated);
        Update(Pubbias.model).selectIndividual(value);
    },
    allLow: () => {
        Update(Pubbias.model).allLow();
    },
    allSome: () => {
        Update(Pubbias.model).allSome();
    },
    allHigh: () => {
        Update(Pubbias.model).allHigh();
    },
    uploadTable2: (evt) => {
        Update(Pubbias.model).uploadTable2(evt);
    },
    updateState: () => {
      Update(Pubbias.model).updateState(Pubbias.model);
    },
    proceed: () => {
      Actions.Router.gotoRoute('indirectness');
      Pubbias.model.persistToLocalStorage();
    },
  },
  modelPosition: 'getState().project.pubbias',
  view: {
    isActive: (route) => {
      return route === Pubbias.model.getState().project.inconsistency.route;
    },
    register: (model) => {
      Pubbias.model = model;
      model.Actions.Pubbias = Pubbias.actions;
     _.map(Pubbias.renderChildren, c => {return c.module.view.register(model);});
    },
    isReady: (model) => {
      return View(model).isReady();
    }
  },
  update: {
    updateState: (model) => {
      if ( _.isUndefined(deepSeek(Pubbias.model,Pubbias.modelPosition))){
        Pubbias.model = model;
        Update(model).updateState(model);
      }else{
        Update(model).updateState(model);
      }
    },
  },
  render: (model) => {
    if(View(model).isReady()){
      let children = _.map(Pubbias.renderChildren, c => { c.render(model);});
      return Template(model,Pubbias.renderChildren);
    }else{
      console.log('Pubbias not ready to render');
    }
  },
  afterRender: () => {
    //hope won't need it!
     _.map(Pubbias.renderChildren, c => {return c.module.afterRender(model);});
  },
  children: [
  ],
  renderChildren: [
  ],
}

module.exports = () => {
  return Pubbias;
}

