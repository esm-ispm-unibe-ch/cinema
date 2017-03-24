var deepSeek = require('safe-access');

var View = (model) => {
  let cm = deepSeek(model,'getState().project.CM');
  let cmc=() => deepSeek(cm,'currentCM');
  let params = deepSeek(cmc(),'params');
  let viewers = {
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
    defaultControls: () => { return [
      {
        type: 'radio',
        title: 'Model:',
        id: 'MAModel',
        tag: 'MAModel',
        action: 'setMAModel',
        selections: [
          {
            name: 'MAModel',
            label:'Fixed',
        tag: 'MAModel',
            value:'fixed',
            isAvailable:true,
            isSelected:true,
          },
          {
            name: 'MAModel',
            label:'Random',
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
            label:'OR',
        tag: 'sm',
            value:'OR',
            validTypes:['binary','iv'],
          },
          {
            label:'RR',
            value:'RR',
        tag: 'sm',
            validTypes:['binary','iv'],
          },
          {
            label:'RD',
            value:'RD',
        tag: 'sm',
            validTypes:['binary','iv'],
          },
          {
            label:'ASD',
            value:'ASD',
        tag: 'sm',
            validTypes:['binary','iv'],
          },
          {
            label:'MD',
            value:'MD',
        tag: 'sm',
            validTypes:['continuous','iv'],
          },
          {
            label:'SMD',
        tag: 'sm',
            value:'SMD',
            validTypes:['continuous','iv'],
          },
        ]
      },
      {
        type: 'checkbox',
        title: 'Interventions:',
        id: 'intvs',
        tag: 'intvs',
        action: 'setInts',
        selections: []
      },
      {
        type: 'radio',
        title: 'Selection rule',
        id: 'rule',
        tag: 'rule',
        action: 'setComps',
        selections: [
          {
            name:'rule',
            label:'Containing',
            value:'every',
            isAvailable:true,
        tag: 'rule',
            isSelected:true,
          },
          {
            name:'rule',
            label:'Between',
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
