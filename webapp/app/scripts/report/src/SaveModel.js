"use strict";

exports.saveState = function (reportState) {
  return function () {
    if (typeof window.Model !== 'undefined'){
      if (typeof window.Model.state !== 'undefined'){
        if (typeof window.Model.state.project !== 'undefined'){
          console.log("savEing from Report", reportState);
          window.Model.state.project.report = reportState;
          window.Model.saveState();
        }
      }
    }
  }
}
