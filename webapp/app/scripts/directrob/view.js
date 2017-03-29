var deepSeek = require('safe-access');

var View = (model) => {
  let DirectRobModelPosition = 'getState().project.DirectRob';
  let viewers = {
    directComparisons: () => {
      let directs = deepSeek(model,'getState().project.studies.directComparisons');
      let project =  deepSeek(model,'getState().project');
      _.map(directs, dc => {
        dc = _.extend(dc,{ 
          maxrobName : project.robLevels[dc.maxrob-1].label,
          meanrobName : project.robLevels[dc.meanrob-1].label,
          majrobName : project.robLevels[dc.majrob-1].label,
          customized: () => {
            if ((dc.directRob !== 'nothing')&&(dc[viewers.getRule()] !== dc.directRob)){
              return true;
            }else{
              return false;
            }
          },
          robselections: () => {
            let robsels = _.union([{
              id:'nothing',
              label: '--',
              isDisabled: true
            }],model.getState().project.robLevels);
            _.map(robsels, r => {
              if( dc.directRob === r.id){
                r.isActive = true;
              }else{
                r.isActive = false;
              }
            });
            return robsels;
          },
        });
      });
      return directs;
    },
    ruleName: () => {
      return model.getState().text.directRob[viewers.getRule()]; 
    },
    getRule: () => {
      return deepSeek(model, DirectRobModelPosition+'.rule');
    },
    getStatus: () => {
      return deepSeek(model, DirectRobModelPosition+'.status');
    },
    customized: () => {
      return deepSeek(model, DirectRobModelPosition+'.customized')>0;
    },
    customizedSingular: () => {
      return viewers.numberCustomized()===1;
    },
    numberCustomized: () => {
      return deepSeek(model, DirectRobModelPosition+'.customized');
    },
    isReady: () => {
      let isReady = false;
      if (! _.isUndefined(deepSeek(model, DirectRobModelPosition))){
        isReady = true;
      }
      return isReady;
    },
    statusReady: () => {
      return viewers.getStatus() === 'ready';
    },
    isMaj: () => {return viewers.getRule() === 'majrob'},
    isMean: () => {return viewers.getRule() === 'meanrob'},
    isMax: () => {return viewers.getRule() === 'maxrob'},
    rulesselections: () => {
      return [
        {
          label: model.getState().text.directRob.norob, 
          value: 'norob',
          isActive: viewers.getStatus() === 'norob',
          isAvailable: viewers.getStatus() === 'norob',
          isDisabled: true
        },
        {
          label: model.getState().text.directRob.majrob, 
          value: 'majrob',
          isActive: viewers.getRule() === 'majrob',
          isAvailable: true
        },
        {
          label: model.getState().text.directRob.meanrob, 
          value: 'meanrob',
          isActive: viewers.getRule() === 'meanrob',
          isAvailable: true
        },
        {
          label: model.getState().text.directRob.maxrob, 
          value: 'maxrob',
          isActive: viewers.getRule() === 'maxrob',
          isAvailable: true
        },
        {
          label: model.getState().text.directRob.customrob, 
          value: 'customrob',
          isAvailable: viewers.getStatus() === 'customized',
          isActive: viewers.getStatus() === 'customized'
        }
      ];
    }
  }
  return viewers;
}

module.exports = () => {
  return View;
}
