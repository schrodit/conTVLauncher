'use strict';
const gulp = require('gulp');
const runSequence = require('run-sequence');
const clean = require('gulp-clean');

const ts = require('gulp-typescript');
const tslint = require('gulp-tslint');

const gulpIf = require('gulp-if');
const eslint = require('gulp-eslint');

const minify = require('gulp-minify');

gulp.task('lint', () => {
    return gulp.src(['**/*.js','!**/node_modules/**', '!**/bower_components/**'])
        .pipe(eslint({configFile: '.eslintc.json', fix: true}))
        .pipe(eslint.format())
        .pipe(eslint.failAfterError())
        .pipe(gulpIf(isFixed, gulp.dest('./')));
});

gulp.task('tslint', ['clean'], () =>
    gulp.src('app/src/*.ts')
        .pipe(tslint({
            configuration: 'tslint.json',
            formatter: 'verbose'
        }))
        .pipe(tslint.report())
);

gulp.task('typescript', () => {
    return gulp.src('app/src/*.ts')
        .pipe(ts({
            moduleResolution: 'Node',
            module: 'CommonJS',
            noImplicitAny: true,
            target: 'ES6',
            allowJs: true
        }))
        .pipe(gulp.dest('app/'));
});

gulp.task('compress', ['lint'], () => {
  gulp.src('app/*.js')
    .pipe(minify({
        ext:{
            src:'-debug.js',
            min:'.js'
        },
        exclude: ['tasks'],
        ignoreFiles: ['.combo.js', '-min.js']
    }))
    .pipe(gulp.dest('app/'));
});

gulp.task('clean', () => {
    return gulp.src(['app/*.js'], {read: false})
        .pipe(clean());
});
gulp.task('clean-debug', () => {
    return gulp.src(['app/*debug.js'], {read: false})
        .pipe(clean());
});

gulp.task('default', function () {
    runSequence('clean', 'tslint', 'typescript', 'compress', 'clean-debug'); 
});

gulp.task('dev',  () => {
    runSequence('clean', 'typescript'); 
});

function isFixed(file) {
	// Has ESLint fixed the file contents?
	return file.eslint != null && file.eslint.fixed;
}