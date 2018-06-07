var deepSeek = require('safe-access');
var clone = require('../../lib/mixins.js').clone;
var fixid = require('../../lib/mixins.js').hatmatrixIdOfComparison;

var View = (model) => {
  let NetIndrModelPosition = 'getState().project.indirectness.netindr';
  let viewers = {
    makeBoxes: (comparisons) => {
      let project =  deepSeek(model,'getState().project');
      let boxes = _.map(comparisons, dc => {
        dc.id = fixid(clone(dc.id));
        dc.color = (() => {
          let color = '';
          let level = _.find(viewers.getState().levels, l => {return l.id === dc.judgement});
          if (typeof level !== 'undefined'){
            color = level.color;
          }
          return color;
        })(),
        _.map(dc.rules, r => {
          r.label = model.getState().text.NetIndr.levels[r.value - 1]; 
          return r.isActive = viewers.getRule()===r.id;
        });
        let rulevalue = deepSeek(_.find(dc.rules, r => {return r.id === viewers.getRule()}),'value');
        return _.extend(dc,{ 
          judgements: () => {
            let lims = _.union([{
              id:'nothing',
              label: '--',
              isDisabled: true
            }], model.getState().project.indirectness.netindr.levels);
            _.map(lims, r => {
              r.label = model.getState().text.NetIndr.levels[r.id - 1]; 
              if(parseInt(dc.judgement) === parseInt(r.id)){
                r.isActive = true;
              }else{
                r.isActive = false;
              }
            });
            return lims;
          },
        });
      });
      return boxes;
    },
    boxs: () => {
      let out = viewers.makeBoxes(viewers.getState().boxes);
      return out;
    },
    indirect: () => {
      return viewers.makeBoxes(viewers.getState().indirect);
    },
    ruleName: () => {
      return model.getState().text.NetIndr.rules[viewers.getRule()]; 
    },
    getState: () => {
      return deepSeek(model, NetIndrModelPosition);
    },
    getRule: () => {
      return deepSeek(model, NetIndrModelPosition+'.rule');
    },
    getStatus: () => {
      return deepSeek(model, NetIndrModelPosition+'.status');
    },
    customized: () => {
      return deepSeek(model, NetIndrModelPosition+'.customized')>0;
    },
    customizedSingular: () => {
      return viewers.numberCustomized()===1;
    },
    numberCustomized: () => {
      return deepSeek(model, NetIndrModelPosition+'.customized');
    },
    dindrReady: () => {
      let isready = false;
      if (typeof deepSeek(model,'getState().project.CM.currentCM.studycontributions')!=='undefined'){
        isready = true;
      }
      return isready;
    },
    isReady: () => {
      let isready = false;
      let  NetIndrState = deepSeek(model,'getState().project.indirectness.netindr');
      if (viewers.dindrReady() && (typeof NetIndrState !== 'undefined')){
        isready = true;
      }
      return isready;
    },
    statusReady: () => {
      return viewers.getStatus() === 'ready';
    },
    rulesselections: () => {
      return [
        {
          label: model.getState().text.NetIndr.rules.noRule, 
          value: 'noRule',
          isActive: viewers.getStatus() === 'noRule',
          isAvailable: viewers.getStatus() === 'noRule',
          isDisabled: true
        },
        {
          label: model.getState().text.NetIndr.rules.majRule, 
          value: 'majRule',
          isActive: viewers.getRule() === 'majRule',
          isAvailable: true
        },
        {
          label: model.getState().text.NetIndr.rules.meanRule, 
          value: 'meanRule',
          isActive: viewers.getRule() === 'meanRule',
          isAvailable: true
        },
        {
          label: model.getState().text.NetIndr.rules.maxRule, 
          value: 'maxRule',
          isActive: viewers.getRule() === 'maxRule',
          isAvailable: true
        },
      ];
    }
  }
  return viewers;
}

module.exports = () => {
  return View;
}
