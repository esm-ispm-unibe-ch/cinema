var deepSeek = require('safe-access');

var View = (model) => {
  let NetRobModelPosition = 'getState().project.netRob.studyLimitations';
  let viewers = {
    makeBoxes: (comparisons) => {
      let project =  deepSeek(model,'getState().project');
      let boxes = _.map(comparisons, dc => {
        dc.color = (() => {
          let color = '';
          let level = _.find(model.getState().project.studyLimitationLevels, l => {return l.id === dc.judgement});
          if (typeof level !== 'undefined'){
            color = level.color;
          }
          return color;
        })(),
        _.map(dc.rules, r => {
          return r.isActive = viewers.getRule()===r.id;
        });
        let rulevalue = deepSeek(_.find(dc.rules, r => {return r.id === viewers.getRule()}),'value');
        return _.extend(dc,{ 
          customized: () => {
            if ((dc.judgement !== 'nothing')&&(rulevalue !== dc.judgement)){
              return true;
            }else{
              return false;
            }
          },
          judgements: () => {
            let lims = _.union([{
              id:'nothing',
              label: '--',
              isDisabled: true
            }], model.getState().project.studyLimitationLevels);
            _.map(lims, r => {
              if( dc.judgement === r.id){
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
    boxes: () => {
      return viewers.makeBoxes(viewers.getState().boxes);
    },
    indirect: () => {
      return viewers.makeBoxes(viewers.getState().indirect);
    },
    ruleName: () => {
      return model.getState().text.NetRob.rules[viewers.getRule()]; 
    },
    getState: () => {
      return deepSeek(model, NetRobModelPosition);
    },
    getRule: () => {
      return deepSeek(model, NetRobModelPosition+'.rule');
    },
    getStatus: () => {
      return deepSeek(model, NetRobModelPosition+'.status');
    },
    customized: () => {
      return deepSeek(model, NetRobModelPosition+'.customized')>0;
    },
    customizedSingular: () => {
      return viewers.numberCustomized()===1;
    },
    numberCustomized: () => {
      return deepSeek(model, NetRobModelPosition+'.customized');
    },
    drobReady: () => {
      let isready = false;
      if (deepSeek(model,'getState().project.DirectRob.status')==='ready'){
        isready = true;
      }
      return isready;
    },
    isReady: () => {
      let isready = false;
      let  NetRobState = deepSeek(model,'getState().project.netRob.studyLimitations');
      if (viewers.drobReady() && (typeof NetRobState !== 'undefined')){
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
          label: model.getState().text.NetRob.rules.noRule, 
          value: 'noRule',
          isActive: viewers.getStatus() === 'noRule',
          isAvailable: viewers.getStatus() === 'noRule',
          isDisabled: true
        },
        {
          label: model.getState().text.NetRob.rules.majRule, 
          value: 'majRule',
          isActive: viewers.getRule() === 'majRule',
          isAvailable: true
        },
        {
          label: model.getState().text.NetRob.rules.meanRule, 
          value: 'meanRule',
          isActive: viewers.getRule() === 'meanRule',
          isAvailable: true
        },
        {
          label: model.getState().text.NetRob.rules.maxRule, 
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
