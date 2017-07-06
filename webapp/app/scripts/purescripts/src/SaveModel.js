//module SaveModel
"use strict";
  
exports.saveStateImpl = function(position, state){
  return function() {
    if (typeof window.Model !== 'undefined'){
      if (typeof window.Model.state !== 'undefined'){
        if (typeof window.Model.state.project !== 'undefined'){
          console.log("savEing", state, " to ", position);
          var objs = position.split(".");
          console.log("objs",objs);
          var initobj = window.Model.getState().project;
          var toupdate = objs.reduce(
            function (acc, pos) {
              if (typeof acc[pos] === 'undefined'){
                acc[pos] = {};
              }
              if (pos === objs[objs.length - 1]){
                acc[pos] = state;
              }
              return acc[pos];
            },
           initobj 
          );
          window.Model.saveState();
        };
      };
    };
  };
};
