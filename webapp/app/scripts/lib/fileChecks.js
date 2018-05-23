var Messages = require('../messages.js').Messages;

var Settings = {
  types: ["continuous","binary"],
  formats: ["long","wide","iv"],
  required: {
    binaryLong: ['id','t','r','n','rob'],
    continuousLong: ['id','t','y','sd','n','rob'],
    binaryWide: ['id','t1','r1','n1','t2','r2','n2','rob'],
    continuousWide: ['id','t1','y1','sd1','n1','t2','y2','sd2','n2','rob'],
    iv: ['id','t1','t2','effect','se','rob'],
  },
  requiredDescriptions: {
    binaryLong: [{short:'study id',long:'specifies the study - unique for each study'}
                ,{short:'treatment id',long:''}
                ,{short:'number of events',long:''}
                ,{short:'sample size',long:''}
                ,{short:'Risk of Bias',long:'specifies risk of bias. It can take either 1, 2 and 3 or L, U, H values for low, unclear and high risk of bias'}],
    continuousLong: [{short:'study id',long:'specifies the study - unique for each study'}
                    ,{short:'treatment id',long:''}
                    ,{short:'mean',long:''}
                    ,{short:'standand deviation',long:''}
                    ,{short:'sample size',long:''}
                    ,{short:'Risk of Bias',long:'specifies risk of bias. It can take either 1, 2 and 3 or L, U, H values for low, unclear and high risk of bias'}],
    binaryWide: [{short:'study id',long:'specifies the study - unique for each study'}
                ,{short:'first treatment',long:'id of first treatment'}
                ,{short:'number of events',long:'number of events in first treatment'}
                ,{short:'sample size',long:'sample size of first treatment'}
                ,{short:'second treatment',long:'id of second treatment'}
                ,{short:'number of events',long:'number of events in second treatment'}
                ,{short:'sample size',long:'sample size of second treatment'}
                ,{short:'Risk of Bias',long:'specifies risk of bias. It can take either 1, 2 and 3 or L, U, H values for low, unclear and high risk of bias'}],
    continuousWide: [{short:'study id',long:'specifies the study - unique for each study'}
                    ,{short:'treatment id',long:''}
                    ,{short:'mean',long:''}
                    ,{short:'standand deviation',long:''}
                    ,{short:'sample size',long:''}
                    ,{short:'treatment id',long:''}
                    ,{short:'mean',long:''}
                    ,{short:'standand deviation',long:''}
                    ,{short:'sample size',long:''}
                    ,{short:'Risk of Bias',long:'specifies risk of bias. It can take either 1, 2 and 3 or L, U, H values for low, unclear and high risk of bias '}],
    iv: [{short:'study id',long:'specifies the study - unique for each study'}
        ,{short:'first treatment',long:'id of first treatment'}
        ,{short:'second treatment',long:'id of second treatment'}
        ,{short:'effect',long:'The effect estimate of t1 versus t2. It can be log odds ratio, log risk ratio, log hazard ratio, mean difference or standardized mean difference. In case that this format is used, you will be asked whether your data measure a binary, continuous or time to event outcome. '}
        ,{short:'standand error',long:'the standard error of the effect estimate'}
        ,{short:'Risk of Bias',long:'specifies risk of bias. It can take either 1, 2 and 3 or L, U, H values for low, unclear and high risk of bias '}],
  },
  optionalDescriptions: [
    {short:'indirectness',long:'per study judgement of indirectness'}
  ],
  //optional: ['sn','tfn','tn','tfn1','tn1','tfn2','tn2','indirectness'],
  optional: ['indirectness']
};

