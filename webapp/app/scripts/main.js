var Model = require('./model.js').Model;

Model.init();
window.Actions = Model.Actions;

module.export = () => {
  return Model;
}
