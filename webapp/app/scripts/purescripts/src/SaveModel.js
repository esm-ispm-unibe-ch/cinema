//module SaveModel
"use strict";
  
exports.saveStateImpl = function(position, state){
  return function() {
    if (typeof window.Model !== 'undefined'){
      if (typeof window.Model.state !== 'undefined'){
        if (typeof window.Model.state.project !== 'undefined'){
          console.log("savEing", state, " to ", position);
          window.Model.getState().project[position] = state;
          window.Model.saveState();
        };
      };
    };
  };
};
