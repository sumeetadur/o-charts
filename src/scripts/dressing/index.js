var textArea = require('./text-area.js');
var seriesKey = require('./series-key.js');
var ftLogo = require('./logo.js');
var themes = require('../themes');
var PADDING = 8;

function getHeight(selection) {
    return Math.ceil(selection.node().getBoundingClientRect().height);
}

function Dressing(svg, model) {
    this.svg = svg;
    this.model = model;
    this.halfLineStrokeWidth = Math.ceil(model.lineStrokeWidth / 2);
    this.headerHeight = 0;
    this.footerHeight = 0;
    this.footerItemCount = 0;
    this.attrs = {};
    if (this.getAttr('chart-logo').display === 'none') this.model.logoSize = 0;
    this.entries = model.y.series.map(function (d) {
        return {key: d.label, value: d.className};
    });
}

Dressing.prototype.getAttr = function(id){
    if (!this.attrs[id]){
        this.attrs[id] = themes.check(this.model.theme, id).attributes;
    }
    return this.attrs[id];
};

Dressing.prototype.addBackground = function (g, viewBox){
    return g.insert('rect', ':first-child')
        .attr({
            'id': 'backgroundFill',
            'x': viewBox[0] * 2,
            'y': viewBox[1],
            'width': viewBox[2] + (viewBox[0] * -2),
            'height': viewBox[3],
            'fill': g.attr('background')
        });
};

Dressing.prototype.addHeader = function () {
    this.addHeaderItem('title');
    this.addHeaderItem('subtitle');
    this.addSeriesKey();
};

Dressing.prototype.addFooter = function () {
    var footerText = this.addFooterItem('footnote');
    var sourceText = this.addFooterItem('source', this.model.sourcePrefix);
    this.setHeight();
    this.addLogo();
    this.positionFooterItem(footerText);
    this.positionFooterItem(sourceText);
    this.addBackground(this.svg, [0,0, this.model.width, this.model.height]);
};

Dressing.prototype.addLogo = function () {
    var model = this.model;
    if (!model.logoSize) return;
    var logo = this.svg.append('g').attr('class', 'chart-logo').call(ftLogo, model.logoSize);
    logo.attr('transform', model.translate({
        left: model.width - model.logoSize - 3,
        top: model.height - getHeight(logo) - 3
    }));
};

Dressing.prototype.addItem = function(item, widthRestrict, prefix){
    var text = textArea()
        .width(this.model.width - widthRestrict - this.model.paddingX * 2)
        .attrs(this.getAttr('chart-' + item));

    return this.svg.append('g')
        .attr('class', 'chart-' + item)
        .datum((prefix || '') + this.model[item])
        .call(text);
};

Dressing.prototype.addHeaderItem = function(item){
    if (!this.model[item]) return;
    var gText = this.addItem(item, 0);
    var currentPosition = {
        top: this.headerHeight + this.getAttr('chart-' + item)['font-size'] + this.model.paddingY,
        left: this.model.paddingX
    };
    if (this.getAttr('chart-' + item).position!=='absolute' &&
        this.getAttr('chart-' + item).float!=='right'
    ){
        this.headerHeight += getHeight(gText) + this.halfLineStrokeWidth;
    }
    gText.attr('transform', this.model.translate(currentPosition));
    this.setChartPosition();
};

Dressing.prototype.addFooterItem = function(item, prefix){
    if (!this.model[item]) return;
    var gText = this.addItem(item, this.model.logoSize, prefix);
    if (this.getAttr('chart-' + item).position!=='absolute' &&
        this.getAttr('chart-' + item).float!=='right'
    ){
        this.footerHeight += getHeight(gText) + PADDING;
    }
    gText.currentPosition = this.footerHeight;
    return gText;
};

Dressing.prototype.positionSeriesKey = function (g) {
    var model = this.model;
    var labelWidth = model.yLabelWidth + PADDING;
    var labelHeight = model.xLabelHeight + PADDING;
    var hasTopAxis = [model.dependentAxisOrient,model.independentAxisOrient].indexOf('top')>-1;
    var hasLeftAxis = [model.dependentAxisOrient,model.independentAxisOrient].indexOf('left')>-1;
    var left = this.halfLineStrokeWidth;
    var top = this.headerHeight ;
    if (model.keyHover){
        left = (hasLeftAxis && left < labelWidth) ? labelWidth : left;
        top = (hasTopAxis && top < labelHeight) ? labelHeight : top;
    } else {
        this.headerHeight += getHeight(g) + (PADDING);
    }
    model.keyPosition = model.keyPosition || { top: top + model.paddingY, left: left+ model.paddingX };
    g.attr('transform', model.translate(model.keyPosition));
};


Dressing.prototype.addSeriesKey = function () {
    if (!this.model.key) {        return;    }
    var model = this.model;

    var chartKey = seriesKey(model)
        .style(function (d) {  return d.value; })
        .label(function (d) {  return d.key;  })
        .width(model.keyWidth || model.contentWidth)
        .colours(model.gradients || model.colours)
        .attrs(this.getAttr('key'));

    var gText = this.svg.append('g')
        .attr('class', 'chart__key')
        .datum(this.entries)
        .call(chartKey);

    this.positionSeriesKey(gText);
    this.setChartPosition();
};

Dressing.prototype.positionFooterItem = function(gText) {
    if (!gText) return;
    var model = this.model;
    this.footerItemCount++;
    // when tspans have been wrapped, we have to move the
    // group up by the height of every nth-child(1+n);
    var spans = gText.selectAll('tspan').size();
    var gHeight = (gText.node().getBBox().height / (spans)) * (spans - 1);
    var yTrans = model.chartPosition.top + model.chartHeight + gText.currentPosition - gHeight;
    if (this.footerItemCount==1 && gText.select('text').attr('float')){
        this.footerHeight += getHeight(gText) + PADDING;
        this.setHeight();
    }

    gText.attr('transform', model.translate({
        top: yTrans,
        left: +model.paddingX
    }));
};

Dressing.prototype.setHeight = function () {
    var model = this.model;
    var footerHeight = Math.max(this.footerHeight + PADDING * 2, model.logoSize);
    if (model.height) {
        model.chartHeight = model.height - this.headerHeight - footerHeight - model.paddingY*2;
        if (model.chartHeight < 0) {
            model.error({ message: 'calculated plot height is less than zero' });
        }
    } else {
        model.height = this.headerHeight + model.chartHeight + footerHeight;
    }
    this.svg.attr('height', Math.ceil(model.height));
};

Dressing.prototype.setChartPosition = function () {
    this.model.chartPosition = {
        top: this.halfLineStrokeWidth + this.model.paddingY + this.headerHeight + PADDING,
        left: this.halfLineStrokeWidth + this.model.paddingX + this.model.chartPadding
    };
};

module.exports = Dressing;
