'use strict';
console.log('\'Allo \'Allo! netplot js here!');


 var NP = {
   vertices : [],
   edges : [],
   etovRatio : 0.5,
   options: {
     vertexSizeBy: 'sampleSize',
     edgeSizeBy: 'sampleSize',
     edgeColorBy: 'majority',
     noROBcolor: '#282C34',
     lowROBcolor: '#9DA5B4',
     unclearROBcolor: '#FBBC05',
     highROBcolor: '#E0685C',
   },

   makeVertices : (model) => {
     var elements = NP.makeGraphFromTreatments(model);
     [NP.vertices, NP.edges] = elements;
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

  makeGraphFromTreatments : (model) => {
    var grouped = _.groupBy(model, tr => {return tr.Treatment});
    var verticeFromGroup = (group) =>{
      var vertex = {id:'', name:'', numStudies:0, sampleSize:0, rSum:0};
      vertex.type='node';
      vertex.id = group[0].Treatment;
      vertex.label = group[0]['Treatment Name'];
      vertex.numStudies = group.length;
      vertex.sampleSize = _.reduce(group, function (memo, row){ return memo + row.n},0);
      vertex.rSum = _.reduce(group, function (memo, row){ return memo + row.r},0);
      vertex.ROB = _.reduce(group, function (memo, row){ return memo + row.ROB},0);
      return vertex;
    };
    var edgeConstructor = (trA,trB,numStudies=1,sampleSize=0,ROB=0) => {
      var aid = (trA,trB) => {
        return [trA,trB].sort(function (a,b){return a-b;});
      };
      return {
        id: aid(trA,trB).toString(),
        trA:aid(trA,trB)[0],
        trB:aid(trA,trB)[1],
        numStudies:numStudies,
        sampleSize:sampleSize,
        ROB:ROB
      }
    };

    var uniqId = (ida,idb) => {
        return [ida,idb].sort(function (a,b){return a-b;});
    };

    var sumBy = (list, key) =>{
      return _.reduce(list, (memo, el) => {return memo + el[key]}, 0);
    };

    var vertices = _.map(_.toArray(grouped),(grp)=>verticeFromGroup(grp));
    var studies =  _.groupBy(model, row => {;return row['Study id']});
    var comparisons = _.groupBy(_.toArray(studies), (st) => {return uniqId(st[0].Treatment,st[1].Treatment);});
    var keyList = (obj) => {return  Object.keys(obj)};
    var edges = _.map(keyList(comparisons),(key)=>{return {
      type:'edge',
      id:key,
      source: comparisons[key][0][0].Treatment,
      target: comparisons[key][0][1].Treatment,
      numStudies: comparisons[key].length,
      sampleSize: sumBy(_.flatten(comparisons[key]),'n'),
      r: sumBy(_.flatten(comparisons[key]),'r'),
      ROB: _.reduce(comparisons[key],(memo, el) => {return memo.concat(el[0].ROB)},[]),
      studies: comparisons[key]
    }
      ;});
    return [vertices,edges];
  },



  resizeElements : (nodeFilter, edgeFilter) => {
    NP.options.vertexSizeBy = nodeFilter;
    NP.options.edgeSizeBy = edgeFilter;
    var setSize = (elem, elements, key, minSize=30, maxSize=140, ratio=1) => {
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
      console.log('adjusting edge size',maxDiff,sizeFactor);
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
    var colors = [NP.options.lowROBcolor,NP.options.unclearROBcolor,NP.options.highROBcolor];
    _.map(NP.edges, e => {
      var totalROB = 0;
      switch(filter){
        case 'majority':
        totalROB = _.first(
          _.sortBy(
            _.sortBy(
              _.groupBy(e.ROB, rob => {return rob}),
              robs => {
                return -robs[0];
              }
            ),
            robs => {
              return -robs.length;
            }
          )
        )[0];
        //console.log(e.ROB,totalROB);
        e.ecolor = colors[totalROB-1];
        break;
        case 'mean':
        totalROB = _.reduce(e.ROB, (memo,rob) => {
          return memo + rob;
        },0) / e.ROB.length;
        totalROB = Math.round(totalROB);
        e.ecolor = colors[totalROB-1];
        //console.log(totalROB);
        break;
        case 'max':
        totalROB = _.reduce(e.ROB, (memo,rob) => {
          return memo > rob ? memo : rob;
        },0);
        //console.log(e.ROB,totalROB);
        e.ecolor = colors[totalROB-1];
        //console.log(totalROB);
        break;
        case 'noColor':
        e.ecolor = NP.options.noROBcolor;
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
    zoomingEnabled: 0,
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

  addControls : (controlContainer, tmplt) => {
    $(controlContainer).append(tmplt);
  },

  controls : [
    {
      type: 'button',
      title: 'Vertex size by:',
      id: 'vertexWidthControls',
      selections: [
        {
          label:'Sample Size',
          value:'sampleSize',
          isActive:true,
          action: 'changeVertexSize'
        },
        {
          label:'# of Studies',
          value:'numStudies',
          isActive:false,
          action: 'changeVertexSize'
        }
      ]
    },
    {
      type: 'button',
      title: 'Edge width by:',
      id: 'edgeWidthControls',
      selections: [
        {
        label:'Sample Size',
        value:'sampleSize',
        isActive:true,
        action: 'changeEdgeSize'
        },
        {
        label:'# of Studies',
        value:'numStudies',
        isActive:false,
        action: 'changeEdgeSize'
        }
      ]
    },
    {
      type: 'button',
      title: 'Edges Color',
      id: 'edgeColorControls',
      selections: [
        {
        label:'Majority ROB',
        value:'majority',
        isActive:true,
        action: 'colorEdges'
        },
        {
        label:'Mean ROB',
        value:'mean',
        isActive:false,
        action: 'colorEdges',
        },
        {
        label:'Maximum ROB',
        value:'max',
        isActive:false,
        action: 'colorEdges',
        },
        {
        label:'No Coloring',
        value:'noColor',
        isActive:false,
        action: 'colorEdges'
        },
      ]
    }
  ],
  boundControls : () => {
    $('a.control').bind( 'click', function() {
      if(!($(this).parent().hasClass('active'))){
        var filter = $(this).attr('filter');
        var action = $(this).attr('action');
        $(this).parent().parent().children('li').removeClass('active');
        $(this).parent().addClass('active');
        switch (action){
          case 'changeVertexSize':
            NP.resizeElements(filter,NP.options.edgeSizeBy);
            break;
          case 'changeEdgeSize':
            NP.resizeElements(NP.options.vertexSizeBy,filter);
            break;
          case 'colorEdges':
            NP.colorEdges(filter);
            break;
        }
      }
    });
  },
  init: (model, cyId) => {
    NP.cyInit(cyId);
    NP.makeVertices(model);
    NP.resizeElements(NP.options.vertexSizeBy,NP.options.edgeSizeBy);
    NP.colorEdges('majority');
    NP.cy.layout(NP.cyOptions);
  },
  cyOptions :{
    name: 'circle',
    ready: () => {
      NP.cyIsReady =true;
      NP.addControls('#cyContainer',cytmpl);
      NP.boundControls();
      NP.cy.center();
    }
  }
}



var cytmpl = Netplot.templates.netplot(NP);
NP.init(middleton, 'cy');
