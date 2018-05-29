#to be run from the root folder
rm(list=ls())
source("./R/hatmatrix.R")
source("./R/nmadbhatmatrix.R")
source("./R/forestplot.R")
library(devtools)
install_github("esm-ispm-unibe-ch/dataformatter")

#install.packages("../nmadata_1.0.tar.gz",repos=NULL)
install_github("esm-ispm-unibe-ch/nmadata")
library(nmadata)

#install_github("esm-ispm-unibe-ch/flow_contribution")
#library(contribution)

listVerified()

#testhm = getHatmatrixFromDB(482734, model="random",sm="OR")
indata = read.csv("tests/Senn2013.csv")
testhm = getHatMatrix(indata=indata,model="random",type="iv",sm="OR")

ipl = forestcinema(testhm$NMAresults,1.04,"imprecision",testhm$sm)
hpl = forestcinema(testhm$NMAresults,1.04,"heterogeneity",testhm$sm)
ggsave("iplot.png",plot=ipl)
ggsave("hplot.png",plot=hpl)


