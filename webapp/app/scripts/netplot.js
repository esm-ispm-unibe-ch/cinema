var deepSeek = require('safe-access');
var h = require('virtual-dom/h');
var VNode = require('virtual-dom/vnode/vnode');
var VText = require('virtual-dom/vnode/vtext');
var convertHTML = require('html-to-vdom')({
     VNode: VNode,
     VText: VText
});
var clone = require('./lib/mixins.js').clone;
var Messages = require('./messages.js').Messages;
var accumulate = require('./lib/mixins.js').accumulate;
var sumBy = require('./lib/mixins.js').sumBy;
var bindTableResize = require('./lib/mixins.js').bindTableResize;

var NP = {
  actions: {
    selectOption: () => {
      $(document).on('change','select.netplotControl', {} ,e=>{
          var key = $(e.currentTarget).attr('data-option');
          var value = $(e.currentTarget).children('option:selected').attr('filter');
          NP.update.selectOption(key,value);
      });
    },
    redrawNP: () => {
      $(document).on('click','.np-redraw', {} ,e=>{
        NP.view.cy.layout({name:'circle'});
      });
    },
    exportNP: () => {
      $(document).on('click','#np-save', {} ,
        e=>{
          let img = NP.view.cy.png();
          var download = document.getElementById('np-save');
          download.href = img;
          download.download = NP.view.getProject().filename+'_netplot.png';
      });
    },
  },
  view: {
    getProject: () => {
      return NP.model.getState().project;
    },
    vertices : [],
    edges : [],
    etovRatio : 0.5,
    addElementsToGraph : () => {
    NP.view.vertices = NP.view.getProject().studies.nodes;
    NP.view.edges = NP.view.getProject().studies.directComparisons;
    var elements = [NP.view.vertices, NP.view.edges];
    NP.view.cy.batch( () => {
      NP.view.cy.add(_.reduce(_.flatten(elements),
        function(memo, nd){
          nd.width = nd.sampleSize;
          var keyList = Object.keys(nd);
          return memo.concat([
            {
              data: nd,
              selectable: true
            }
          ])
          }
          ,[]
        )
      )
    });
    },
    resizeElements : (nodeFilter, edgeFilter) => {
      let nFilter = nodeFilter;
      let eFilter = edgeFilter;
      var setSize = (elem, elements, key, minSize=NP.view.getOptions().minSize, maxSize=NP.view.getOptions().maxSize, ratio=1) => {
        if(key!=='equal'){
          var minVertexSize = (elements, key) => {return _.reduce(elements, (memo, e)=>{return memo<e[key]&&memo!==-1?memo:e[key];},-1)};
          var maxVertexSize = (elements, key) => {return _.reduce(elements, (memo, e)=>{return memo>e[key]?memo:e[key];},0)};
          var aggregate = (elements, key) => {return  _.reduce(elements, (memo, e)=>{return memo+e[key]},0)};
          var minRuleRatio = minSize / minVertexSize(elements,key);
          var maxRuleRatio = maxSize / maxVertexSize(elements,key);
          var ratio = maxVertexSize(elements,key)*minRuleRatio>maxSize?maxRuleRatio:minRuleRatio;
          _.reduce(elements, (memo,e) => {
            e.renderSize = e[key]*ratio;
            //console.log(e.renderSize);
            return memo.concat(e);},[])
        }else{
          _.reduce(elements, (memo,e) => {
            e.renderSize = NP.view.etovRatio * maxSize;
            //console.log(e.renderSize);
            return memo.concat(e);},[])
        }
      };
      var adjustEdgesWidth = () => {
        var edges = NP.view.edges;
        var vertices = NP.view.vertices;
        var connectedNodes = (edge) => {
          var st =[edge.source,edge.target];
          var out =  _.map(st,(n)=>{return _.find(vertices,v=>{return v.id==n})});
          return out;
        }
        var sizeDiff = e => _.map(connectedNodes(e), n=>{
          var diff=n.renderSize - e.renderSize;
          return {diff:diff,vsize:n.renderSize}; });
        var diffs =_.reduce(edges, (memo,e) => {
          return memo.concat(sizeDiff(e));
        },[]);
        var maxDiff = _.reduce(diffs, (memo, d) => {
          return memo.diff/memo.vsize>=d.diff/d.vsize?d:memo;
        },{diff:0,vsize:1});
        var sizeFactor = NP.view.etovRatio * maxDiff.vsize / (-maxDiff.diff+maxDiff.vsize);
        // console.log('adjusting edge size',maxDiff,sizeFactor);
        if(maxDiff.diff<=0){
          _.map(edges, e =>{e.renderSize *= sizeFactor});
        }
        if(nFilter==='equal'&&eFilter==='equal'){
          _.map(edges, e =>{e.renderSize = 10;});
        }
      };
      var renderElements = () =>{
        var elements = NP.view.vertices.concat(NP.view.edges);
        NP.view.cy.batch( () => {
          _.map(elements, (e) => {
            var elem = e.type;
            if(e.renderSize<40){
              NP.view.cy.elements(elem+'[id="'+e.id+'"]').style({'text-valign':'top'});
            }else{
              NP.view.cy.elements(elem+'[id="'+e.id+'"]').style({'text-valign':'center'});
            }
            NP.view.cy.elements(elem+'[id="'+e.id+'"]').style({'width':e.renderSize,'height':e.renderSize});
          });
        });
      };
      setSize('node', NP.view.vertices, nodeFilter);
      setSize('edge', NP.view.edges, edgeFilter);
      adjustEdgesWidth();
      renderElements();
    },

    colorVertices : (filter) => {
      let vertices = NP.view.vertices;
        NP.view.cy.batch( () => {
        if(filter === 'noColor'){
          _.map(vertices, n => {
            NP.view.cy.elements('node[id="'+n.id+'"]').style({
              'pie-size': 0,
            });
          });
        }else{
          _.map(vertices, n => {
            NP.view.cy.elements('node[id="'+n.id+'"]').style({
              'pie-size': '92%',
            });
          });
        }
      });
    },

    colorEdges : (filter) => {
      var edges = NP.view.edges;
      var colors = [NP.view.getOptions().lowrobcolor,NP.view.getOptions().unclearrobcolor,NP.view.getOptions().highrobcolor];
      NP.view.cy.batch( () => {
        _.map(NP.view.edges, e => {
          var totalrob = 0;
          switch(filter){
            case 'majority':
            e.ecolor = colors[e.majrob-1];
            break;
            case 'mean':
            e.ecolor = colors[e.meanrob-1];
            break;
            case 'max':
            e.ecolor = colors[e.maxrob-1];
            break;
            case 'noColor':
            e.ecolor = NP.view.getOptions().norobcolor;
            break;
          }
            NP.view.cy.elements('edge[id="'+e.id+'"]')
            .style({'line-color':e.ecolor});
        });
      });
    },
    cyInit : (containerId) => {
      NP.view.cy = cytoscape({
        container: document.getElementById(containerId), // container to render in
        zoomingEnabled: 1,
        avoidOverlap: true,
        zoomingEnabled: true,
        userZoomingEnabled: false,
        fit:true,
        layout :{
          name: 'circle',
          ready: () => {
            // NP.cyIsReady = true;
            // NP.cy.center();
          }
        },
        style: cytoscape.stylesheet()
        .selector('node')
        .style({
          'content': 'data(label)',
          'text-valign': 'center',
          'text-halign': 'center',
          'node-text-rotation': 'autorotate',
          'color': NP.view.getOptions().norobcolor,
          //'color': "#D7D787",
          //'text-outline-color': NP.view.getOptions().defaultVertexColor,
          'text-outline-color': "#84A8C7",
          'text-outline-width':'0.5px',
          'background-color': NP.view.getOptions().defaultVertexColor,
          'width': '60px',
          'height': '60px',
          'pie-size': '92%',
          'pie-1-background-color':NP.view.getOptions().lowrobcolor,
          'pie-2-background-color':NP.view.getOptions().unclearrobcolor,
          'pie-3-background-color':NP.view.getOptions().highrobcolor,
          'pie-1-background-size': 'mapData(low, 0, 100, 0, 100)',
          'pie-2-background-size': 'mapData(unclear, 0, 100, 0, 100)',
          'pie-3-background-size': 'mapData(high, 0, 100, 0, 100)'
        })
      });
    },
    defaultControls: () => {return [
      {
        type: 'button',
        title: 'Node size by:',
        id: 'vertexWidthControls',
        tag: 'vertexSizeBy',
        action: 'changeVertexSize',
        selections: [
          {
            label:'Equal size',
            value:'equal',
            isAvailable:true,
          },
          {
            label:'Sample size',
            value:'sampleSize',
            isAvailable:true,
          },
          {
            label:'Number of studies',
            value:'numStudies',
            isAvailable:true,
          },
        ]
      },
      {
        type: 'button',
        title: 'Node color by:',
        id: 'vertexColorControls',
        tag: 'vertexColorBy',
        action: 'colorVertices',
        selections: [
          {
            label:'Risk of Bias',
            value:'rob',
            isAvailable:true,
          },
          {
            label:'No color',
            value:'noColor',
            isAvailable:true,
          }
        ]
      },
      {
        type: 'button',
        tag: 'edgeSizeBy',
        title: 'Edge width by:',
        id: 'edgeWidthControls',
        action: 'changeEdgeSize',
        selections: [
          {
            label:'Equal size',
            value:'equal',
            isAvailable:true,
          },
          {
          label:'Sample Size',
          value:'sampleSize',
          isAvailable:true,
          },
          {
          label:'Number of studies',
          value:'numStudies',
          isAvailable:true,
        },
          {
          label:'Inverse variance',
          value:'iv',
          isAvailable:false,
          }
        ]
      },
      {
        type: 'button',
        title: 'Edge color by:',
        id: 'edgeColorControls',
        tag: 'edgeColorBy',
        action: 'colorEdges',
        selections: [
          {
          label:'Majority RoB',
          value:'majority',
          isAvailable:true,
          },
          {
          label:'Average RoB',
          value:'mean',
          isAvailable:true,
          },
          {
          label:'Highest RoB',
          value:'max',
          isAvailable:true,
          },
          {
          label:'No color',
          value:'noColor',
          isAvailable:true,
          },
        ]
      }
    ]},
    controls: () => {
      let type = NP.model.getState().project.type;
      let format = NP.model.getState().project.format;
      let controls =  NP.view.defaultControls(); if(format === 'iv'){
        controls[0].selections[1].isAvailable = false;
        controls[2].selections[1].isAvailable = false;
        controls[2].selections[3].isAvailable = true;
      }
      _.map(controls, c => {
        let def = NP.view.getOptions()[c.tag];
        _.map(c.selections, sl => {
          if(sl.value === def ){
            sl.isActive = true;
          }else{
            sl.isActive = false;
          }
        });
      });
      return controls;
    },
    filterStudiesByNode: (filter,fields) => {
      let model = NP.view.getProject().studies.wide;
      return _.filter(model, r => {
        return _.some(_.map(fields, field => {
          return filter === r[field].toString();
        }))
      });
    },
    filterStudiesByEdge: (filter,fields) => {
      let model = NP.view.getProject().studies.wide;
      let out= {};
      if(filter===''){
        out = model;
      }else{
        out = _.filter(model, r => {
          let pred = _.map(fields, field => {return r[field]});
          let lkj = pred.sort().toString()
          return lkj=== filter;
        });
      }
      return out;
    },
    bindElementSelection: (cy) => {
      cy.on('select', 'edge', () => {
        let e = cy.$('edge:selected');
        e.style({'line-color':NP.view.getOptions().selectedColor});
        e.addClass('selectedEdge');
        let filteredStudies = NP.view.filterStudiesByEdge(e.id(), ['t1','t2']);
        NP.view.showTable('np-table', filteredStudies)
          .then(hot => {
            bindTableResize(hot, 'np-table-container');
          });
      });
      cy.on('unselect', 'edge', () => {
        let e = cy.$('.selectedEdge');
        let ec = e.json().data.ecolor;
        e.style({'line-color': ec});
        e.removeClass('selectedEdge');
      });
      cy.on('select', 'node', () => {
        let n = cy.$('node:selected');
        let ndata = n.json().data;
        n.style({
          'text-outline-color': NP.view.getOptions().selectedColor,
          'background-color': NP.view.getOptions().selectedColor,
        }),
        n.addClass('selectedNode');
        let filteredStudies = NP.view.filterStudiesByNode(n.id(), ['t1','t2']);
        NP.view.showTable('np-table', filteredStudies)
          .then(hot => {
            bindTableResize(hot, 'np-table-container');
          });
      });
      cy.on('unselect', 'node', () => {
        let n = cy.$('.selectedNode');
        n.style({
          'text-outline-color': NP.view.getOptions().defaultVertexColor,
          'background-color': NP.view.getOptions().defaultVertexColor
        });
        n.removeClass('selectedNode');
      });
      cy.on('tap', function(event){
      // cyTarget holds a reference to the originator
      // of the event (core or element)
      var evtTarget = event.cyTarget;
      if( evtTarget === cy ){
        // console.log('tap on background');
        NP.view.showWholeTable();
      } else {
        // console.log('tap on some element');
      }
      });
    },
    showWholeTable: () => {
      NP.view.removeTable('np-table');
      NP.view.showTable('np-table', NP.view.getProject().studies.wide)
        .then(hot => {
        bindTableResize(hot, 'np-table-container');
      });
    },
    showTable: (container, data) => {
      NP.view.removeTable('np-table');
      return new Promise((resolve, reject)=>{
        let cont = document.getElementById(container);
        var rendered = false;
        var hot = new Handsontable(cont, {
          data: data,
          // height: 700,
          // width: 700,
          manualColumnMove: true,
          renderAllRows:true,
          rowHeights: 23,
          rowHeaders: true,
          colHeaders: true,
          colHeaders: Object.keys(data[0]),
          width: $('#np-table-container').width(),
          height: $('#np-table-container').height(),
          columns: _.map(Object.keys(data[0]), k => {
            return { data: k, readOnly: true };
          }),
          afterRender: () => {
            if(rendered===false){
              rendered=true;
            }
          },
        });
        resolve(hot);
      });
    },
    removeTable: (container) => {
      $('#'+container).empty();
    },
    getOptions: () => {
      return NP.model.getState().project.NP.options;
    },
    register: (model) => {
      NP.model = model;
      model.Actions.Netplot = NP.update;
      _.mapObject(NP.actions, (f,n) => {f();});
    },
    isReady: () => {
      let isReady = false;
      if (! _.isUndefined(deepSeek(NP,'model.getState().project.NP'))){
        isReady = true;
      }
      return isReady;
    }, 
    hasChanged: () => {
      let np = NP.model.getState().project.NP;
      if ( _.isUndefined(NP.npstate)||$('#cy').is(':empty') ){
        NP.npstate = clone(np);
        return true;
      }else{
        if(_.isEqual(NP.npstate,np)) {
          return false;
        }else{
          NP.npstate = clone(np);
          return true;
        }
      }
    }
  },
  update: {
    updateState: () => {
      if ( typeof NP.model.getState().project.NP === 'undefined'){
        let lowrobcolor = NP.model.getState().project.robLevels[0].color;
        let unclearrobcolor = NP.model.getState().project.robLevels[1].color;
        let highrobcolor = NP.model.getState().project.robLevels[2].color;
        NP.update.setState({
          options: {
            vertexSizeBy: 'equal',
            vertexColorBy: 'noColor',
            edgeSizeBy: 'equal',
            edgeColorBy: 'noColor',
            defaultVertexColor: '#84A8C7',
            lowrobcolor: lowrobcolor,
            unclearrobcolor: unclearrobcolor,
            highrobcolor: highrobcolor, 
            norobcolor: '#282C34',
            selectedColor: '#2C4D6D',
            minSize: 30,
            maxSize: 130,
          }
        });
        NP.hasChanged = true;
      }else{
        //console.log('init state netplot already initiated');
      }
    },
    setState: (np) => {
      NP.model.getState().project.NP = np;
      _.map(NP.children, c => {c.update.updateState()});
      NP.model.saveState();
    },
    selectOption:(key,value) => {
      NP.model.getState().project.NP.options[key] = value;
      NP.model.saveState();
    },
  },
  render: (model) => {
    if (NP.view.isReady()){
      var tmpl = GRADE.templates.netplot({text:NP.model.state,view:NP.view});
      return h('div#netplotContainer.col-xs-12',convertHTML(tmpl));
    }else{
    }
  },
  afterRender: () => {
    if (NP.view.hasChanged()) {
      if (! _.isUndefined(deepSeek(NP,'view.cy'))){NP.view.cy.destroy()};
      NP.view.cyInit('cy');
      NP.view.addElementsToGraph();
      NP.view.resizeElements(NP.view.getOptions().vertexSizeBy,NP.view.getOptions().edgeSizeBy);
      NP.view.colorEdges(NP.view.getOptions().edgeColorBy);
      NP.view.colorVertices(NP.view.getOptions().vertexColorBy);
      NP.view.cy.layout({name:'circle'});
      NP.view.showWholeTable();
      NP.view.bindElementSelection(NP.view.cy);
    }
  },
  children: [
  ],
}

module.exports = () => {
  return NP;
}
