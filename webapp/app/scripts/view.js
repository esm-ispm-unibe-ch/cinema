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
    View.renderProjects(model.emptyProject());
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
  renderProjects: (hasModel) => {
    var projectstmpl = GRADE.templates.projects();
    $('#projects').html(projectstmpl);
    PR.bindControls();
    PR.bindFileUploader();
    PR.rendered = true;
    if(! hasModel){
      PR.disableUpload();
    }
  },
  updateProject:()=>{
    let m = View.getModel();
    let hasModel = ! m.emptyProject();
    if(hasModel){
      Tools.init(m);
      View.renderConChart();
      View.gotoRoute('tools', hasModel);
    }else{
      View.gotoRoute('projects', hasModel);
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
};

module.exports = {
  View : View,
}
