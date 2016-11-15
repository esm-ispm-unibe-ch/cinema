var Messages = require('./messages.js').Messages;
var Model = require('./model.js').Model;
var Tools = require('./tools.js')();
var Projects = require('./projects.js')();

var Router = {
  headerTitle: 'GRADE NMA Visualization Tools',
  headerTitleShort: 'GRADE',
  currentRoute: '',
  routes:[
    {
      route: 'about',
      label: 'About',
      title: 'About',
      infos: Messages.aboutRoute,
      actions: []
    },
    {
      route: 'tools',
      label: 'Tools',
      title: 'Tools',
      infos: Messages.toolsRoute,
      actions: [Model.saveProject, Tools.init]
    },
    {
      route: 'projects',
      label: 'My Projects',
      title: 'My Projects',
      infos: Messages.projectRoute,
      actions: [Projects.init]
    },
  ],
  gotoRoute: (route) => {
    if(Router.currentRoute!==route){
      Router.currentRoute = route;
      let routy = _.find(Router.routes, (r) => {return r.route===Router.currentRoute});
      $('.routes').removeClass('active');
      $('.routes.'+route).addClass('active');
      $('.routed').hide();
      $('#'+route).fadeIn(400);
      Messages.updateInfo(routy.infos);
      if(!(_.isEmpty(routy.actions))){
        _.map(routy.actions, ra => {
          if(route==='projects'){
            ra(Router);
          }else{
            ra(Model);
          }
        });
      };
    }
  },
  enableRoute: (route) => {
    $(document).ready( () => {
      let btns = $('.routes[action='+route+']');
      btns.attr('disabled', false);
      Router.bindNavControls();
    });
  },
  disableRoute: (route) => {
    $(document).ready( () => {
      let btns = $('.routes[action='+route+']');
      btns.attr('disabled', true);
    });
  },
  bindNavControls: () => {
    $('.routes').unbind();
    $(document).ready( () => {
      $('.routes').bind( 'click', function() {
        var route = $(this).attr('action');
        var active = $(this).hasClass('active');
        var disabled = $(this).attr('disabled')==='disabled';
        if(!(disabled||active)){
          Router.gotoRoute(route);
        }
      });
    });
  },
  init: () => {
    $(document).ready(function () {
      Router.bindNavControls();
      Model.readLocalStorage();
      if(Model.emptyProject()){
        Router.disableRoute('tools');
        Router.gotoRoute('projects');
      }else{
        Router.gotoRoute('tools');
      }
    });
  },
}

module.exports = {
  Router: Router
};
