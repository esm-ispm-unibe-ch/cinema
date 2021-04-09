// generated on 2016-10-10 using generator-webapp 2.2.0
const gulp = require('gulp');
const gulpLoadPlugins = require('gulp-load-plugins');
const browserSync = require('browser-sync');
const del = require('del');
const wiredep = require('wiredep').stream;
const runSequence = require('run-sequence');
const assign = require('lodash.assign');
const browserify = require('browserify');
const watchify = require('watchify');
const gutil = require('gulp-util');
const babelify = require('babelify');
const buffer = require('vinyl-buffer');
const source = require('vinyl-source-stream');
const dockerPath = '../RServer/toRoot/installContribution/contribution/inst/';
const $ = gulpLoadPlugins();
const reload = browserSync.reload;
const transform = require('gulp-transform');
const ext_replace = require('gulp-ext-replace');
const replace = require('gulp-replace');
const randomstring = require('randomstring');
const fs = require('fs');
const template = require('gulp-template');
const rename = require('gulp-rename');

function string_src(filename, string) {
  var src = require('stream').Readable({ objectMode: true })
  src._read = function () {
    this.push(new gutil.File({
      cwd: "",
      base: "",
      path: filename,
      contents: new Buffer(string)
    }))
    this.push(null)
  }
  return src
}

var config = {};
if(fs.existsSync("config.json")){
  config = require('./config.json');
}else{
  config = {
    version: "2.0.0",
    ganalID: "UA-XXXXXXXXX-X",
    rserverurl: "http://localhost:8004/ocpu/library/contribution/R"
  }
}
conf = { config: {
         version: config.version,
         rserverurl: config.rserverurl
       }};

gulp.task('config', function() {
  return string_src("config.js", "module.exports="+JSON.stringify(conf))
    .pipe(gulp.dest('app/scripts/'));
});

gulp.task('hbsTojs', () => {
  let modulify = c => {
    let pre = '"use strict";exports.template=';
    let contents = JSON.stringify(c);
    return pre + contents;
  };
  return gulp.src('app/scripts/**/*.hbs')
    .pipe(transform( contents => modulify(contents),{encoding: 'utf8'}))
    .pipe(ext_replace('.js'))
    .pipe(gulp.dest('app/scripts/'));
});

gulp.task('templates', () => {
  return gulp.src('app/templates/**/*.hbs')
    .pipe($.handlebars())
    .pipe($.defineModule('plain'))
    .pipe($.declare({
      namespace: 'GRADE.templates' // change this to whatever you want
    }))
    .pipe(gulp.dest('.tmp/templates'));
});

gulp.task('styles', () => {
  return gulp.src('app/styles/*.scss')
    .pipe($.plumber())
    .pipe($.sourcemaps.init())
    .pipe($.sass.sync({
      outputStyle: 'expanded',
      precision: 10,
      includePaths: ['.']
    }).on('error', $.sass.logError))
    .pipe($.autoprefixer({browsers: ['> 1%', 'last 2 versions', 'Firefox ESR']}))
    .pipe($.sourcemaps.write())
    .pipe(gulp.dest('.tmp/styles'))
    .pipe(reload({stream: true}));
});

// using vinyl-source-stream:
gulp.task('scripts', function() {
  const customOpts = {
    entries: 'app/scripts/main.js',
    debug: true
  };
  var bopts = assign({}, watchify.args, customOpts);
  var bundleStream = browserify(bopts).transform(babelify).bundle();

  return bundleStream
    .pipe(source('bundle.js'))
    .pipe($.plumber())
    .pipe(buffer())
    .pipe($.sourcemaps.init({loadMaps: true}))
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest('.tmp/scripts'));
});

// add custom browserify options here
const customOpts = {
  entries: 'app/scripts/main.js',
  debug: true
};
var bopts = assign({}, watchify.args, customOpts);
var b = watchify(browserify(bopts));

b.transform(babelify);

function watchbundle () {
  return b.bundle()
    .on('error', gutil.log.bind(gutil, 'Browserify Error'))
    .pipe(source('bundle.js'))
    .pipe($.plumber())
    .pipe(buffer())
    .pipe($.sourcemaps.init({loadMaps: true}))
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest('.tmp/scripts'))
    .pipe(reload({stream: true}));
}

gulp.task('watchscripts', watchbundle);
b.on('update', watchbundle); // on any dep update, runs the bundler
b.on('log', gutil.log); // output build logs to terminal

function lint(files, options) {
  return gulp.src(files)
    .pipe(reload({stream: true, once: true}))
    .pipe($.eslint(options))
    .pipe($.eslint.format())
    .pipe($.if(!browserSync.active, $.eslint.failAfterError()));
}

gulp.task('lint', () => {
  return lint('app/scripts/**/*.js', {
    fix: true
  })
    .pipe(gulp.dest('app/scripts'));
});
gulp.task('lint:test', () => {
  return lint('test/spec/**/*.js', {
    fix: true,
    env: {
      mocha: true
    }
  })
    .pipe(gulp.dest('test/spec'));
});

