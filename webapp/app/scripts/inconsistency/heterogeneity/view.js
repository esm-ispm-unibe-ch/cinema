var deepSeek = require('safe-access');

var View = (model) => {
  let modelPosition = "project.Inconsistency.Heterogeneity";
  let viewers = {
    isReady: () => {
      let isReady = false;
      if (! _.isUndefined(deepSeek(model.getState(), modelPosition))){
        isReady = true;
      }
      return isReady;
    },
    rfvParams: () => {
      let prs =  [
        {
          id: 'measurement',
          label: "Measurement",// from text file
          isAvailable: true,
          selections: [
            { id : "nothing",
              label: "--",
              isAvailable: true,
              isDisabled: true
            },
            { id :'binary',
              label: 'binary',
              isAvailable: true
            },
            { id :'continuous',
              label: 'continuous',
              isAvailable: true
            }
          ]
        },
        {
          id: 'InterventionComparisonType',
          label: 'Intervention comparison type',
          isAvailable: true,
          selections: [
            { id : "nothing",
              label: "--",
              isDisabled: true,
              isAvailable: true
            },
            { id : "Pharmacological vs Placebo/Control",
              label: "Pharmacological vs Placebo/Control",
              isAvailable: true
            },
            { id :'Pharmacological vs Pharmacological',
              label: 'Pharmacological vs Pharmacological',
              isAvailable: true
            },
            { id : "Non-pharmacological vs any",
              label: "Non-pharmacological vs any",
              isAvailable: true
            }
          ]
        },
        {
          id: 'OutcomeType',
          label: "Outcome type",// from text file
          isAvailable: () => {
            return viewers.getState().referenceValues.params.measurement !== 'nothing';
          },
          selections: () => {
            let binaryOptions = ["Objective","Semi-objective","Subjective"];
            let continuousOptions = ["Obstetric outcome", 
                  "Resource use and hospital stay/process", 
                  "Internal and external structure-related outcome",
                  "General physical health and adverse event and pain and quality of life/functioning",
                  "Signs/symptoms reflecting continuation/end of condition and infection/onset of new acute/chronic disease",
                  "Mental health outcome",
                  "Biological marker",
                  "Various subjectively measured outcomes"];
            let res = [
            { id : "nothing",
              label: "--",
              isDisabled: true,
              isAvailable: true,
              isActive: () => {return ('nothing' === viewers.getState().referenceValues.params.OutcomeType)},
            }];
            res = _.union(res,
              _.map(binaryOptions,
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
              _.map(continuousOptions,
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
        },
      ]
      _.map(prs, p => {
        _.map(p.selections, s => {
          s.isActive = (s.id === viewers.getState().referenceValues.params[p.id]);
        })
      });
      return prs;
    },
    boxes: () => {
      let boxes = viewers.getState().heters.boxes;
      _.map(boxes, box => {
        _.map(box.levels, l => {
          let name = {};
          if(l.id !=='nothing'){
            name = {
              label: model.getState().text.Heterogeneity.levels[l.id-1]
            }
          }
          return _.extend(l, name);
        });
        _.map(box.rules, r => {
          r.label = model.getState().text.Heterogeneity.rules[r.id];
          r.levelLabel = model.getState().text.Heterogeneity.levels[r.level];
        });
      });
      return boxes;
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
    rfvsTauSquare: () => {
      let res = viewers.getState().referenceValues.results.tauSquareNetwork;
      return res;
    },
    rfvFilled: () => {
      return _.all(_.toArray(viewers.getState().referenceValues.params), p=> { return p!== 'nothing'});
    },
    canFetch: () => {
      return viewers.rfvFilled() && (! viewers.rfvReady());
    },
    rfvReady: () => {
      return viewers.getState().referenceValues.status === 'ready';
    },
    getState: () => {
      return deepSeek(model.getState(),modelPosition);
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
      console.log("the HHHHETTTEROGGENEITY rules",rules);
      return rules;
    },
  }
  return viewers;
}

module.exports = () => {
  return View;
}
