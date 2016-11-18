var Messages = require('./messages.js').Messages;
var accumulate = require('./mixins.js').accumulate;
var sumBy = require('./mixins.js').sumBy;
var bindTableResize = require('./mixins.js').bindTableResize;

 var NP = {
  model:{},
  isRendered: false,
   vertices : [],
   edges : [],
   etovRatio : 0.5,
   options: {
     vertexSizeBy: 'numStudies',
     vertexColorBy: 'noColor',
     edgeSizeBy: 'sampleSize',
     edgeColorBy: 'noColor',
     defaultVertexColor: '#61AFD1',
     norobcolor: '#282C34',
     lowrobcolor: ()=>{return NP.model.lowrobcolor},
     unclearrobcolor: ()=>{return NP.model.unclearrobcolor},
     highrobcolor: ()=>{return NP.model.highrobcolor},
     selectedColor: '#C678D7',
     minSize: 30,
     maxSize: 130,
   },

   addElementsToGraph : (model) => {
    NP.vertices = NP.makeNodes(model.long);
    NP.edges = NP.makeEdges(NP.project);
    var elements = [NP.vertices, NP.edges];
    NP.cy.batch( () => {
      NP.cy.add(_.reduce(_.flatten(elements),
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

  makeNodes: (model) => {
    let type = NP.project.type;
    var grouped = _.groupBy(model, tr => {return tr.t});
    var verticeFromGroup = (group) =>{
      var vertex = {id:'', name:'', numStudies:0, sampleSize:0, rSum:0};
      vertex.type='node';
      vertex.id = group[0].t;
      vertex.label = _.isEmpty(group[0]['tn'])?group[0]['t']:group[0]['tn'];
      vertex.studies = accumulate(group,'id');
      vertex.numStudies = group.length;
      if(type!=='iv'){
      vertex.sampleSize = sumBy(group,'n');
      }
      //vertex.rSum = _.reduce(group, function (memo, row){ return memo + row.r},0);
      vertex.rob = accumulate(group,'rob');
      vertex.low = _.filter(vertex.rob, r => {return r===1}).length/vertex.numStudies*100;
      vertex.unclear = _.filter(vertex.rob, r => {return r===2}).length/vertex.numStudies*100;
      vertex.high = _.filter(vertex.rob, r => {return r===3}).length/vertex.numStudies*100;
      return vertex;
    };
    let res = _.map(_.toArray(grouped),(grp)=>verticeFromGroup(grp));
    return res;
  },

  makeEdges: (project) => {
    let edges = project.model.directComparisons;
    return edges;
  },

  resizeElements : (nodeFilter, edgeFilter) => {
    var setSize = (elem, elements, key, minSize=NP.options.minSize, maxSize=NP.options.maxSize, ratio=1) => {
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
    };
    var adjustEdgesWidth = () => {
      var edges = NP.edges;
      var vertices = NP.vertices;
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
      var sizeFactor = NP.etovRatio * maxDiff.vsize / (-maxDiff.diff+maxDiff.vsize);
      // console.log('adjusting edge size',maxDiff,sizeFactor);
      if(maxDiff.diff<0){
        _.map(edges, e =>{e.renderSize *= sizeFactor});
      }
    };
    var renderElements = () =>{
      var elements = NP.vertices.concat(NP.edges);
      NP.cy.batch( () => {
        _.map(elements, (e) => {
          var elem = e.type;
          if(e.renderSize<40){
            NP.cy.elements(elem+'[id="'+e.id+'"]').style({'text-valign':'top'});
          }else{
            NP.cy.elements(elem+'[id="'+e.id+'"]').style({'text-valign':'center'});
          }
          NP.cy.elements(elem+'[id="'+e.id+'"]').style({'width':e.renderSize,'height':e.renderSize});
        });
      });
    };
    setSize('node', NP.vertices, nodeFilter);
    setSize('edge', NP.edges, edgeFilter);
    adjustEdgesWidth();
    renderElements();
  },

  colorVertices : (filter) => {
    let vertices = NP.vertices;
      NP.cy.batch( () => {
      if(filter === 'noColor'){
        _.map(vertices, n => {
          NP.cy.elements('node[id="'+n.id+'"]').style({
            'pie-size': 0,
          });
        });
      }else{
        _.map(vertices, n => {
          NP.cy.elements('node[id="'+n.id+'"]').style({
            'pie-size': '87%',
          });
        });
      }
    });
  },

  colorEdges : (filter) => {
    var edges = NP.edges;
    var colors = [NP.options.lowrobcolor,NP.options.unclearrobcolor,NP.options.highrobcolor];
    NP.cy.batch( () => {
      _.map(NP.edges, e => {
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
          e.ecolor = NP.options.norobcolor;
          break;
        }
          NP.cy.elements('edge[id="'+e.id+'"]')
          .style({'line-color':e.ecolor});
      });
    });
  },
  cyInit : (containerId) => {
    if(typeof NP.cy !== 'undefined'){
      NP.cy.destroy();
    }
    NP.cy = cytoscape({
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
        'color': NP.options.norobcolor,
        'text-outline-color': NP.options.defaultVertexColor,
        'text-outline-width':'1px',
        'background-color': NP.options.defaultVertexColor,
        'width': '60px',
        'height': '60px',
        'pie-size': '87%',
        'pie-1-background-color':NP.options.lowrobcolor,
        'pie-2-background-color':NP.options.unclearrobcolor,
        'pie-3-background-color':NP.options.highrobcolor,
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
          label:'Sample Size',
          value:'sampleSize',
          isAvailable:true,
        },
        {
          label:'Number of studies',
          value:'numStudies',
          isAvailable:true,
        }
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
          label:'ROB',
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
        label:'Majority ROB',
        value:'majority',
        isAvailable:true,
        },
        {
        label:'Mean ROB',
        value:'mean',
        isAvailable:true,
        },
        {
        label:'Maximum ROB',
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
  getControls: (type) => {
    let controls =  NP.defaultControls();
      if(type === 'iv'){
      controls[0].selections[0].isAvailable = false;
      controls[2].selections[0].isAvailable = false;
      controls[2].selections[2].isAvailable = true;
      NP.options.vertexSizeBy = 'numStudies';
      NP.options.edgeSizeBy = 'numStudies';
    }
    _.map(controls, c => {
      let def = NP.options[c.tag];
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
  filterModelByNode: (filter,fields) => {
    let model = NP.project.model.wide;
    return _.filter(model, r => {
      return _.some(_.map(fields, field => {
        return filter === r[field].toString();
      }))
    });
  },
  filterModelByEdge: (filter,fields) => {
    let model = NP.project.model.wide;
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
    $('#m-table-container').click(()=>{
      let hot = (()=>{return CM.hot})();
      if(typeof hot !== 'undefined'){
        CM.resizeTable(hot);
      }
    });
    cy.on('select', 'edge', () => {
      let e = cy.$('edge:selected');
      e.style({'line-color':NP.options.selectedColor});
      e.addClass('selectedEdge');
      let filteredModel = NP.filterModelByEdge(e.id(), ['t1','t2']);
      NP.showTable('np-table', filteredModel)
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
        'text-outline-color': NP.options.selectedColor,
        'background-color': NP.options.selectedColor,
      }),
      n.addClass('selectedNode');
      let filteredModel = NP.filterModelByNode(n.id(), ['t1','t2']);
      NP.showTable('np-table', filteredModel)
        .then(hot => {
          bindTableResize(hot, 'np-table-container');
        });
    });
    cy.on('unselect', 'node', () => {
      let n = cy.$('.selectedNode');
      n.style({
        'text-outline-color': NP.options.defaultVertexColor,
        'background-color': NP.options.defaultVertexColor
      });
      n.removeClass('selectedNode');
    });
    cy.on('tap', function(event){
    // cyTarget holds a reference to the originator
    // of the event (core or element)
    var evtTarget = event.cyTarget;
    if( evtTarget === cy ){
      // console.log('tap on background');
      NP.showWholeTable();
    } else {
      // console.log('tap on some element');
    }
});
  },
  bindActions: () => {
    window.addEventListener('resize', ()=>{
      NP.isRendered=false;
    });
    $('.np-redraw').bind('click', () =>{
      NP.cy.layout({name:'circle'});
    });
    $('#cyContainer').bind('click', function () {
      Messages.updateInfo({title:'Visualization Tools', cont:'NetPlot: representing the project as a graph'});
    });
    $('.netplotControl').bind('change', function() {
        var filter = $('option:selected', this).attr('filter');
        var action = $(this).attr('action');
        var controls = _.find(NP.controls, c => {return c.action == action});
        _.map(controls.selections, (sel) => {sel.isActive = sel.value===filter? true: false;});
        var action = $(this).attr('action');
        switch (action){
          case 'changeVertexSize':
            NP.options.vertexSizeBy = filter;
            NP.resizeElements(filter,NP.options.edgeSizeBy);
            break;
          case 'colorVertices':
            NP.options.vertexColorBy = filter;
            NP.colorVertices(filter);
            break;
          case 'changeEdgeSize':
            NP.options.edgeSizeBy = filter;
            NP.resizeElements(NP.options.vertexSizeBy,filter);
            break;
          case 'colorEdges':
            NP.options.edgeColorBy = filter;
            NP.colorEdges(filter);
            break;
      }
    });
  },
  project: {}
  ,
  init: (model) => {
    NP.model = model;
    let project = model.getProject();
    if(NP.project.id!==project.id){
      NP.project = project;
      NP.isRendered = false;
    }
    if (!(NP.isRendered)){
      $('#cy').empty();
      $(document).ready( () => {
        NP.controls = NP.getControls(NP.project.type);
        var cytmpl = GRADE.templates.netplot(NP);
        $('#netplotContainer').html(cytmpl);
        NP.bindActions();
        NP.cyInit('cy');
        NP.addElementsToGraph(NP.project.model);
        NP.resizeElements(NP.options.vertexSizeBy,NP.options.edgeSizeBy);
        NP.colorEdges(NP.options.edgeColorBy);
        NP.colorVertices(NP.options.vertexColorBy);
        NP.cy.layout({name:'circle'});
        NP.bindElementSelection(NP.cy);
        NP.showWholeTable();
        NP.isRendered = true;
      });
    }
  },
  showWholeTable: () => {
    NP.removeTable('np-table');
    NP.showTable('np-table', NP.project.model.wide)
      .then(hot => {
      bindTableResize(hot, 'np-table-container');
    });
  },
  showTable: (container, data) => {
    NP.removeTable('np-table');
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

}

module.exports = () => {
  return NP;
}
