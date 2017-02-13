# Use builds from launchpad
# FROM opencpu/base:latest
FROM tosku/evnma:0.2

# RUN apt-get update

# RUN  apt-get install -y vim

#copying contribution package and installation scripts
ADD toRoot /root

# RUN mv /root/server.conf /etc/opencpu/


# RUN apt-get install -y vim 

# RUN apt-get install -y tmux 

# dependency for netmeta r package
# RUN apt-get install -y r-cran-rgl

#Install contribution package in image
RUN chmod +x /root/installContribution -R && \
Rscript /root/installContribution/rgrade.batch


#restarting opencpu service
RUN sh -c 'service opencpu restart'
