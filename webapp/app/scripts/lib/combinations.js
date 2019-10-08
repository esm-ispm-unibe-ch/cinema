var getCombinations = (inArr, k) => {
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

module.exports = {
  getCombinations: getCombinations
}
