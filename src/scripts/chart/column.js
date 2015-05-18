//var d3 = require('d3');
var Axes = require('../util/draw-axes.js');
var DataModel = require('../util/data.model.js');
var metadata = require('../util/metadata.js');
var Dressing = require('../util/dressing.js');
var styler = require('../util/chart-attribute-styles');

function plotSeries(plotSVG, model, axes, series, seriesNumber){
	var data = formatData(model, series);
    var s = plotSVG.append('g').attr('class', 'series');
    s.selectAll('rect')
        .data(data)
        .enter()
        .append('rect')
        .attr('class', function (d){return 'column '  + series.className + (d.value < 0 ? ' negative' : ' positive');})
        .attr('data-value', function (d){return d.value;})
		.attr('x',      function (d, i){ return axes.xPositions(d, seriesNumber); })
        .attr('y',      function (d, i){ return axes.yPositions(d, i); })
        .attr('height', function (d, i){ return Math.abs(axes.valueScale(d.value) - axes.valueScale(0));})
		.attr('width',  function (d, i){ return axes.columnWidth(d, i); });

    styler(plotSVG);
}

function formatData(model, series) {
    //null values in the data are interpolated over, filter these out
    //NaN values are represented by line breaks
    var data = model.data.map(function (d){
        return{
            key:d[model.x.series.key],
            value: d[series.key] || d.values[0][series.key]
        };
    }).filter(function (d) {
        return (d.y !== null);
    });
    return data;
}

function columnChart(g){
	'use strict';

	var model = new DataModel('column', Object.create(g.data()[0]));
	var i;
	var svg = g.append('svg')
		.attr({
			'class': 'graphic line-chart',
			height: model.height,
			width: model.width,
			xmlns: 'http://www.w3.org/2000/svg',
			version: "1.2"
		});
	metadata.create(svg, model);

	var dressing = new Dressing(svg, model);
		dressing.addHeader();
		dressing.addFooter();

	var chartSVG = svg.append('g').attr('class', 'chart');
		chartSVG.attr('transform', model.translate(model.chartPosition));

	var axes = new Axes(chartSVG, model);
    axes.addValueScale();
    axes.addIndependentScale(model.groupData ? 'ordinal' : 'time');
	axes.repositionAxis();

	var plotSVG = chartSVG.append('g').attr('class', 'plot');

	for(i = 0 ; i < model.y.series.length; i++){
		plotSeries(plotSVG, model, axes, model.y.series[i], i);
	}
}

module.exports = columnChart;
