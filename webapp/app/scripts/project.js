var deepSeek = require('safe-access');
var h = require('virtual-dom/h');
var VNode = require('virtual-dom/vnode/vnode');
var VText = require('virtual-dom/vnode/vtext');
var convertHTML = require('html-to-vdom')({
     VNode: VNode,
     VText: VText
});
var sortStudies = require('./lib/mixins.js').sortStudies;
var clone = require('./lib/mixins.js').clone;
var majrule = require('./lib/mixins.js').majrule;
var meanrule = require('./lib/mixins.js').meanrule;
var maxrule = require('./lib/mixins.js').maxrule;
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
var ComparisonModel = require('./purescripts/output/ComparisonModel');

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
      $(document).on('click','#proceed', {} ,
        e=>{ console.log("going to configuration");
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
      }
      _.map(PR.children, c => { c.update.updateState(model);});
    },
    setProject: (pr) => {
      PR.model.getState().project = pr;
      _.map(PR.children, c => {c.update.updateState(PR.model);});
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
    makeDirectComparisons: (format,model) => {
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
        if (typeof comp[0].indirectness !== 'undefined'){
          row.indirectness = accumulate(comp,'indirectness');
          row.majindr = majrule(row.indirectness);
          row.meanindr = meanrule(row.indirectness);
          row.maxindr = maxrule(row.indirectness);
        }else{
          row.majindr = -1;
          row.meanindr = -1;
          row.maxindr = -1;
        };
        row.tn1 = row.t1===comp[0].t1?comp[0].tn1:comp[0].tn2;
        row.tn2 = row.t2===comp[0].t2?comp[0].tn2:comp[0].tn1;
        row.majrob = majrule(row.rob);
        row.meanrob = meanrule(row.rob);
        row.maxrob = maxrule(row.rob);
        if(format !== 'iv'){
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
          hasFile: false,
          isSaved: false,
          robLevels: robLvls,
          studyLimitationLevels: studyLimitationLevels
      };
      PR.model.saveState();
      PR.model.factorySettings();
    },
    initProject: (model) => {
      let prj = PR.view.getProject();
      prj.rawData = model;
      //console.log("model",model);
      prj.rawData.selected={};
      prj.isRecognized = false;
      if (!_.isUndefined(model.type)){
        prj.type = model.type;
      }
      if (!_.isUndefined(model.format)){
        prj.format = model.format;
      }
      PR.model.saveState();
    },
    makeStudies: (dataset) => {
      //console.log("to object gia na kaneis studies",dataset);
      return new Promise((resolve,reject) => {
      let res = Checker.checkTypes(dataset)
          .then(Checker.checkMissingValues)
          .then(Checker.checkConsistency)
          .then(project => {
            let prj = PR.view.getProject();
            prj.format = project.format;
            prj.type = project.type;
            let mdl = {};
            if(project.format === 'long'){
              mdl.long = project.model;
              mdl.wide = Reshaper.longToWide(project.model,project.type);
              }else{
                if (project.format === "iv"){
                  mdl.long = Reshaper.wideToLong(project.model,"iv");
                  mdl.wide = project.model;
                }else{
                  mdl.long = Reshaper.wideToLong(project.model,project.type);
                  mdl.wide = project.model;
                }
              }
              if (project.format === "iv"){
                mdl.nodes = PR.model.makeNodes("iv", mdl.long);
              }else{
                mdl.nodes = PR.model.makeNodes(project.type, mdl.long);
              }
              let ids = _.pluck(mdl.nodes,'id');
              let sortedIds = ComparisonModel.orderIds(ids);
              let dcomps = PR.update.makeDirectComparisons(project.format, mdl.wide);
              mdl.directComparisons = 
                _.unzip(sortStudies(_.map(dcomps, comp => {return comp.t1+":"+comp.t2}),dcomps))[1];
              let indirects = PR.update.makeIndirectComparisons(mdl.nodes,mdl.directComparisons);
              mdl.indirectComparisons = indirects;
              mdl.robs = _.mapObject(_.groupBy(mdl.long,"id"),s => {return s[0].rob});
              mdl.indrs = _.mapObject(_.groupBy(mdl.long,"id"),s => {return s[0].indirectness});
              prj.studies = mdl;
              prj.isSaved = true;
              PR.update.setProject(prj);
              return prj;
            })
          .catch( err => {
            Messages.alertify().error(err);
            reject(err);
          });
          resolve(res);
        })
    },
    recognizeFile: (dataset) => {
      return new Promise((resolve,reject) => {
        resolve(Checker.checkColumnNames(dataset))
      })
      .catch( err => {
        Messages.alertify().error(err);
        reject(err);
      });
    },
    getJSON: (infile, filename) => {
      return FR.handleFileSelect(infile)
      .then(FR.convertCSVtoJSON);
    },
    createProject: (filename) =>{
      let pr = PR.view.getProject();
      let npr = clone(pr);
      var date = Number(new Date());
      var id = md5(date+Math.random());
      let robLvls = PR.update.robLevels();
      let studyLimitationLevels = PR.update.studyLimitationLevels();
      npr.hasFile = true;
      npr.filename = filename;
      npr.title = filename;
      npr.id = id;
      npr.creationDate = date;
      npr.accessDate = date;
      npr.robLevels = robLvls;
      npr.studyLimitationLevels = studyLimitationLevels;
      PR.update.setProject(npr);
    },
    //The main project reading function
    fetchProject: (evt) => {
      return new Promise((resolve,reject) => {
      var filename = htmlEntities($('#files').val().replace(/C:\\fakepath\\/i, '')).slice(0, -4);
      PR.update.getJSON(evt,filename).then(data => {
        PR.update.createProject(filename);
        return data;
      })
      .catch( err => {
        Messages.alertify().error(err);
        reject(err);
      })
      .then(PR.update.recognizeFile)
      .catch( err => {
        Messages.alertify().error(err);
        reject(err);
      })
      .then(answer => {
        PR.update.initProject(answer);
        let hasFormat = ! _.isUndefined(answer.format);
        let hasType = ! _.isUndefined(answer.type);
        if (hasFormat && hasType) {
          PR.view.getProject().isRecognized = true;
          PR.update.makeStudies(answer);
        }
      })
      .catch( err => {
        Messages.alertify().error(err);
        reject(err);
      })
      //.then(project => {
          //Messages.alertify().success(PR.model.state.text.longFileUpload.title);
      //})
      })
    },
    changeName: () => {
      let prevVal = PR.view.getProject().title;
      Messages.alertify().prompt( 'Change project title', 'Prompt Message', prevVal
             , function(evt, value) { 
               let pr = PR.view.getProject();
               pr.title = value.toString();
               PR.model.saveState();
               Messages.alertify().success('Project name updated');
             }
             , function() { console.log("canceled naming") });
    },
    selectType: (rtype) => {
      let pr = PR.view.getProject();
      let type = rtype.value;
      pr.rawData.selected.type = type;
      PR.model.saveState();
    },
    selectFormat: (rformat) => {
      let pr = PR.view.getProject();
      let format = rformat.value;
      pr.rawData.selected.format = format;
      PR.model.saveState();
    },
    saveFormatType: () => {
      let pr = PR.view.getProject();
      let format = PR.view.selectedFormat();
      let type = PR.view.selectedType();
      let getrequired = (fr,tp) => {
        let out = '';
        switch (fr) {
          case "long":
            switch (tp) {
              case "continuous":
                out = "continuousLong";
                break;
              case "binary":
                out = "binaryLong";
                break;
            }
            break;
          case "wide":
            switch (tp) {
              case "continuous":
                out = "continuousWide";
                break;
              case "binary":
                out = "binaryWide";
                break;
            }
            break;
          case "iv":
            out = "iv";
            break;
          }
        return out;
      };
      let availables = pr.rawData.columns;
      let requiredFields = pr.rawData.defaults.required[getrequired(format,type)];
      let reqdecs = _.reduce(_.zip(requiredFields, pr.rawData.defaults.requiredDescriptions[getrequired(format,type)])
        ,(ac,d) => {
        ac[_.head(d)] = _.last(d);
        return ac;
      },{});
      //console.log("requiredDescriptions", reqdecs);
      let required = _.map(requiredFields, req => {
              return { name: req
                      , selected: _.contains(availables,req)?req:"--", isActive:false
                      , description: reqdecs[req]
                     };
            });
      let optionalFields = pr.rawData.defaults.optional;
      let optional = _.map(optionalFields, req => {
              return {name: req, selected:_.contains(availables,req)?req:"--", isActive:false};
            });
      pr.format = format;
      pr.type = type;
      pr.settings = {};
      pr.settings.format = format; 
      pr.settings.selectedField = 'none'; 
      pr.settings.selectedColumn = 'none'; 
      pr.settings.type = type; 
      pr.settings.required = required;
      pr.settings.optional = optional;
      PR.model.saveState();
    },
    selectColumn: (rcolumn,field) =>{
      let pr = PR.view.getProject();
      let column = rcolumn.value;
      let reqs = PR.view.requiredFields();
      let opts = PR.view.optionalFields();
      let reqsel = _.findLastIndex(reqs, {name: field});
      let optsel = _.findLastIndex(opts, {name: field});
      if (reqsel !== -1){
        reqs[reqsel].selected = column;
      }
      if (optsel !== -1){
        opts[optsel].selected = column;
      }
      PR.model.saveState();
    },
    editFormatType: () => {
     Messages.alertify().confirm('Clear Format/Outcome?','You will have to reselect the file\'s fields',
        () => {
          let pr = PR.view.getProject();
          pr.type = null;
          pr.format = null;
          pr.settings = null;
          PR.model.saveState();
          Messages.alertify().message('Format and Outcome type have been reset');
      },()=>{});
    },
    checkFile: () => {
      return new Promise((resolve,reject) => {
        let pr = PR.view.getProject();
        let rawmodel = PR.view.getProject().rawData.model;
        let reqs = PR.view.requiredFields();
        let newmodel = _.map(rawmodel, r => {
          let out = {};
            _.mapObject(r, (v,k) =>{
               let field = 
                _.findWhere(reqs,{selected:k});
              if(! _.isUndefined(field)){
                out[field.name] = v; 
              }else{
                out[k] = v;
              }
            })
          return out;
         });
        pr.model = newmodel;
        resolve(pr);
      })
      .then(
        PR.update.makeStudies
      )
      .then(project => {
          Messages.alertify().success(PR.model.state.text.longFileUpload.title);
      })
      .catch( err => {
        Messages.alertify().error(PR.model.getState().text.wrongFileFormat+err);
        reject(err);
      })
    },
    proceed: () => {
      Actions.Router.gotoRoute('general');
      PR.model.persistToLocalStorage();
    }
  },
  view: {
    getProject: () => {
      return PR.model.getState().project;
    },
    hasFile: () => {
      return PR.view.getProject().hasFile;
    },
    canUpload: () => {
      return ! PR.view.getProject().hasFile;
    },
    canProceed: () => {
      let hasnoStudies = _.isUndefined(PR.view.getProject().studies);
      return (! hasnoStudies) && (PR.view.hasFormatType());
    },
    projectTitle: () => {
      return PR.view.getProject().title;
    },
    filename: () => {
      return PR.view.getProject().filename;
    },
    type: () => {
      return PR.view.getProject().type;
    },
    format: () => {
      return PR.view.getProject().format;
    },
    hasFormatType: () => {
      let hasFormat = ! _.isUndefined(PR.view.format());
      let hasType = ! _.isUndefined(PR.view.type());
    return hasFormat && hasType;
  },
  creationDate: () => {
      let creation = new Date(PR.view.getProject().creationDate);
      let datestring = creation.getHours().toString() +":"+ creation.getMinutes()+" "+creation.toLocaleDateString();
      return datestring;
    },
    numStudies: () => {
      let out = 0;
      if(! _.isUndefined(PR.view.getProject().studies)){
        let studies = _.toArray(_.groupBy(PR.view.getProject().studies.long,'id'));
        out = studies.length;
      }
      return out;
    },
    interventions: () => {
      return PR.view.getProject().studies.nodes.length;
    },
    comparisons: () => {
      return PR.view.getProject().studies.directComparisons.length;
    },
    isSaved: () => {
      return PR.view.getProject().isSaved;
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
    rawData: () => {
      let pr = PR.view.getProject();
      if( _.isUndefined(pr.rawData)){
        return {};
      }else{
        return PR.view.getProject().rawData;
      }
    },
    rawTypes: () => {
      let pr = PR.view.getProject();
      if( _.isUndefined(pr.rawData)){
        return [];
      }else{
        return PR.view.getProject().rawData.defaults.types;
      }
    },
    rawFormats: () => {
      let pr = PR.view.getProject();
      if( _.isUndefined(pr.rawData)){
        return [];
      }else{
        return PR.view.getProject().rawData.defaults.formats;
      }
    },
    rawDefaults: () => {
      let pr = PR.view.getProject();
      if( _.isUndefined(pr.rawData)){
        return {};
      }else{
        return PR.view.getProject().rawData.defaults.required;
      }
    },
    selectedFormat: () => {
      let pr = PR.view.getProject();
      let out = {};
      if (! _.isUndefined(deepSeek(pr,'rawData.selected.format'))){
        out = pr.rawData.selected.format;
      }else{
        out = pr.format;
      }
      return out;
    },
    hasSelectedFormat: () => {
      return ! _.isUndefined(PR.view.selectedFormat());
    },
    selectedType: () => {
      let pr = PR.view.getProject();
      let out = {};
      if (! _.isUndefined(deepSeek(pr,'rawData.selected.type'))){
        out = pr.rawData.selected.type;
      }else{
        out = pr.type;
      }
      return out;
    },
    hasSelectedType: () => {
      return ! _.isUndefined(PR.view.selectedType());
    },
    hasSelectedFormatType: () => {
      let out = PR.view.hasSelectedFormat() && PR.view.hasSelectedType();
      return out;
    },
    projectFields: () => {
      let pr = PR.view.getProject();
      let reqs = {};
      let opts = {};
      let selects = {};
      let availables = {};
      if(! _.isUndefined(deepSeek(PR.view.getProject(),"rawData.columns"))){
        availables = ["--"].concat(PR.view.getProject().rawData.columns);
      }
      if (! _.isUndefined(deepSeek(pr,'settings.required'))){
        reqs = PR.view.getProject().settings.required;
        opts = PR.view.getProject().settings.optional;
        let fields = [];
        if(! _.isUndefined(reqs)){
          if(! _.isUndefined(opts)){
            fields = reqs.concat(opts);
          }else{
            fields = reqs;
          }
        }else{
          if(! _.isUndefined(opts)){
            fields = opts;
          }else{
            fields = [];
          }
        }
        if(! _.isUndefined(fields)){
          selects = _.filter(fields, f => {
            return f.selected !== "--";
          });
          selects = _.map(selects, f => {return f.selected});
        }
        _.map(reqs, req => {
          let avs = _.map(availables, av => {
            return { name: av
                   , isSelected: av === req.selected
                   , isDisabled: _.contains(selects,av)
                   }
          });
          req.availableColumns = avs;
        });
        _.map(opts, opt => {
          let avs = _.map(availables, av => {
            return { name: av
                   , isSelected: av === opt.selected
                   , isDisabled: _.contains(selects,av)
                   }
          });
          opt.availableColumns = avs;
        });
      }
      return {required:reqs, optional: opts};
    },
    requiredFields: () => {
      return PR.view.projectFields().required;
    },
    optionalFields: () => {
      return PR.view.projectFields().optional;
    },
    selectedColumns: () => {
      let pr = PR.view.getProject();
      let reqs = PR.view.requiredFields();
      let opts = PR.view.optionalFields();
      let fields = reqs.concat(opts);
      let out = _.filter(fields, f => {
        return f.selected !== "--";
      });
      return _.map(out, f => {return f.selected});
    },
    availableColumns: () => {
      let pr = PR.view.getProject();
      let selectedColumns = PR.view.selectedColumns();
      let allColumns = [];
      if (! _.isUndefined(deepSeek(pr,'rawData.columns'))){
        allColumns = ["--"].concat(PR.view.getProject().rawData.columns);
      }
      return _.difference(allColumns, selectedColumns);
    },
    allRequiredSelected: () => {
      let reqs = PR.view.requiredFields();
      let numreqs = 0
      if(! _.isUndefined(reqs)){
        numreqs = reqs.length;
      }
      let numSelected = _.countBy(reqs, r => {
        return r.selected !== "--";
      })["true"];
      let res = false;
      if (_.isUndefined(numSelected) || _.isUndefined(numreqs)){
        res = false;
      }else{
        res = numSelected === numreqs;
      }
      return res;
    },
    notRecognized: () => {
      let pr = PR.view.getProject();
      return ! pr.isRecognized;
    }
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
  ],
};

module.exports = () =>{
  return PR;
}
