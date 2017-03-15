var Doc = {
  view: {
    register: (model) => {
      Doc.model = model;
    },
  },
  init: () => {},
  render: (model,container) => {
    var tmpl = GRADE.templates.doc(model.getState().text);
    $(container).html(tmpl);
  }
}

module.exports = () => {
  return Doc;
}
