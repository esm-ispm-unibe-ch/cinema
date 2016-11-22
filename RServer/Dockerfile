# Use builds from launchpad
FROM opencpu/base:latest

RUN  apt-get install -y vim

#copying contribution package and installation scripts
ADD toRoot /root

#dependency for netmeta r package
RUN apt-get install -y r-cran-rgl

#Install contribution package in image
RUN chmod +x /root/installContribution -R && \
Rscript /root/installContribution/rgrade.batch


#restarting opencput service
CMD sh -c 'service opencpu restart && /bin/bash'
