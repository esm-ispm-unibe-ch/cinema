# Use builds from launchpad
# FROM opencpu/base:latest
FROM tosku/evnma:0.2

# RUN apt-get update

# RUN  apt-get install -y vim

RUN  apt-get install -y git
RUN sh -c 'curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -'
RUN  apt-get install -y nodejs
RUN  apt-get install -y npm

#copying contribution package and installation scripts
ADD toRoot /root

# RUN mv /root/server.conf /etc/opencpu/


# RUN apt-get install -y vim 

# RUN apt-get install -y tmux 

# dependency for netmeta r package
# RUN apt-get install -y r-cran-rgl

#Install contribution package in image
RUN chmod +x /root/installContribution -R 

RUN sh -c 'git clone https://github.com/tpapak/cinema.git /root'
RUN sh -c 'npm install -g gulp && npm install -g bower'
RUN sh -c 'cd /root/cinema/webapp/ && npm install && bower install --allow-root&& gulp build'
RUN sh -c 'rm -rf /usr/local/lib/R/site-library/contribution/www'
RUN sh -c 'mv /root/cinema/webapp/dist /usr/local/lib/R/site-library/contribution/www'
#restarting opencpu service
RUN sh -c 'Rscript /root/installContribution/rgrade.batch && service opencpu restart'
