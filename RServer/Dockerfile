# Use builds from launchpad
# FROM opencpu/base:latest
FROM tosku/cinema:0.1.1

# RUN apt-get update

# RUN  apt-get install -y vim

# RUN  apt-get install -y git

# RUN sh -c 'curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -'
# RUN sh -c 'apt-get install -y nodejs'
#copying contribution package and installation scripts
ADD toRoot /root

# RUN mv /root/server.conf /etc/opencpu/


# RUN apt-get install -y vim 

# RUN apt-get install -y tmux 

# dependency for netmeta r package
# RUN apt-get install -y r-cran-rgl

#Install contribution package in image
# RUN chmod +x /root/installContribution -R 

# RUN sh -c 'rm -rf /root/cinema'
RUN sh -c 'cd /root/cinema/webapp/ && git stash'
RUN a=b sh -c 'cd /root/cinema/webapp/ && git pull'
# RUN sh -c 'cd /root/cinema/webapp/ && npm install gulp -g && npm install bower -g'
RUN a=a sh -c 'cd /root/cinema/webapp/ && npm install'
RUN a=a sh -c 'cd /root/cinema/webapp/ && bower install --allow-root'
RUN a=a sh -c 'cd /root/cinema/webapp/ && gulp clean'
RUN a=b sh -c 'cd /root/cinema/webapp/ && gulp build'
RUN a=a sh -c 'mv /root/cinema/webapp/dist /root/cinema/webapp/www'
RUN a=a sh -c 'rm -rf /usr/local/lib/R/site-library/contribution/www/*'
RUN a=b sh -c 'cp -rf /root/cinema/webapp/www/* /usr/local/lib/R/site-library/contribution/www/'
RUN sh -c 'Rscript /root/installContribution/rgrade.batch'
#restarting opencpu service
RUN sh -c 'service opencpu restart'
