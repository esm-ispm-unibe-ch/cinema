var View = require('./view.js').View;
var md5 = require('../../bower_components/js-md5/js/md5.min.js');
var FR = require('./readFile.js').FR;
var Checker = require('./fileChecks.js').Checker;
var Reshaper = require('./reshaper.js').Reshaper;
var uniqId = require('./mixins.js').uniqId;
var accumulate = require('./mixins.js').accumulate;
var sumBy = require('./mixins.js').sumBy;
var getCombinations = require('./combinations.js').getCombinations;


var Model = {
  lowrobcolor: '#7CC9AE',
  unclearrobcolor: '#FBBC05',
  highrobcolor: '#E0685C',
  createProject: (pr) =>{
    var date = Number(new Date());
    var id = md5(date+Math.random());
    return {
      id: id,
      title: pr.title,
      filename: pr.filename,
      model: pr.model,
      format: pr.format,
      type: pr.type,
      creationDate: date,
      accessDate: date,
      currentCM: {},
      contributionMatrices: [],
      state: {},
    };
  },
  readLocalStorage: () => {
    if (_.isEmpty(localStorage.project)){
      Model.setProject({});
    }else{
      Model.setProject(JSON.parse(localStorage.project));
    }
  },
  emptyProject: () => {
    return _.isEmpty(Model.project);
  },
  clearProject: () => {
    Model.project = {};
    localStorage.clear();
    View.updateProjects();
  },
  setProjectName: (title) =>{
    Model.project.title = title;
  },
  getProjectName: () =>{
    return Model.project.title;
  },
  setProjectFileName: (filename) =>{
    Model.project.fileName = filename;
  },
  getProjectFileName: () =>{
    return Model.project.fileName;
  },
  getProject: () => {
    return Model.project;
  },
  setProject: (project) => {
    // console.log('setting project');
    Model.project = project;
    View.updateProjects();
    Model.saveProject();
  },
  saveProject: () => {
    localStorage.clear();
    localStorage.setItem('project', JSON.stringify(Model.getProject()));
  },
  pushToContributionMatrix: (connma) => {
    let prj = Model.getProject();
    let cms = prj.contributionMatrices;
    cms.push(connma);
    Model.makeCurrentCM(connma);
    // console.log('pushing to contributionMatrices',cms,'conma',connma);
  },
  clearCurrentCM: () =>{
    Model.getProject().currentCM = {};
    Model.saveProject();
    View.updateConChart();
  },
  makeCurrentCM: (cm) =>{
    let cms = Model.getProject().contributionMatrices;
    _.map(cms, c => {
      let fit = _.isMatch(c,_.omit(cm,['isCurrent','intvs']));
      if(fit){
        c.isDefault = true;
        c.intvs = cm.intvs;
        Model.getProject().currentCM = c;
      }else{
        c.isDefault = false;
      }
    });
    Model.saveProject();
    View.updateConChart();
  },
  fetchContributionMatrix: ([MAModel,sm,tau,intvs]) => {
    return new Promise((resolve, reject) => {
      let project = Model.getProject();
      let cms = project.contributionMatrices;
      let result = {};
      let foundCM = {};
      let params = {
        MAModel: MAModel,
        sm: sm,
        tau: tau,
        intvs: intvs
      }
      // console.log('cmss',cms,'params',params);
      //check if the matrix is in the model;
      if(! _.isEmpty(cms)){

        // console.log('check to find matrix in cms',cms,'params',params);
        foundCM = _.find(cms, cm => {
           return _.isMatch(cm, _.omit(params, 'intvs'));
          });
      }
      if(! _.isEmpty(foundCM)){
        let newCM = foundCM;
        newCM.intvs = intvs;
        // console.log('foundcM', newCM);
        Model.makeCurrentCM(newCM);
        resolve(newCM);
      }else{
        // console.log('CM not found in model');
        let rtype = '';
        switch(project.type){
          case 'binary':
          rtype = 'netwide_binary';
          break;
          case 'continuous':
          rtype = 'netwide_continuous';
          break;
          case 'iv':
          rtype = 'iv';
          break;
        }
        //comment to deploy just for dev
        ocpu.seturl('//localhost:8004/ocpu/library/contribution/R');
        //
        var req = ocpu.rpc('getContributionMatrix',{
          indata: JSON.stringify(project.model.wide),
          type: rtype,
          model: params.MAModel,
          sm: params.sm,
          }, (output) => {
            let connma = params;
            console.log('Server response', output);
            connma.matrix = output.hatMatrix;
            connma.matrix.contributionMatrix = output.contributionMatrix;
            connma.matrix.percentageContr = output.contributionMatrix;
             connma.matrix.impD = [output.totalWeights];
            // console.log('the ocpu result',connma,'pushing to project');
            console.log('RESULTS FROM SERVER',connma.matrix);
            Model.pushToContributionMatrix(connma);
            resolve(connma);
          });
        req.fail( () => {
          reject('R returned an error: ' + req.responseText);
        })
      }
    })
  },
  makeNodes: (type, model) => {
    var grouped = _.groupBy(model, tr => {return tr.t});
    var verticeFromGroup = (group) =>{
      var vertex = {id:'', name:'', numStudies:0, sampleSize:0, rSum:0};
      vertex.type='node';
      vertex.id = group[0].t;
      vertex.name = group[0].tn;
      vertex.label = _.isEmpty(group[0]['tn'])?group[0]['t']:group[0]['tn'];
      vertex.studies = accumulate(group,'id');
      vertex.numStudies = group.length;
      if(type!=='iv'){
      vertex.sampleSize = sumBy(group,'n');
      }
      //vertex.rSum = _.reduce(group, function (memo, row){ return memo + row.r},0);
      vertex.rob = accumulate(group,'rob');
      vertex.low = _.filter(vertex.rob, r => {return r===1}).length/vertex.numStudies*100;
      vertex.unclear = _.filter(vertex.rob, r => {return r===2}).length/vertex.numStudies*100;
      vertex.high = _.filter(vertex.rob, r => {return r===3}).length/vertex.numStudies*100;
      return vertex;
    };
    let res = _.map(_.toArray(grouped), (grp) => verticeFromGroup(grp));
    return res;
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
  selectRobs: (sels) => {
    let prj = Model.getProject();
    _.map(prj.model.directComparisons, c => {
      c.selectedrob = sels[c.id];
    });
    prj.hasSelectedRob = true;
    Model.saveProject();
    View.updateSelections();
  },
  unselectRobs: () => {
    let prj = Model.getProject();
    _.map(prj.model.directComparisons, c => {
      c.selectedrob = '';
    });
    prj.hasSelectedRob = false;
    Model.saveProject();
    View.updateSelections();
  },
  getJSON: (evt, filename) => {
    return FR.handleFileSelect(evt)
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
      mdl.nodes = Model.makeNodes(project.type, mdl.long);
      //directComparisons correspond to netplot edges
      mdl.directComparisons = Model.makeDirectComparisons(project.type, mdl.wide);
      //indirectComparisons are the complement of the netplot edges
      mdl.indirectComparisons = Model.makeIndirectComparisons(mdl.nodes,mdl.directComparisons);
      prj.model = mdl;
      prj.title = filename;
      prj.filename = filename;
      Model.setProject(Model.createProject(prj));
      return prj;
    });
  },
  init: () => {
    View.init(Model);
    Model.readLocalStorage();
  }
};

module.exports = {
  Model: Model,
};
