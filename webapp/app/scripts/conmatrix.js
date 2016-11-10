var Messages = require('./messages.js').Messages;
var View = require('./view.js')();


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
  params: {
    MAModel: '',
    sm: '',
    tau: -1,
  },
  setControls: (type) => {
    CM.controls = CM.defaultControls();
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
        let params = CM.params;
        CM.checkInputs();
        CM.createMatrix(params);
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
        CM.params.MAModel = mamodel;
        CM.params.sm = $('select[action=setSM]').val();
        $('#popoverCM').attr('disabled',false);
        // $('#popoverCM').popover('disable');
      }
  },
  getProject:() =>{
    return CM.project;
  },
  fetchCM: (params) => {
    return new Promise((resolve, reject) => {
      let project = CM.getProject();
      let rtype = '';
      switch(project.type){
        case 'binary':
        rtype = 'netwide_binary';
        break;
        case 'continuous':
        rtype = 'netwide_continuous';
        break;
        case 'iv':
        rtype = 'iv';
        break;
      }
      var req = ocpu.rpc('twobu',{
        json: JSON.stringify(project.model.wide),
        type: rtype,
        model: params.MAModel,
        sm: params.sm,
        }, (output) => {
      resolve(output);
      });
      req.fail( () =>{
        reject('R returned an error: ' + req.responseText);
      });
    });
  },
  createMatrix: (params) => {
    CM.removeTable();
    CM.fetchCM(params)
      .then(CM.showTable)
      .then(hot => {
        View.bindTableResize(hot, 'cm-table-container');
      }).catch( err => {
        Messages.updateInfo(Messages.ocpuError,err);
    });
  },
  showTable: (cm) => {
    return new Promise((resolve,reject) => {
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
            View.focusTo('cm-table');
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
  },
  init: (project) => {
    CM.project = project;
    CM.setControls(project.type);
    var tmpl = GRADE.templates.conmatrix(CM);
    $('#contMatContainer').html(tmpl);
    CM.bindActions();
  }
}

module.exports = () => {
  return CM;
}
