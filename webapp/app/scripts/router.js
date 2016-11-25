var Messages = require('./messages.js').Messages;
//maybe init in View

var Router = {
  headerTitle: 'Evaluating NMA Evidence Visualization Suite - DEVELOPMENT VERSION',
  headerTitleShort: 'Evaluating NMA Evidence',
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
    },
    {
      route: 'projects',
      label: 'My Projects',
      title: 'My Projects',
      infos: Messages.projectRoute,
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
}

module.exports = {
  Router: Router
};
