var pkg = require('./package.json');

module.exports = {
    pkg: pkg,
    buildPaths: [
        {source: "./src", target: './_site', minify: false},
        {source: "./examples", target: './_site'},
        {source: './test/fixtures', target: './_test'}
    ],
    tasks: {
        build: ['sass', 'mustache', 'browserify'],
        serve: 'staticApp',
        bump: ['package.json', 'src/app.json'],
        release: ['git', 'gh-pages']
    },
    browserify: {
        insertGlobals: true,
        detectGlobals: false,
        noParse: [
            './bower_components/d3/d3.js'
        ],
        vendorBundle: [
            {file: './bower_components/d3/d3.js', expose: 'd3'}
        ],
        vendorTarget: 'scripts/vendor.js'
    }
};
