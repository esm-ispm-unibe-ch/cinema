var Model = require('./model.js').Model;
let version = "0.6.0";

Model.init(version);
window.Actions = Model.Actions;
//Need it for passing the model to purescript actions
window.Model = {};
window.Model.state = Model.getState();
window.Model.getState = Model.getState;

window.Model.saveState = Model.saveState;

module.export = () => {
  return Model;
}
