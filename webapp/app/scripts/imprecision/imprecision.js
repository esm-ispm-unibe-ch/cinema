var clone = require('../lib/mixins.js').clone;
var deepSeek = require('safe-access');
var Messages = require('../messages.js').Messages;
var View = require('./view.js')();
var Update = require('./update.js')();
var Template = require('./template.js')();
var h = require('virtual-dom/h');


var Imprecision = {
  actions: {
    setClinImp: (value) => {
      Update(Imprecision.model).setClinImp();
    },
    resetClinImp: (emtype) => {
      Update(Imprecision.model).resetClinImp(emtype);
    },
    resetBoxes: () => {
    let [title,msg,successmsg] = Imprecision.model.getState().text.Imprecision.resetConfirm;
      Messages.alertify().confirm(title,msg,
        () => {
        Update(Imprecision.model).resetBoxes();
          Messages.alertify().message(successmsg);
        },() => {});
    },
    selectIndividual: (value) => {
      let updated = Imprecision.model.getState().text.Imprecision.ImprecisionSet;
      Messages.alertify().message(updated);
        Update(Imprecision.model).selectIndividual(value);
    },
    updateState: () => {
      Update(Imprecision.model).updateState(Imprecision.model);
    },
    proceed: () => {
      Actions.Router.gotoRoute('heterogeneity');
      Imprecision.model.persistToLocalStorage();
    },
  },
  modelPosition: 'getState().project.imprecision',
  view: {
    isActive: (route) => {
      return route === Imprecision.model.getState().project.imprecision.route;
    },
    register: (model) => {
      Imprecision.model = model;
      model.Actions.Imprecision = Imprecision.actions;
     _.map(Imprecision.renderChildren, c => {return c.module.view.register(model);});
    },
    isReady: (model) => {
      let isReady = false;
      if (! _.isUndefined(Imprecision.model)){
        isReady = true;
      }
      return isReady;
    },
  },
  update: {
    cmReady: (model) => {
      let isready = false;
      if (deepSeek(model,'getState().project.CM.currentCM.status')==='ready'){
        isready = true;
      }
      return isready;
    },
    updateState: (model) => {
      if ( _.isUndefined(deepSeek(Imprecision.model,Imprecision.modelPosition))){
        Imprecision.model = model;
        Update(model).updateState(model);
      }else{
        Update(model).updateState(model);
      }
    },
  },
  render: (model) => {
    if(View(model).isReady()){
      let children = _.map(Imprecision.renderChildren, c => { c.render(model);});
      return Template(model,Imprecision.renderChildren);
    }else{
      console.log('Imprecision not ready to render');
    }
  },
  afterRender: () => {
    //hope won't need it!
     _.map(Imprecision.renderChildren, c => {return c.module.afterRender(model);});
  },
  children: [
  ],
  renderChildren: [
  ],
}

module.exports = () => {
  return Imprecision;
}

