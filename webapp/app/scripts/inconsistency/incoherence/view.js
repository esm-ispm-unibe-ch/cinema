var deepSeek = require('safe-access');
var clone = require('../../lib/mixins.js').clone;

var View = (model) => {
  let modelPosition = 'getState().project.inconsistency.incoherence';
  let viewers = {
    isReady: () => {
      let isReady = false;
      if (! _.isUndefined(deepSeek(model, modelPosition))){
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
      return _.map(viewers.getState().boxes, box => {
        let levels = _.map(box.levels, l => {
          let level = clone(l);
          let name = {};
          let isActive = parseInt(box.judgement) === parseInt(level.id);
          name = {
            isActive,
            label: model.getState().text.Incoherence.levels[level.id-1],
          }
          return _.extend(level, name);
        });
        box.levels = levels;
        box.customized = box.ruleJudgement !== box.judgement;
        box.color = _.find(box.levels, l => {return l.id === box.judgement}).color;
        return box;
      });
    },
    rfvs: () => {
      let res = viewers.getState().referenceValues; 
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
      return deepSeek(model,modelPosition);
    },
    heterReady: () => {
      return viewers.getState().heters.status === 'ready'
    },
  }
  return viewers;
}

module.exports = () => {
  return View;
}
