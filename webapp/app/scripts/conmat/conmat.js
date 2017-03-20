var deepSeek = require('safe-access');
var h = require('virtual-dom/h');
var VNode = require('virtual-dom/vnode/vnode');
var VText = require('virtual-dom/vnode/vtext');
var convertHTML = require('html-to-vdom')({
     VNode: VNode,
     VText: VText
});
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
            })),'param');
            let newparams = _.groupBy(_.toArray(params),'param');
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
      model.Actions.ConMat = CM.update;
      _.mapObject(CM.actions, (f,n) => {f();});
    },
  },
  //has to be incorporated to update module rewrite netplot nad project
  update: {
    updateState: () => {
      console.log('updatingState in conmat');
      if ( typeof CM.model.getState().project.CM === 'undefined'){
        Update(CM.model).setState({
          contributionMatrices: [],
          currentCM: {
            params: {
              MAModel: {},
              sm: {},
              intvs: [],
              rule: {}
            },
            status: 'empty',
          },
        });
      }else{
        Update(CM.model).updateChildren();
      }
    },
  },
  render: (model) => {
    if(View(model).isReady()){
      var tmpl = GRADE.templates.conmatrix(View(model));
      return h('div#contMatContainer.col-xs-12',convertHTML(tmpl));
    }else{
      console.log('conMat not ready');
    }
  },
  afterRender: () => {
    console.log('after render conmat');
  },
  children: [
  ],
}

module.exports = () => {
  return CM;
}
