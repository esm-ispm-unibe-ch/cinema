var Messages = require('./messages.js').Messages;

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
    $('#popoverCM').popover({trigger:'hover',container:'body'});
    $('#conMatControls').bind('change', () => {
      CM.checkInputs();
    });
    $('a[action=makeConMatrix]').bind('click', () => {
      let params = CM.params;
      CM.checkInputs();
      CM.createMatrix(params);
    });
    CM.removeTable();
  },
  checkInputs: () =>{
      console.log('checking inputs');
      let mamodel =  $('input[type=radio][name=MAModel]:checked').val();
      if( typeof mamodel === 'undefined'){
        $('#popoverCM').attr('data-content','You must choose model');
      }else{
        CM.params.MAModel = mamodel;
        CM.params.sm = $('select[action=setSM]').val();
        $('#popoverCM').attr('disabled',false);
        $('#popoverCM').popover('disable');
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
        reject("R returned an error: " + req.responseText);
      });
    });
  },
  createMatrix: (params) => {
    CM.removeTable();
    CM.fetchCM(params).then(cm => {
      console.log(cm);
      let cont = document.getElementById('cm-table');
      CM.showTable(cont,cm.percentageContr.concat(cm.impD),cm.colNames,cm.rowNames.concat('Net'));
    }).catch( err => {
      Messages.updateInfo(Messages.ocpuError,err);
    });
  },
  showTable: (cont,studies,cols,rows) => {
    // console.log(data);
    var hot = new Handsontable(cont, {
      data: studies,
      renderAllRows:true,
      rowHeights: 23,
      rowHeaders: rows,
      colHeaders: true,
      colHeaders: cols,
    });
    hot.updateSettings({
     cells: function (row, col, prop) {
       var cellProperties = {};
       cellProperties.readOnly = true;
       return cellProperties;
     }
    });
  },
  removeTable: () => {
    $('#cm-table').empty();
  },
  init: (project) => {
    CM.project = project;
    CM.setControls(project.type);
    var tmpl = GRADE.templates.conmatrix(CM);
    $('#contMatContainer').html(tmpl);
    CM.bindActions();
    $('a[action=makeConMatrix]').click();
  }
}

module.exports = () => {
  return CM;
}
