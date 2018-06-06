//module UpdateHeterogeneity
"use strict";

exports.updateClinImpChildren = function () {
  if (typeof Actions !== 'undefined'){
    if (typeof Actions.Heterogeneity !== 'undefined'){
      Actions.Heterogeneity.updateState();
      if (typeof Actions.Imprecision !== 'undefined'){
        Actions.Imprecision.updateState();
      }
    }
  }
};
