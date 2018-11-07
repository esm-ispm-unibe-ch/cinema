# Change log

## v1.4.0 - Nov. 07 2018

**Stability improvements:** 
- Added ```Reset``` functionality to ```My Projects```. Helps when app is stack.
- Projects are not automatically loaded after page refresh. Added load cached
  project in ```My Projects```

## v1.3.0 - Nov. 06 2018
**Updates:** 
- Domains renamed and reordered according to the updated [CINeMA papers](http://www.ispm.unibe.ch/research/research_groups/evidence_synthesis_methods/index_eng.html#pane551967)
 - **within-study bias**
 - **across-studies bias** 
 - **indirectness** 
 - **imprecision**,
 - **heterogeneity** 
 - **incoherence**


## v1.2.2 - Jun. 20 2018

**Updates:** 
- Updated Documentation page.

**Bug fixes:**
- Added disclaimer file.

## v1.2.0 - Jun. 12 2018

**Updates:**
- New rules for Incoherence according the position of direct and indirect confidence intervals in respect to clinical important value

## v1.1.0 - Jun. 6 2018

Report page improvements

**Updates:**
- Added judgements on filal report
- Download Report
- Persist to localstorage only when clicking ```Proceed``` which dramatically
  improved speed :)

**Bug fixes:**
- contribution rownames in Study limitations and Indirectness according to
  hatmatrix of ```netmeta```

## v1.0.0 - Jun. 1 2018

Switched to **study** contribution. Calculate contributions of each study from hatmatrix.
This affects **Study limitations** and **Indirectness**.

**Improvements:**
- No need for direct judgements since bar plot of contributions is calculated
  automatically.
- Can download per study contribution matrix
- Can download per comparison contribution matrix
- Can download **league table**
- Added indirectness information in Network plot

**Warning:**
- **Indirectness** study level judgements are **mandatory** in dataset
