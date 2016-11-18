var Msg = require('./messages.js').Messages;
var focusTo = require('./mixins.js').focusTo;

var RS = {
  initControls:() =>{
    //initialize controls
    if(RS.model.project.hasSelectedRob){
      $('.custom-selector').attr('disabled',true);
      $('.custom-none').hide();
      $('#RSRule').val('none');
      $('#editRS').attr('disabled',false);
      $('#RSRule').attr('disabled',true);
    }else{
      $('.custom-selector').attr('disabled',true);
      $('.custom-none').show();
      $('.custom-selector').val('-1');
      $('.robLabel').removeClass('isSelected');
      $('.compRobSelector').removeClass('customized');
      $('#RSRule').val('none');
      $('#RSRule').attr('disabled',false);
      $('#editRS').attr('disabled',true);
      $('#resetRS').attr('disabled',true);
    }
  },
  bindControls:()=>{
    RS.bindRule();
    RS.bindEdit();
    RS.bindReset();
  },
  bindRule: () => {
    $('#RSRule').unbind();
    $('#RSRule').on('change', () => {
      let rule = $('#RSRule option:selected').val();
      $('#resetRS').attr('disabled',false);
      $('#RSRule').attr('disabled',true);
      $('#editRS').attr('disabled',false);
      $('#editRS').removeClass('active');
      $('#editRS').click();
      RS.setRule(rule);
      RS.bindCustom(rule);
    });
  },
  saveSelections: () =>{
    let comps = $('.compRobSelector');
    let sels = {};
    _.map(comps, c => {
      let s = $(c).find('.custom-selector');
      let sid = s.attr('data-id');
      let v = s.val();
      sels[sid] = v;
    });
    $('.custom-selector').attr('disabled',true);
    $('#editRS').attr('disabled',false);
    $('#editRS').removeClass('active');
    RS.model.selectRobs(sels);
  },
  resetSelections: () => {
    RS.model.unselectRobs();
    RS.initControls();
  },
  bindEdit: () => {
    $('#editRS').on('click',()=>{
      if($('#editRS').hasClass('active')){
        $('.custom-selector').attr('disabled',true);
        $('#editRS').removeClass('active');
        $('#editRS').text('Edit');
        $('#editRS').blur();
        RS.saveSelections();
        Msg.alertify().success('Your selections are saved!');
      }else{
        $('.custom-none').hide();
        $('.custom-selector').attr('disabled',false);
        $('#editRS').addClass('active');
        $('#editRS').text('Save');
        Msg.alertify().message('You can now edit your selections');
      }
    });
  },
  bindReset: () => {
    $('#resetRS').on('click',()=>{
      Msg.alertify().confirm('Clear selections?','All changes will be lost',
        () => {
          RS.resetSelections();
          Msg.alertify().warning('selections cleared');
        },
        () => {
      });
    });
  },
  bindCustom: (rule) => {
    $('.custom-selector').on('change', (evt) => {
      let s = $(evt.target);
      if(s.val() !== s.children('option[default=true]').attr('value')){
        s.parent().parent().parent().addClass('customized');
        s.parent().siblings('.'+rule).removeClass('isSelected');
      }else{
        s.parent().parent().parent().removeClass('customized');
        s.parent().siblings('.'+rule).addClass('isSelected');
      }
    });
  },
  setRule:(rule)=>{
    let comps = RS.model.project.model.directComparisons;
    $(document).ready(() => {
      _.map(comps, c => {
        let s = $('.custom-selector[data-id="'+c.id+'"]');
        s.attr('disabled',false).val(c[rule]);
        s.children('option').attr('default',false);
        s.children('option[value="'+c[rule]+'"]').attr('default',true);
        s.parent().siblings('.'+rule).addClass('isSelected');
      });
    });
  },
  init:(model)=>{
    RS.model = model;
    // console.log(model.project);
    var rstmpl = GRADE.templates.robSelector(RS);
    $('#robSelectorContainer').html(rstmpl);
    focusTo('robSelectorTitle');
    RS.initControls();
    RS.bindControls();
  }
}

module.exports = () => {
  return RS;
}
