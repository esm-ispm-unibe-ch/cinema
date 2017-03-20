var Messages = require('../messages.js').Messages;
var focusTo = require('../mixins.js').focusTo;
var bindTableResize = require('../mixins.js').bindTableResize;
var json2csv = require('json2csv');
var clone = require('../mixins.js').clone;
var View = require('./view.js')();
var Update = require('./update.js')();

var CM = {
  actions: {
    selectParams: () => {
      $(document).on('change','.conMatControls', {} ,
          e=>{
            let params = $('.conMatControls input:checked').map(
              function() {return {
              param:$(this).attr('data-param'),
              value:$(this).attr('data-value')
              };
            });
            let sels = _.groupBy(_.toArray(
              $('.conMatControls option:checked').map(
                function() {return {
                param:$(this).attr('data-param'),
                value:$(this).attr('data-value')
                };
            })),"param");
            let newparams = _.groupBy(_.toArray(params),"param");
            newparams = _.extend(newparams,sels);
            newparams = _.mapObject(newparams, (v,k) => {
              let vals = _.map(v, vv => {return vv.value});
              if(k!=='intvs'){
                vals = _.first(vals);
              }
              return vals;
            });
            Update(CM.model).selectParams(newparams);
      });
    },
    selectAllInts: () => {
      $(document).on('click','#checkAllIntvs', {} ,
        e=>{
          Update(CM.model).checkAllIntvs();
      });
      $(document).on('click','#uncheckAllIntvs', {} ,
        e=>{
          Update(CM.model).uncheckAllIntvs();
      });
    },
    createMatrix: () => {
      $(document).on('click','createMatrixButton', {} ,
        e=>{
          Update(CM.model).createMatrix();
      });
    },
  },
  //has to be incorporated to view module
  view: {
    register: (model) => {
      CM.model = model;
      _.mapObject(CM.actions, (f,n) => {f();});
    },
  },
  //has to be incorporated to update module rewrite netplot nad project
  update: {
    updateState: () => {
      if ( typeof CM.model.getState().project.CM === 'undefined'){
        CM.model.getState().project.CM = {
          currentCM: {
            params: {
            },
            status: "empty",
          },
          contributionMatrices: [],
        }
      }
      Update(CM.model).saveState();
    },
  },
  render: (model) => {
    if(View(model).isReady()){
      console.log("going to render model",model);
      var tmpl = GRADE.templates.conmatrix(View(model));
      $('#contMatContainer').html(tmpl);
    }
  },
}

module.exports = () => {
  return CM;
}
