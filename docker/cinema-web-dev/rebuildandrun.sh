#!/bin/bash

cd /root/cinema/webapp
#pull from github https://github.com/esm-ispm-unibe-ch/cinema.git
git pull
#first build purescripts with pulp
cd /root/cinema/webapp/app/scripts/purescripts
bower install --allow-root
npx pulp build
#then build scripts with gulp
cd /root/cinema/webapp
npm install &&\
 npm rebuild node-sass
bower install --allow-root
npm i npx
gulp build
#reload nginx
mv dist cinema 
rm -rf /usr/share/nginx/cinema 
mv cinema /usr/share/nginx/
