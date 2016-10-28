var Messages = require('./messages.js').Messages;

var Router = {
    currentRoute: 'projects',
    routes:[
      {route: 'about', label: 'About', title: 'About',
        infos: Messages.aboutRoute
      },
      {route: 'tools', label: 'Tools', title: 'Tools',
        infos: Messages.toolsRoute
      },
      {route: 'projects', label: 'My Projects', title: 'My Projects',
        infos: Messages.projectRoute,
      },
  ],
  gotoRoute: (route) => {
    Router.currentRoute = route;
    $('.routes').removeClass('active');
    $('.routes.'+route).addClass('active');
    $('.routed').hide();
    $('#'+route).fadeIn(400);
    Messages.updateInfo(Router.getCurrentRouteInfos());
    $("html, body").animate({
      scrollTop: 0
    }, 300);
  },
  getCurrentRouteInfos: () => {
    return _.find(Router.routes, (r) => {return r.route===Router.currentRoute}).infos;
  },
  bindNavControls: () => {
    $('.routes').bind( 'click', function() {
      var route = $(this).attr('action');
      var active = $(this).hasClass('active');
      if(!(active)){
        Router.gotoRoute(route);
      }
    });
  },
  init: () => {
    $(document).ready(function () {
      Router.bindNavControls();
      Router.gotoRoute(Router.currentRoute);
    });
  },
}

module.exports =  {
  Router: Router
};
