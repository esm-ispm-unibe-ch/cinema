var clone = require('../lib/mixins.js').clone;
var deepSeek = require('safe-access');
var h = require('virtual-dom/h');
var Heterogeneity = require('./heterogeneity/heterogeneity.js')();
var Incoherence = require('./incoherence/incoherence.js')();


var Inconsistency = {
  actions: {
    gotoRoute: (route) => {
      Inconsistency.update.gotoRoute(route);
    },
  },
  modelPosition: "project.Inconsistency",
  view: {
    isActive: (route) => {
      return route === Inconsistency.getState(Inconsistency.model).route;
    },
    register: (model) => {
      Inconsistency.model = model;
      model.Actions.Inconsistency = Inconsistency.actions;
     _.map(Inconsistency.renderChildren, c => {return c.module.view.register(model);});
    },
    isReady: (model) => {
      let isReady = false;
      if (! _.isUndefined(Inconsistency.getState(model))){
        isReady = true;
      }
      return isReady;
    },
  },
  getState: (model) => {
    return deepSeek(model.getState(),Inconsistency.modelPosition);
  },
  update: {
    cmReady: (model) => {
      let isready = false;
      if (deepSeek(model,'getState().project.CM.currentCM.status')==='ready'){
        isready = true;
        console.log('contribution matrix ready');
      }
      return isready;
    },
    updateState: (model) => {
      if (Inconsistency.update.cmReady(model) ){
        if(_.isUndefined(Inconsistency.getState(model))){
          Inconsistency.model = model;
          Inconsistency.update.setState(Inconsistency.update.skeletonModel());
          Inconsistency.update.changeState('status','ready');
        }else{
          _.map(Inconsistency.children, c => { c.update.updateState(model);});
          console.log("Inconsistency model ready");
        }
      }else{
        console.log("Inconsistency model not ready");
        Inconsistency.update.setState(Inconsistency.update.skeletonModel());
      }
    },
    setState: (newState) => {
      Inconsistency.model.getState().project.Inconsistency=newState;
      Inconsistency.update.saveState();
    },
    saveState: () => {
      Inconsistency.model.saveState();
      _.map(Inconsistency.children, c => { c.update.updateState(Inconsistency.model);});
    },
    skeletonModel: () => {
      return { 
        route: 'heterogeneity',
        status: 'notReady',
      }
    },
    changeState: (key,value) => {
      Inconsistency.getState(Inconsistency.model)[key] = value;
      Inconsistency.update.saveState();
    },
    gotoRoute: (route) => {
      console.log("going to", route);
      Inconsistency.update.changeState("route",route);
    }
  },
  render: (model) => {
    if(Inconsistency.view.isReady(model)){
      let child = _.find(Inconsistency.renderChildren, c => {return c.route === Inconsistency.getState(model).route;}).module.render(model);
      let hetli ="li";
      hetli+= Inconsistency.view.isActive('heterogeneity')?".active":""; 
      let incli ="li";
      incli+= Inconsistency.view.isActive('incoherence')?".active":""; 
      return [h("ul.nav.nav-tabs", [
          h(hetli, [
                h("a", {
                        "attributes": {
                                  "onclick": "Actions.Inconsistency.gotoRoute('heterogeneity')",
                                  "href": "#inconsistency/heterogeneity"
                                }
                      }, `Heterogeneity`)
              ]),
          h(incli, [
                h("a", {
                        "attributes": {
                                  "onclick": "Actions.Inconsistency.gotoRoute('incoherence')",
                                  "href": "#inconsistency/incoherence"
                                }
                      }, `Incoherence`)
              ])
      ])
      ,h("div.row",child)];
    }else{
      console.log('Inconsistency not ready to render');
    }
  },
  afterRender: () => {
    //hope won't need it!
     _.map(Inconsistency.renderChildren, c => {return c.module.afterRender(model);});
  },
  children: [
    Heterogeneity,
    Incoherence
  ],
  renderChildren: [{
    route: 'heterogeneity',
    module: Heterogeneity,
  },{
    route: 'incoherence',
    module: Incoherence,
  }],
}

module.exports = () => {
  return Inconsistency;
}

