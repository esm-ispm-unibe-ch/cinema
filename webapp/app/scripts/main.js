var Messages = require('./messages.js').Messages;
var Router = require('./router.js').Router;
var PR = require('./projects.js')();
var NP = require('./netplot.js')();

var GR = {
  savedProjects: {},
  headerTitle: 'GRADE NMA Visualization Tools',
  headerTitleShort: 'GRADE',
  init: () =>{
    var headertmpl = Netplot.templates.header(Router);
    var abouttmpl = Netplot.templates.about();
    $('.header').html(headertmpl);
    $('#about').html(abouttmpl);
  },
};


//Rendering functions
$(document).ready(function () {
  Router.init();
  GR.init();
  PR.init();
});
