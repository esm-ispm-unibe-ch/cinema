var Model = require('./model.js').Model;

ocpu.seturl('//localhost:8004/ocpu/library/contribution/R');
//Rendering functions
$(document).ready(function () {
  Model.init();
});
