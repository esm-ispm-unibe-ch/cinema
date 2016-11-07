//Converts model into various table formats
function getCombinations(inArr, k){
var fn = function(heads, tails, k, all) {
  if (all===undefined){all=[];};
  if (heads === undefined){heads = [];};
  if (tails === undefined){tails = [];};
    if((heads.length===0)&&(tails.length===0)){
      return;
    }
    if((tails.length===0)&&(k===0)){
      all.push(heads);
      return;
    }
    if((k<0)||(tails.length===0)){
      return;
    };
    var tails1 = tails.slice(1);
    fn(heads.concat(tails[0]), tails1, k-1, all);
    fn(heads, tails1, k, all);
    return all;
  };
	return fn ([],inArr,k,[]);
};

var Reshaper = {
  longToWide: (model,type) => {
    let mold = [];
    switch(type){
      case 'binary':
      mold = [['t','tn','r','n'],[['t1','tn1','r1','n1'],['t2','tn2','r2','n2']]];
      break;
      case 'continuous':
      mold = [['t','y','sd','n'],[['t1','y1','sd1','n1'],['t2','y2','sd2','n2']]];
      break;
    }
    let perId = _.groupBy(model,'id');
    let comps = _.map(perId, st => {return getCombinations(st,2)});
    let res = _.map(comps, comp => {
      return _.map(comp, row => {
        return _.reduce(mold[1], (r,tm) => {
          let mp = _.object(mold[0],tm);
          let i = _.indexOf(mold[1],tm);
          _.map(_.keys(row[i]), ok => {
            if(mp[ok]===undefined){
              mp[ok] = ok;
            }
            let nk = mp[ok];
            r[nk] = row[i][ok];
          });
          return r;
        },{});
      });
    });
    // console.log('perid',perId,'comps',comps,'res',res);
    return _.flatten(res);
  },
  wideToLong: (model,type) => {
    let mold = [];
    switch(type){
      case 'binary':
      mold = [['t','r','n'],[['t1','r1','n1'],['t2','r2','n2']]];
      break;
      case 'continuous':
      mold = [['t','y','sd','n'],[['t1','y1','sd1','n1'],['t2','y2','sd2','n2']]];
      break;
      case 'iv':
      mold = [['t'],[['t1'],['t2']]];
      break;
    }
    let res = _.reduce(model, (long, c)=>{
      let rt = Object.keys(c);
      let nt = _.map(mold[1],tm => {
        return _.object(tm,mold[0]);
      });
      _.map(nt, no => {
        return _.map(rt, ok => {
          if (! _.contains(_.flatten(mold[1]),ok)){
            no[ok]=ok;
          }
        });
      });
      let nr = _.map(nt, ts => {
        return _.reduce(Object.keys(ts), (nrow,ot) => {
           nrow[ts[ot]] = c[ot];
           return nrow;
        },{});
      });
      return long.concat([nr]);
    },[]);
    res = _.map(_.toArray(_.groupBy(_.flatten(res),a=>{
      let aid = a.id.toString();
      let at = a.t.toString();
      return aid+at;
    })),b=>{return b[0]});
    return res;
  }
}

module.exports = {
  Reshaper: Reshaper
}
