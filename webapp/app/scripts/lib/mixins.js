var ComparisonModel = require('../purescripts/output/ComparisonModel');

var htmlEntities = (str) => {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
};

var uniqId = (ids) => {
    return ids.sort();
};
var sumBy = (list, keys) => {
  let out = 0;
  if (_.isArray(keys)){
    out =  _.reduce(list, (memo, el) => {return memo + el[keys[0]]+el[keys[1]]}, 0);
  }else{
    out = _.reduce(list, (memo, el) => {return memo + el[keys]}, 0);
  }
  return out;
};
var accumulate = (list, key) => {
  return _.reduce(list, (memo, el) => {return memo.concat([el[key]]);},[]);
};

var bindTableResize = (hot,container) => {
  $('#'+container).unbind();
  $('#'+container).on('mouseup touchend'  ,()=>{
    if(typeof hot !== 'undefined'){
      let e = $('#'+container);
      let w = e.width();
      let h = e.height();
      hot.updateSettings({
        width: w,
        height: h
      });
    }
  });
  $('#'+container+' .table-resizer').unbind();
  // $('#'+container+' .table-resizer').on('mouseup',(e)=>{
  //   let t = $(e.target).parent();
  //   t.toggleClass('fullscreen');
  //   $(e.target).parent().find('.table-resizer').toggle();
  // });
};

var focusTo = (id) => {
  jQuery('html,body').animate({
  scrollTop: jQuery('#'+id).offset().top,
  scrollLeft:jQuery('#'+id).offset().left},
  'fast');
};

var clone = (obj) =>{
  var copy;
  // Handle the 3 simple types, and null or undefined
  if (null == obj || 'object' != typeof obj) return obj;
   // Handle Array
  if (obj instanceof Array) {
    copy = [];
    for (var i = 0, len = obj.length; i < len; i++) {
      copy[i] = clone(obj[i]);
    }
    return copy;
  }
    // Handle Date
  if (obj instanceof Date) {
    copy = new Date();
    copy.setTime(obj.getTime());
    return copy;
  }

  if (obj instanceof Object) {
    copy = {};
    for (var attr in obj) {
      if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
    }
    return copy;
  }
  throw new Error('Unable to copy obj! Its type isn\'t supported.');
};


let sortStudies = (rownames, studies) => {
  let fixednames = _.map(rownames, sid => {
    return ComparisonModel.fixComparisonId(sid);
  });
  let sortedIds = ComparisonModel.sortStringComparisonIds(fixednames); 
  let distance = (comp) => {
    return sortedIds.indexOf(comp);
  }
  let sortedStudies = _.zip(fixednames,studies).sort(
    (z1, z2) => {
      return distance(z1[0]) -
             distance(z2[0])
    });
  return sortedStudies;

  // return _.zip(rownames,studies);
}

let sortComparisonIds = (rownames) => {
  let fixednames = _.map(rownames, sid => {
    return ComparisonModel.fixComparisonId(sid);
  });
  let sortedIds = ComparisonModel.sortStringComparisonIds(fixednames); 
  return sortedIds;
}

let majrule = (values) => {
  let sbv =  _.sortBy(
      _.sortBy(
        _.groupBy(values),
        vss => {
          return -vss[0];
        }
      ),
      vs => {
        return -vs.length;
      }
    );
  return sbv[0][0];
}

let meanrule = (values) => {
  let out = _.reduce(values, (memo,v) => {
      return memo + v;
  },0) / values.length;
  return  Math.round(out);
}

let maxrule = (values) => {
  return _.reduce(values, (memo,rob) => {
    return memo > rob ? memo : rob;
  },0);
}

module.exports = {
  meanrule,
  majrule,
  maxrule,
  focusTo: focusTo,
  bindTableResize: bindTableResize,
  uniqId: uniqId,
  sumBy: sumBy,
  accumulate: accumulate,
  htmlEntities: htmlEntities,
  clone: clone,
  sortComparisonIds: sortComparisonIds,
  sortStudies: sortStudies
}

