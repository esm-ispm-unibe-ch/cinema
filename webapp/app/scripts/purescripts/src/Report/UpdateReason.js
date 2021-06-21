//module UpdateReason
"use strict";
  
exports.updateReason = function(repidjudgement){
  var repidjdg = repidjudgement.value.split("σδεl");
  var rid =  repidjdg[0];
  var reasonid =  repidjdg[1];
  console.log('jdg',rid,'rid',reasonid);
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
          row.judgement.reasons.map(function(l){
            if( parseInt(l.id) === parseInt(reasonid)){
              if(l.selected){
                l.selected = false;
              }else{
                l.selected = true;
              }
            }
          });
          window.Model.saveState();
          window.Model.persistToLocalStorage();
        };
      };
    };
  };
};
