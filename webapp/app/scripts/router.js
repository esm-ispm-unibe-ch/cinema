var deepSeek = require('safe-access');
var h = require('virtual-dom/h');
var VNode = require('virtual-dom/vnode/vnode');
var VText = require('virtual-dom/vnode/vtext');
var convertHTML = require('html-to-vdom')({
     VNode: VNode,
     VText: VText
});
var Messages = require('./messages.js').Messages;
var Welcome = require('./welcome.js')();
var Project = require('./project.js')();
var Doc = require('./doc.js')();
var Error = require('./error.js')();
var General = require('./general.js')();
var RoB = require('./rob/directrob/directrob.js')();
var ConChart = require('./rob/conchart/conchart.js')();
var Heterogeneity = require('./inconsistency/heterogeneity/heterogeneity.js')();
var Incoherence = require('./inconsistency/incoherence/incoherence.js')();
var Imprecision = require('./imprecision/imprecision.js')();
var Indirectness = require('./indirectness/directIndr/directIndr.js')();
var Pubbias = require('./pubbias/pubbias.js')();
var Report = require('./purescripts/output/Report');
var ReportUpdate = require('./purescripts/output/Report.Update');

var Router = {
  view: {
    checkAvailability: (route) => {
      if(_.contains(Router.view.menuRoutes, route)){
        return true;
      }else{
        let conmatStatus = deepSeek(Router,'model.getState().project.CM.currentCM.status');
        let directRobStatus = deepSeek(Router,'model.getState().project.DirectRob.status');
        let reportStatus = deepSeek(Router,'model.getState().project.report.status');
        let imprecisionStatus = deepSeek(Router,'model.getState().project.imprecision.status');
        switch(route) {
          case 'general':
            if(Router.model.getState().project && typeof Router.model.getState().project.studies !== 'undefined'){
              return true;
            }else{
              return false;
            }
            break;
          case 'rob':
            return (conmatStatus==='ready');
            break;
          case 'pubbias':
            return (conmatStatus==='ready');
            break;
          case 'indirectness':
            return (conmatStatus==='ready');
            break;
          case 'imprecision':
            return (conmatStatus==='ready');
            break;
          case 'heterogeneity':
            return (conmatStatus==='ready');
            break;
          case 'incoherence':
            return (conmatStatus==='ready');
            break;
          case 'report':
            return (reportStatus==='ready');
            break;
        }
        return false;
      }
    },
    menuRoutes: ['welcome', 'project', 'doc'],
    evalRoutes: ['general', 'rob', 'pubbias', 'indirectness', 'imprecision', 'heterogeneity', 'incoherence', 'report'],
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
    isReady: () => {
      let isReady = false;
      if (! _.isUndefined(deepSeek(Router,'model.getState().router.currentRoute'))){
        isReady = true;
      }
      return isReady;
    },
    title: () => {
      let projectTitle = deepSeek(Router,'model.getState().project.title');
      if (_.isUndefined(projectTitle)){
        projectTitle="--"
      }
      return(projectTitle);
    },
    currentRoute: () => {
      let currentRoute = deepSeek(Router,'model.getState().router.currentRoute');
      if (_.isUndefined(currentRoute)){
        currentRoute="--"
      }
      return(currentRoute);
    },
  },
  update: {
    updateState: (model) => {
      if (_.isUndefined(deepSeek(model,'getState().router'))){
          model.getState().router = {
          currentRoute: 'welcome'
        }
        model.saveState();
      }else{
        //console.log('found cached route', Router.view.currentRoute());
      }
    },
    gotoRoute: (route) => {
      //console.log('routing to ', route);
      window.scrollTo(0,0);
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
          // console.log(e,'going to route',route);
          // Router.update.gotoRoute(route);
      });
    },
  },
  render:(model) => {
    return new Promise((resolve,reject) => {
      if (Router.view.isReady()){
        var headertmpl = GRADE.templates.header({model:model.state,view:Router.view});
        var footertmpl = GRADE.templates.footer({model:model.state,view:Router.view});
        var hnode = convertHTML(headertmpl);
        var fnode = convertHTML(footertmpl);
        let cnode = {};
        let child = _.find(Router.renderChildren, c => {
          return c.route === Router.view.currentRoute();
        });
        //// let lkj = Report.katiFn(model);
        // console.log('giving to report',lkj);
        if(typeof child === 'undefined'){
          cnode = Error.render(model);
          // reject('didn\'t find route');
        }else{
          if(Router.view.currentRoute() !=='rob'){
             ConChart.destroyRender(model);
          }
          if(Router.view.currentRoute() !=='indirectness'){
             Indirectness.destroyRender(model);
          }
          if(Router.view.currentRoute() === 'report'){
              cnode = convertHTML(child.module.render(model.getState()));
          }else{
            cnode = child.module.render(model);
          }
        }

        let ptree = [
                     h('div#header.row',hnode),
                     cnode,
                     h('nav.row.footerContainer',fnode) // + .navbar-fixed-bottom
                   ];
          resolve(ptree);
        }else{
        reject('not ready');
      }
    });
  },
  afterRender: (model) => {
    let child = _.find(Router.renderChildren, c => {
      return c.route === Router.view.currentRoute();
    });
    if( typeof child !== 'undefined'){
      if(child.route === 'general'){
        General.afterRender();
      }else{
        if(child.route === 'rob'){
          RoB.afterRender(model);
        }
        if(child.route === 'indirectness'){
          Indirectness.afterRender(model);
        }
      }
    }
  },
  register:(model) => {
    Router.model = model;
    Router.model.Actions.Router = Router.update;
    Router.actions.bindNavControls();
    _.map(Router.renderChildren, c => {
      if ( c.route === 'report' ){
        Router.model.Actions.Report = ReportUpdate;
      }else{
        c.module.view.register(model);
      }
    });
  },
  renderChildren: [
    { route: 'welcome',
      module: Welcome
    },
    { route: 'doc',
      module: Doc
    },
    { route: 'project',
      module: Project
    },
    { route: 'general',
      module: General
    },
    { route: 'rob',
      module: RoB
    },
    { route: 'imprecision',
      module: Imprecision,
    },
    { route: 'indirectness',
      module: Indirectness,
    },
    { route: 'pubbias',
      module: Pubbias,
    },
    { route: 'heterogeneity',
      module: Heterogeneity,
    },
    { route: 'incoherence',
      module: Incoherence,
    },
    { route: 'report',
      module: Report,
    },
  ],
}

module.exports = {
  Router: Router
};
