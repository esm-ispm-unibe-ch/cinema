//module UpdateHeterogeneity
"use strict";

exports.updateClinImpChildren = function () {
  if (typeof Actions !== 'undefined'){
    if (typeof Actions.Heterogeneity !== 'undefined'){
      Actions.Imprecision.updateState();
      Actions.Heterogeneity.updateState();
    }
  }
};
