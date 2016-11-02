var Messages = require('./messages.js').Messages;
var Model = require('./model.js').Model;

 var NP = {
  isRendered: false,
   vertices : [],
   edges : [],
   etovRatio : 0.5,
   options: {
     vertexSizeBy: 'numStudies',
     edgeSizeBy: 'sampleSize',
     edgeColorBy: 'majority',
     norobcolor: '#282C34',
     lowrobcolor: '#7CC9AE',
     unclearrobcolor: '#FBBC05',
     highrobcolor: '#E0685C',
     minSize: 30,
     maxSize: 130
   },

   addElementsToGraph : (model) => {
    NP.vertices = NP.makeNodes(model.long);
    NP.edges = NP.makeEdges(model.wide);
    var elements = [NP.vertices, NP.edges];
     NP.cy.add(_.reduce(_.flatten(elements),
         function(memo, nd){
          nd.width = nd.sampleSize;
          var keyList = Object.keys(nd);
          return memo.concat([
            {data: nd}
          ])
        }
      ,[]
      )
    )
  },

  makeNodes: (model) => {
    let type = NP.project.type;
    var grouped = _.groupBy(model, tr => {return tr.t});
    var verticeFromGroup = (group) =>{
      var vertex = {id:'', name:'', numStudies:0, sampleSize:0, rSum:0};
      vertex.type='node';
      vertex.id = group[0].t;
      vertex.label = _.isEmpty(group[0]['tn'])?group[0]['t']:group[0]['tn'];
      vertex.numStudies = group.length;
      if(type!=='iv'){
      vertex.sampleSize = _.reduce(group, function (memo, row){ return memo + row.n},0);
      }else{
      vertex.sampleSize = group.length;
      }
      //vertex.rSum = _.reduce(group, function (memo, row){ return memo + row.r},0);
      vertex.rob = _.reduce(group, function (memo, row){ return memo.concat(row.rob);},[]);
      return vertex;
    };
    return _.map(_.toArray(grouped),(grp)=>verticeFromGroup(grp));
  },

  makeEdges: (model) => {
    let type = NP.project.type;
    var uniqId = (ida,idb) => {
        return [ida,idb].sort(function (a,b){return a-b;});
    };

    var sumBy = (list, keys) => {
      return _.reduce(list, (memo, el) => {return memo + el[keys[0]]+el[keys[1]]}, 0);
    };

    let accumulate = (list, key) => {
      return _.reduce(list, (memo, el) => {return memo.concat([el[key]]);},[]);
    };

    let comparisons = _.groupBy(model, row => {
      return uniqId(row.t1,row.t2).toString();
    });

    var edges = _.map( _.toArray(comparisons), comp => {
      let row = {
        type:'edge',
        id: uniqId(comp[0].t1,comp[0].t2).toString(),
        studies: accumulate(comp,'id'),
        source: uniqId(comp[0].t1,comp[0].t2)[0],
        target: uniqId(comp[0].t1,comp[0].t2)[1],
        numStudies: comp.length,
        rob: accumulate(comp,'rob'),
      };
      if(type !== 'iv'){
        row.sampleSize = sumBy(comp,['n1','n2']);
      }else{
        row.sampleSize = _.reduce(comp, (iv,s) => {
          let au = Math.pow(1/s.se,2);
          return iv + au;
        },0);
      }
      return row;
      });
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
    _.map(elements, (e) => {
      var elem = e.type;
      if(e.renderSize<40){
      NP.cy.elements(elem+'[id="'+e.id+'"]').style({'text-valign':'top'});
      }
      NP.cy.elements(elem+'[id="'+e.id+'"]').style({'width':e.renderSize,'height':e.renderSize});});
    };
    setSize('node', NP.vertices, nodeFilter);
    setSize('edge', NP.edges, edgeFilter);
    adjustEdgesWidth();
    renderElements();
  },

  colorEdges : (filter) => {
    var edges = NP.edges;
    var colors = [NP.options.lowrobcolor,NP.options.unclearrobcolor,NP.options.highrobcolor];
    _.map(NP.edges, e => {
      var totalrob = 0;
      switch(filter){
        case 'majority':
        totalrob = _.first(
          _.sortBy(
            _.sortBy(
              _.groupBy(e.rob, rob => {return rob}),
              robs => {
                return -robs[0];
              }
            ),
            robs => {
              return -robs.length;
            }
          )
        )[0];
        //console.log(e.rob,totalrob);
        e.ecolor = colors[totalrob-1];
        break;
        case 'mean':
        totalrob = _.reduce(e.rob, (memo,rob) => {
          return memo + rob;
        },0) / e.rob.length;
        totalrob = Math.round(totalrob);
        e.ecolor = colors[totalrob-1];
        //console.log(totalrob);
        break;
        case 'max':
        totalrob = _.reduce(e.rob, (memo,rob) => {
          return memo > rob ? memo : rob;
        },0);
        //console.log(e.rob,totalrob);
        e.ecolor = colors[totalrob-1];
        //console.log(totalrob);
        break;
        case 'noColor':
        e.ecolor = NP.options.norobcolor;
        break;
      }
      NP.cy.elements('edge[id="'+e.id+'"]').style({'line-color':e.ecolor});
    });
  },

  cyIsReady : false,
  cy : {},
  cyInit : (containerId) => {
    NP.cy = cytoscape({
    container: document.getElementById(containerId), // container to render in
    zoomingEnabled: 1,
    style: [
        {
          selector: 'node',
          style: {
            'content': 'data(label)',
            'text-valign': 'center',
            'text-halign': 'center',
            'text-outline-color':'#61AFD1',
            'text-outline-width':'1px',
            'background-color': '#61AFD1'
          }
        },
        {
          selector: ':parent',
          style: {
            'background-opacity': 1.0
          }
        }
      ]

    });
  },

  defaultControls: () => {return [
    {
      type: 'button',
      title: 'Vertex size by:',
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
          label:'# of Studies',
          value:'numStudies',
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
        label:'# of Studies',
        value:'numStudies',
        isAvailable:true,
      },
        {
        label:'inverse variance',
        value:'sampleSize',
        isAvailable:false,
        }
      ]
    },
    {
      type: 'button',
      title: 'Edges Color by:',
      id: 'edgeColorControls',
      tag: 'edgeColorBy',
      action: 'colorEdges',
      selections: [
        {
        label:'Majority rob',
        value:'majority',
        isAvailable:true,
        },
        {
        label:'Mean rob',
        value:'mean',
        isAvailable:true,
        },
        {
        label:'Maximum rob',
        value:'max',
        isAvailable:true,
        },
        {
        label:'No Coloring',
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
      controls[1].selections[0].isAvailable = false;
      controls[1].selections[2].isAvailable = true;
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
  bindActions: () => {
    window.addEventListener('resize', ()=>{
      NP.isRendered=false;
    });
    $('.np-redraw').bind('click', () =>{
      NP.cy.layout();
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
  model:{}
  ,
  init: () => {
    if(NP.project.id!==Model.getProject().id){
      NP.project = Model.getProject();
      NP.isRendered = false;
    }
    if(Model.project.format==='long'){
      NP.model.long = NP.project.model;
      NP.model.wide = Model.reshaper.longToWide(NP.project.model,NP.project.type);
    }else{
      NP.model.long = Model.reshaper.wideToLong(NP.project.model,NP.project.type);
      NP.model.wide = NP.project.model;
    }
    if (!(NP.isRendered)){
      $('#cy').empty();
      $(document).ready( () => {
        NP.controls = NP.getControls(NP.project.type);
        var cytmpl = GRADE.templates.netplot(NP);
        $('#netplotContainer').html(cytmpl);
        NP.bindActions();
        NP.cyInit('cy');
        NP.addElementsToGraph(NP.model);
        NP.resizeElements(NP.options.vertexSizeBy,NP.options.edgeSizeBy);
        NP.colorEdges(NP.options.edgeColorBy);
        NP.cy.layout(NP.cyOptions);
        NP.isRendered = true;
      });
    }
  },
  cyOptions :{
    name: 'circle',
    avoidOverlap: true,
    fit:true,
    ready: () => {
      NP.cyIsReady = true;
      NP.cy.center();
    }
  }
}

module.exports = () => {
  return NP;
}
