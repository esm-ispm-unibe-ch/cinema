var deepSeek = require('safe-access');
var h = require('virtual-dom/h');
var VNode = require('virtual-dom/vnode/vnode');
var VText = require('virtual-dom/vnode/vtext');
var convertHTML = require('html-to-vdom')({
     VNode: VNode,
     VText: VText
});
var Messages = require('./messages.js').Messages;
var htmlEntities = require('./lib/mixins.js').htmlEntities;
var FR = require('./lib/readFile.js').FR;
var Checker = require('./lib/fileChecks.js').Checker;
var md5 = require('../../bower_components/js-md5/js/md5.min.js');
var Reshaper = require('./lib/reshaper.js').Reshaper;
var uniqId = require('./lib/mixins.js').uniqId;
var sumBy = require('./lib/mixins.js').sumBy;
var getCombinations = require('./lib/combinations.js').getCombinations;
var accumulate = require('./lib/mixins.js').accumulate;
var Netplot = require('./netplot.js')();
var ConMat = require('./conmat/conmat.js')();
var DirectRob = require('./directrob/directrob.js')();

var PR = {
  actions: {
    bindControls: () => {
      $(document).on('click','#projectClear', {} ,
        e=>{
          Messages.alertify().confirm('Clear Project?','All changes will be lost',
          () => {
            Messages.alertify().message('Project cleared');
            PR.update.clearProject();
        },()=>{});
      });
    }
  },
  update: {
    studyLimitationLevels: () =>{
      let lims = PR.model.defaults.studyLimitationLevels;
      _.map(lims, r => {
        r.label = PR.model.state.text.NetRob.levels[r.id-1];
      });
      return lims;
    },
    robLevels: () => {
      let robs = PR.model.defaults.robLevels;
      _.map(robs, r => {
        r.label = PR.model.state.text.robLevels[r.id-1];
      });
      return robs;
    },
    updateState: (model) => {
      if (typeof PR.model.getState().project === 'undefined'){
        PR.model = model;
        let robLvls = PR.update.robLevels();
        let studyLimitationLevels = PR.update.studyLimitationLevels();
        PR.update.setProject({
          robLevels: robLvls,
          studyLimitationLevels: studyLimitationLevels
        });
      }else{
        _.map(PR.children, c => { c.update.updateState(model);});
      }
    },
    setProject: (pr) => {
      PR.model.getState().project = pr;
      _.map(PR.children, c => { c.update.updateState(PR.model);});
      PR.model.saveState();
    },
    makeIndirectComparisons: (nodes,directComparisons) => {
      let lind = _.filter(getCombinations(nodes,2), c=> {
        let uid = uniqId([_.first(c).id,_.last(c).id]).toString();
          let found = _.find(directComparisons, dc => {
            return dc.id === uid;
          });
          return typeof found === 'undefined';
      });
      lind = _.map(lind, c => {
        let uid = uniqId([_.first(c).id,_.last(c).id]).toString();
        return uid;
      });
      return lind;
    },
    makeDirectComparisons: (type,model) => {
      let comparisons = _.groupBy(model, row => {
          return uniqId([row.t1, row.t2]).toString();
        });
      var edges = _.map( _.toArray(comparisons), comp => {
        let row = {
          type:'edge',
          id: uniqId([comp[0].t1,comp[0].t2]).toString(),
          studies: accumulate(comp,'id'),
          t1: uniqId([comp[0].t1,comp[0].t2])[0],
          t2: uniqId([comp[0].t1,comp[0].t2])[1],
          source: uniqId([comp[0].t1,comp[0].t2])[0],
          target: uniqId([comp[0].t1,comp[0].t2])[1],
          numStudies: comp.length,
          rob: accumulate(comp,'rob'),
        };
        row.tn1 = row.t1===comp[0].t1?comp[0].tn1:comp[0].tn2;
        row.tn2 = row.t2===comp[0].t2?comp[0].tn2:comp[0].tn1;
        let majrob = _.first(
            _.sortBy(
              _.sortBy(
                _.groupBy(row.rob, rob => {return rob}),
                robs => {
                  return -robs[0];
                }
              ),
              robs => {
                return -robs.length;
              }
            )
          )[0];
        row.majrob = majrob;
        let meanrob = _.reduce(row.rob, (memo,rob) => {
          return memo + rob;
        },0) / row.rob.length;
        meanrob = Math.round(meanrob);
        row.meanrob = meanrob;
        let maxrob = _.reduce(row.rob, (memo,rob) => {
          return memo > rob ? memo : rob;
        },0);
        row.maxrob = maxrob;
        if(type !== 'iv'){
          row.sampleSize = sumBy(comp,['n1','n2']);
        }else{
          row.iv = _.reduce(comp, (iv,s) => {
            let au = Math.pow(1/s.se,2);
            return iv + au;
          },0);
        }
        return row;
        });
      return _.sortBy(edges,e =>{return e.id});
    },
    clearProject: () => {
      let robLvls = PR.update.robLevels();
      let studyLimitationLevels = PR.update.studyLimitationLevels();
      PR.model.getState().project = {
          robLevels: robLvls,
          studyLimitationLevels: studyLimitationLevels
      };
      PR.model.saveState();
    },
    getJSON: (infile, filename) => {
      return FR.handleFileSelect(infile)
      .then(FR.convertCSVtoJSON)
      .then(Checker.checkColumnNames)
      .then(Checker.checkTypes)
      .then(Checker.checkMissingValues)
      .then(Checker.checkConsistency)
      .then(project => {
        let prj = project;
        let mdl = {};
        if(project.format === 'long'){
          mdl.long = project.model;
          mdl.wide = Reshaper.longToWide(project.model,project.type);
        }else{
          mdl.long = Reshaper.wideToLong(project.model,project.type);
          mdl.wide = project.model;
        }
        //nodes are the combined treatments (which correspond to netplot nodes)
        mdl.nodes = PR.model.makeNodes(project.type, mdl.long);
        //directComparisons correspond to netplot edges
        mdl.directComparisons = PR.update.makeDirectComparisons(project.type, mdl.wide);
        //indirectComparisons are the complement of the netplot edges
        mdl.indirectComparisons = PR.update.makeIndirectComparisons(mdl.nodes,mdl.directComparisons);
        prj.studies = mdl;
        prj.title = filename;
        prj.filename = filename;
        PR.update.setProject(PR.update.createProject(prj));
        return prj;
      });
    },
    createProject: (pr) =>{
      var date = Number(new Date());
      var id = md5(date+Math.random());
      let robLvls = PR.update.robLevels();
      let studyLimitationLevels = PR.update.studyLimitationLevels();
      return {
        id: id,
        title: pr.title,
        filename: pr.filename,
        studies: pr.studies,
        format: pr.format,
        type: pr.type,
        creationDate: date,
        accessDate: date,
        robLevels: robLvls,
        studyLimitationLevels: studyLimitationLevels
      };
    },
    fetchProject: (evt) => {
        var filename = htmlEntities($('#files').val().replace(/C:\\fakepath\\/i, '')).slice(0, -4);
        PR.update.getJSON(evt,filename).then(project => {
          Messages.alertify().success(PR.model.state.text.longFileUpload.title,' csv format '+project.format+' '+project.type);
      })
      .catch( err => {
        Messages.alertify().error(PR.model.getState().text.wrongFileFormat+err);
      });
    },
  },
  view: {
    getProject: () => {
      return PR.model.getState().project;
    },
    canUpload: () => {
      return _.isUndefined(PR.view.getProject().studies);
    },
    projectTitle: () => {
      return PR.view.getProject().title;
    },
    numStudies: () => {
      let studies = _.toArray(_.groupBy(PR.view.getProject().studies.long,'id'));
      return studies.length;
    },
    interventions: () => {
      return PR.view.getProject().studies.nodes.length;
    },
    comparisons: () => {
      return PR.view.getProject().studies.directComparisons.length;
    },
    isReady: () => {
      let isReady = false;
      if (! _.isUndefined(deepSeek(PR,'model.getState().project'))){
        isReady = true;
      }
      return isReady;
    },
    register: (model) => {
      model.Actions.Project = PR.update;
      PR.model = model;
      _.mapObject(PR.actions, (f,n) => {f();});
    },
  },
  render: (model) => {
    if (PR.view.isReady()){
      var tmpl = GRADE.templates.project({model:model.state,view:PR.view});
      return h('div#contentProject.row',convertHTML(tmpl));
    }
  },
  children: [
    Netplot,
    ConMat,
    DirectRob,
  ],
};

module.exports = () =>{
  return PR;
}
