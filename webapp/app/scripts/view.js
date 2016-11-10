var View = {
  bindTableResize:(hot,container) => {
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
  },
  focusTo: (id) => {
    jQuery('html,body').animate({
    scrollTop: jQuery('#'+id).offset().top,
    scrollLeft:jQuery('#'+id).offset().left},
    'fast');
  },
};

module.exports = () => {
  return View;
}
