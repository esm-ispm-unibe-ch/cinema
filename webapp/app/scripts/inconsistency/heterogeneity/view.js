var deepSeek = require('safe-access');
var clone = require('../../lib/mixins.js').clone;
var Nodes = require('../../purescripts/output/Heterogeneity.Nodes');

var View = (model) => {
  let modelPosition = 'project.inconsistency.heterogeneity';
  let viewers = {
    isReady: () => {
      let isReady = false;
      if (! _.isUndefined(deepSeek(model.getState(), modelPosition))){
        isReady = true;
      }
      return isReady;
    },
    getMeasureType: () => {
      let mdl = model.getState();
      let mt = deepSeek(mdl,'project.type');
      let result = "nothing";
      if (typeof mt === 'undefined'){
        result = "nothing";
      }else{
        switch(mt) {
          case "binary":
              result = "binary";
              break;
          case "continuous":
              result = "continuous";
              break;
        } 
      }
      return result;
    },
    availableParameters: () => {
      let ap = deepSeek(model.getState(), ".project.inconsistency.heterogeneity.referenceValues.availableParameters");
      let result = [];
      if (typeof ap !== "undefined"){
        result = clone(ap);
        let ot = _.findWhere(result, {id :"OutcomeType"});
        ot.isAvailable = () => {
          return viewers.getState().referenceValues.params.measurement !== 'nothing';
        };
        ot.selections = () => {
          let res = [
          { id : 'nothing',
            label: '--',
            isDisabled: true,
            isAvailable: true,
            isActive: () => {return ('nothing' === viewers.getState().referenceValues.params.OutcomeType)},
          }];
          res = _.union(res,
            _.map(ot.options.binaryOptions,
              mo => {
                return {
                  id: mo,
                  label: mo,
                  isActive: () => {return (mo === viewers.getState().referenceValues.params.OutcomeType)},
                  isAvailable: () => {
                    return viewers.getState().referenceValues.params.measurement === 'binary';
                  }
                }
            })
          );
          res = _.union(res,
            _.map(ot.options.continuousOptions,
              mo => {
                return {
                  id: mo,
                  label: mo,
                  isActive: () => {return (mo === viewers.getState().referenceValues.params.OutcomeType)},
                  isAvailable: () => {
                    return viewers.getState().referenceValues.params.measurement === 'continuous';
                  }
                }
            })
          );
          return _.flatten(res);
        }
        _.findWhere(result, {id:"measurement"}).isAvailable = () => {
          let mt = viewers.getMeasureType();
          return !((mt === "binary") || (mt === "continuous"));
        };
      }else{
        result = [];
      }
      return result;
    },
    rfvParams: () => {
      let dfp = viewers.availableParameters();
      let prs = _.without(dfp, _.findWhere(dfp, {
          id: "InterventionType"
      }));
      prs = _.without(prs, _.findWhere(prs, {
          id: "InterventionComparisonType"
      }));
      _.map(prs, p => {
        _.map(p.selections, s => {
          s.isActive = (s.id === viewers.getState().referenceValues.params[p.id]);
        })
      });
      return prs;
    },
    interventionTypes: () => {
      let prs = viewers.availableParameters()[1];
      return prs;
    },
    customized: () => {
      return viewers.numberCustomized() > 0;
    },
    customizedSingular: () => {
      return viewers.numberCustomized() === 1;
    },
    numberCustomized: () => {
      let vboxes = clone(viewers.getState().heters.boxes);
      let result = _.size(_.filter(vboxes, box => {
          return box.judgement !== box.ruleLevel;
        })
      );
      return result;
    },
    boxes: () => {
      let vboxes = clone(viewers.getState().heters.boxes);
      return _.map(vboxes, box => {
        box.customized = box.judgement !== box.ruleLevel;
        box.color = deepSeek (_.find(box.levels, l => {return l.id === box.judgement}),'color');
        box.levels = _.map(box.levels, l => {
            let isActive = parseInt(l.id) === parseInt(box.judgement);
            l.label= model.getState().text.Heterogeneity.levels[l.id-1];
            l.isActive = isActive;
            return l;
          });
        box.quantiles = _.map(box.quantiles, q => {
          q.isActive = false;
          if((typeof box.tauSquare !== 'undefined') && (! isNaN(box.tauSquare))) {
            q.isActive = Number(box.tauSquare) > q.value;
          }
          return q;
        });
        return box;
      });
    },
    treatments: () => {
      let ts = viewers.getState().referenceValues.treatments;  
      return ts;
    },
    clinImp: () => {
      return model.getState().project.clinImp.baseValue;
    },
    clinImpLow: () => {
      return model.getState().project.clinImp.lowerBound.toFixed(3);
    },
    clinImpHigh: () => {
      return model.getState().project.clinImp.upperBound.toFixed(3);
    },
    clinImpReady: () => {
      return model.getState().project.clinImp.status === "ready";
    },
    getRule: () => {
      return viewers.getState().heters.rule;
    },
    rfvsFirst: () => {
      let res = viewers.getState().referenceValues.results.first;
      return res;
    },
    rfvsMedian: () => {
      let res = viewers.getState().referenceValues.results.median;
      return res;
    },
    rfvsThird: () => {
      let res = viewers.getState().referenceValues.results.third;
      return res;
    },
    emType: () => {
      return model.getState().project.clinImp.emtype;
    },
    rfvsTauSquare: () => {
      let res = viewers.getState().referenceValues.results.tauSquareNetwork;
      return res;
    },
    rfvFilled: () => {
      return _.all(_.toArray(viewers.getState().referenceValues.params), 
        p => { return (p !== 'nothing') && 
          Nodes.hasSelectedAll(model.getState());
        });
    },
    canFetch: () => {
      return viewers.rfvFilled() && (! viewers.rfvReady());
    },
    rfvReady: () => {
      return viewers.getState().referenceValues.status === 'ready';
    },
    getState: () => {
      return deepSeek(model.getState(), modelPosition);
    },
    heterReady: () => {
      return viewers.getState().heters.status === 'ready';
    },
    getRule: () => {
      return viewers.getState().heters.rule;
    },
    ruleName: () => {
      let rule = viewers.getRule(); 
      return  model.getState().text.Heterogeneity.rules[rule];
    },
    rules: () => {
      let rules = _.union([{id: 'noRule'}], viewers.getState().heters.availablerules);
      _.map(rules, r => {
        r.label = model.getState().text.Heterogeneity.rules[r.id];
        r.isActive = viewers.getState().heters.rule === r.id;
        if(r.id !== 'noRule'){
          r.isDisabled = false;
        }else{
          r.isDisabled = true;
        }
      });
      return rules;
    },
  }
  return viewers;
}

module.exports = () => {
  return View;
}
