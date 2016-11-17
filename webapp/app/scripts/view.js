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
      View.renderConChart();
      View.gotoRoute('tools', hasModel);
    }
  },
  renderConChart:() =>{
    let m = View.getModel();
    Tools.CC.model = m;
    View.updateConChart();
    Tools.CC.bindActions();
  },
  updateConChart:()=>{
    let m = View.getModel();
    var tmpl = GRADE.templates.conchart(Tools.CC);
    $('#conChart').html(tmpl);
  },
  updateSelections:()=>{
    View.updateConChart();
  },
  updateConMat:() =>{
    console.log('con mat changed');
  },
};

module.exports = {
  View : View,
}
