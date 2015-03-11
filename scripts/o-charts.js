require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict'

var d3 = require('d3');

function categoryAxis() {

	var ticksize = 5;
	var a = d3.svg.axis().orient('left').tickSize(ticksize , 0);
	var lineHeight = 16;
	var userTicks = [];
	var yOffset = 0;
	var xOffset = 0;

	function isVertical() {
		return a.orient() === 'left' || a.orient() === 'right';
	}

	function axis(g) {
		g = g.append('g').attr('transform','translate(' + xOffset + ',' + yOffset + ')');
		g.call(a);
	}

	axis.tickSize = function(x){
		if (!arguments.length) return ticksize;
		a.tickSize(-x);
		return axis;
	}

	axis.ticks = function(x){
		if (!arguments.length) return a.ticks();
		if (x.length) {
			userTicks = x;
		}
		return axis;
	}

	axis.orient = function(x){
		if (!arguments.length) return a.orient();
		a.orient(x);
		return axis;
	};

	axis.scale = function(x){
		if (!arguments.length) return a.scale();
		a.scale(x);
		if (userTicks.length) {
			a.tickValues( userTicks );
		} else {
			a.ticks( Math.round( (a.scale().range()[1] - a.scale().range()[0])/100 ) );
		}
		return axis;
	};

	axis.yOffset = function(x){
		if (!arguments.length) return yOffset;
		yOffset = x;
		return axis;
	};

	axis.xOffset = function(x){
		if (!arguments.length) return yOffset;
		xOffset = x;
		return axis;
	};

	return axis;
}

