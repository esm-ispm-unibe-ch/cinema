var Welcome = {
  view: {
    register: (model) => {
      Welcome.model = model;
    },
  },
  init: () => {},
  render: (model,container) => {
    var tmpl = GRADE.templates.welcome(model.state.text);
    $(container).html(tmpl);
  }
}

module.exports = () => {
  return Welcome;
}
