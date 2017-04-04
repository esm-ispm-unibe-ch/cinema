var deepSeek = require('safe-access');
var Update = require('./update.js')();
var View = require('./view.js')();
var Template = require('./template.js')();

var ConChart = {
  actions: {
    save: () => {
      Update(ConChart.model).save();
    },
  },
  view: {
    register: (model) => {
      ConChart.model = model;
      model.Actions.ConChart = ConChart.actions;
    },
  },
  update: {
    updateState: (model) => {
      Update(model).updateState();
    },
  },
  render: (model) => {
    if(View(model).isReady()){
      let children = _.map(ConChart.renderChildren, c => { c.render(model);});
      return Template(model,ConChart.renderChildren);
    }else{
      console.log('ConChart not ready to render');
    }
  },
  afterRender: (model) => {
    if($('#barChartContainer').is(':empty')){
      ConChart.destroyRender(model);
      let chartData = View(model).createChart();
      let nrows = chartData.labels.length;
      let ndirects = chartData.datasets.length;
      let chartHeight = 15 * nrows;
      $('#barChartContainer').append('<canvas style="display:none" id=\'barChartPrinterFriendly\' width=\'300\' height=\''+chartHeight+'\'></chart>');
      let ctxp = document.getElementById('barChartPrinterFriendly');
      ConChart.barChart = new Chart(ctxp, {
        type: 'horizontalBar',
        data:  chartData,
        options: {
          responsive: false,
          legend: {
            display: false,
          },
          scales: {
            xAxes: [{
              stacked: true,
              barThickness: 40,
              ticks: {
                   min: 0,
                   max: 100
               }
            }],
            yAxes: [{
              stacked: true,
            }]
          },
        }
      })
      $('#barChartContainer').append('<canvas style="display:visible" id=\'barChart\' width=\'400\' height=\''+chartHeight+'\'></chart>');
      let ctx = document.getElementById('barChart');
      ConChart.barChart = new Chart(ctx, {
        type: 'horizontalBar',
        data:  chartData,
        options: {
          responsive: true,
          legend: {
            display: false,
          },
          scales: {
            xAxes: [{
              stacked: true,
              barThickness: 40,
              ticks: {
                   min: 0,
                   max: 100
               }
            }],
            yAxes: [{
              stacked: true,
            }]
          },
        }
      })
    }else{
      // console.log('already rendered bar chart');
    }
  },
  destroyRender: (model) => {
    // console.log('destroying barchart');
    if (! _.isUndefined(ConChart.barChart)){
      ConChart.barChart.destroy();
    }
    $('#barChartContainer').empty();
  },
  renderChildren: [
  ],
}

module.exports = () => {
  return ConChart;
}
