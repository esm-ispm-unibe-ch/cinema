var htmlEntities = require('./model.js').htmlEntities;
var alertify = require('alertifyjs');


var Messages = {
  alertify: ()=>{ alertify.defaults = {
      // dialogs defaults
      autoReset:true,
      basic:false,
      closable:true,
      closableByDimmer:true,
      frameless:false,
      maintainFocus:true, // <== global default not per instance, applies to all dialogs
      maximizable:true,
      modal:true,
      movable:true,
      moveBounded:false,
      overflow:true,
      padding: true,
      pinnable:true,
      pinned:true,
      preventBodyShift:false, // <== global default not per instance, applies to all dialogs
      resizable:true,
      startMaximized:false,
      transition:'pulse',

      // notifier defaults
      notifier:{
          // auto-dismiss wait time (in seconds)
          delay:5,
          // default position
          position:'top-right'
      },

      // language resources
      glossary:{
          // dialogs default title
          title:'AlertifyJS',
          // ok button text
          ok: 'OK',
          // cancel button text
          cancel: 'Cancel'
      },

      // theme settings
      theme:{
          // class name attached to prompt dialog input textbox.
          input:'ajs-input',
          // class name attached to ok button
          ok:'ajs-ok',
          // class name attached to cancel button
          cancel:'ajs-cancel'
      }
    };
    return alertify;
  },
  updateInfo : (infos,extra) => {
    Messages.extra = extra;
    let aux = infos;
    // aux.projectName = Model.getProjectName();
    if(extra){
      aux.extra = extra;
    }
    var infotmpl = GRADE.templates.messages(aux);
    // $('#info').html(infotmpl);
    // if(aux.projectName){
      // Messages.bindNameEditor();
    // }
  },
  // bindNameEditor: () => {
  //   $('.pn').unbind();
  //   $('.project-name-edit').unbind();
  //   $('.project-name').bind('click',() => {
  //     $('.pn').toggle();
  //     $('.project-name-edit').focus();
  //   });
  //   $('.project-name-edit').blur( () => {
  //     let name = $('.project-name-edit').val().trim();
  //     setName(name);
  //   });
  //   $('.project-name-edit').keyup(function(e){
  //     if(e.keyCode == 13)
  //     {
  //       $(this).blur();
  //     }
  //   });
  //   let setName = (name) => {
  //     $('.pn').toggle();
  //     if(name===''){
  //       // name = Model.getProjectFileName();
  //     }
  //     $('.project-name').text(name);
  //     // Model.setProjectName(name);
  //   }
  // }
};

module.exports =  {
  Messages: Messages
};
