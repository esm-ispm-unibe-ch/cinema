var Messages = require('./messages.js').Messages;
var Welcome = require('./welcome.js')();
var Project = require('./project.js')();
var Doc = require('./doc.js')();
var Error = require('./error.js')();
var General = require('./general.js')();

var Router = {
  view: {
    checkAvailability: (route) => {
      if(_.contains(Router.view.menuRoutes, route)){
        return true;
      }else{
        switch(route) {
          case "general":
            if(Router.model.getState().project && typeof Router.model.getState().project.studies !== 'undefined'){
              return true;
            }else{ 
              return false;
            }
            break;
        }
        return false;
      }
    },
    menuRoutes: ["welcome","project","doc"],
    evalRoutes: ["general","rob", "imprecision","inconsistency", "indirectness",  "pubBias","report"],
    dependencies: {
      project: [],
      general: ['projectName'],
      rob: ['currentCM','directRobs'],
      about: []
    },
    mainMenu: () => {
      return Router.view.routes(Router.view.menuRoutes);
    },
    evalMenu: () => {
      return Router.view.routes(Router.view.evalRoutes);
    },
    routes: (rtnames) => {
      let outRoutes = _.map(rtnames, rt => {
        return {
          route: rt,
          label: () => {return Router.model.getState().text.routes[rt].label},
          info: () => {return Router.model.getState().text.routes[rt].info},
          isAvailable: () => {return Router.view.checkAvailability(rt)},
          isActive: () => {return rt===Router.view.currentRoute()},
        }
     });
      return outRoutes;
    },
    currentRoute : () =>{
      return Router.model.getState().router.currentRoute;
    },
    register:(model) => {
      _.map(Router.renderChildren, c => {
        c.module.view.register(model);
      });
      Router.model = model;
    },
    isReady: () => {
      let isReady = false;
      if(! _.isUndefined(Router.model.getState().router)){
        isReady = true;
      }
      return isReady;
    },
  },
  update: {
    updateState: () => {
      if (typeof Router.model.getState().router === 'undefined'){
        Router.model.getState().router = {
          currentRoute: 'welcome'
        }
        Router.model.saveState();
      }else{
      }
    },
    gotoRoute: (route) => {
      if((Router.view.currentRoute()!==route)){
        if(Router.view.checkAvailability(route)){
        Router.model.getState().router.currentRoute = route;
        Router.model.saveState();
        }else{
          Router.update.gotoRoute('welcome');
        }
      }
    },
  },
  actions: {
    bindNavControls: () => {
      $(document).on('click','a.routes', {} ,
        e=>{
          var route = $(e.currentTarget).attr('action');
          Router.update.gotoRoute(route);
      });
    },
  },
  init: (model) => {
    //bind actions
    Router.actions.bindNavControls();
    //bind children actions
    _.map(Router.renderChildren, c => {
        c.module.init(model);
    });
  },
  render: (model) => {
    return new Promise((resolve,reject) => {
      if (Router.view.isReady()){
        var headertmpl = GRADE.templates.header({model:model.state,view:Router.view});
        $('#header').html(headertmpl);
        let currentRoute = Router.view.currentRoute();
        let child = _.find(Router.renderChildren, c => {
          return c.route === currentRoute;
        });
        if(typeof child === 'undefined'){
          Error.render(model,"#content");
          reject("didn't find route");
        }else{
          child.module.render(model,"#content");
        }
      }
      var footertmpl = GRADE.templates.footer({model:model.state,view:Router.view});
      $('.footer').html(footertmpl);
      resolve('rendered route');
    });
  },
  renderChildren: [
    { route: "welcome",
      module: Welcome
    },
    { route: "doc",
      module: Doc
    },
    { route: "project",
      module: Project
    },
    { route: "general",
      module: General
    },
  ],
}

module.exports = {
  Router: Router
};
