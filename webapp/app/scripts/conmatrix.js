var Messages = require('./messages.js').Messages;
var focusTo = require('./mixins.js').focusTo;
var bindTableResize = require('./mixins.js').bindTableResize;
var json2csv = require('json2csv');
var clone = require('./mixins.js').clone;

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
          name: 'MAModel',
          label:'Fixed',
          value:'fixed',
          isAvailable:true,
          isSelected:true,
        },
        {
          name: 'MAModel',
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
    },
    {
      type: 'checkbox',
      title: 'Interventions:',
      id: 'ints',
      tag: 'ints',
      action: 'setInts',
      selections: []
    },
    {
      type: 'radio',
      title: "Selection rule",
      id: 'rule',
      tag: 'rule',
      action: 'setComps',
      selections: [
        {
          name:'rule',
          label:'Containing',
          value:'every',
          isAvailable:true,
          isSelected:true,
        },
        {
          name:'rule',
          label:'Between',
          value:'between',
          isAvailable:true,
          isSelected:false,
        },
      ],
    },
  ]},
  params:{},
  getParams: () => {
    return CM.model.getCMParams();
  },
  setParams: (k,v) => {
    CM.params[k] = v;
    CM.model.setCMParams(CM.params);
  },
  //ξανγράψιμο να ενημερώνεται από το model τα control.
  setControls: () => {
    let project = CM.model.getProject();
    let type = project.type;
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
    let intvs = _.map(project.model.nodes, pn => {
      return {
        label: pn.name?pn.name:pn.id,
        value: pn.id,
        isAvailable: true,
      };
    });
    if(! _.isEmpty(CM.currentCM)){
      _.map(intvs, intv => {
        if(_.find(CM.currentCM.intvs, cint => {return cint === intv.value})){
          intv.isChecked = true;
        }
      });
    }else{
      _.map(intvs, intv => {
        intv.isChecked = true;
      });
    }
    let intselect = _.first(_.filter(CM.controls, c=> {return c.id ==='ints'}));
    intselect.selections = intvs;
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
    $('#createMatrixButton').bind('click', () => {
      let cmb = $('#createMatrixButton');
      console.log("Downloading Matrix");
      if(cmb.hasClass('disabled')==false){
        CM.checkInputs();
        cmb.addClass('disabled');
        CM.createMatrix();
        $('#conMatControls input').prop('disabled',true);
        $('#conMatControls select').prop('disabled',true);
        $('#conMatControls a.ints').attr('disabled',true);
        $('#conMatControls a.ints').addClass('disabled');
      }
    });
    $('a[action=clearCM]').bind('click', () => {
      let cmb = $('a[action=clearCM]');
      if(cmb.hasClass('disabled')==false){
        console.log('clearing table');
        CM.removeTable();
        cmb.addClass('disabled');
        CM.checkInputs();
      }
    });
    $('a[action=checkAllInt]').bind('click', () => {
      console.log("checking All");
      let lkj = $('#chekcAllInt');
      if(! ($('#checkAllInt').hasClass("disabled"))){
        $('#conMatControls .ints input').prop('checked',true);
      }
      CM.checkInputs();
    });
    $('a[action=uncheckAllInt]').bind('click', () => {
      console.log("Unchecking All");
      if(! ($('#uncheckAllInt').hasClass("disabled"))){
        $('#conMatControls .ints input').prop('checked',false);
      }
      CM.checkInputs();
    });
    $('a[action=cancelCM]').bind('click', () => {
      console.log("Cancelling computing contribution matrix");
      CM.model.cancelCM();
    });
  },
  disableCM: () => {
    $('#conMatControls input').prop('disabled',true);
    $('#conMatControls select').prop('disabled',true);
    $('#conMatControls a.ints').attr('disabled',true);
    $('a[action=makeConMatrix]').attr('disabled',true);
    $('#uncheckAllInt').addClass("disabled");
    $('#checkAllInt').addClass("disabled");
    $('#clearCM').attr('disabled',false);
    $('#clearCM').removeClass('disabled');
  },
  enableCM: () => {
    $('#conMatControls input').prop('disabled',false);
    $('#conMatControls select').prop('disabled',false);
    $('#conMatControls a.ints').attr('disabled',false);
    $('a[action=makeConMatrix]').attr('disabled',false);
    $('#createMatrixButton').removeClass('disabled');
    $('#uncheckAllInt').removeClass("disabled");
    $('#checkAllInt').removeClass("disabled");
  },
  updateCMLoader: ([title,done]) => {
    $("#conMatProgressBar").text(done);
    $("#loaderTitle").html(title);
    $("#conMatProgressBar").attr("aria-valuenow",done);
    $("#conMatProgressBar").attr("style","width:"+done);
  },
  checkInputs: () => {
      let mamodel = $('input[type=radio][name=MAModel]:checked').val();
      let rule = $('input[type=radio][name=rule]:checked').val();
      if( typeof mamodel === 'undefined'){
        CM.disableCM();
      }else{
        CM.enableCM();
        CM.setParams('MAModel', mamodel);
        CM.setParams('sm', $('select[action=setSM]').val());
        CM.setParams('tau', 1);
        let intvs = _.reduce($('div.ints').find('input[type="checkbox"]'),
        (memo, intv) => {
          let out = memo;
          if ($(intv).is(':checked')){
            out = memo.concat([$(intv).val()]);
          }
          return out;
        },[]);
        CM.setParams('intvs', intvs);
        CM.setParams('rule', rule);
        if(intvs.length!==0){
          if((intvs.length<2)){
            if(rule==="between"){
              $('#createMatrixButton').attr('disabled',true);
              $('#createMatrixButton').addClass('disabled');
            }
          }else{
            $('#createMatrixButton').attr('disabled',false);
            $('#createMatrixButton').removeClass('disabled');
          }
        }else{
          $('#createMatrixButton').attr('disabled',true);
          $('#createMatrixButton').addClass('disabled');
        }
      }
  },
  getProject:() =>{
    return CM.model.getProject();
  },
  fetchCM: () => {
    CM.showLoader();
    return new Promise ((resolve,reject) => {
       resolve(CM.model.fetchContributionMatrix());
    })
  },
  showLoader: () => {
    $('#cancelCM').show();
    $('#conMatloader').show();
    $("#conMatProgressBar").attr("style","width:0");
    $("#conMatProgressBar").text("0%");
    $("#conMatProgressBar").attr("aria-valuenow",0);
  },
  removeLoader: (tbl) => {
    $('#cancelCM').hide();
    $('#conMatloader').hide();
    return tbl;
  },
  // cancelCM: () => {
  //   CM.removeLoader();
  //   Messages.alertify().error(Messages.ocpuError+err);
  //       CM.checkInputs();
  // },
  createMatrix: () => {
    let params = (CM.getParams)();
    CM.removeTable();
    CM.fetchCM()
      .then(CM.removeLoader)
      .then(CM.makeDownloader)
      .then(CM.showTable)
      .then(hot => {
        bindTableResize(hot, 'cm-table-container');
      }).catch( err => {
        CM.removeLoader();
        Messages.alertify().error(Messages.ocpuError + err);
        CM.checkInputs();
    });
  },
  makeDownloader: (res) => {
    return new Promise((resolve,reject) => {
      let cm = res;
      let cw = cm.colNames.length;
      cm.sortedStudies = [];
      if(res.directStudies.length !== 0){
        cm.sortedStudies = 
        cm.sortedStudies.concat([Array(cw).fill()])
        .concat(res.directStudies);
      }
      if(res.indirectStudies.length !== 0){
        cm.sortedStudies = 
        cm.sortedStudies.concat([Array(cw).fill()])
        .concat(res.indirectStudies);
      }
      // .concat(cm.impD);
      cm.sortedRowNames = [];
      if(res.directStudies.length !== 0){
        cm.sortedRowNames =
        cm.sortedRowNames.concat(['Mixed estimates'])
        .concat(cm.directRowNames);
      }
      if(res.indirectStudies.length !== 0){
        cm.sortedRowNames =
        cm.sortedRowNames
        .concat(['Indirect estimates'])
        .concat(cm.indirectRowNames);
      }
      // .concat(['','Entire network']);
      let studies = cm.sortedStudies;
      let cols = cm.colNames;
      let rows = cm.sortedRowNames;
      let fcols = [cm.MAModel+" "+cm.sm].concat(cols);
      let fstudies = _.map(_.zip(rows, studies), r=>{
        return [r[0]].concat(r[1]);
      });
      fstudies = _.map(fstudies,st=>{return _.object(fcols,st);});
      let csvTable = json2csv({
        data: fstudies,
        fields: fcols,
      });
      let csvContent = 'data:text/csv;charset=utf-8,'+csvTable;
      var encodedUri = encodeURI(csvContent);
      let cmfilename = (CM.getProject().title+'_'+CM.params.MAModel+"_"+CM.params.sm).replace(/\,/g,'_')+'.csv';
      $('#conMatControls').append('<a class= "btn btn-default" id="downloadAnchorElem">Download csv</a>');
      var dlAnchorElem = document.getElementById('downloadAnchorElem');
      dlAnchorElem.setAttribute('href', encodedUri);
      dlAnchorElem.setAttribute('download', cmfilename);
      console.log("res",res);
      resolve(res);
    });
  },
  showTable: (res) => {
    return new Promise((resolve,reject) => {
      let params = CM.getParams();
      let cm = res;
      let cont = document.getElementById('cm-table');
      let cw = cm.colNames.length;
      //Filter rows
      let numDirects = cm.directStudies.length;
      let numIndirects = cm.indirectStudies.length;
      let studies = [];
      let rowNames = [];
      let mergeCells = [];
      mergeCells = mergeCells.concat({row: 0, col: 0, rowspan: 1, colspan: cw});
      if (numDirects !== 0){
        studies = 
        studies.concat([Array(cw).fill()])
          .concat(cm.directStudies);
        rowNames = rowNames.concat(['Mixed <br> estimates'])
          .concat(cm.directRowNames);
      }
      if(numIndirects!==0){
        studies = studies
          .concat([Array(cw).fill()])
          .concat(cm.indirectStudies);
        rowNames = rowNames
          .concat(['Indirect <br> estimates'])
          .concat(cm.indirectRowNames);
        mergeCells = numDirects===0?mergeCells:mergeCells.concat({row: numDirects+1, col: 0, rowspan: 1, colspan: cw});
      }
      // mergeCells.concat(
      //   {row: numDirects+numIndirects+2, col: 0, rowspan: 1, colspan: cw}
      // );
      // studies = studies.concat(cm.impD);
      // rowNames = rowNames.concat('Entire <br> network');
      let cols = cm.colNames;
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
      let lastRow = rowNames.length;
      var rendered = false;
      //show only 1 decimal in matrix
      let hotStudies = studies.map( r => {
        return r.map( c => {
          let out = '';
          if (isNaN(c) || c===100){
            out = c;
          }else{
            if(c<0.1){
              if(c<0.05){
                out = 0.0;
              }else{
                out = 0.1;
              }
            }else{
              if(c<1){
                out = c.toPrecision(1);
              }else{
                if(c<10){
                  out = c.toPrecision(2);
                }else{
                  out = c.toPrecision(3);
                }
              }
            }
          }
          return out;
        })
      });
      var hot = new Handsontable(cont, {
        data: hotStudies,
        renderAllRows:true,
        renderAllColumns:true,
        rowHeights: 23,
        columnWidth: 200,
        rowHeaders: rowNames,
        colHeaders: true,
        colHeaders: cols,
        mergeCells: mergeCells,
                manualColumnResize: true,
        strechH: 'all',
        rendered: false,
        width: $('#cm-table-container').width(),
        height: $('#cm-table-container').height(),
        afterRender: () => {
          if(rendered===false){
            // focusTo('cm-table');
            CM.disableCM();
            rendered=true;
            // $(`.ht_master tr:nth-child('+numDirects+') > td`).style('horizontal-align','middle');
          }
        },
      });
      hot.updateSettings({
        cells: function (row, col, prop) {
          var cellProperties = {};
          cellProperties.renderer = makeBars;
          cellProperties.readOnly = true;
          // if(row===lastRow-1){
            // cellProperties.className = 'htMiddle h5';
          // }
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
    let project = CM.model.getProject();
    CM.setControls();
    var tmpl = GRADE.templates.conmatrix(CM);
    $('#contMatContainer').html(tmpl);
    CM.bindActions();
    if(! _.isEmpty(project.currentCM)){
      CM.params = clone(project.currentCM);
      console.log("found default cm",CM.params);
      CM.createMatrix();
    }
  }
}

module.exports = () => {
  return CM;
}
