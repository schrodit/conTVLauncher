'use strict';
const gulp = require('gulp');
const gutil = require('gulp-util');
const runSequence = require('run-sequence');
const clean = require('gulp-clean');
const gulpCopy = require('gulp-copy');
const install = require('gulp-install');

const packager = require('electron-packager');

const ts = require('gulp-typescript');
const tslint = require('gulp-tslint');

const gulpIf = require('gulp-if');
const eslint = require('gulp-eslint');

const minify = require('gulp-minify');

gulp.task('default', function () {
    runSequence('clean-debug', 'tslint', 'typescript', 'compress'); 
});

gulp.task('dev',  () => {
    runSequence('clean-debug', 'typescript'); 
});

gulp.task('build', () => {
    runSequence('clean', 'tslint', 'typescript', 'compress', 'copy-build', 'compress-frontend', 'install-app', 'install-bower', 'package', 'clean-build'); 
});

gulp.task('test', () => {
    runSequence('clean-debug', 'tslint', 'typescript'); 
});

gulp.task('copy-build', ['clean-build'],  () => {
    return gulp.src(['src/**/*', '!src/*.ts', '!src/*debug.js', '!src/frontend/bower_components', 'package.json', 'package-lock.json'])
        .pipe(gulpCopy('./build'));
});

gulp.task('package', (cb) => {
    return packager({
        dir: './build/',
        name: 'conTVLauncher',
        overwrite: true,
        packageManager: 'npm',
        platform: 'linux',
        arch: 'x64',
        out: './'
    }, function done_callback (err, appPaths) { 
        if(err instanceof Error) throw err;
        else {
            gutil.log(appPaths);
            cb();
        }
     });
});

gulp.task('lint', () => {
    return gulp.src(['**/*.js','!**/node_modules/**', '!**/bower_components/**'])
        .pipe(eslint({configFile: '.eslintc.json', fix: true}))
        .pipe(eslint.format())
        .pipe(eslint.failAfterError())
        .pipe(gulpIf(isFixed, gulp.dest('./')));
});

gulp.task('tslint', () =>
    gulp.src('src/*.ts')
        .pipe(tslint({
            configuration: 'tslint.json',
            formatter: 'verbose'
        }))
        .pipe(tslint.report())
);

gulp.task('typescript', () => {
    return gulp.src('src/*.ts')
        .pipe(ts({
            moduleResolution: 'Node',
            module: 'CommonJS',
            noImplicitAny: true,
            target: 'ES6',
            allowJs: true
        }))
        .pipe(gulp.dest('src/'));
});

gulp.task('compress', ['lint'], () => {
  gulp.src('src/*.js')
    .pipe(minify({
        noSource: true,
        ext:{
            min:'.js'
        },
        exclude: ['tasks'],
        ignoreFiles: ['.combo.js', '-min.js']
    }))
    .pipe(gulp.dest('src/'));
});

gulp.task('compress-frontend', () => {
  gulp.src('build/src/frontend/**/*.js')
    .pipe(minify({
        noSource: true,
        ext:{
            min:'.js'
        },
        exclude: ['tasks'],
        ignoreFiles: ['.combo.js', '-min.js']
    }))
    .pipe(gulp.dest('src/'));
});

gulp.task('clean',['clean-debug', 'clean-build'], () => {
    return gulp.src(['conTVLauncher*'], {read: false})
        .pipe(clean())
        .pipe(gulp.dest('./'));
});

gulp.task('clean-debug', () => {
    return gulp.src(['src/*.js'], {read: false})
        .pipe(clean())
        .pipe(gulp.dest('./'));
});
gulp.task('clean-build', () => {
    return gulp.src(['build'], {read: true})
        .pipe(clean())
        .pipe(gulp.dest('./'));
});

gulp.task('install-app', () => {
    return gulp.src(['build/package.json'])
        .pipe(gulp.dest('build/'))
        .pipe(install({
            npm: '--production'
        }));
});
gulp.task('install-bower', () => {
    return gulp.src(['build/src/frontend/bower.json'])
        .pipe(gulp.dest('./build/src/frontend'))
        .pipe(install({
            bower: {allowRoot: true}
        }));
});



function isFixed(file) {
	// Has ESLint fixed the file contents?
	return file.eslint != null && file.eslint.fixed;
}