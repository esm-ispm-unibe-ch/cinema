//module DownloadJudgements
"use strict";


exports.downloadJudgements = function () {
  if (typeof window.Model !== 'undefined'){
    if (typeof window.Model.state !== 'undefined'){
      if (typeof window.Model.state.project !== 'undefined'){
        const json2csv = window.Actions.json2csv;
        const download = window.Actions.download;
        var project = window.Model.getState().project;
        var cm = window.Model.getState().project.CM.currentCM;
        var fields = 
          ["Comparison"
          , "Number of studies"
          , "Within-study bias"
          , "Reporting bias"
          , "Indirectness"
          , "Imprecision"
          , "Heterogeneity"
          , "Incoherence"
          , "Confidence rating"
          , "Reason(s) for downgrading"
          ]
        var report = project.report;
        var directs =  report.directRows;
        var indirects =  report.indirectRows;
        var rownames = project.CM.currentCM.hatmatrix.rowNames;
        var parseRow = function (row) {
        var rid = rownames.find(function(n){
          var t1 = n.split(":")[0].toString();
          var t2 = n.split(":")[1].toString();
          var armA = row.armA.toString();
          var armB = row.armB.toString();
          return (armA===t1 && armB===t2) || (armA===t2 && armB===t1)
        });
        var reasons = row.judgement.reasons.filter(function(reas){return(reas.selected)}).map(function(r){return(r.label)});
        var out = {};
          out[fields[0]] = rid; 
          out[fields[1]] = row.numberOfStudies;
          out[fields[2]] = row.studyLimitation.label;
          out[fields[3]] = row.pubbias.label
          out[fields[4]] = row.indirectness.label;
          out[fields[5]] = row.imprecision.label;
          out[fields[6]] = row.heterogeneity.label;
          out[fields[7]] = row.incoherence.label;
          out[fields[8]] = row.judgement.selected.label;
          out[fields[9]] = reasons;
          return out;
        }
        report = [].concat(directs.map(function(r){return parseRow(r)})
                          ,indirects.map(function(r){return parseRow(r)}));
        var csvTable = json2csv.parse(report, {fields: fields});
        var csvContent = 'data:text/csv;charset=utf-8,'+csvTable;
        var encodedUri = encodeURI(csvContent);
        var filename = (project.title+'_'+cm.params.MAModel+'_'+cm.params.sm+"_Report").replace(/\,/g,'_')+'.csv';
        download(encodedUri,filename);
      }
    }
  }
};
