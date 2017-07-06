"use strict";

exports.updateHeter = function () {
  if (typeof Actions !== 'undefined'){
    if (typeof Actions.Heterogeneity !== 'undefined'){
      Actions.Heterogeneity.updateState();
    }
  }
}
