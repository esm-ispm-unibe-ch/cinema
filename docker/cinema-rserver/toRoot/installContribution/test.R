rm(list=ls())
#library(readr)
library(devtools)
install_github("esm-ispm-unibe-ch/dataformatter")
#install_github("esm-ispm-unibe-ch/nmadata")
install.packages("./contribution_0.3.0.tar.gz",repos=NULL)
#install_github("esm-ispm-unibe-ch/flow_contribution")
library(dataformatter)
library(contribution)

diab = wide2long(read.csv2("diabetes_indr.csv"))

testhm = getHatMatrix(indata=diab,type="long_binary",model="random",sm="OR")

comparison = "2:3"

result = getStudyContribution(testhm, comparison)
print(result)

print("contributions sum to 100")
print(all.equal(sum(result$contribution),100))
