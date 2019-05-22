# Change log

## Frontend v1.7.0 - May 22 2019
- Incoherence: 
 - NMA effects with **only direct** evidence or **only indirect** evidence 
are assigned a judgment determined by the p-value of the design-by-treatment interaction test
 - Design by treatment p-value minimum range changed from 0.01 to **0.05**
 - Star networks are judged as having major concerns.
- Accept **M**-**m** in input dataset levels as well as the old **U**(nlear)
  level

## Frontend v1.5-6.0 - May 20 2019
- Heterogeneity and Imprecision clinicaly important zones defined
 defined as the null effect and the further from the point estimate clinical important value.
- Incoherence rules for mixed comparisons judged as *no concerns* when they have
  side p-value>0.1
- added config.json file
- created docker-web-dev image for development and building frontend

## Frontend v1.4.1 - Nov. 12 2018
**bug fix**
- Fixed runtime error when localstorage quota exceeded.

## Backend v1.3.3 - Nov. 12 2018
**bug fix**
- Fixed problem with double zero binary studies 

## Frontend v1.4.0 - Nov. 07 2018

**Stability improvements:** 
- Added ```Reset``` functionality to ```My Projects```. Helps when app is stack.
- Projects are not automatically loaded after page refresh. Added load cached
  project in ```My Projects```

## Frontend v1.3.0 - Nov. 06 2018
**Updates:** 
- Domains renamed and reordered according to the updated [CINeMA papers](http://www.ispm.unibe.ch/research/research_groups/evidence_synthesis_methods/index_eng.html#pane551967)
 - **within-study bias**
 - **across-studies bias** 
 - **indirectness** 
 - **imprecision**,
 - **heterogeneity** 
 - **incoherence**


## Frontend v1.2.2 - Jun. 20 2018

**Updates:** 
- Updated Documentation page.

**Bug fixes:**
- Added disclaimer file.

## Frontend v1.2.0 - Jun. 12 2018

**Updates:**
- New rules for Incoherence according the position of direct and indirect confidence intervals in respect to clinical important value

## Frontend v1.1.0 - Jun. 6 2018

Report page improvements

**Updates:**
- Added judgements on filal report
- Download Report
- Persist to localstorage only when clicking ```Proceed``` which dramatically
  improved speed :)

**Bug fixes:**
- contribution rownames in Study limitations and Indirectness according to
  hatmatrix of ```netmeta```

## Frontend v1.0.0 - Jun. 1 2018

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
