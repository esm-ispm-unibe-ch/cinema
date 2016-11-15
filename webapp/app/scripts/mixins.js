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
  $('#'+container+' .table-resizer').on('mouseup',(e)=>{
    let t = $(e.target).parent();
    t.toggleClass('fullscreen');
    $(e.target).parent().find('.table-resizer').toggle();
  });
};


var focusTo = (id) => {
  jQuery('html,body').animate({
  scrollTop: jQuery('#'+id).offset().top,
  scrollLeft:jQuery('#'+id).offset().left},
  'fast');
};

module.exports = {
  focusTo: focusTo,
  bindTableResize: bindTableResize,
  uniqId: uniqId,
  sumBy: sumBy,
  accumulate: accumulate,
  htmlEntities: htmlEntities,
}
