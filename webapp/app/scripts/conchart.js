var Messages = require('./messages.js').Messages;


var CC = {
  defaultControls: () => { return [
    {
      type: 'select',
      title: 'Effect measure:',
      id: 'sm',
      tag: 'sm',
      action: 'setSM',
      selections: [
        {
          label:'OR',
          value:'OR',
          validTypes:['binary','iv'],
        },
      ]
    },
  ]},
  bindActions: () => {
  },
  createChart: () => {

  },
  removeChart: () => {
  },
}

module.exports = () => {
  return CC;
}
