var gulp = require('gulp')
    $ = require('gulp-load-plugins')(),
    browserSync = require('browser-sync').create(),
    gutil = require('gulp-util'),
    del = require('del'),
    runSequence = require('run-sequence'),
    webpack = require('webpack-stream'),
    webpackConfig = require('./webpack.config.js'),
    webpackConfigProd = require('./webpack.config.prod.js');

// CONFIG
var taskName = gutil.env._[0];
var isProduction = taskName === 'build';

// Add vendor prefix support for the following browsers
var AUTOPREFIXER_BROWSERS = [
    'ie >= 9',
    'ie_mob >= 10',
    'ff >= 21',
    'chrome >= 31',
    'safari >= 5',
    'opera >= 23',
    'ios >= 6',
    'android >= 4',
    'bb >= 10'
];

var ftpDomain = 'http://designer.sanookonline.co.th';

var FTP_CONFIG = {
    host: '203.151.131.30',
    user: 'designer_dev',
    pass: 'mPpJCTa7wM',
    remotePath: '/landing/demo' // insert remote path
};

var appPath = 'app/';
var viewPath = 'view/';
var paths = {
    styles: {
        src: appPath + 'scss/**/*.scss',
        dest: viewPath + 'cs',
        build: 'dist/cs'
    },
    scripts: {
        src: appPath + 'js/concat/**/*.js',
        dest: viewPath + 'js',
        build: 'dist/js'
    },
    twig: {
        src: appPath + 'twig/*.twig',
        dest: viewPath,
        build: 'dist'
    },
    img: {
        src: appPath + 'img/**/*',
        dest: viewPath + 'img',
        build: 'dist/img'
    },
    fonts: {
        src: appPath + 'fonts/**/*',
        dest: viewPath + 'fonts',
        build: 'dist/fonts'
    },
}
var changeEvent = function(evt) {
    var line = '---------------------------------------------------';
    gutil.log( line + '\n\tFile', gutil.colors.cyan(evt.path.replace(new RegExp('/.*(?=/' + appPath + ')/'), '')), 'was', gutil.colors.magenta(evt.type));
};

// reload
gulp.task('bs-reload', function () {
    browserSync.reload();
});


// Static server
gulp.task('browser-sync', function() {
    browserSync.init({
        server: {
            baseDir: viewPath
        }
    });
});

// - HTML
gulp.task('html', function() {
    return gulp.src( paths.twig.src )
        .pipe($.plumber({
            errorHandler: function (err) {
                new gutil.PluginError('TWIG', err, {showStack: true});
                this.emit('end');
            }
        }))
        .pipe($.twig())
        .pipe( isProduction ? $.processhtml() : gutil.noop())
        .pipe( isProduction ? $.htmlmin({
            conditionals: true,
            empty: true,
            cdata: true,
            quotes: true
        }) : gutil.noop() )
        .pipe( isProduction ? $.prettify({
            unformatted: ['pre', 'code'],
            indent_inner_html: true,
            indent_size: 4
        }) : gutil.noop())

        .pipe( isProduction ? gulp.dest( paths.twig.build ) : gulp.dest( paths.twig.dest ) );
});

// - CSS
gulp.task('css', function() {
    return gulp.src( paths.styles.src )
        .pipe($.sass({
            outputStyle: 'expanded'
        }).on('error', $.sass.logError))
        .pipe($.autoprefixer(AUTOPREFIXER_BROWSERS))
        .pipe(isProduction ? $.rename({
            suffix: '.min'
        }) : gutil.noop())
        .pipe( isProduction ? gulp.dest( paths.styles.build ) : gulp.dest( paths.styles.dest ) )
        .pipe( isProduction ? gutil.noop() : browserSync.stream());
});

// - JS
gulp.task('js', function() {
    return gulp.src( paths.scripts.src )
        .pipe($.plumber({
            errorHandler: function (err) {
                new gutil.PluginError('JS', err, {showStack: true});
                this.emit('end');
            }
        }))
        .pipe($.concat('main.js'))
        .pipe(isProduction ? gulp.dest( paths.scripts.build ) : gulp.dest( paths.scripts.dest ) );
});

// - JS
gulp.task('jsWebpack', function() {
    return gulp.src( './app/js/webpack/app.js' )
        .pipe(webpack( isProduction ? webpackConfigProd : webpackConfig ))
        .pipe(isProduction ? gulp.dest( paths.scripts.build ) : gulp.dest( paths.scripts.dest ) );
});

gulp.task('js:nonConcat', function() {
    return gulp.src( appPath + 'js/*.js' )
           .pipe(gulp.dest( isProduction ? paths.scripts.build : paths.scripts.dest ));
});

// - IMAGES
gulp.task('images', function() {
    return gulp.src( paths.img.src )
           .pipe(gulp.dest( isProduction ? paths.img.build : paths.img.dest ));
});

// - FONTS
gulp.task('fonts', function() {
    return gulp.src( paths.fonts.src )
           .pipe(gulp.dest( isProduction ? paths.fonts.build : paths.fonts.dest ));
});

gulp.task('clean', del.bind(null, ['dist']));

gulp.task('ftp', function() {
    return gulp.src('dist/**')
        .pipe($.ftp(FTP_CONFIG))
        .on('finish', function() {
            var msg = 'Result URLs: ' + gutil.colors.magenta(ftpDomain + FTP_CONFIG.remotePath);
            var line = '===================================================';
            gutil.log('\n' + line + '\n' + msg + '\n' + line);
        });
});

// - Combine media query
gulp.task('cmq', function() {
    return gulp.src('dist/cs/*.css')
        .pipe($.groupCssMediaQueries())
        .pipe($.cleanCss())
        .pipe(gulp.dest( paths.styles.build ));
});

gulp.task('default', function() {
    return gulp.start('serve');
});

gulp.task('serve', ['html','css','js', 'js:nonConcat', 'jsWebpack', 'fonts', 'images', 'browser-sync'], function() {
    gulp.watch( appPath + 'twig/**/*.twig' ).on('change', function(evt) {
        changeEvent(evt);
        runSequence(['html'],'bs-reload');
    });
    gulp.watch(paths.styles.src, ['css']).on('change', function(evt) {
        changeEvent(evt);
    });
    gulp.watch( appPath + 'js/**/*.js' ).on('change', function(evt) {
        changeEvent(evt);
        runSequence(['js', 'jsWebpack'],'bs-reload');
    });
    gulp.watch( paths.img.src ).on('change', function(evt) {
        changeEvent(evt);
        runSequence(['images'],'bs-reload');
    });
    gulp.watch( paths.fonts.src ).on('change', function(evt) {
        changeEvent(evt);
        runSequence(['fonts'],'bs-reload');
    });
});

// Build Production Files
gulp.task('build', ['clean'], function(cb) {
    runSequence(['html', 'css', 'js', 'js:nonConcat', 'jsWebpack', 'fonts', 'images'], 'cmq', cb);
});
