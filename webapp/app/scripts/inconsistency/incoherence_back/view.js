var deepSeek = require('safe-access');

var View = (model) => {
  let modelPosition = "project.Inconsistency.Incoherence";
  let viewers = {
    isReady: () => {
      let isReady = false;
      if (! _.isUndefined(deepSeek(model.getState(), modelPosition))){
        isReady = true;
      }
      return isReady;
    },
  }
  return viewers;
}

module.exports = () => {
  return View;
}
