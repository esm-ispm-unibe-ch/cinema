## CINeMA front-end

## Description
Source files for building the webapp.
CINeMA is a single page web application written in javascript and purescript.
First purescript files have to be compiled with ```pulp``` and the ```gulp``` takes care of the rest.

### Quick start with ```Docker```
The easiest way given you have ```Docker``` installed is to use the following:
for developing
```
docker run -ti -p 80:80 tosku/cinema-web-dev bash
```
and for deploying
```
docker run -d -p 80:80 tosku/cinema-web-dev
```
this will pull the more resent version of the front end and deploy it in ```localhost:80```

Unless you provide ```webapp/config.json``` R calculations will be queried in
```localhost:8004``` so you would have to deploy the R server also:
```
docker run -d -p 8004:8004 tosku/cinema-rserver
```
### Installation
First download CINeMA

```
git clone https://github.com/esm-ispm-unibe-ch/cinema.git
cd cinema/webapp
```
From now the base directory will be ```cinema/webapp```

Then install ```node```, use nvm it's much safer since you can have separate
node versions per folder.
then install gulp and bower
```
npm install -g gulp
npm install -g bower
```
and then the purescript stuff, psc and pulp
```
npm install -g purescript pulp
````
Install npm packages

```
npm install 
npm rebuild node-sass
bower install
```
then moving on to purescript dependencies
```
cd app/scripts/purescripts
bower install
```

Tested on versions
```node v6.10.1``` 
```node v8.9.3``` 
```node v9.4.0``` 


### Build
First purescript
```
cd app/scripts/purescripts
pulp build
```
Builds js modules refered in the pure js files in ```scripts```
Then build js files in script
```
cd ../../
gulp build
```
This builds cinema in the folder ```dist```.


### Serve
After you build CINeMA you can serve on ```localhost:9000```
```
gulp serve
```
serves on ```localhost:9000```

For purescript real time compilation fire up another terminal and
since purescript files are located in ```webapp/app/scripts/purescripts/```

```
cd app/scripts/purescripts/
pulp --watch build

```
Now you can get to work!
### R Server
Note that you have to set up a back end server running R. The docker image is provided
in cinema-rserver.



<sup> CINeMA is licensed under the [AGPLv3](https://www.gnu.org/licenses/agpl-3.0.en.html) license. <sup>
