var deepSeek = require('safe-access');
var clone = require('../../lib/mixins.js').clone;
var uniqId = require('../../lib/mixins.js').uniqId;
var Messages = require('../../messages.js').Messages;

var children = [
  //Report
  ];

var Update = (model) => {
  //update functions will only change state in that node of the model DAG
  let modelPosition = 'project.NetRob.studyLimitations';
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
    drobReady: () => {
      let isready = false;
      if (deepSeek(model,'getState().project.DirectRob.status')==='ready'){
        isready = true;
        // console.log('direct robs ready');
      }
      return isready;
    },
    updateState: () => {
      if ( updaters.cmReady() && updaters.drobReady() ){
        if(updaters.getState().status === 'ready'){
        // console.log("Study Limitations model ready");
          _.map(children, c => { c.update.updateState(model);});
        }else{
          updaters.setState(updaters.completeModel());
        }
      }else{
        updaters.setState(updaters.skeletonModel());
      }
    },
    setState: (newState) => {
      // this affects the whole node in the state.
      let  NetRobState = deepSeek(model.getState(),'project');
      NetRobState.NetRob.studyLimitations = newState;
      updaters.saveState();
    },
    getRule: () => {
      return deepSeek(model.getState(), modelPosition+'.rule');
    },
    selectRule: (rule) => {
    },
    selectIndividual: (value) => {
      let [tid,tv] = value.value.split('σδel');
      let boxes = updaters.getState().boxes;
      let tbc = _.find(boxes, m => {
        return m.id === tid;
      });
      let rulevalue = deepSeek(_.find(tbc.rules, r => {return r.id === updaters.getRule()}),'value');
      // console.log('tid tv',tid,tv,'rule',rulevalue);
      if(parseInt(tv) !== rulevalue){
        if((tbc.judgement === 'nothing')||(tbc.judgement === rulevalue)){
          updaters.getState().customized += 1;
        }      
      }else{
        updaters.getState().customized -= 1;
      }
      tbc.judgement = parseInt(tv);
      updaters.getState().status = 'selecting';
      updaters.saveState();
      updaters.getState().status = 'ready';
      Messages.alertify().success(model.getState().text.NetRob.LimitationsSet);
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
    completeModel: () => {
      let boxes = updaters.createEstimates();
      // console.log('boxes',boxes);
      return { 
        status: 'noRule',// noRule, editing, ready
        rule: 'noRule', // noRule, majRule, meanRule, maxRule
        customized: 0,
        boxes,
      }
    },
    skeletonModel: () => {
      return { 
        status: 'noRule',// noRule, editing, ready
        rule: 'noRule', // noRule, majRule, meanRule, maxRule
        customized: 0,
        boxes: [],
      }
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
  }
  return updaters;
};


module.exports = () => {
  return Update;
}
