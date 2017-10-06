var deepSeek = require('safe-access');
var ComparisonModel = require('../../purescripts/output/ComparisonModel');

var View = (model) => {
  let DirectIndrModelPosition = 'getState().project.indirectness';
  let viewers = {
    getState: () => {
      return deepSeek(model,'getState().project.indirectness');
    },
    directComparisons: () => {
      let directs = deepSeek(model,'getState().project.studies.directComparisons');
      let project =  deepSeek(model,'getState().project');
      console.log("project",project);
      _.map(directs, dc => {
        dc = _.extend(dc,{
          maxindrName: viewers.getState().levels[dc.maxindr-1].label,
          meanindrName: viewers.getState().levels[dc.meanindr-1].label,
          majindrName: viewers.getState().levels[dc.meanindr-1].label,
          color: () => {
            let level = _.find(model.getState().defaults.indrLevels,
              indr => {
                return indr.id === dc.directIndr;
            });
            let out = "";
            if(typeof level !== 'undefined'){
              out = level.color;
            }
            return out;
          },
          customized: () => {
            if ((dc.directIndr !== 'nothing')&&(dc[viewers.getRule()] !== dc.directIndr)){
              return true;
            }else{
              return false;
            }
          },
          indrselections: () => {
            let indrsels = _.union([{
              id:'nothing',
              label: '--',
              isDisabled: true
            }],model.getState().project.indrLevels);
            _.map(indrsels, r => {
              if( dc.directIndr === r.id){
                r.isActive = true;
              }else{
                r.isActive = false;
              }
            });
            return indrsels;
          },
        });
        dc.niceid = ComparisonModel.fixComparisonId(dc.id.replace(",",":"));
      });
      let sids = _.map(directs, dir => {
        return (dir.t1+":"+dir.t2);
      });
      return directs;
    },
    ruleName: () => {
      return model.getState().text.directIndr[viewers.getRule()]; 
    },
    getRule: () => {
      return deepSeek(model, DirectIndrModelPosition+'.rule');
    },
    getStatus: () => {
      return deepSeek(model, DirectIndrModelPosition+'.status');
    },
    customized: () => {
      return deepSeek(model, DirectIndrModelPosition+'.customized')>0;
    },
    customizedSingular: () => {
      return viewers.numberCustomized()===1;
    },
    numberCustomized: () => {
      return deepSeek(model, DirectIndrModelPosition+'.customized');
    },
    isReady: () => {
      let isReady = false;
      if (deepSeek(model, 'getState().project.CM.currentCM.status')==='ready'){
        isReady = true;
      }
      return isReady;
    },
    statusReady: () => {
      return viewers.getStatus() === 'ready';
    },
    isMaj: () => {return viewers.getRule() === 'majindr'},
    isMean: () => {return viewers.getRule() === 'meanindr'},
    isMax: () => {return viewers.getRule() === 'maxindr'},
    rulesselections: () => {
      return [
        {
          label: model.getState().text.directIndr.noindr, 
          value: 'noindr',
          isActive: viewers.getStatus() === 'noindr',
          isAvailable: viewers.getStatus() === 'noindr',
          isDisabled: true
        },
        {
          label: model.getState().text.directIndr.majindr, 
          value: 'majindr',
          isActive: viewers.getRule() === 'majindr',
          isAvailable: true
        },
        {
          label: model.getState().text.directIndr.meanindr, 
          value: 'meanindr',
          isActive: viewers.getRule() === 'meanindr',
          isAvailable: true
        },
        {
          label: model.getState().text.directIndr.maxindr, 
          value: 'maxindr',
          isActive: viewers.getRule() === 'maxindr',
          isAvailable: true
        },
        {
          label: model.getState().text.directIndr.customindr, 
          value: 'customindr',
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
