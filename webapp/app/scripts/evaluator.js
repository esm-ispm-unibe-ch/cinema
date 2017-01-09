var Msg = require('./messages.js').Messages;
var focusTo = require('./mixins.js').focusTo;

var EV = {
  initControls:() =>{
    //initialize controls
    if(EV.model.project.hasSelectedRob){
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
    EV.bindRule();
    EV.bindEdit();
    EV.bindReset();
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
      EV.setRule(rule);
      EV.bindCustom(rule);
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
    EV.model.selectRobs(sels);
  },
  resetSelections: () => {
    EV.model.unselectRobs();
    EV.initControls();
  },
  bindEdit: () => {
    $('#editRS').on('click',()=>{
      if($('#editRS').hasClass('active')){
        $('.custom-selector').attr('disabled',true);
        $('#editRS').removeClass('active');
        $('#editRS').text('Edit');
        $('#editRS').blur();
        EV.saveSelections();
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
          EV.resetSelections();
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
    let comps = EV.model.project.model.directComparisons;
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
  setIndirectComps: () => {
    let minds = EV.model.project.model.indirectComparisons;
    let inds = _.map(minds, ind => {
      let [t1,t2] = ind.split(',');
      return {t1:t1, t2:t2};
    });
    EV.inds = inds;
  },
  updateRobs: () => {
    let m = EV.model;
    if(m.project.hasSelectedRob && !_.isEmpty(m.project.currentCM)){
      $('.indirects').show();
      console.log('updating robs');
    }else{
      $('.indirects').hide();
    }
  },
  init:(model)=>{
    EV.model = model;
    EV.setIndirectComps();
    // console.log(model.project);
    var evtmpl = GRADE.templates.evaluator(EV);
    var robs = GRADE.templates.studyLimitations(EV);
    var inds = GRADE.templates.indirectness(EV);
    var incs = GRADE.templates.inconsistency(EV);
    var imps = GRADE.templates.imprecision(EV);
    var pubBias = GRADE.templates.pubBias(EV);
    $('#evaluator').html(evtmpl);
    $('#limitations').html(robs);
    $('#indirectness').html(inds);
    $('#inconsistency').html(incs);
    $('#imprecision').html(imps);
    $('#pubBias').html(pubBias);
    // focusTo('robSelectorTitle');
    EV.initControls();
    EV.bindControls();
  }
}

module.exports = () => {
  return EV;
}
