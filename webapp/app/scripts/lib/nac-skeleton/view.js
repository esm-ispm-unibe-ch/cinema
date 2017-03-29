var deepSeek = require('safe-access');

var View = (model) => {
  let NACModelPosition = 'nac model position';
  let viewers = {
    isReady: () => {
      let isReady = false;
      if (! _.isUndefined(deepSeek(model, NACModelPosition))){
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
