var deepSeek = require('safe-access');

var View = (model) => {
  let cm = deepSeek(model,'getState().project.CM');
  let cmc=() => deepSeek(cm,'currentCM');
  let params = deepSeek(cmc(),'params');
  let viewers = {
    robReady: () => {
      let ready = false;
      if(_.isUndefined(deepSeek(model.getState(),'project.DirectRob.status'))){
        ready = false;
      }else{
        if(deepSeek(model.getState(),'project.DirectRob.status')==='ready'){
          ready = true;
        }
      }
      console.log('rob ready',ready);
      return ready;
    },
    tableReady: () => {
      if(cmc().status==='ready'){
        return true;
      }else{
        return false;
      }
    },
    isEmpty: () => {
      if(cmc().status==='epmty'){
        return true;
      }else{
        return false;
      }
    },
    isLoading: () => {
      if(cmc().status==='loading'){
        return true;
      }else{
        return false;
      }
    },
    isCanceling: () => {
      if(cmc().status==='canceling'){
        return true;
      }else{
        return false;
      }
    },
    table: () => {
      return cmc().directStudies;
    },
    progress: () => {
      return cmc().progress;
    },
    headerTitle: () => {
      return cmc().currentRow;
    },
    canCreateMatrix: () => {
      if(cmc().status !== 'empty'){
        return false;
      }
      let musthaves = ['MAModel','sm','rule','intvs'];
      if(_.isEmpty(params)){
        return false;
      }
      let can = ! _.any(musthaves, mh => {
        return _.isEmpty(params[mh]);
      });
      if (can === false) {
        return false;
      }
      if((params.intvs.length===0)||((params.rule === 'between')&&(params.intvs.length<2))){
        return false;
      }
      return true;
    },
    listReady: () => {
      if ((_.isUndefined(params.intvs) || _.isUndefined(params.rule)) ){
        return false;
      }else{
        return ( ( (params.intvs.length>0) && (params.rule === 'every') )|| 
          ( (params.intvs.length>1) && (params.rule === 'between') ) );
      }
    },
    isReady: () => {
      let isReady = false;
      if (! _.isUndefined(deepSeek(model,'getState().project.CM.currentCM'))){
        isReady = true;
      }
      return isReady;
    },
    status: () => {
      return cmc().status;
    },
    isEmpty: () => {
      return cmc().status === 'empty';
    },
    isLoading: () => {
      return cmc().status === 'loading';
    },
    controls: () => {
      let project = model.getState().project;
      let cm = model.getState().project.CM;
      let cmc = cm.currentCM;
      let currentCM = cmc;
      let type = project.type;
      let cntrs = viewers.defaultControls();
      _.map(cntrs, cn => {
        _.map(cn.selections, s => {
          if(currentCM.params[cn.id]===s.value){
            s.isSelected = true;
          }else{
            s.isSelected = false;
          }
        })
      });
      _.map(cntrs[1].selections, c => {
        if(_.find(c.validTypes, t => {return t===type;})){
          c.isAvailable = true;
        }
      });
      let intvs = _.map(project.studies.nodes, pn => {
        return {
          label: pn.name?pn.name:pn.id,
          value: pn.id,
          isAvailable: true,
          tag: 'intvs'
        };
      });
      _.map(intvs, intv => {
        if(_.find(currentCM.params.intvs, cint => {return cint === intv.value})){
          intv.isSelected = true;
        }
      });
      _.first(_.filter(cntrs, c=> {return c.id ==='intvs'})).selections = intvs;
      return cntrs;
    },
    selectedComparisons: () =>{
      let rows = _.union(_.pluck(model.getState().project.studies.directComparisons,'id'),
        model.getState().project.studies.indirectComparisons);
      let intvs = model.getState().project.CM.currentCM.params.intvs;
      let rule = model.getState().project.CM.currentCM.params.rule;
      let res = [];
      switch(rule){
        case 'every':
          res = _.filter(rows, r =>{
            let [t1,t2] = r.split(',');
            return (_.contains(intvs,t1)||_.contains(intvs,t2));
          });
          break;
        case 'between':
          res = _.filter(rows, r =>{
            let [t1,t2] = r.split(',');
            return (_.contains(intvs,t1)&&_.contains(intvs,t2));
          });
          break;
      }
      return _.map(res, r => () => {
        return r.replace(',',' vs ');
      });
    },
    numSelectedComparisons: () => {
      let res = viewers.selectedComparisons();
      return res.length;
    },
    defaultControls: () => { return [
      {
        type: 'radio',
        title: 'Analysis model:',
        id: 'MAModel',
        tag: 'MAModel',
        action: 'setMAModel',
        selections: [
          {
            name: 'MAModel',
            label:'Fixed effect',
        tag: 'MAModel',
            value:'fixed',
            isAvailable:true,
            isSelected:true,
          },
          {
            name: 'MAModel',
            label:'Random effects',
        tag: 'MAModel',
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
            label:'Odds Ratio',
        tag: 'sm',
            value:'OR',
            validTypes:['binary','iv'],
          },
          {
            label:'Risk Ratio',
            value:'RR',
        tag: 'sm',
            validTypes:['binary','iv'],
          },
          {
            label:'Risk Difference',
            value:'RD',
        tag: 'sm',
            validTypes:['binary','iv'],
          },
        //   {
        //     label:'ASD',
        //     value:'ASD',
        // tag: 'sm',
        //     validTypes:['binary','iv'],
        //   },
          {
            label:'Mean Difference',
            value:'MD',
        tag: 'sm',
            validTypes:['continuous','iv'],
          },
          {
            label:'Standardised Mean Difference',
        tag: 'sm',
            value:'SMD',
            validTypes:['continuous','iv'],
          },
        ]
      },
      {
        type: 'interventions',
        title: 'Interventions:',
        id: 'intvs',
        tag: 'intvs',
        action: 'setInts',
        selections: []
      },
      {
        type: 'interventionRules',
        title: 'Select comparisons:',
        after: 'the selected treatments',
        id: 'rule',
        tag: 'rule',
        action: 'setComps',
        selections: [
          {
            name:'rule',
            label:'Containing any of the above interventions',
            value:'every',
            isAvailable:true,
        tag: 'rule',
            isSelected:true,
          },
          {
            name:'rule',
            label:'Between the above interventions',
        tag: 'rule',
            value:'between',
            isAvailable:true,
            isSelected:false,
          },
        ],
      },
    ]},
  }
  return viewers;
}

module.exports = () => {
  return View;
}