module.exports = categoryAxis;

},{"d3":undefined}],2:[function(require,module,exports){
'use strict'

var d3 = require('d3');

function dateAxis() {

	var axes = [ d3.svg.axis().orient('bottom') ];
	var scale;
	var lineheight = 20;
	var ticksize = 5;
	var formatter = {};
	// a simple axis has only first and last points as ticks, i.e. the scale's domain extent
	var simple = false;
	var nice = false;
	var units = ['multi'];
	var unitOverride = false;
	var yOffset = 0;
	var xOffset = 0;
	var labelWidth;
	var showDomain = false;

	var formatter = {
		centuries: function(d, i) {
			if(i == 0 || d.getYear() % 100 == 0) {
				return d3.time.format('%Y')(d);
			}
			return d3.time.format('%y')(d);
		},

		decades: function(d, i) {
			if(i == 0 || d.getYear() % 100 == 0) {
				return d3.time.format('%Y')(d);
			}
			return d3.time.format('%y')(d);
		},

		years: function(d, i) {
			if(i == 0 || d.getYear() % 100 == 0) {
				return d3.time.format('%Y')(d)
			}
			return d3.time.format('%y')(d);
		},

		fullyears: function(d, i) {
			return d3.time.format('%Y')(d);
		},
		shortmonths: function(d, i){
			return d3.time.format('%b')(d)[0];
		},
		months: function(d, i) {
			return d3.time.format('%b')(d);
		},

		weeks: function(d, i) {
			return d3.time.format('%e %b')(d);
		},

		days: function(d, i) {
			return d3.time.format('%e')(d);
		},

		hours: function(d, i) {
			return parseInt(d3.time.format('%H')(d)) + ':00';
		}

	};

	var interval = {
		centuries: d3.time.year,
		decades: d3.time.year,
		years: d3.time.year,
		fullyears: d3.time.year,
		months: d3.time.month,
		weeks: d3.time.week,
		days: d3.time.day,
		hours: d3.time.hours
	};

	var increment = {
		centuries: 100,
		decades: 10,
		years: 1,
		fullyears: 1,
		months: 1,
		weeks: 1,
		days: 1,
		hours: 6
	};

	function unitGenerator(domain){	//which units are most appropriate
		var u = [];
		var timeDif = domain[1].getTime() - domain[0].getTime();
		var dayLength = 86400000;
		if (timeDif < dayLength * 2) {
			return ['hours','days','months'];
		}
		if (timeDif < dayLength * 60){
			return ['days','months'];
		}
		if (timeDif < dayLength * 365.25) {
			return ['months','years'];
		}
		if (timeDif < dayLength * 365.25 * 15) {
			return ['years'];
		}
		if (timeDif < dayLength * 365.25 * 150) {
			return ['decades'];
		}
		if (timeDif < dayLength * 365.25 * 1000) {
			return ['centuries'];
		}

		return ['multi'];
	}

	function dateSort(a,b){
		return (a.getTime() - b.getTime());
	}

	function axis(g){

		g = g.append('g').attr('transform','translate(' + xOffset + ',' + yOffset + ')');

		g.append('g').attr('class','x axis').each(function() {
			var g = d3.select(this);
			axes.forEach(function (a,i) {
				g.append('g')
					.attr('class',function() {
						if(i==0){
							return 'primary';
						}
						return 'secondary';
					})
					.attr('transform','translate(0,' + (i * lineheight) + ')')
					.call(a);
			});
			//remove text-anchor attribute from year positions
			var v = g.selectAll('.primary')
				.selectAll('text').attr({
					x: null,
					y: null,
					dy: 15 + ticksize
				});
			//clear the styles D3 sets so everything's coming from the css
			g.selectAll('*').attr('style', null);
		});

		labelWidth = 0;
		g.select('.tick text').each(function (d) { //calculate the widest label
			labelWidth = Math.max(d3.select(this).node().getBoundingClientRect().width, labelWidth);
		});
		if(!showDomain){
			g.select('path.domain').remove();
		}

//check for and remove overlaping labels
// if there are overlaps then remove text
		var limit = 5;
		while(overlapping( g.selectAll('.primary text') ) && limit>0){
			limit--;
			g.selectAll('.primary text').each(function(d,i){
				if(i%2 != 0) d3.select(this).remove();
			});
		}

		limit = 5;
		while(overlapping( g.selectAll('.secondary text') ) && limit>0){
			limit--;
			g.selectAll('.secondary text').each(function(d,i){
				if(i%2 != 0) d3.select(this).remove();
			});
		}
	}

	function overlapping(selection){
		var bounds = [];
		var overlap = false;
		selection.each(function(d,i){
			//check whether it overlaps any of the existing bounds
			var rect = this.getBoundingClientRect();
			var include = true;
			var current = d3.select(this);
			bounds.forEach(function(b,i){
				if(intersection(b,rect)){
					include = false;
					overlap = true;
				}
			});
			if(include){
				bounds.push(rect);
			}
		});
		return overlap;
	}

	function intersection(a, b){
		var overlap = (a.left <= b.right &&
			b.left <= a.right &&
			a.top <= b.bottom &&
			b.top <= a.bottom);
		return overlap;
	}

	axis.simple = function(x) {
		if (!arguments.length) return simple;
		simple = x;
		return axis;
	}

	axis.nice = function(x) {
		if (!arguments.length) return nice;
		nice = x;
		return axis;
	}

	axis.labelWidth = function() {
		// return the width of the widest axis label
		return labelWidth;
	}


	axis.lineHeight = function(x) {
		if (!arguments.length) return lineheight;
		lineheight = x;
		return axis;
	}

	axis.tickSize = function(x) {
		if (!arguments.length) return ticksize;
		ticksize = x;
		return axis;
	}


	axis.scale = function(x, u) {
		if (!arguments.length) return axes[0].scale();
		if (!u) {
			u = unitGenerator(x.domain());
		}
		scale = x;
		if (nice) {
			scale.nice((scale.range()[1] - scale.range()[0]) / 100); //specify the number of ticks should be about 1 every 100 pixels
		}

		//go through the units array

		axes = [];
		for (var i = 0; i < u.length; i++) {
			if( formatter[u[i]] ){
				if(!simple){
					var customTicks = scale.ticks( interval[ u[i] ], increment[ u[i] ] );

					customTicks.push(scale.domain()[0]); //always include the first and last values
					customTicks.push(scale.domain()[1]);
					customTicks.sort(dateSort);

					//if the last 2 values labels are the same, remove them
					var labels = customTicks.map(formatter[u[i]]);
					if(labels[labels.length-1] == labels[labels.length-2]){
						customTicks.pop();
					}
				}else{
					if (u[i] === 'years' || u[i] === 'decades' || u[i] === 'centuries') {
						u[i] = 'fullyears'; //simple axis always uses full years
					}
					customTicks = scale.domain();
				}


				var a = d3.svg.axis()
					.scale( scale )
					.tickValues( customTicks )
					.tickFormat( formatter[ u[i] ] )
					.tickSize(ticksize,0);

				axes.push( a );
			}
		}

		axes.forEach(function (a) {
			a.scale(scale);
		})

		return axis;
	};

	axis.yOffset = function(x) {
		if (!arguments.length) return yOffset;
		yOffset = x;
		return axis;
	};

	axis.xOffset = function(x) {
		if (!arguments.length) return yOffset;
		yOffset = x;
		return axis;
	};

	return axis;
}

module.exports = dateAxis;

},{"d3":undefined}],3:[function(require,module,exports){
module.exports = {
  category: require('./category.js'),
  date: require('./date.js'),
  number: require('./number.js')
};

},{"./category.js":1,"./date.js":2,"./number.js":4}],4:[function(require,module,exports){
'use strict'

//this is wrapper for d3.svg.axis
//for a standard FT styled numeric axis
//usually these are vertical

var d3 = require('d3');

function numericAxis() {

	var ticksize = 5;
	var a = d3.svg.axis().orient('left').tickSize(ticksize , 0);
	var lineHeight = 16;
	var userTicks = [];
	var hardRules = [0];
	var yOffset = 0;
	var xOffset = 0;
	var simple = false;
	var noLabels = false;
	var pixelsPerTick = 100;
	var extension = 0;

	function isVertical() {
		return a.orient() === 'left' || a.orient() === 'right';
	}

	function axis(g) {
		var orientOffset = 0;

		if (a.orient() === 'right') {
			orientOffset = -a.tickSize();
		}

		g = g.append('g').attr('transform','translate(' + (xOffset + orientOffset) + ',' + yOffset + ')');

		g.append('g')
			.attr('class', function(){
				if (isVertical()) {
					if (a.orient() == 'left') {
						return 'y axis left';
					}
					return 'y axis left';
				} else {
					return 'x axis';
				}
			})
			.append('g')
				.attr('class', 'primary')
				.call(a);

		//arange the ticks (if they're on the right to be properly right aligned taking into account their size)
		var textWidth = 0;
		if(a.orient() == 'right'){
			//measure the width of the text boxes
			g.selectAll('text').each(function(d){
				textWidth = Math.max( textWidth, Math.ceil(this.getBoundingClientRect().width) );
			});
		}

		g.selectAll('*').attr('style', null); //clear the styles D3 sets so everything's coming from the css
		if (isVertical()) {
			g.selectAll('text').attr('transform', 'translate( '+textWidth+', ' + -(lineHeight/2) + ' )'); //move the labels so they sit on the axis lines
			g.selectAll('.tick').classed('origin', function (d,i) { //'origin' lines are 0, the lowest line (and any user specified special values)
				return hardRules.indexOf(d) > -1;
			});

		}

		//extend the axis rules to the right or left if we need to
		var rules = g.selectAll('line');
		if (isVertical()) {
			if (a.orient() == 'right') {
				rules.attr('x1',extension)
			}else{
				rules.attr('x1',-extension)
			}
		}

		if (noLabels) {
			g.selectAll('text').remove();
		}
	}

	axis.tickExtension = function(x) { // extend the axis ticks to the right/ left a specified distance
		if (!arguments.length) return extension;
		extension = x;
		return axis;
	}

	axis.tickSize = function(x) {
		if (!arguments.length) return ticksize;
		a.tickSize(-x);
		return axis;
	}

	axis.ticks = function(x) {
		if (!arguments.length) return a.ticks();
		if (x.length > 0) {
			userTicks = x;
		}
		return axis;
	}

	axis.orient = function(x){
		if (!arguments.length) return a.orient();
		a.orient(x);
		return axis;
	};

	axis.simple = function(x){
		if (!arguments.length) return simple;
		simple = x;
		return axis;
	}

	axis.pixelsPerTick = function(x){
		if (!arguments.length) return pixelsPerTick;
		pixelsPerTick = x;
		return axis;
	}

	axis.scale = function(x){
		if (!arguments.length) return a.scale();
		a.scale(x);

		if (userTicks.length > 0) {
			a.tickValues(userTicks);
		}else{
			var count = Math.round( (a.scale().range()[1] - a.scale().range()[0])/pixelsPerTick );
			if(count < 2) { count = 3; }
			else if(count < 5) { count = 5; }
			else if(count < 10) { count = 10; }

			if (simple) {
				var customTicks = [];
				var r = a.scale().domain();
				if (Math.min(r[0], r[1]) < 0 && Math.max(r[0], r[1]) > 0) {
					customTicks.push(0);
				}
				customTicks.push(a.scale().domain()[1]);
				customTicks.push(a.scale().domain()[0]);
			}else{
				customTicks = a.scale().ticks(count);
				//the bottom and top of the domain should be at exact ticks
				//get the max tic interval, this will be the default
				var interval = 0;
				customTicks.forEach(function(d,i){
					if(i < customTicks.length-1){
						interval = Math.max( customTicks[i+1] - d,  interval);
					}
				});

				//round up to the domain to the nearest interval
				a.scale().domain()[0] = Math.ceil(a.scale().domain()[0]/interval) * interval;
				a.scale().domain()[1] = Math.floor(a.scale().domain()[1]/interval) * interval;

				customTicks.push(a.scale().domain()[1]);
				customTicks.push(a.scale().domain()[0]);
				hardRules.push(a.scale().domain()[1]);
			}
			//if two of the formatted ticks have the same value, remove one of them

			var formatted = [];
			customTicks = customTicks.filter( function(d){
				var f = a.scale().tickFormat()(d);
				if(formatted.indexOf(f) > -1){
					return false;
				}
				formatted.push(f);
				return true;
			} );
			a.tickValues( customTicks );
		}
		return axis;
	};

	axis.hardRules = function(x){ //this allows you to set which lines will be solid rather than dotted, by default it's just zero and the bottom of the chart
		if (!arguments.length) return hardRules;
		hardRules = x;
		return axis;
	}

	axis.yOffset = function(x){
		if (!arguments.length) return yOffset;
		yOffset = x;
		return axis;
	};

	axis.xOffset = function(x){
		if (!arguments.length) return yOffset;
		xOffset = x;
		return axis;
	};

	axis.tickFormat = function(f){
		if (!arguments.length) return a.tickFormat();
		a.tickFormat(f);
		return axis;
	}

	axis.noLabels = function(x){
		if (!arguments.length) return noLabels;
		noLabels = x;
		return axis;
	}

	return axis;
}

module.exports = numericAxis;

},{"d3":undefined}],5:[function(require,module,exports){
'use strict';
var d3 = require('d3');

function blankChart() {

	function buildModel(opts){
		var m = {
			//layout stuff
			title: 'chart title',
			subtitle: 'chart subtitle (letters)',
			height: undefined,
			width: 300,
			chartHeight: 300,
			chartWidth: 300,
			blockPadding: 8,
			data: [],
			error: function(err) {
				console.log('ERROR: ', err);
			}
		};

		for(var key in opts) {
			m[key] = opts[key];
		}

		return m;
	}

	function getHeight(selection){
		return Math.ceil(selection.node().getBoundingClientRect().height);
	}

	function getWidth(selection){
		return Math.ceil(selection.node().getBoundingClientRect().width);
	}

	function translate(position){
		return 'translate(' + position.left + ',' + position.top + ')';
	}

	function chart(g) {

		var model = buildModel(g.data()[0]);

		if(!model.height) {
			model.height = model.width;
		}

		var	svg = g.append('svg')
				.attr({
					'class': 'null-chart',
					height: model.height,
					width: model.width
				});

		var title = svg.append('text').text(model.title + " - PLACE HOLDER CHART");
		title.attr('transform', translate({top: getHeight(title), left: 0}));
		var subtitle = svg.append('text').text(model.subtitle);
		subtitle.attr('transform', translate({top: getHeight(title) + getHeight(subtitle) ,left: 0}));

		svg.selectAll('text').attr({
			fill:'#000',
			stroke:'none'
		});
	}

	return chart;
}

module.exports = blankChart;

},{"d3":undefined}],6:[function(require,module,exports){
module.exports = {
  line: require('./line.js'),
  blank: require('./blank.js'),
  pie: require('./pie.js')
};

},{"./blank.js":5,"./line.js":7,"./pie.js":8}],7:[function(require,module,exports){
//reusable linechart
'use strict'

var d3 = require('d3');
var dateAxis = require('../axis/date.js');
var numberAxis = require('../axis/number.js');
var textArea = require('../element/text-area.js');
var lineKey = require('../element/line-key.js');
var ftLogo = require('../element/logo.js');
var lineThickness = require('../util/line-thickness.js');
var interpolator = require('../util/line-interpolators.js');
var ratios = require('../util/aspect-ratios.js');

function isDate(d) {
	return d && d instanceof Date && !isNaN(+d);
}

function isTruthy(value) {
	return !!value;
}

function normaliseSeriesOptions(value) {
	var d = {key: null, label: null};

	if (!value) {
		return d;
	}

	if (typeof value === 'string') {
		d.key = d.label = value;
	} else if (Array.isArray(value) && value.length <= 2 && typeof value[0] === 'string') {
		d.key = value[0];
		d.label = typeof value[1] !== 'string' ? d.key : value[1];
	} else if (typeof value === 'function') {
		d = value();
	} else if (value.key) {
		d.key = value.key;
		d.label = value.label || d.key;
	}

	if (typeof d.key === 'function') {
		d.key = d.key();
	}

	if (typeof d.label === 'function') {
		d.label = d.label();
	}

	return d;
}

function normaliseYAxisOptions(value) {
	if (!value) return [];
	return (!Array.isArray(value) ? [normaliseSeriesOptions(value)] : value.map(normaliseSeriesOptions)).filter(isTruthy);
}

function getHeight(selection) {
	return Math.ceil(selection.node().getBoundingClientRect().height);
}

function getWidth(selection) {
	return Math.ceil(selection.node().getBoundingClientRect().width);
}

function translate(margin) {
	return function(position) {
		var left = position.left || 0;
		var top = position.top || 0;
		return 'translate(' + (margin + left) + ',' + top + ')';
	}
}

function lineChart(p) {

	var lineClasses = ['series1', 'series2', 'series3', 'series4', 'series5', 'series6', 'series7', 'accent'];

	//these classes can be used in addition to those above
	var complementaryLineCLasses = ['forecast'];

	function buildModel(opts) {
		var m = {
			//layout stuff
			height: undefined,
			width: 300,
			chartHeight: undefined,
			chartWidth: undefined,
			blockPadding: 8,
			simpleDate: false,
			simpleValue: false,
			logoSize: 28,
			//data stuff
			falseorigin: false, //TODO, find out if there's a standard 'pipeline' temr for this
			error: function(err) { console.log('ERROR: ', err) },
			lineClasses: {},
			niceValue: true,
			hideSource: false,
			numberAxisOrient: 'left',
			margin: 2,
			lineThickness: undefined,
			x: {
				series: '&'
			},
			y: {
				series: []
			},
			labelLookup: null,
			sourcePrefix: 'Source: '
		};

		for (var key in opts) {
			m[key] = opts[key];
		}

		m.contentWidth = m.width - (m.margin * 2);

		m.translate = translate(0);

		// only set the chart width if hasn't been defined
		// explicitly in the config
		if (!m.chartWidth) {
			// minus gutter for logo
			var rightGutter = m.contentWidth < 260 ? 16 : 26
			m.chartWidth = m.contentWidth - rightGutter;
		}

		if (!m.chartHeight) {
			// The chart size should have a nice aspect ratio
			var isNarrow = m.chartWidth < 220;
			var isWide = m.chartWidth > 400;
			var ratio = isNarrow ? 1.1 : (isWide ? ratios.commonRatios.widescreen : ratios.commonRatios.standard);
			m.chartHeight = ratios.heightFromWidth(m.chartWidth, ratio);
		}

		m.lineStrokeWidth = lineThickness(m.lineThickness);

		m.x.series = normaliseSeriesOptions(m.x.series);
		m.y.series = normaliseYAxisOptions(m.y.series)
							.filter(function (d) {
								return !!d.key && d.key !== m.x.series.key;
							})
							.map(function (d, i) {
								d.index = i;
								d.className = lineClasses[i];
								return d;
							});

		if (typeof m.key !== 'boolean') {
			m.key = m.y.series.length > 1;
		} else if (m.key && !m.y.series.length) {
			m.key = false;
		}

		m.data = !Array.isArray(m.data) ? [] : m.data.map(function (d, i) {

			var s = d[m.x.series.key];
			var error = {
				node: null,
				message: '',
				row: i,
				column: m.x.series.key,
				value: s
			};

			if (!d) {
				error.message = 'Empty row';
			} else if (!s) {
				error.message = 'X axis value is empty or null';
			} else if (!isDate(s)) {
				error.message = 'Value is not a valid date';
			}

			if (error.message) {
				m.error(error);
				d[m.x.series.key] = null;
			}

			return d;

		});

		//make sure all the lines are numerical values, calculate extents...
		var extents = [];
		m.y.series.forEach(function (l, i) {
			var key = l.key;
			m.data = m.data.map(function (d, j) {

				var value = d[key];
				var isValidNumber = value === null || typeof value === 'number';
				if (!isValidNumber) {
					m.error({
						node: null,
						message: 'Value is not a number',
						value: value,
						row: j,
						column: key
					});
				}
				return d;
			});
			var ext = d3.extent(m.data, function(d){
				return d[key];
			});
			extents = extents.concat (ext);
		});

		//work out the time domain
		if (!m.timeDomain) {
			m.timeDomain = d3.extent(m.data, function (d) {
				return d[m.x.series.key];
			});
		}

		//work out the value domain
		if (!m.valueDomain) {
			m.valueDomain = d3.extent(extents);
			// unless a false origin has been specified
			if (!m.falseorigin && m.valueDomain[0] > 0) {
				m.valueDomain[0] = 0;
			}
		}

		return m;
	}

	function chart(g){

		//the model is built froma  copy of the data
		var model = buildModel(Object.create(g.data()[0]));

		var svg = g.append('svg')
				.attr({
					'class': 'graphic line-chart',
					//we don't necessarily know the height at the moment so may be undefiend...
					height: model.height,
					width: model.width
				});

		var defaultLineHeight = 1.2;
		// TODO: don't hard-code the fontsize, get from CSS somehow.
		var titleFontSize = 18;
		// TODO: move calculation of lineheight to the textarea component;
		var titleLineHeight = defaultLineHeight;
		var titleLineHeightActual = Math.ceil(titleFontSize * titleLineHeight);
		var titleLineSpacing = titleLineHeightActual - titleFontSize;
		var footerLineHeight = 15;
		var subtitleFontSize = 12;
		var subtitleLineHeight = defaultLineHeight;
		var subtitleLineHeightActual = Math.ceil(subtitleFontSize * subtitleLineHeight);
		var subtitleLineSpacing = subtitleLineHeightActual - subtitleFontSize;
		var sourceFontSize = 10;
		var sourceLineHeight = defaultLineHeight;
		var sourceLineHeightActual = sourceFontSize * sourceLineHeight;
		var halfLineStrokeWidth = Math.ceil(model.lineStrokeWidth / 2);

			//create title, subtitle, key, source, footnotes, logo, the chart itself
			var titleTextWrapper = textArea().width(model.contentWidth).lineHeight(titleLineHeightActual),
			subtitleTextWrapper = textArea().width(model.contentWidth).lineHeight(subtitleLineHeightActual),
			footerTextWrapper = textArea().width(model.contentWidth - model.logoSize).lineHeight(footerLineHeight),

			chartKey = lineKey({lineThickness: model.lineStrokeWidth})
				.style(function (d) {
					return d.value;
				})
				.label(function (d) {
					if (model.labelLookup !== null && model.labelLookup[d.key]) {
						return model.labelLookup[d.key];
					}
					return d.key;
				}),

			elementPositions = [],
			totalHeight = 0;

		//position stuff
		//start from the top...
		var title = svg.append('g').attr('class','chart-title').datum(model.title).call(titleTextWrapper);
		if (!model.titlePosition) {
			if (model.title) {
				model.titlePosition = {top: totalHeight + titleFontSize, left: 0};
				//if the title is multi line it's positon should only be the offset by the height of the first line...
				totalHeight += (getHeight(title) + model.blockPadding - titleLineSpacing);
			} else {
				model.titlePosition = {top: totalHeight, left: 0};
			}
		}

		title.attr('transform', model.translate(model.titlePosition));

		var subtitle = svg.append('g').attr('class','chart-subtitle').datum(model.subtitle).call(subtitleTextWrapper);

		if (!model.subtitlePosition) {
			if (model.subtitle) {
				model.subtitlePosition = {top: totalHeight + subtitleFontSize, left: 0};
				totalHeight += (getHeight(subtitle) + model.blockPadding);
			} else {
				model.subtitlePosition = {top: totalHeight, left: 0};
			}
		}

		subtitle.attr('transform', model.translate(model.subtitlePosition));

		if (model.key) {
			var entries = model.y.series.map(function (d) {
				return {key: d.label, value: d.className};
			});

			var key = svg.append('g').attr('class', 'chart-key').datum(entries).call(chartKey);

			if (!model.keyPosition) {
				model.keyPosition = {top: totalHeight, left: halfLineStrokeWidth};
				totalHeight += (getHeight(key) + model.blockPadding);
			}
			key.attr('transform', model.translate(model.keyPosition));
		}

		var chart = svg.append('g').attr('class', 'chart');

		if (!model.chartPosition) {
			model.chartPosition = {
				top: totalHeight + halfLineStrokeWidth,
				left: (model.numberAxisOrient === 'left' ? 0 : halfLineStrokeWidth)
			};
		}

		chart.attr('transform', model.translate(model.chartPosition));

		var footnotes = svg.append('g').attr('class','chart-footnote').datum(model.footnote).call(footerTextWrapper);
		var source = svg.append('g').attr('class','chart-source').datum(model.sourcePrefix + model.source).call(footerTextWrapper);
		var sourceHeight = getHeight(source);

		if (model.hideSource) {
			sourceHeight = 0;
			source.remove();
		}

		var footnotesHeight = getHeight(footnotes);
		var footerHeight = Math.max(footnotesHeight + sourceHeight + (model.blockPadding * 2), model.logoSize);

		totalHeight += (footerHeight + model.blockPadding);

		if (!model.height) {
			model.height = totalHeight + model.chartHeight;
		} else {
			model.chartHeight = model.height - totalHeight;
			if (model.chartHeight < 0) {
				model.error({
					node:chart,
					message:'calculated plot height is less than zero'
				});
			}
		}

		svg.attr('height', Math.ceil(model.height));

		//the position at the bottom of the 'chart'
		var currentPosition = model.chartPosition.top + model.chartHeight;
		footnotes.attr('transform', model.translate({ top: currentPosition + footerLineHeight + model.blockPadding }));
		source.attr('transform', model.translate({ top: currentPosition + footnotesHeight + sourceLineHeightActual + (model.blockPadding * 2)}));

		//the business of the actual chart
		//make provisional scales
		var valueScale = d3.scale.linear()
			.domain(model.valueDomain.reverse())
			.range([0, model.chartHeight ]);

		if (model.niceValue) {
			valueScale.nice();
		}

		var timeScale = d3.time.scale()
			.domain(model.timeDomain)
			.range([0, model.chartWidth]);

		//first pass, create the axis at the entire chartWidth/Height

		var vAxis = numberAxis()
//				.orient( model.numberAxisOrient )
				.tickFormat(model.numberAxisFormatter)
				.simple(model.simpleValue)
				.tickSize(model.chartWidth)	//make the ticks the width of the chart
				.scale(valueScale),

			timeAxis = dateAxis()
				.simple(model.simpleDate)
				.yOffset(model.chartHeight)	//position the axis at the bottom of the chart
				.scale(timeScale);

		if (model.numberAxisOrient !== 'right' && model.numberAxisOrient !== 'left') {
			vAxis.noLabels(true);
		} else {
			vAxis.orient(model.numberAxisOrient);
		}

		chart.call(vAxis);
		chart.call(timeAxis);

		//measure chart
		var widthDifference = getWidth(chart) - model.chartWidth, //this difference is the ammount of space taken up by axis labels
			heightDifference = getHeight(chart) - model.chartHeight,
			//so we can work out how big the plot should be (the labels will probably stay the same...
			plotWidth = model.chartWidth - widthDifference,
			plotHeight = model.chartHeight - heightDifference,
			newValueRange = [valueScale.range()[0], plotHeight],
			newTimeRange = [timeScale.range()[0], plotWidth];

		valueScale.range(newValueRange);
		timeScale.range(newTimeRange);
		timeAxis.yOffset(plotHeight);
		vAxis.tickSize(plotWidth).tickExtension(widthDifference);

		//replace provisional axes
		chart.selectAll('*').remove();
		chart.call(vAxis);
		chart.call(timeAxis);
		if (model.numberAxisOrient !== 'right') {
			//figure out how much of the extra width is the vertical axis lables
			var vLabelWidth = 0
			chart.selectAll('.y.axis text').each(function(){
				vLabelWidth = Math.max(vLabelWidth, getWidth(d3.select(this)));
			});
			model.chartPosition.left += vLabelWidth + 4;//NOTE magic number 4
		}

		model.chartPosition.top += (getHeight(chart.select('.y.axis')) - plotHeight);
		chart.attr('transform', model.translate(model.chartPosition));

		var plot = chart.append('g').attr('class', 'plot');

		var logo = svg.append('g').call(ftLogo, model.logoSize);
		var heightOfFontDescenders = 3;
		var baselineOfLastSourceLine = model.height - getHeight(logo) - heightOfFontDescenders - (sourceLineHeightActual - sourceFontSize);

		logo.attr('transform', model.translate({
			left: model.width - model.logoSize,
			top: baselineOfLastSourceLine
		}));

		function drawPlot(g, series) {
			//null values in the data are interpolated over
			//NaN values are represented by line breaks
			var normalisedData = model.data.map(function(d){
				return {
					x:d[model.x.series.key],
					y:d[series.key]
				}
			});

			normalisedData = normalisedData.filter(function(d){
				return (d.y !== null);
			});	//filter out null values, these are to be interpolated over

			var line = d3.svg.line()
				.interpolate(interpolator.gappedLine)
				.x( function(d){ return timeScale(d.x) } )
				.y( function(d){ return valueScale(d.y) } );

			g.append('path')
				.datum(normalisedData)
				.attr('class', 'line ' + series.className)
				.attr('stroke-width', model.lineStrokeWidth)
				.attr('d', function(d){
					console.log('datum ', d);
					return line(d);
				});
		}

		var i = model.y.series.length;

		while (i--) {
			drawPlot(plot, model.y.series[i]);
		}

	}

	return chart;
}

module.exports = lineChart;

},{"../axis/date.js":2,"../axis/number.js":4,"../element/line-key.js":9,"../element/logo.js":10,"../element/text-area.js":11,"../util/aspect-ratios.js":12,"../util/line-interpolators.js":14,"../util/line-thickness.js":15,"d3":undefined}],8:[function(require,module,exports){
'use strict';
var d3 = require('d3');

function pieChart() {
	
	function buildModel(opts) {
		var m = {
			//layout stuff
			title:'chart title',
			height:undefined,
			width:300,
			chartHeight:300,
			chartWidth:300,
			indexProperty:'&',
			valueProperty:'value',
			blockPadding:8,
			data:[],
			error:function(err){ console.log('ERROR: ', err) },
		};

		for(var key in opts){
			m[key] = opts[key];
		}

		return m;
	}

	function getHeight(selection) {
		return Math.ceil(selection.node().getBoundingClientRect().height);
	}

	function getWidth(selection) {
		return Math.ceil(selection.node().getBoundingClientRect().width);	
	}

	function translate(position) {
		return 'translate(' + position.left + ',' + position.top + ')';
	}

	function chart(g) {
		var model = buildModel( g.data()[0] );
		if(!model.height){
			model.height = model.width;
		}
		var	svg = g.append('svg')
				.attr({
					'class':'null-chart',
					'height':model.height,
					'width':model.width
				});

		var title = svg.append('text').text(model.title + " - PLACE HOLDER CHART");
		title.attr('transform',translate({top: getHeight(title), left:0}));

		var subtitle = svg.append('text').text(model.subtitle);
		subtitle.attr('transform',translate({top: getHeight(title) + getHeight(subtitle), left:0}));

		var chart = svg.append('g').attr('class','chart');

		if(model.data.length > 3){
			model.error('PIE warning: too many segments!');
		}

		var outerRadius = model.width / 2; 

		chart.selectAll('.slice')
			.data( model.data )
				.enter()
					//.append(path);
		
		svg.selectAll('text').attr({
			fill:'#000',
			stroke:'none'
		});
	}

	return chart;
}

module.exports = pieChart;

},{"d3":undefined}],9:[function(require,module,exports){
'use strict'

var d3 = require('d3');
var lineThickness = require('../util/line-thickness.js');

function lineKey(options) {

	options = options || {};

	var width = 300;
	var strokeLength = 15;
	var lineHeight = 16;
	var strokeWidth = lineThickness(options.lineThickness);

	var style = function(d) {
		return d.style;
	};

	var label = function(d) {
		return d.label;
	};

	var filter = function(){
		return true;
	};

	function key(g){
		g = g.append('g').attr('class','chart-linekey');
		var keyItems = g.selectAll('g').data( g.datum().filter( filter ) )
				.enter()
				.append('g').attr({
					'class':'key-item',
					'transform':function(d,i){
						return 'translate(0,' + (lineHeight + i * lineHeight) + ')'
					}
				});

		keyItems.append('line').attr({
			'class': style,
			x1: 1,
			y1: -5,
			x2: strokeLength,
			y2: -5
		})
		.attr('stroke-width', strokeWidth)
		.classed('key-line',true);

		keyItems.append('text').attr({
			'class':'key-label',
			x:strokeLength + 10
		}).text(label);

	}

	key.label = function(f){
		if (!arguments.length) return label;
		label = f;
		return key;
	};

	key.style = function(f){
		if (!arguments.length) return style;
		style = f;
		return key;
	};

	key.width = function(x){
		if (!arguments.length) return width;
		width = x;
		return key;
	};

	key.lineHeight = function(x){
		if (!arguments.length) return lineHeight;
		lineHeight = x;
		return key;
	};

	return key;
}

module.exports = lineKey;

},{"../util/line-thickness.js":15,"d3":undefined}],10:[function(require,module,exports){
//the ft logo there's probably an easier ay to do this...

'use strict'

var d3 = require('d3');

function ftLogo(g, dim) {
	if(!dim){
		dim = 32;
	}
	var d = 'M21.777,53.336c0,6.381,1.707,7.1,8.996,7.37v2.335H1.801v-2.335c6.027-0.27,7.736-0.989,7.736-7.37v-41.67 c0-6.387-1.708-7.104-7.556-7.371V1.959h51.103l0.363,13.472h-2.519c-2.16-6.827-4.502-8.979-16.467-8.979h-9.27 c-2.785,0-3.415,0.624-3.415,3.142v19.314h4.565c9.54,0,11.61-1.712,12.779-8.089h2.338v21.559h-2.338 c-1.259-7.186-4.859-8.981-12.779-8.981h-4.565V53.336z M110.955,1.959H57.328l-1.244,13.477h3.073c1.964-6.601,4.853-8.984,11.308-8.984h7.558v46.884 c0,6.381-1.71,7.1-8.637,7.37v2.335H98.9v-2.335c-6.931-0.27-8.64-0.989-8.64-7.37V6.453h7.555c6.458,0,9.351,2.383,11.309,8.984 h3.075L110.955,1.959z';
	var path = g.append('path').attr('d', d); //measure and rescale to the bounds
	var rect = path.node().getBoundingClientRect();
	//the logo is square so
	var scale = Math.min (dim /rect.width, dim / rect.height);

	path.attr({
		'transform':'scale('+scale+')',
		'fill':'rgba(0,0,0,0.1)'
	});
} 

module.exports = ftLogo;

/*
<path fill="none" d="M21.777,53.336c0,6.381,1.707,7.1,8.996,7.37v2.335H1.801v-2.335c6.027-0.27,7.736-0.989,7.736-7.37v-41.67
		c0-6.387-1.708-7.104-7.556-7.371V1.959h51.103l0.363,13.472h-2.519c-2.16-6.827-4.502-8.979-16.467-8.979h-9.27
		c-2.785,0-3.415,0.624-3.415,3.142v19.314h4.565c9.54,0,11.61-1.712,12.779-8.089h2.338v21.559h-2.338
		c-1.259-7.186-4.859-8.981-12.779-8.981h-4.565V53.336z"/>
	<path fill="none" d="M110.955,1.959H57.328l-1.244,13.477h3.073c1.964-6.601,4.853-8.984,11.308-8.984h7.558v46.884
		c0,6.381-1.71,7.1-8.637,7.37v2.335H98.9v-2.335c-6.931-0.27-8.64-0.989-8.64-7.37V6.453h7.555c6.458,0,9.351,2.383,11.309,8.984
		h3.075L110.955,1.959z"/>
		*/

},{"d3":undefined}],11:[function(require,module,exports){
//text area provides a wrapping text block of a given type

'use strict'

var d3 = require('d3');

function textArea() { 
	var xOffset = 0, 
		yOffset = 0, 
		width=1000, 
		lineHeight = 20, 
		units = 'px', //pixels by default
		bounds;

	function wrap(text, width) {
		text.each(function() {
			var text = d3.select(this),
				words = text.text().trim().split(/\s+/).reverse(),
				word,
				line = [],
				lineNumber = 0,
				y = text.attr('y'),
				dy = parseFloat(text.attr('dy'));

			if(isNaN(dy)){ dy = 0 };

			var tspan = text.text(null).append('tspan')
				.attr('x', 0)
				.attr('y', y)
				.attr('dy', dy + units);

			while (word = words.pop()) {
				line.push(word);
				tspan.text(line.join(' '));
				if (tspan.node().getComputedTextLength() > width) {
					line.pop();
					tspan.text(line.join(' '));
					line = [word];
					lineNumber ++;
					var newY = (lineNumber * lineHeight);
					tspan = text.append('tspan').attr('x', 0).attr('y', y).attr('y', + newY + units).text(word);
				}
			}
		});
	}

	function textArea(g, accessor){
		if(!accessor) {
			accessor = function(d){
				return d;
			}
		}
		g = g.append('g').attr('transform','translate(' + xOffset + ',' + yOffset + ')')
		g.append('text').text(accessor).call(wrap, width);
		bounds = g.node().getBoundingClientRect();
	}


	textArea.bounds = function() {
		return bounds;
	};

	textArea.units = function(x) { //px, em, rem
		if (!arguments.length) return units;
		units = x;
		return textArea;
	};

	textArea.lineHeight = function(x) { //pixels by default
		if (!arguments.length) return lineHeight;
		lineHeight = x;
		return textArea;
	};

	textArea.width = function(x) {
		if (!arguments.length) return width;
		width = x;
		return textArea;
	};

	textArea.yOffset = function(x) {
		if (!arguments.length) return yOffset;
		yOffset = x;
		return textArea;
	};

	textArea.xOffset = function(x) {
		if (!arguments.length) return yOffset;
		yOffset = x;
		return textArea;
	};

	return textArea;
}

module.exports = textArea;

},{"d3":undefined}],12:[function(require,module,exports){
// More info:
// http://en.wikipedia.org/wiki/Aspect_ratio_%28image%29

var commonRatios = {
  square: {width: 1, height: 1},
  standard: {width: 4, height: 3},
  golden: {width: 1.618, height: 1},
  classicPhoto: {width: 3, height: 2},
  widescreen: {width: 16, height: 9},
  panoramic: {width: 2.39, height: 1}
};

function getRatio(name) {
  if (!name) return;

  if (name in commonRatios) {
    return commonRatios[name];
  }

  if (typeof name === 'string') {
    var p = name.split(':');
    return {width: p[0], height: p[1]};
  }

  return name;
}

module.exports = {

  commonRatios: commonRatios,

  widthFromHeight: function(height, ratio) {

    ratio = getRatio(ratio);

    if (!ratio) {
      throw new Error('Ratio is falsey');
    }

    if (typeof ratio === 'number') return height * ratio;

    if (!ratio.height || !ratio.width) {
      throw new Error('Ratio must have width and height values');
    }

    ratio = ratio.width / ratio.height;

    return Math.ceil(height * ratio);
  },

  heightFromWidth: function(width, ratio) {

    ratio = getRatio(ratio);

    if (!ratio) {
      throw new Error('Ratio is falsey');
    }

    if (typeof ratio === 'number') return width * ratio;

    if (!ratio.height || !ratio.width) {
      throw new Error('Ratio must have width and height values');
    }

    ratio = ratio.height / ratio.width;

    return Math.ceil(width * ratio);
  }
};

},{}],13:[function(require,module,exports){
// because of the need to export and convert browser rendered SVGs 
// we need a simple way to attach styles as attributes if necessary, 
// so, heres a list of attributes and the selectors to which they should be applied

var d3 = require('d3');

function applyAttributes(){
	var styleList = [
		//general
			{
				'selector':'svg text',
				'attributes':{
					'font-family':'BentonSans, sans-serif',
					'fill':'#a7a59b',
					'stroke':'none'
				}
			},
		//axes
			{
				'selector':'.axis path, .axis line',
				'attributes':{
					'shape-rendering':'crispEdges',
					'fill':'none'
				}
			},{
				'selector':'.y.axis path.domain, .secondary path.domain, .secondary .tick line',
				'attributes':{
					'stroke':'none'
				}
			},

			{
				'selector':'.y.axis .tick line',
				'attributes':{
					'stroke-dasharray':'2 2'
				}
			},
			{
				'selector':'.y.axis .origin line',
				'attributes':{
					'stroke':'#333',
					'stroke-dasharray':'none'
				}
			},{
				'selector':'.y.axis .origin.tick line',
				'attributes':{
					'stroke':'#333',
					'stroke-dasharray':'none'
				}
			},{
				'selector':'.primary .tick text',
				'attributes':{
					'font-size':12,
					'fill':'#757470'
				}
			},{
				'selector':'.secondary .tick text',
				'attributes':{
					'font-size':10,
					'fill':'#757470'
				}
			},{
				'selector':'.primary .tick line',
				'attributes':{
					'stroke':'#a7a59b'
				}
			},{ 
				'selector':'.y.axis.right text',
				'attributes':{
					'text-anchor':'start'
				}
			},{ 
				'selector':'.y.axis.left text',
				'attributes':{
					'text-anchor':'end'
				}
			},{
				'selector':'.x.axis .primary path.domain',
				'attributes':{
					'stroke':'#757470'
				}
			},
		//lines
			{
				'selector':'path.line, line.key-line',
				'attributes':{
					'fill': 'none',
					'stroke-linejoin': 'round',
					'stroke-linecap': 'round'
				}
			},{
				'selector':'path.series1, line.series1',
				'attributes':{
					'stroke':'#af516c'
				}
			},{
				'selector':'path.series2, line.series2',
				'attributes':{
					'stroke':'#ecafaf'
				}
			},{
				'selector':'path.series3, line.series3',
				'attributes':{
					'stroke':'#d7706c'
				}
			},{
				'selector':'path.series4, line.series4',
				'attributes':{
					'stroke':'#76acb8'
				}
			},{
				'selector':'path.series5, line.series5',
				'attributes':{
					'stroke':'#81d0e6'
				}
			},{
				'selector':'path.series6, line.series6',
				'attributes':{
					'stroke':'#4086b6'
				}
			},{
				'selector':'path.series7, line.series7',
				'attributes':{
					'stroke':'#b8b1a9'
				}
			},{
				'selector':'path.accent, line.accent',
				'attributes':{
					'stroke':'rgb(184,177,169)'
				}
			},
			//text
			{
				'selector':'.chart-title text, .chart-title tspan',
				'attributes':{
					'font-family': 'BentonSans, sans-serif',
					'font-size':18,
					'fill':'rgba(0, 0, 0, 0.8)'
				}
			},{
				'selector':'.chart-subtitle text, .chart-subtitle tspan',
				'attributes':{
					'font-family': 'BentonSans, sans-serif',
					'font-size': 12,
					'fill':'rgba(0, 0, 0, 0.5)'
				}
			},{
				'selector':'.chart-source text, .chart-source tspan',
				'attributes':{
					'font-family': 'BentonSans, sans-serif',
					'font-size': 10,
					'fill': 'rgba(0, 0, 0, 0.5)'
				}
			},{
				'selector':'.chart-footnote text, .chart-footnote tspan',
				'attributes':{
					'font-family': 'BentonSans, sans-serif',
					'font-size': 12,
					'fill': 'rgba(0, 0, 0, 0.5)'
				}
			},{
				'selector':'text.key-label',
				'attributes':{
					'font-family': 'BentonSans, sans-serif',
					'font-size': 12,
					'fill': 'rgba(0, 0, 0, 0.5)'
				}
			}
		];


	for(var s in styleList){
		s = styleList[s];	
		var selected = d3.selectAll(s.selector).attr(s.attributes);
	}
	return true;
}

module.exports = applyAttributes;

},{"d3":undefined}],14:[function(require,module,exports){
'use strict';

//a place to define custom line interpolators

var d3 = require('d3');

function gappedLineInterpolator(points){  //interpolate straight lines with gaps for NaN
  var section = 0;
  var arrays = [[]];
  points.forEach(function(d,i){
    if(isNaN(d[1])){
      if(arrays[section].length==1){console.log('warning: Found a line fragment which is a single point this won\'t be drawn')}
      section++;
      arrays[section] = [];
    }else{
      arrays[section].push(d)
    }
  });

  var pathSections = [];
  arrays.forEach(function(points){
    pathSections.push(d3.svg.line()(points));
  })
  var joined = pathSections.join('');
  return joined.substr(1); //substring becasue D£ always adds an M to a path so we end up with MM at the start
}

module.exports = {
  gappedLine:gappedLineInterpolator
};

},{"d3":undefined}],15:[function(require,module,exports){
var thicknesses = {
  small: 2,
  medium: 4,
  large: 6
};

var defaultThickness = thicknesses.medium;

module.exports = function(value) {

  // fail fast
  if (!value) {
    return defaultThickness;
  }

  var lineThicknessIsNumber = value
                              && typeof value === 'number'
                              && !isNaN(value);

  if (lineThicknessIsNumber) {
    return value;
  } else if (typeof value === 'string' && value.toLowerCase() in thicknesses) {
    return thicknesses[value];
  } else {
    return defaultThickness;
  }
}

},{}],"o-charts":[function(require,module,exports){
'use strict';

module.exports  = {
  chart: require('./chart/index.js'),

  axis: require('./axis/index.js'),

  element: {
    lineKey: require('./element/line-key.js'),
    textArea: require('./element/text-area.js')
  },

  util: {
    attributeStyler: require('./util/chart-attribute-styles.js')
  }

};

},{"./axis/index.js":3,"./chart/index.js":6,"./element/line-key.js":9,"./element/text-area.js":11,"./util/chart-attribute-styles.js":13}]},{},["o-charts"]);
