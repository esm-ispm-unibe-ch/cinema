var deepSeek = require('safe-access');
var clone = require('../lib/mixins.js').clone;

var View = (model) => {
  let modelPosition = 'project.imprecision';
  let viewers = {
    isReady: () => {
      let isReady = false;
      if (! _.isUndefined(deepSeek(model.getState(), modelPosition))){
        isReady = true;
      }
      return isReady;
    },
    getMeasureType: () => {
      let mdl = model.getState();
      let mt = deepSeek(mdl,'project.type');
      let result = "nothing";
      if (typeof mt === 'undefined'){
        result = "nothing";
      }else{
        switch(mt) {
          case "binary":
              result = "binary";
              break;
          case "continuous":
              result = "continuous";
              break;
        } 
      }
      return result;
    },
    interventionTypes: () => {
      let prs = viewers.availableParameters()[1];
      return prs;
    },
    customized: () => {
      return viewers.numberCustomized() > 0;
    },
    customizedSingular: () => {
      return viewers.numberCustomized() === 1;
    },
    numberCustomized: () => {
      let vboxes = clone(viewers.getState().boxes);
      let result = _.size(_.filter(vboxes, box => {
          return box.judgement !== box.ruleLevel;
        })
      );
      return result;
    },
    boxes: () => {
      let vboxes = clone(viewers.getState().boxes);
      return _.map(vboxes, box => {
        box.customized = box.judgement !== box.ruleLevel;
        box.color = deepSeek (_.find(box.levels, l => {return l.id === box.judgement}),'color');
        box.levels = _.map(box.levels, l => {
            let isActive = parseInt(l.id) === parseInt(box.judgement);
            l.label = model.getState().text.Imprecision.levels[l.id-1];
            l.isActive = isActive;
            return l;
          });
        box.crossestext = model.getState().text.Imprecision.nullText[box.crosses];
        return box;
      });
    },
    clinImp: () => {
      return model.getState().project.clinImp.baseValue;
    },
    clinImpLow: () => {
      return model.getState().project.clinImp.lowerBound.toFixed(3);
    },
    clinImpHigh: () => {
      return model.getState().project.clinImp.upperBound.toFixed(3);
    },
    clinImpReady: () => {
      return model.getState().project.clinImp.status === "ready";
    },
    emType: () => {
      return model.getState().project.clinImp.emtype;
    },
    getState: () => {
      return deepSeek(model.getState(), modelPosition);
    },
    imprecisionReady: () => {
      return viewers.getState().status === 'ready';
    },
    smtitle: () => {
      let sm = model.getState().project.CM.currentCM.params.sm;
      let outtext = {
        OR: "Odds ratio",
        RR: "Risk ratio",
        RD: "Risk difference",
        MD: "Mean difference",
        SMD: "Standardised mean difference"
      };
      return outtext[sm];
    }
  }
  return viewers;
}

module.exports = () => {
  return View;
}
