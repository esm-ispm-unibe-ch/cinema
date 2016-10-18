console.log('\'Allo \'Allo! main js here!');

var GR = {
  model: middleton,
  headerTitle: 'GRADE NMA Visualization Tools',
  headerTitleShort: 'GRADE',
  router: {
    currentRoute: 'projects',
    routes:[
      {route: 'about', label: 'About', title: 'About',
        infos: {
          title: 'The GRADE NMA project',
          cont: 'PLOS paper Abstract',
          error: '',
        },
      },
      {route: 'tools', label: 'Tools', title: 'Tools',
        infos: {
          title: 'Visualization Tools',
          cont: 'You now can use the tools provided for your project!',
          error: '',
        },
      },
      {route: 'projects', label: 'My Projects', title: 'My Projects',
        infos: {
          title: 'My Projects',
          cont: 'Welcome to our App, please browse your projects or upload a new one!',
          error: '',
        },
      },
  ]
  },
  bindNavControls: () => {
    $('.routes').bind( 'click', function() {
      GR.router.currentRoute = $(this).attr('action');
      var active = $(this).hasClass('active');
      if(!(active)){
        GR.activateRoute();
      }
    });
  },

  activateRoute: () => {
    var route = GR.router.currentRoute;
    $('.routes').removeClass('active');
    $('.routes.'+route).addClass('active');
    $('.routed').hide();
    $('#'+route).fadeIn(400);
    GR.updateInfo(GR.getCurrentRouteInfos());
    if(route==='tools'){
      NP.init(GR.model, 'cy');
    }
  },

  getCurrentRouteInfos: () => {
    return _.find(GR.router.routes, (r) => {return r.route===GR.router.currentRoute}).infos;
  },

  updateInfo: (infos) =>{
    var infotmpl = Netplot.templates.info(infos);
    $("#info").html(infotmpl);
  },

  init: () =>{
    var headertmpl = Netplot.templates.header(GR);
    var projectstmpl = Netplot.templates.projects();
    var abouttmpl = Netplot.templates.about();
    var infotmpl = Netplot.templates.info(GR.getCurrentRouteInfos());
    $(".header").html(headertmpl);
    $("#projects").html(projectstmpl);
    $("#about").html(abouttmpl);
    $("#info").html(infotmpl);
    GR.bindNavControls();
    GR.activateRoute();
  },

};


//Rendering functions
$(document).ready(function () {
  GR.init();
});
