"use strict";

exports.model = window.Model;

exports.setState = function (reportState) {
  window.Model.state.project.report = reportState;
  window.Model.saveState();
}

// exports.setState = function (newState) {
//   window.Model.setState(newState)
// }
