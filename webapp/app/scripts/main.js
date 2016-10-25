var Messages = require('./Messages.js')();
var PR = require('./projects.js')();
var NP = require('./netplot.js')();

var GR = {
  savedProjects: {},
  headerTitle: 'GRADE NMA Visualization Tools',
  headerTitleShort: 'GRADE',
  router: {
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
    Messages.updateInfo(GR.getCurrentRouteInfos());
  },

  getCurrentRouteInfos: () => {
    return _.find(GR.router.routes, (r) => {return r.route===GR.router.currentRoute}).infos;
  },


  init: (model) =>{
    var headertmpl = Netplot.templates.header(GR);
    var projectstmpl = Netplot.templates.projects();
    var abouttmpl = Netplot.templates.about();
    var infotmpl = Netplot.templates.info(GR.getCurrentRouteInfos());
    $('.header').html(headertmpl);
    $('#projects').html(projectstmpl);
    $('#about').html(abouttmpl);
    $('#info').html(infotmpl);
    GR.bindNavControls();
    GR.activateRoute();
    //NP.init(model, 'cy');
  },

};


//Rendering functions
$(document).ready(function () {
  var fetchModel = new Promise(
        // The resolver function is called with the ability to resolve or
        // reject the promise
        function(resolve, reject) {
            resolve(PR.getModel());
          }
      );

      // We define what to do when the promise is resolved/fulfilled with the then() call,
      // and the catch() method defines what to do if the promise is rejected.
      fetchModel.then(
          // Log the fulfillment value
        function(val) {
            GR.savedProjects = val;
            PR.init();
            GR.init(val);
      })
    .catch(
        // Log the rejection reason
        function(reason) {
            console.log('Handle rejected promise ('+reason+') here.');
        });
});
