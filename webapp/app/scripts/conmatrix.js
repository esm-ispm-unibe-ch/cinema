var Messages = require('./messages.js').Messages;
var focusTo = require('./mixins.js').focusTo;
var bindTableResize = require('./mixins.js').bindTableResize;
var json2csv = require('json2csv');

var CM = {
  defaultControls: () => { return [
    {
      type: 'radio',
      title: 'Model:',
      id: 'MAModel',
      tag: 'MAModel',
      action: 'setMAModel',
      selections: [
        {
          label:'Fixed',
          value:'fixed',
          isAvailable:true,
          isSelected:true,
        },
        {
          label:'Random',
          value:'random',
          isAvailable:true,
          selections: [{
            type: 'input',
            label:'τ',
            value:'tau',
            isAvailable:true,
          }]
        }
      ]
    },
    {
      type: 'select',
      title: 'Effect measure:',
      id: 'sm',
      tag: 'sm',
      action: 'setSM',
      selections: [
        {
          label:'OR',
          value:'OR',
          validTypes:['binary','iv'],
        },
        {
          label:'RR',
          value:'RR',
          validTypes:['binary','iv'],
        },
        {
          label:'RD',
          value:'RD',
          validTypes:['binary','iv'],
        },
        {
          label:'ASD',
          value:'ASD',
          validTypes:['binary','iv'],
        },
        {
          label:'MD',
          value:'MD',
          validTypes:['continuous','iv'],
        },
        {
          label:'SMD',
          value:'SMD',
          validTypes:['continuous','iv'],
        },
      ]
    }
  ]},
  params:{},
  getParams: () => {
    return CM.params;
  },
  setParams: (k,v) => {
    CM.params[k] = v;
  },
  setControls: () => {
    let type = CM.model.getProject().type;
    CM.controls = CM.defaultControls();
    CM.currentCM = CM.model.getProject().currentCM;
    if(! _.isEmpty(CM.currentCM)){
      _.map(CM.controls, cn => {
        _.map(cn.selections, s => {
          if(CM.currentCM[cn.id]===s.value){
            s.isSelected = true;
          }else{
            s.isSelected = false;
          }
        })
      });
    }
    _.map(CM.controls[1].selections, c => {
      if(_.find(c.validTypes, t => {return t===type;})){
        c.isAvailable = true;
      }
    });
  },
  bindActions: () => {
    $('input[type=radio][name=MAModel]').bind('change', () =>{
      let val = $('input[type=radio][name=MAModel]:checked').val();
      if(val==='fixed'){
        $('input[name="tau"]').attr('disabled', true);
      }else{
        $('input[name="tau"]').attr('disabled', false);
      }
    });
    // $('#popoverCM').popover({trigger:'hover',container:'body'});
    $('#conMatControls').bind('change', () => {
      CM.checkInputs();
    });
    $('a[action=makeConMatrix]').bind('click', () => {
      if(!($('a[action=makeConMatrix]').attr('disabled'))){
        CM.checkInputs();
        CM.createMatrix();
      }
    });
    $('a[action=clearCM]').bind('click', () => {
      CM.removeTable();
      CM.checkInputs();
    });
  },
  disableCM: () => {
    $('#conMatControls input').prop('disabled',true);
    $('#conMatControls select').prop('disabled',true);
    $('a[action=makeConMatrix]').attr('disabled',true);
    $('#clearCM').attr('disabled',false);
  },
  enableCM: () => {
    $('#conMatControls input').prop('disabled',false);
    $('#conMatControls select').prop('disabled',false);
    $('a[action=makeConMatrix]').attr('disabled',false);
  },
  checkInputs: () => {
      let mamodel =  $('input[type=radio][name=MAModel]:checked').val();
      if( typeof mamodel === 'undefined'){
        // $('#popoverCM').attr('data-content','You must choose model');
        CM.disableCM();
      }else{
        CM.enableCM();
        CM.setParams('MAModel', mamodel);
        CM.setParams('sm', $('select[action=setSM]').val());
        CM.setParams('tau', 1);
        $('#popoverCM').attr('disabled',false);
      }
  },
  getProject:() =>{
    return CM.project;
  },
  fetchCM: (params) => {
    return CM.model.fetchContributionMatrix(params);
  },
  createMatrix: () => {
    let params = (CM.getParams)();
    CM.removeTable();
    CM.fetchCM([params.MAModel,params.sm,params.tau])
      .then(CM.makeDownloader)
      .then(CM.showTable)
      .then(hot => {
        bindTableResize(hot, 'cm-table-container');
      }).catch( err => {
        Messages.updateInfo(Messages.ocpuError,err);
    });
  },
  makeDownloader: (res) => {
    return new Promise((resolve,reject) => {
      let cm = res.matrix;
      let studies = cm.percentageContr.concat(cm.impD);
      let cols = cm.colNames;
      let rows = cm.rowNames.concat('Entire <br> Network');
      let fcols = ["comparison"].concat(cols);
      let fstudies = _.map(_.zip(cm.rowNames.concat('Entire Network'),studies), r=>{
        return [r[0]].concat(r[1]);
      });
      fstudies = _.map(fstudies,st=>{return _.object(fcols,st);});
      let csvTable = json2csv({
        data: fstudies,
        fields: fcols,
      });
      let csvContent = "data:text/csv;charset=utf-8,"+csvTable;
      var encodedUri = encodeURI(csvContent);
      let cmfilename = CM.project.title+"_"+_.pairs(_.omit(CM.params,['matrix','tau','isDefault'])).toString().replace(/\,/g,"_")+".csv";
      $('#conMatControls').append('<a class= "btn btn-default" id="downloadAnchorElem">Download csv</a>');
      var dlAnchorElem = document.getElementById('downloadAnchorElem');
      dlAnchorElem.setAttribute("href", encodedUri);
      dlAnchorElem.setAttribute("download", cmfilename);
      resolve(res);
    });
  },
  showTable: (res) => {
    return new Promise((resolve,reject) => {
      let cm = res.matrix;
      let cont = document.getElementById('cm-table');
      let studies = cm.percentageContr.concat(cm.impD);
      let cols = cm.colNames;
      let rows = cm.rowNames.concat('Entire <br> Network');
      var setBackground = (percentage) => {
        return `
          linear-gradient(
          to right,
          rgba(238,238,238,0.83) `+percentage+`%,
          white `+percentage+`%
        )`;
      };
      function makeBars(instance, td, row, col, prop, value, cellProperties) { Handsontable.renderers.TextRenderer.apply(this, arguments);
        td.style.background = setBackground(value);
      };
      let lastRow = rows.length;
      var rendered = false;
      var hot = new Handsontable(cont, {
        data: studies,
        renderAllRows:true,
        renderAllColumns:true,
        rowHeights: 23,
        columnWidth: 200,
        rowHeaders: rows,
        colHeaders: true,
        colHeaders: cols,
        manualColumnResize: true,
        strechH: 'all',
        rendered: false,
        width: $('#cm-table-container').width(),
        height: $('#cm-table-container').height(),
        afterRender: () => {
          if(rendered===false){
            focusTo('cm-table');
            CM.disableCM();
            rendered=true;
          }
        },
      });
      hot.updateSettings({
        cells: function (row, col, prop) {
          var cellProperties = {};
          cellProperties.renderer = makeBars;
          cellProperties.readOnly = true;
          if(row===lastRow-1){
            cellProperties.className = 'htMiddle h5';
          }
          return cellProperties;
        }
      });
      resolve(hot);
    });
  },
  removeTable: () => {
    $('#cm-table').empty();
    $('#clearCM').attr('disabled',true);
    $('#downloadAnchorElem').remove();
    CM.model.clearCurrentCM();
  },
  init: (model) => {
    CM.model = model;
    CM.project = CM.model.project;
    CM.setControls();
    var tmpl = GRADE.templates.conmatrix(CM);
    $('#contMatContainer').html(tmpl);
    CM.bindActions();
    if(! _.isEmpty(CM.project.currentCM)){
      CM.params = CM.project.currentCM;
      CM.createMatrix();
    }
  }
}

module.exports = () => {
  return CM;
}
