'use strict';
console.log('\'Allo \'Allo! netplot js here!');


 var NetPlot = {
   vertices : [],
   edges : [],
   etovRatio : 0.5,
   makeVertices : (model) => {
     var elements = NetPlot.makeGraphFromTreatments(model);
     [NetPlot.vertices, NetPlot.edges] = elements;
     NetPlot.cy.add(_.reduce(_.flatten(elements),
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
    var setSize = (elem, elements, key, minSize=30, maxSize=140, ratio=1) => {
      var minVertexSize = (elements, key) => {return _.reduce(elements, (memo, e)=>{return memo<e[key]&&memo!==-1?memo:e[key];},-1)};
      var maxVertexSize = (elements, key) => {return _.reduce(elements, (memo, e)=>{return memo>e[key]?memo:e[key];},0)};
      var aggregate = (elements, key) => {return  _.reduce(elements, (memo, e)=>{return memo+e[key]},0)};
      var minRuleRatio = minSize / minVertexSize(elements,key);
      var maxRuleRatio = maxSize / maxVertexSize(elements,key);
      var ratio = maxVertexSize(elements,key)*minRuleRatio>maxSize?maxRuleRatio:minRuleRatio;
      _.reduce(elements, (memo,e) => {
        e.renderSize = e[key]*ratio;
        console.log(e.renderSize);
        return memo.concat(e);},[])
    }
    var renderElements = () =>{
      var elements = NetPlot.vertices.concat(NetPlot.edges);
    _.map(elements, (e) => {
      var elem = e.type;
      if(e.renderSize<40){
      NetPlot.cy.elements(elem+'[id="'+e.id+'"]').style({"text-valign":"top"});
      }
      NetPlot.cy.elements(elem+'[id="'+e.id+'"]').style({'width':e.renderSize,'height':e.renderSize});});
      NetPlot.cy.center();
    }

    var adjustEdgesWidth = () => {
      var edges = NetPlot.edges;
      var vertices = NetPlot.vertices;
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
        return memo.diff>=d.diff?d:memo;
      },{diff:0,vsize:0})

      var sizeFactor = NetPlot.etovRatio* maxDiff.vsize/(-maxDiff.diff+maxDiff.vsize);

      _.map(edges, e =>{ e.renderSize*=sizeFactor});

    }

    setSize('node', NetPlot.vertices, nodeFilter);
    setSize('edge', NetPlot.edges, nodeFilter);
    adjustEdgesWidth();

    renderElements();


  },


  cyIsReady : false,
  cy : {},
  cyInit : (containerId) => {
    NetPlot.cy = cytoscape({
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
            'background-opacity': 0.9
          }
        }
      ]

    });
  },

  addControls : (controlContainer, tmplt) => {
    $(controlContainer).append(tmplt);
  },

  controls : {
    vertices: [
      {type: 'button', title: 'Vertex size by:', selections: [
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
      }]}
    ]
  },

  boundControls : () => {
    $('a[data-type=changeVertexSize]').bind( 'click', function() {
      var filter = $(this).attr('filter');
    $('a[data-type=changeVertexSize]').parent().parent().children('li').removeClass('active');
      $(this).parent().addClass('active');
      NetPlot.resizeElements(filter,'sampleSize');
    });
  },

  init: (model, cyId) => {
    NetPlot.cyInit(cyId);
    NetPlot.makeVertices(model);
    NetPlot.resizeElements('sampleSize','sampleSize');
    NetPlot.cy.layout(NetPlot.cyOptions);
  },
  cyOptions :{
    name: 'circle',
    ready: () => {
      NetPlot.cyIsReady =true;
      NetPlot.addControls('#cyContainer',cytmpl);
      NetPlot.boundControls();
      NetPlot.cy.center();
    }
  }
}



var cytmpl = Netplot.templates.netplot(NetPlot);
NetPlot.init(middleton, 'cy');