var fileChecker = {
  checkColumnNames: (json) => {
    let required = Settings.required;
    let type = '';
    let checkNames = (titles, required) => {
      return _.reduce(titles,(memo, t) => {
        return _.without(memo, t);}
      ,required).length === 0;
    };
    let titles = Object.keys(json[0]);
    let fileTypes = Object.keys(required);
    let answer = {defaults: Settings
                 , columns: titles
                 , model: json};
    _.map(fileTypes, ft => {
      if(checkNames(titles, required[ft])){
        switch (ft) {
          case 'binaryLong':
            answer.format='long';
            answer.type='binary';
          break;
          case 'continuousLong':
            answer.format='long';
            answer.type='continuous';
          break;
          case 'binaryWide':
            answer.format='wide';
            answer.type='binary';
          break;
          case 'continuousWide':
            answer.format='wide';
            answer.type='continuous';
          break;
          case 'iv':
            answer.format='iv';
          break;
        }
      }
    });
    return answer;
  },
  checkTypes: (project) => {
    var pr = project;
    //converts r, n ,rob to numbers
    return new Promise((resolve, reject) => {
      let mdl = _.map(project.model,r=>{
        if(project.format==='long'){
          if(project.type==='binary'){
            if(isNaN(r.r)){reject('Found non number value in column <strong>r</strong>')};
          }else{
            if(isNaN(r.y)){reject('Found non number value in column <strong>y</strong>')};
            if(isNaN(r.sd)){reject('Found non number value in column <strong>sd</strong>')};
          }
            if(isNaN(r.n)){reject('Found non number value in column <strong>n</strong>')};
        }else{
          //type checks for wide format
          if(project.format==='iv'){
            if(isNaN(r.effect)){reject('Found non number value in column <strong>effect</strong>')};
            if(isNaN(r.se)){reject('Found non number value in column <strong>se</strong>')};
          }else{
            if(isNaN(r.n1)){reject('Found non number value in column <strong>n1</strong>')};
            if(isNaN(r.n2)){reject('Found non number value in column <strong>n2</strong>')};
            switch (project.type){
              case 'binary':
                if(isNaN(r.r1)){reject('Found non number value in column <strong>r1</strong>')};
                if(isNaN(r.r2)){reject('Found non number value in column <strong>r2</strong>')};
              break;
              case 'continuous':
                if(isNaN(r.y1)){reject('Found non number value in column <strong>y1</strong>')};
                if(isNaN(r.sd1)){reject('Found non number value in column <strong>sd1</strong>')};
                if(isNaN(r.y2)){reject('Found non number value in column <strong>y2</strong>')};
                if(isNaN(r.sd2)){reject('Found non number value in column <strong>sd2</strong>')};
              break;
            }
          }
        }
        if("indirectness" in r){
          if(r.indirectness!=='l'&&r.indirectness!=='u'&&r.indirectness!=='h'&&r.indirectness!=='L'&&r.indirectness!=='U'&&r.indirectness!=='H'&&r.indirectness!==1&&r.indirectness!==2&&r.indirectness!==3){
            reject('<strong>indirectness</strong> can be 1, 2, 3 or L, U, H')
          }else{
            switch(r.indirectness){
              case 'L':
              r.indirectness =1;
              break;
              case 'l':
              r.indirectness =1;
              break;
              case 'U':
              r.indirectness =2;
              break;
              case 'u':
              r.indirectness =2;
              break;
              case 'H':
              r.indirectness =3;
              break;
              case 'h':
              r.indirectness =3;
              break;
            }
          }
        }
        if(r.rob!=='l'&&r.rob!=='u'&&r.rob!=='h'&&r.rob!=='L'&&r.rob!=='U'&&r.rob!=='H'&&r.rob!==1&&r.rob!==2&&r.rob!==3){
          reject('<strong>rob</strong> can be 1, 2, 3 or L, U, H')
        }else{
          switch(r.rob){
            case 'L':
            r.rob =1;
            break;
            case 'l':
            r.rob =1;
            break;
            case 'U':
            r.rob =2;
            break;
            case 'u':
            r.rob =2;
            break;
            case 'H':
            r.rob =3;
            break;
            case 'h':
            r.rob =3;
            break;
          }
        }
        return r;
      });
      pr.model = mdl;
      resolve(pr);
    });
  },
  checkMissingValues: (project) => {
    return new Promise((resolve, reject) => {
      //checks for missing values
      _.map(project.model,r=>{
        let rt = Object.keys(r);
        let cv = rt.map(c=>{
          if(r[c]===''){reject('At least one cell is empty in column <strong>'+c+'</strong>')};
        });
      });
      resolve(project);
    });
  },
  checkConsistency: (project) => {
    let pdata = project.model;
    return new Promise((resolve, reject) => {
      var checkCons = (pr, [id, idname, chks]) => {
        let gid = _.groupBy(pr, id);
        _.map(gid, row => {
          _.map(chks, key => {
            _.reduce(row, (memo, r) => {
              if (typeof r[key] !== 'undefined'){
                if(r[key]!==memo[key]){
                  reject('Inconsistency in data: multiple <strong> '+key+'</strong> in <strong>'+idname+' '+r[id]+'</strong>');
                }
              }
              return r;
            },row[0])
          })
        });
      };
      let checkUniqueness = (cl, filters) => {
        let f = _.first(filters);
        let rest = _.rest(filters);
        if(rest.length===0){
          if(_.isArray(f)){
            return _.every(_.groupBy(cl, r => {
              return _.map(f,ff=>{return r[ff]}).sort().toString();
              }), ccl => {
              return ccl.length===1;
            });
          }else{
            return _.every(_.groupBy(cl, f), ccl => {
              return ccl.length===1;
            });
          }
        }else{
          return _.every(_.groupBy(cl, f), ccl => {
            return checkUniqueness(ccl,rest);
          });
        }
      };
      let st = Object.keys(pdata[0]);
      //check Inconsistency in the studies
      checkCons(pdata,['id','study',['sn','rob','indirectness']]);
      if(project.format==='long'){
        if(checkUniqueness(pdata,['id','t'])===false){
          reject('Multiple entries with the same id and t');
        }
        checkCons(pdata,['t','treatment',['tfn','tn']]);
        if(project.type==='binary'){
          _.map(pdata,st=>{
            if (st.r>st.n){
              reject('r must be lower than n in study '+st.id);
            }
          });
        }
      //check title id and name are consistent
      }else{
        //wideformat checks
        if(checkUniqueness(pdata,['id',['t1','t2']])===false){
          reject('Multiple entries with the same id and t');
        }
        let comparisons = [['t1','treatment 1',['tfn1','tn1']],['t2','treatment 2',['tfn2','tn2']]];
        _.map(comparisons, comp => {checkCons(pdata,comp)});
        if(project.type==='binary'){
          _.map(pdata,st=>{
            if (st.r1>st.n1){
              reject('r1 must be lower than n1 in study '+st.id);
            }
            if (st.r2>st.n2){
              reject('r2 must be lower than n2 in study '+st.id);
            }
          });
        }
      }
      resolve(project);
    });
  },
};

module.exports = {
  Checker: fileChecker
};
