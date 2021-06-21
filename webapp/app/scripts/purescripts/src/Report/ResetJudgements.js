//module ResetJudgements
"use strict";

exports.resetJudgements = function () {
    if (typeof window.Model !== 'undefined'){
      if (typeof window.Model.state !== 'undefined'){
        if (typeof window.Model.state.project !== 'undefined'){
          window.Actions.alertify().confirm('Reset Judgemetns','All will be set to High', function () {
          console.log("reset judgements");
          var report = window.Model.getState().project.report;
          var directs =  report.directRows;
          var indirects =  report.indirectRows;
          var resetRows = function (rows) {
            return rows.map(function (r) {
              var lvs = r.judgement.levels.map(function (l) {
                if (parseInt(l.id) === 0){
                  l.selected = true;
                }else{
                  l.selected = false;
                }
                return l;
              });
              r.judgement.levels = lvs;
              r.judgement.selected = lvs[0];
              var rsns = r.judgement.reasons.map(function (reas){
                reas.selected = false;
                return(reas);
              });
              r.judgement.reasons = rsns;
              return r;})
          }
          resetRows(directs);
          resetRows(indirects);
          window.Model.saveState();
          window.Model.persistToLocalStorage();
          },function () {
            console.log("canceled");
          })
        }
      }
    }
};
