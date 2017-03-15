var Error = {
  init: () => {},
  render: (model,container) => {
    var tmpl = GRADE.templates.error(model.text);
    $(container).html(tmpl);
  }
}

module.exports = () => {
  return Error;
}
