//module UpdateJudgement
"use strict";
  
exports.updateJudgement = function(repidjudgement){
  var repidjdg = repidjudgement.value.split("σδεl");
  var jdg =  repidjdg[0];
  var rid =  repidjdg[1];
  return function() {
    if (typeof window.Model !== 'undefined'){
      if (typeof window.Model.state !== 'undefined'){
        if (typeof window.Model.state.project !== 'undefined'){
          var report = window.Model.getState().project.report;
          var directs =  report.directRows;
          var row = directs.find(function(x) {
              return x.id === rid;
            });
          if (typeof row !== "undefined"){
          } else {
          var indirects =  report.indirectRows;
            row = indirects.find(function(x) {
              return x.id === rid;
            });
          }
          row.judgement.levels.map(function(l){
            if( parseInt(l.id) === parseInt(jdg)){
              l.selected = true;
            }else{
              l.selected = false;
            }
          });
          var level = row.judgement.levels.find(function(l){
            return parseInt(l.id) === parseInt(jdg);
          });
          row.judgement.selected = level;
          window.Model.saveState();
          window.Model.persistToLocalStorage();
        };
      };
    };
  };
};