gulp.task('html', ['config', 'styles', 'scripts', 'templates', 'hbsTojs'], () => {
  var inject = require('gulp-inject-string');
  var postfix = config.version==='0.0.0'?randomstring.generate():config.version;
  var ganal = config.version==='0.0.0'?'':`<script async src='https://www.googletagmanager.com/gtag/js?id=`+config.ganalID+`'></script>
   <script>
      window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments)};
    gtag('js', new Date());

    gtag('config', '`+config.ganalID+`');
  </script>`;

  return gulp.src('app/*.html')
    .pipe($.useref({searchPath: ['.tmp', 'app', '.']}))
    .pipe($.if('*.js', $.uglify()))
    .pipe($.if('*.css', $.cssnano({safe: true, autoprefixer: false})))
    .pipe($.if('*.html', $.htmlmin({collapseWhitespace: true})))
    .pipe($.if('index.html', replace("main.js","main.js?"+postfix)))
    .pipe($.if('index.html', replace("plugins.js","plugins.js?"+postfix)))
    .pipe($.if('index.html', replace("vendor.js","vendor.js?"+postfix)))
    .pipe($.if('index.html', replace("vendor.css","vendor.css?"+postfix)))
    .pipe($.if('index.html', replace("main.css","main.css?"+postfix)))
    //.pipe($.if('index.html', inject.after('<!-- analytics:js -->', ganal)))
    .pipe(gulp.dest('dist'));
});

gulp.task('model', () => {
  return gulp.src('app/model/**/*')
    .pipe(gulp.dest('dist/model'));
});

gulp.task('images', () => {
  return gulp.src('app/images/**/*')
    .pipe($.cache($.imagemin()))
    .pipe(gulp.dest('dist/images'));
});

gulp.task('fonts', () => {
  return gulp.src(require('main-bower-files')('**/*.{eot,svg,ttf,woff,woff2}', function (err) {})
    .concat('app/fonts/**/*'))
    .pipe(gulp.dest('.tmp/fonts'))
    .pipe(gulp.dest('dist/fonts'));
});

gulp.task('extras',() => {
  return gulp.src([
    'app/*',
    '!app/*.html'
  ], {
    dot: true
  }).pipe(gulp.dest('dist'));
});

gulp.task('clean', del.bind(null, ['.tmp', 'dist']));

gulp.task('serve', () => {
  runSequence(['clean', 'wiredep'], ['styles', 'templates', 'hbsTojs', 'watchscripts', 'fonts'], () => {
    browserSync({
      notify: false,
      port: 9000,
      browser: "chromium-browser",
      server: {
        baseDir: ['.tmp', 'app'],
        routes: {
          '/bower_components': 'bower_components'
        }
      }
    });

    gulp.watch([
      'app/*.html',
      'app/images/**/*',
      '.tmp/templates/**/*.js',
      '.tmp/templates/**/*.json',
      '.tmp/fonts/**/*'
    ]).on('change', reload);

    gulp.watch('app/styles/**/*.scss', ['styles']);
    gulp.watch('app/templates/**/*.hbs', ['templates']);
    gulp.watch('app/scripts/**/*.hbs', ['hbsTojs']);
    gulp.watch('app/scripts/**/*.js', ['watchscripts']);
    gulp.watch('app/fonts/**/*', ['fonts']);
    gulp.watch('bower.json', ['wiredep', 'fonts']);
  });
});

gulp.task('serve:dist', () => {
  browserSync({
    notify: false,
    port: 9001,
    server: {
      baseDir: ['dist']
    }
  });
});

gulp.task('serve:test', ['templates','scripts'], () => {
  browserSync({
    notify: false,
    port: 9000,
    ui: false,
    server: {
      baseDir: 'test',
      routes: {
        '/scripts': '.tmp/scripts',
        '/bower_components': 'bower_components'
      }
    }
  });

  gulp.watch('app/templates/**/*.hbs', ['templates']);
  gulp.watch('app/scripts/**/*.js', ['scripts']);
  gulp.watch(['test/spec/**/*.js', 'test/index.html']).on('change', reload);
  gulp.watch('test/spec/**/*.js', ['lint:test']);
});

// inject bower components
gulp.task('wiredep', () => {
  gulp.src('app/styles/*.scss')
    .pipe(wiredep({
      ignorePath: /^(\.\.\/)+/
    }))
    .pipe(gulp.dest('app/styles'));

  gulp.src('app/*.html')
    .pipe(wiredep({
      exclude: ['bootstrap-sass'],
      ignorePath: /^(\.\.\/)*\.\./
    }))
    .pipe(gulp.dest('app'));
});

gulp.task('generate-service-worker', [ 'html', 'images', 'fonts'], function(callback) {
  var path = require('path');
  var swPrecache = require('sw-precache');
  var rootDir = 'dist';

  swPrecache.write(path.join(rootDir, 'sw.js'), {
    staticFileGlobs: [rootDir + '/**/*.{js,html,css,png,jpg,gif,eot,svg,ttf,woff,woff2}'],
    stripPrefix: rootDir
  }, callback);
});

gulp.task('buildWithServiceWorker', ['lint','generate-service-worker', 'extras'], () => {
  return gulp.src('dist/**/*').pipe($.size({title: 'build', gzip: true}));
});

gulp.task('buildToDocker', ['build'], () => {
  console.log("deleting "+dockerPath+"www");
  return del(dockerPath+"/www/**/*",{force:true}).then(
    () => {
      console.log("copying dist to "+dockerPath+"www");
      gulp.src('./dist/**/*')
        .pipe(gulp.dest(dockerPath+"/www"));
    }
  );
});

gulp.task('build', ['html', 'model', 'images', 'fonts', 'extras'], () => {
  return gulp.src('dist/**/*').pipe($.size({title: 'build', gzip: true}));
});

gulp.task('default', () => {
  runSequence(['clean', 'wiredep'], 'build');
});
