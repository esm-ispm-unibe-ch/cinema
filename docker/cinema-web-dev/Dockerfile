FROM ubuntu:18.04

RUN apt update
RUN apt upgrade -y util-linux
RUN apt install -y git
#install nvm
#From boldt/nvm THanks boldt :)
##############################################################################
# Replace shell with bash so we can source files
##############################################################################

RUN mv /bin/sh /bin/sh_back && \
	ln -s /bin/bash /bin/sh && \
	mkdir -p /root/.nvm

##############################################################################
# Install dependencies from Ubuntu
##############################################################################

ENV NVM_DIR /root/.nvm
ENV NODE_VERSION 9.4.0

RUN apt-get update --fix-missing && \
	apt-get install -y curl && \
	##############################################################################
	# Install: nvm, node and npm
	# @see: http://stackoverflow.com/questions/25899912/install-nvm-in-docker
	##############################################################################
	curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.34.0/install.sh | bash && \
	source $NVM_DIR/nvm.sh && \
	nvm install $NODE_VERSION && \
	nvm cache clear && \
	apt-get remove -y curl && \
	rm -rf /var/lib/apt/lists/*

ENV PATH $NVM_DIR/versions/node/v$NODE_VERSION/bin:$PATH
#install cinema
#RUN mv /bin/sh_back /bin/sh
RUN git clone https://github.com/esm-ispm-unibe-ch/cinema.git /root/cinema
WORKDIR /root/cinema/webapp
RUN npm install -g gulp
RUN npm install -g bower
RUN apt update
RUN apt install -y python-minimal
RUN apt install -y make 
RUN apt install -y g++ 
RUN npm install &&\
    npm rebuild node-sass
RUN bower install --allow-root
RUN npm i npx
WORKDIR /root/cinema/webapp/app/scripts/purescripts
RUN bower install --allow-root
RUN npx pulp build
WORKDIR /root/cinema/webapp
RUN gulp build
#install and run nginx
RUN apt install -y nginx
RUN apt install -y vim
RUN mv dist cinema 
RUN mv cinema /usr/share/nginx/
COPY default.conf /etc/nginx/conf.d/
COPY rebuildandrun.sh /usr/bin
RUN chmod +x /usr/bin/rebuildandrun.sh
CMD rebuildandrun.sh && nginx -g 'daemon off;'
