var Router = require('./router.js').Router;
var Messages = require('./messages.js').Messages;
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
  render: (model) => {
    return new Promise((resolve, reject) => {
      Router.render(model).then(out => {
        resolve (out);
      }).catch(err => {reject(err)});
    });
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
  cancelCM: () => {
    Tools.CM.cancelCM();
  },
  updateCMLoader: (done) => {
    Tools.CM.updateCMLoader(done);
  },
};

module.exports = {
  View : View,
}
