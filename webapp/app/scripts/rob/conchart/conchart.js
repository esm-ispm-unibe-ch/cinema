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
    if($("#barChartContainer").is(':empty')){
      ConChart.destroyRender(model);
      let chartData = View(model).createChart();
      let nrows = chartData.labels.length;
      let ndirects = chartData.datasets.length;
      let legendHeight = ndirects * 15 / 5;
      let chartHeight = 20 * nrows + legendHeight;
      console.log('chartheight', chartHeight,'nrows',nrows,'data',chartData);
      $("#barChartContainer").append("<canvas id='barChart' width='400' height='"+chartHeight+"'></chart>");
      let ctx = document.getElementById("barChart");
      ConChart.barChart = new Chart(ctx, {
        type: 'horizontalBar',
        data:  chartData,
        options: {
          scales: {
            xAxes: [{
              stacked: true,
              ticks: {
                   min: 0,
                   max: 100
               }
            }],
            yAxes: [{
              stacked: true,
            }]
          }
        }
      })
    }else{
      console.log('already rendered bar chart');
    }
  },
  destroyRender: (model) => {
    console.log('destroying barchart');
    if (! _.isUndefined(ConChart.barChart)){
      ConChart.barChart.destroy();
    }
    $("#barChartContainer").empty();
  },
  renderChildren: [
  ],
}

module.exports = () => {
  return ConChart;
}
