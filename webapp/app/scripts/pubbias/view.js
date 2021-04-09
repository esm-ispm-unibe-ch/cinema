var deepSeek = require('safe-access');
var clone = require('../lib/mixins.js').clone;

var View = (model) => {
  let modelPosition = 'getState().project.pubbias';
  let viewers = {
    isReady: () => {
      let isReady = false;
      if (! _.isUndefined(deepSeek(model, modelPosition))){
        isReady = true;
      }
      return isReady;
    },
    boxes: () => {
      let vboxes = clone(viewers.getState().boxes);
      return _.map(vboxes, box => {
        box.color = deepSeek (_.find(box.levels, l => {return l.id === box.judgement}),'color');
        box.levels = _.map(box.levels, l => {
            let isActive = parseInt(l.id) === parseInt(box.judgement);
            l.label = model.getState().text.Pubbias.levels[l.id-1];
            l.isActive = isActive;
            return l;
          });
        box.judgementlabel = _.find(box.levels, l=>{return(l.isActive === true)});
        return box;
      });
    },
    getState: () => {
      return deepSeek(model, modelPosition);
    },
    pubbiasReady: () => {
      return viewers.getState().status === 'ready';
    },
    hasUploaded: () => {
      return viewers.getState().hasUploaded === 'true';
    },
    hasNotUploaded: () => {
      return viewers.getState().hasUploaded !== 'true';
    },
  }
  return viewers;
}

module.exports = () => {
  return View;
}
