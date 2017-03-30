# Use builds from launchpad
# FROM opencpu/base:latest
FROM tosku/cinema:0.1.0

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

RUN sh -c 'rm -rf /root/cinema'
# RUN b=d sh -c 'cd /root/cinema/webapp/ && git stash'
# RUN b=d sh -c 'cd /root/cinema/webapp/ && git pull'
 RUN b=d sh -c 'cd /root/ && rm -rf cinema'
 RUN b=d sh -c 'cd /root/ && git clone  https://github.com/tpapak/cinema.git'
# RUN sh -c 'cd /root/cinema/webapp/ && npm install gulp -g && npm install bower -g'
RUN b=d sh -c 'cd /root/cinema/webapp/ && npm install'
RUN b=d sh -c 'cd /root/cinema/webapp/ && bower install --allow-root'
RUN b=d sh -c 'cd /root/cinema/webapp/ && gulp'
RUN b=e sh -c 'rm -rf /root/cinema/webapp/www/'
RUN b=e sh -c 'mv /root/cinema/webapp/dist /root/cinema/webapp/www'
RUN b=e sh -c 'rm -rf /usr/local/lib/R/site-library/contribution/www/*'
RUN b=e sh -c 'cp -rf /root/cinema/webapp/www/* /usr/local/lib/R/site-library/contribution/www/'
RUN b=e sh -c 'Rscript /root/installContribution/rgrade.batch'
#restarting opencpu service
RUN sh -c 'service opencpu stop'
RUN sh -c 'service opencpu restart'
