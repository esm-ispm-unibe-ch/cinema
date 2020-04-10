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
      model.Actions.IndrChart = ConChart.actions;
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
    }
  },
  afterRender: (model) => {
    if($('#IndrChartContainer').is(':empty')){
      ConChart.destroyRender(model);
      let chartData = View(model).createChart();
      let nrows = chartData.labels.length;
      let ndirects = chartData.datasets.length;
      let chartHeight = 15 * nrows + 20;
      $('#IndrChartContainer').append('<canvas style="display:none" id=\'IndrChartPrinterFriendly\' width=\'300\' height=\''+chartHeight+'\'></chart>');
      let ctxp = document.getElementById('IndrChartPrinterFriendly');
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
      $('#IndrChartContainer').append('<canvas style="display:visible" id=\'IndrChart\' width=\'400\' height=\''+chartHeight+'\'></chart>');
      let ctx = document.getElementById('IndrChart');
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
    }
  },
  destroyRender: (model) => {
    if (! _.isUndefined(ConChart.barChart)){
      ConChart.barChart.destroy();
    }
    $('#IndrChartContainer').empty();
  },
  renderChildren: [
  ],
}

module.exports = () => {
  return ConChart;
}
