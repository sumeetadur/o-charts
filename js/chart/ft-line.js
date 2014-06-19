'use strict'

if(!ft){
	var ft = {};
}

if(!ft.charts){
	ft.charts = {};
}

ft.charts.line = function(){

	var xProp = 'x', 
		yProp = 'y', 
		xScale = function(d){ return d }, 
		yScale = function(d){ return d },
		xParser = function(d){ return parseFloat(d) },
		yParser = function(d){ return parseFloat(d) },
		endLabelTemplate = '';

	function linedraw(g){

		g.datum(
			g.datum().map(
				function(d){
					return {
						x:xScale( xParser( d[xProp] )),
						y:yScale( yParser( d[yProp] ))
					}
				}
			)
		);

		console.log(g.datum());

		var line = d3.svg.line()
			.x(function(d){ return d.x })
			.y(function(d){ return d.y })
	}


	linedraw.yScale = function(x){
		if (!arguments.length) return yScale;
		return linedraw;
	};

	linedraw.xScale = function(x){
		if (!arguments.length) return xScale;
		return linedraw;
	};

	linedraw.xParser = function(f){
		if (!arguments.length) return xScale;
		xParser = f;
		return linedraw;
	};

	linedraw.yParser = function(f){
		if (!arguments.length) return xScale;
		yParser = f;
		return linedraw;
	};

	linedraw.xProperty = function(prop){
		if (!arguments.length) return xProp;
		xProp = prop;
		return linedraw;
	};

	linedraw.yProperty = function(prop){
		if (!arguments.length) return yProp;
		yProp = prop;
		return linedraw;
	};

	linedraw.endLabel = function(template){
		if (!arguments.length) return template;
		return linedraw;
	};

	return linedraw;
}