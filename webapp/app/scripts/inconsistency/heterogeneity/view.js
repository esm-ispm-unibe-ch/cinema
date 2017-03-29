var deepSeek = require('safe-access');

var View = (model) => {
  let modelPosition = 'project.Inconsistency.Heterogeneity';
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
          label: 'Measurement',// from text file
          isAvailable: true,
          selections: [
            { id : 'nothing',
              label: '--',
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
            { id : 'nothing',
              label: '--',
              isDisabled: true,
              isAvailable: true
            },
            { id : 'Pharmacological vs Placebo/Control',
              label: 'Pharmacological vs Placebo/Control',
              isAvailable: true
            },
            { id :'Pharmacological vs Pharmacological',
              label: 'Pharmacological vs Pharmacological',
              isAvailable: true
            },
            { id : 'Non-pharmacological vs any',
              label: 'Non-pharmacological vs any',
              isAvailable: true
            }
          ]
        },
        {
          id: 'OutcomeType',
          label: 'Outcome type',// from text file
          isAvailable: () => {
            return viewers.getState().referenceValues.params.measurement !== 'nothing';
          },
          selections: () => {
            let binaryOptions = ['Objective','Semi-objective','Subjective'];
            let continuousOptions = ['Obstetric outcome', 
                  'Resource use and hospital stay/process', 
                  'Internal and external structure-related outcome',
                  'General physical health and adverse event and pain and quality of life/functioning',
                  'Signs/symptoms reflecting continuation/end of condition and infection/onset of new acute/chronic disease',
                  'Mental health outcome',
                  'Biological marker',
                  'Various subjectively measured outcomes'];
            let res = [
            { id : 'nothing',
              label: '--',
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
      let ruleLevel = (argsss) => {
        let [rule,CI,PrI,tauSquare] = argsss;
        let baseValue = viewers.getState().referenceValues.results[rule.id];
        let tauNet = viewers.getState().referenceValues.results.tauSquareNetwork;
        let tauExists = () => {
          return ! isNaN(tauSquare);
        };
        let tauBigger = () => {
          return tauSquare > baseValue;
        };
        let PrIProblem = () => {
          let CIcrosses = CI[0] * CI[1] < 0;
          let PrIcrosses = PrI[0] * PrI[1] < 0;
          return !((CIcrosses && PrIcrosses) || (! CIcrosses && ! PrIcrosses));
        };
        console.log('baseValue',rule,baseValue);
        let res = 0;
        if(tauNet < baseValue) {
          if(tauExists()) {
            res = viewers.getState().heters.rules[0][PrIProblem()?0:1][tauBigger()?0:1];
          }else{
            if(PrIProblem()){
              res = 2;
            }else{
              res = 1;
            }
          }
        }else{
          if(tauExists()) {
            res = viewers.getState().heters.rules[1][PrIProblem()?0:1][tauBigger()?0:1];
          }else{
            if(PrIProblem()){
              res = 3;
            }else{
              res = 2;
            }
          }
        }
        return res;
      };
      let boxes = viewers.getState().heters.boxes;
      _.map(boxes, box => {
        box.rules = _.map(viewers.getState().heters.availablerules, rule => {
          if(box.tauSquare === 'nothing'){
            return {
              id: rule.id,
              level: ruleLevel([rule,box.CI,box.PrI])
            }
          }else{
            return {
              id: rule.id,
              level: ruleLevel([rule,box.CI,box.PrI,box.tauSquare])
            }
          }
        });
        _.map(box.rules, r => {
          r.isActive = r.id === viewers.getState().heters.rule;
        });
        _.map(box.levels, l => {
          if(l.id !=='nothing'){
            l.label= model.getState().text.Heterogeneity.levels[l.id-1];
          }
            l.isActive = () => {return l.id === box.judgement;}
        });
        _.map(box.rules, r => {
          r.label = model.getState().text.Heterogeneity.rules[r.id];
          r.levelLabel = model.getState().text.Heterogeneity.levels[r.level-1];
        });
      });
      return boxes;
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
      console.log('the HHHHETTTEROGGENEITY rules',rules);
      return rules;
    },
  }
  return viewers;
}

module.exports = () => {
  return View;
}
