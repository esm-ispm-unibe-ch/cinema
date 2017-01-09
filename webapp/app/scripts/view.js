var Router = require('./router.js').Router;
var Messages = require('./messages.js').Messages;
var PR = require('./projects.js').PR;
var Tools = require('./tools.js')();


var View = {
  //first render
  model: {},
  setModel:(model)=>{
    View.model = model;
  },
  getModel:() => {
    return View.model;
  },
  init: (model) => {
    View.setModel(model);
    //main site
    var headertmpl = GRADE.templates.header(Router);
    var abouttmpl = GRADE.templates.about();
    $('.header').html(headertmpl);
    $('#about').html(abouttmpl);
    //routes
    if(model.emptyProject()){
      Router.disableRoute('tools');
      Router.gotoRoute('projects');
    }else{
      Router.gotoRoute('tools');
    }
    Router.bindNavControls();
    //Projects
    PR.setModel(model);
    var projectstmpl = GRADE.templates.projects();
    $('#projects').html(projectstmpl);
    PR.bindControls();
    PR.bindFileUploader();
  },
  gotoRoute:(route,hasModel)=>{
    if(hasModel){
      Router.enableRoute('tools');
      Router.gotoRoute(route);
    }else{
      Router.gotoRoute('projects');
      Router.disableRoute('tools');
    }
  },
  updateProjects: () => {
    let m = View.getModel();
    console.log(m);
    let hasModel = ! m.emptyProject();
    PR.rendered = true;
    if(! hasModel){
      console.log('no model');
      PR.enableUpload();
      View.gotoRoute('projects', hasModel);
    }else{
      console.log('exei monterlo');
      PR.disableUpload();
      Tools.init(m);
      View.updateConChart();
      View.gotoRoute('tools', hasModel);
    }
  },
  updateConChart:()=>{
    let m = View.getModel();
    Tools.CC.updateChart(m);
    View.updateRobs();
  },
  updateSelections:()=>{
    View.updateConChart();
  },
  //show / hide Indirect rob selections 
  updateRobs: () => {
    Tools.EV.updateRobs();
  },
  updateConMat:() =>{
    // console.log('con mat changed');
  },
};

module.exports = {
  View : View,
}
