var deepSeek = require('safe-access');
var clone = require('../../lib/mixins.js').clone;
var uniqId = require('../../lib/mixins.js').uniqId;
var Messages = require('../../messages.js').Messages;

var children = [
  ];

var Update = (model) => {
  //update functions will only change state in that node of the model DAG
  let modelPosition = 'project.Inconsistency.Incoherence';
  let IncoherenceLevels = [
    { id: 1,
      color: '#7CC9AE'
    },
    { id: 2,
      color: '#FBBC05'
    },
    { id: 3,
      color: '#E0685C'
  }];
  let updaters = {
    getState: () => {
      return deepSeek(model.getState(),modelPosition);
    },
    cmReady: () => {
      let isready = false;
      if (deepSeek(model,'getState().project.CM.currentCM.status')==='ready'){
        isready = true;
        // console.log('contribution matrix ready');
      }
      return isready;
    },
    statusReady: () => {
      return  (updaters.getState().status === 'ready');
    },
    updateState: (model) => {
      if (updaters.cmReady()){
        _.map(children, c => { c.update.updateState();});
        updaters.setState(updaters.skeletonModel());
      }else{
        model.getState().project.Inconsistency.Incoherence = {};
        updaters.setState(updaters.skeletonModel());
      }
    },
    setState: (newState) => {
      model.getState().project.Inconsistency.Incoherence = newState;
      updaters.saveState();
    },
    saveState: () => {
      model.saveState();
      _.map(children, c => { c.update.updateState();});
    },
    createEstimators: () => {
      let cm = model.getState().project.CM.currentCM;
      let sideValues = model.getState().project.CM.currentCM.hatmatrix.side;
      let sideRowNames = model.getState().project.CM.currentCM.hatmatrix.rowNamesSide;
      let sideColNames = model.getState().project.CM.currentCM.hatmatrix.colNamesSide;
      let sides = _.zip(sideRowNames,_.map(sideValues,sr => {
        return _.object(sideColNames,sr);
      }));
      let makeBoxes = (studies) => {
        let res = _.map(studies, s => {
          let sideRow = _.find(sides, side => {
            return _.isEqual(uniqId(side[0].split(':')),uniqId(s[0].split(':')));
          });
          let contents = {}
            contents =  {
                id: s[0],
                judgement: 'nothing'
            }
          if(_.isUndefined(sideRow)){
            _.extend(contents,{
                isMixed: false,
            })
          }else{
            console.log('sideIF',sideRow);
            if (_.every(_.toArray(sideRow[1]), sr => {return sr !== 'NA'})){
              _.extend(contents,{
                  isMixed: true,
                  sideIF: sideRow[1].SideIF.toFixed(3),
                  sideIFLower: sideRow[1].SideIFlower.toFixed(3),
                  sideIFUpper: sideRow[1].SideIFupper.toFixed(3),
                  Ztest: sideRow[1].SideZ.toFixed(3),
                  pvalue: sideRow[1].SidePvalue.toFixed(3),
              })
            }
          }
          let levels = _.union([{
            id:'nothing',
            label: '--',
            isDisabled: true
          }],updaters.getState().levels);
          // _.map(levels, l => {
          //   let name = {};
          //   if(l.id !=='nothing'){
          //     name = {
          //       label: model.getState().text.Incoherence.levels[l.id-1]
          //     }
          //   }
          //   return _.extend(l, name);
          // });
          contents.levels = levels;
          return contents;
        });
        return res;
      };
      let mixed = makeBoxes(_.zip(cm.directRowNames,cm.directStudies));
      let indirect = makeBoxes(_.zip(cm.indirectRowNames,cm.indirectStudies));
      // console.log('mixed',mixed);
      return _.union(mixed,indirect);
    },
    skeletonModel: () => {
      let boxes = updaters.createEstimators();
      let rfvs = () => {
        let dbt = [];
        if(! _.isUndefined(deepSeek(model.getState(),'project.CM.currentCM.hatmatrix.dbt[0]'))){
          dbt = _.map(model.getState().project.CM.currentCM.hatmatrix.dbt[0], d => {
            return d.toFixed(3);
          });
          dbt[1]=parseInt(dbt[1]);
        }
        return dbt;
      };
      return { 
        levels: IncoherenceLevels,
        status: 'ready',
        referenceValues: rfvs(),
        boxes,
      }
    },
    resetIncoherence: () => {
      updaters.setState(updaters.skeletonModel());
      updaters.saveState();
    },
  }
  return updaters;
};


module.exports = () => {
  return Update;
}
