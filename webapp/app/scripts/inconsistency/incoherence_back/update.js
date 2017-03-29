var deepSeek = require('safe-access');
var clone = require('../../lib/mixins.js').clone;
var uniqId = require('../../lib/mixins.js').uniqId;
var Messages = require('../../messages.js').Messages;

var children = [
  ];

var Update = (model) => {
  //update functions will only change state in that node of the model DAG
  let modelPosition = 'project.Inconsistency.Incoherence';
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
    updateState: (model) => {
      if (updaters.cmReady()&&(! _.isUndefined(updaters.getState()))){
        if(updaters.getState().status !== 'empty'){
          _.map(children, c => { c.update.updateState();});
        }else{
          updaters.setState(updaters.completeModel());
        }
      }else{
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
    createEstimates: () => {
      let cm = model.getState().project.CM.currentCM;
      let directRobs = _.object(_.map(model.getState().project.studies.directComparisons,
        dc => {
          let colname = _.find(cm.colNames,cname => {
            let cid = uniqId([dc.t1.toString(),dc.t2.toString()]);
            let cnid = uniqId(cname.split(':'));
            return _.isEqual(cid,cnid);
          });
          return [colname,dc.directRob];
      }));
      // console.log('cmdirectrows',cm,'directrobs',directRobs);
      let groupContributions = (contributions) => {
        let res =  _.groupBy(_.toArray(contributions),'rob');
        res = _.map(res, r => {
          return {
            rob: r[0].rob,
            percentage: _.reduce(_.pluck(r,'amount'), function(memo, num){ return memo + num; }, 0),
          };
        });
        return res;
      };
      let majRule = (contributions) => {
        let res = groupContributions(contributions);
        res = _.reduce(res, (memo, r) => {
          let per = r.percentage;
          if(per > memo[1]){
            return [r.rob,r.percentage];
          }else{
            return memo;
          }
        },[0,0]);
        return {rob:res[0],percentage:res[1]};
      };
      let meanRule = (contributions) => {
        let res = groupContributions(contributions);
        res = _.reduce(res, (memo,r) => {
          return memo + (r.rob * r.percentage / 100);
        },0);
        // console.log(res,Math.round(res),'res');
        return Math.round(res);
      };
      let maxRule = (contributions) => {
        let res = groupContributions(contributions);
        res = _.reduce(res, (memo, r) => {
          if (r.rob > memo){
            return r.rob;
          }else{
            memo;
          }
        },0);
        return res;
      };
      let makeRules = (rownames,colnames,studies) => {
        let project =  deepSeek(model,'getState().project');
        return _.map(_.zip(rownames,studies), d => {
          let contributions = _.object(colnames,(d[1]));
          contributions = _.mapObject(contributions, (amount,id) => {
            return {
              rob: directRobs[id],
              amount
            }
          });
          return {
            id: d[0],
            judgement: 'nothing',
            contributions,
            rules: [{ 
                id: 'majRule',
                name: model.getState().text.NetRob.rules.majRule, 
                label: project.studyLimitationLevels[majRule(contributions).rob-1].label,
                value: majRule(contributions).rob,
              },
              { id: 'meanRule',
                name: model.getState().text.NetRob.rules.meanRule, 
                label: project.studyLimitationLevels[meanRule(contributions)-1].label,
                value: meanRule(contributions),
              },
              { id: 'maxRule',
                name: model.getState().text.NetRob.rules.maxRule, 
                label: project.studyLimitationLevels[maxRule(contributions)-1].label,
                value: maxRule(contributions),
            }],
          }
        })
      };
      let mixed = makeRules(cm.directRowNames,cm.colNames,cm.directStudies);
      _.map(mixed, m => { m.isMixed = true } );
      let indirect = makeRules(cm.indirectRowNames,cm.colNames,cm.indirectStudies);
      _.map(indirect, i => { i.isMixed = false } );
      // console.log('mixed',mixed);
      return _.union(mixed,indirect);
    },
    selectRule: (rule) => {
      let nrstate = updaters.getState();
      nrstate.rule = rule.value;
      nrstate.status = 'ready';
      let boxes = updaters.getState().boxes; 
      _.map(boxes, m => {
        m.judgement = _.find(m.rules,mr =>{return mr.id===rule.value}).value;
      });
      updaters.saveState();
      Messages.alertify().success(model.getState().text.NetRob.LimitationsSet);
    },
    resetNetRob: () => {
      updaters.setState(updaters.completeModel());
    },
    skeletonModel: () => {
      return { 
        rule: 'noRule',
        status: 'empty',
        boxes: []
      }
    },
    completeModel: () => {
      // let boxes = updaters.createEstimates();
      return { 
        rule: 'noRule',
        status: 'empty',
        // boxes
      }
    },
    clickedMe: () => {
      console.log('clicked me');
    }
  }
  return updaters;
};


module.exports = () => {
  return Update;
}
