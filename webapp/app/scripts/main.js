var Router = require('./router.js').Router;

var GR = {
  savedProjects: {},
  init: () =>{
    ocpu.seturl('//localhost:8004/ocpu/library/contribution/R');
    var headertmpl = GRADE.templates.header(Router);
    var abouttmpl = GRADE.templates.about();
    $('.header').html(headertmpl);
    $('#about').html(abouttmpl);
  },
};


//Rendering functions
$(document).ready(function () {
  GR.init();
  Router.init();
});
