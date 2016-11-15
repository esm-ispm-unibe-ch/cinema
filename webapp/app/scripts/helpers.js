Handlebars.registerHelper('if_eq', function(v1, v2, options) {
  if(v1 === v2) {
    return options.fn(this);
  }
  return options.inverse(this);
});

Handlebars.registerHelper('labelROB', function(n) {
  var out = '';
  switch(n){
    case 1:
    out = 'low';
    break;
    case 2:
    out = 'unclear';
    break;
    case 3:
    out = 'high';
    break;
  }
  return out;
});
