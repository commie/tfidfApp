"use strict";


let heatmapSketch = {
	xMin : -124.54294774946788,   
	xMax : 103.72491858742902,
	yMin : -135.4597580659929,
	yMax : 113.07611418644774
};

heatmapSketch.aspectRatio = (-(heatmapSketch.yMin) + heatmapSketch.yMax + 0.1) / (-(heatmapSketch.xMin) + heatmapSketch.xMax + 0.1)

let treatmentSample,
	uniqueNames = {},

	report = {
		clicks:             [],     // clicks, in order they happened
        clickNum:           0,      // total number of clicks (for sanity checks)

        pageInitialized:    -1,     // when the page was initialized
        startClicked:       -1,     // when the "start" link was clicked
        endClicked:         -1,     // when the "done" link was clicked

        treatmentDataTitle:  '',
        treatmentData:		{}
	},

    correctCount 	=       0,
    mistakeCount 	=       0,

    // mapsToShow		=		5,
    // mapsShown		=		0

    fldCorrectCount =    null,
    fldMistakeCount =    null,
    fldJsonReport 	=    null



function init() {

	fldCorrectCount = $("#fldCorrectCount");
    fldMistakeCount = $("#fldMistakeCount");
    fldJsonReport   = $("#fldJsonReport");
    
    fldCorrectCount.val(0);
    fldMistakeCount.val(0);
    fldJsonReport.val("");
	

	//load a random "flatData" from precreated dataset
	let treatmentsData = Object.keys(mapData),
		randomSample = treatmentsData[ treatmentsData.length * Math.random() << 0];

	//console.log(randomSample);
	

	let mapToShow = mapData[randomSample],
		flatData = mapToShow.flatData;

	uniqueNames = mapToShow.nameColors;
	

	report.treatmentDataTitle 	= randomSample;
	report.treatmentData		= flatData;

	// Calculate bin step
	let	xSize 	= -(heatmapSketch.xMin) + heatmapSketch.xMax + 0.1,
		xBinNum = 8,
		binStep = xSize / xBinNum;

	heatmapSketch.binStep = binStep;

	// Calculate number of bins along y-axis
	let	ySize 	= -(heatmapSketch.yMin) + heatmapSketch.yMax + 0.1,
		yBinNum = Math.ceil(ySize / binStep);

	

	// Draw the d3 sketch
	draw(flatData);

	
	d3.select('#startLink').on("click", onStartClick);

	report.pageInitialized = Date.now();
};


function projectPoint (lat, lon) {

    // Albers equal-area conic projection

    lat = lat * Math.PI / 180;
    lon = lon * Math.PI / 180;

    let stdParallel1 	=  38.403267 * Math.PI / 180, // 29.5
    	stdParallel2 	=  42.327108 * Math.PI / 180, //45.5
    	centerLat 		=  40.3651875 * Math.PI / 180, // 29.0
    	centerLon 		= -82.5 * Math.PI / 180; //-98.6

    let earthRad = 3959; // mi

    // calculate projection constants
    let n 		= (Math.sin(stdParallel1) + Math.sin(stdParallel2)) * 0.5,
    	c 		= Math.cos(stdParallel1) ** 2 + 2 * n * Math.sin(stdParallel1),
    	rho0 	= earthRad * Math.sqrt(c - 2 * n * Math.sin(centerLat)) / n;

   	// project
    let	rho 	= earthRad * Math.sqrt(c - 2 * n * Math.sin(lat)) / n,
    	theta 	= n * (lon - centerLon),
    	x 		= rho * Math.sin(theta),
    	y 		= rho0 - rho * Math.cos(theta);

    return [x, y];
};

function draw (flatData) {
	let canvasWidth = 1000,
		margin 		= 10,
	    mapWidth 	= canvasWidth -50,//1000,
		mapHeight 	= mapWidth * heatmapSketch.aspectRatio,
		canvasHeight = mapHeight + 50;//1000б,
		

	let mainSvgGroup = d3.select("#mapContainer")
		.append("svg")
			.attr("id", "svgCanvas")
			.attr("width", canvasWidth)
			.attr("height", canvasHeight)
			.append("g")
				.attr("transform", "translate(" + margin + "," + margin + ")");


	let symbolRadius = 5,
		symbolFill = "#f768a1";

	let xScale = d3.scaleLinear()
		.domain([heatmapSketch.xMin, heatmapSketch.xMax])
		.range([0, mapWidth]);

	let yScale = d3.scaleLinear()
		.domain([heatmapSketch.yMax, heatmapSketch.yMin])
		.range([0, mapHeight]);

	heatmapSketch.xScale = d3.scaleLinear()
		.domain([heatmapSketch.xMin, heatmapSketch.xMax])
		.range([0, mapWidth]);
	
	heatmapSketch.yScale = d3.scaleLinear()
		.domain([heatmapSketch.yMax, heatmapSketch.yMin])
		.range([0, mapHeight]);		

	// add US outline /////////////////////////////////////////////////

	let jsonPoints = ohOutline.features[0].geometry.coordinates[0];

    let polylinePts = jsonPoints.reduce(function (ptString, currentPoint) {

    	let projectedPt = projectPoint(currentPoint[1], currentPoint[0]);
    	
    	ptString += xScale(projectedPt[0]) + "," + yScale(projectedPt[1]) + " ";

    	return ptString;

    }, "");

    mainSvgGroup.append("polyline")
    	.attr("points", polylinePts)
    	.attr("fill", "none")
		.attr("stroke", "#f2f2f2")
		.attr("stroke-width", "5px");

	//draw heatmap with points

	let cellGroups = mainSvgGroup.selectAll(".cell")
		.data(flatData)
			.enter()
				.append("g")
					.classed('cellG', function (d) {

						if (d.cellData.length) {
							return true;
						}

						return false;
					})
					.attr('transform', function(d){
	                                
					                    let attrValue = 'translate(' + xScale(d.x ) + ',' + yScale(d.y ) + ')';
					                    
					                    return attrValue;   
					                })
					.attr("id", function(d,i) { return i; })
					.on("click", onCellClick);


	// //cells	

	cellGroups.append("rect")
		.attr("x",0)
		.attr("y",0)
	 	.attr("width", xScale(heatmapSketch.xMin + heatmapSketch.binStep) - xScale(heatmapSketch.xMin))
	 	.attr("height", xScale(heatmapSketch.xMin + heatmapSketch.binStep) - xScale(heatmapSketch.xMin))

	 	.classed("cell", true)
		.classed("clickable", function (d) {

			if (d.cellData.length) {
				return true;
			}

			return false;
		})
	
	 	.style("stroke-width", 0)
	 	.style("stroke", "#f3f3f3")
	 	.style("fill-opacity", 0);				


	// points

	cellGroups.selectAll(".point")
		.data(function(d){return d.cellData;})
			.enter()
				.append("circle")
					.attr("cx", function (d) {return xScale(d[0]) - xScale(d3.select(this.parentNode).datum().x);})
					.attr("cy", function (d) {return yScale(d[1]) - yScale(d3.select(this.parentNode).datum().y);})
					.attr("r", symbolRadius)
					.classed("clickable", true)
					.style("fill", function (d) {
									
									let color = uniqueNames[d[2]];

									return color;	
					});	
};

function onStartClick () {
	// update the timers
    report.startClicked = Date.now();

    // show the map
    $("#mapContainer").removeClass("hidden");

    // deactivate the "start" link
    $("#startLink").removeClass("clickable").addClass("unclickable");


    // activate the "done" link
    $("#endLink").one("click", onEndClick);
    $("#endLink").addClass("clickable");
};

function onEndClick () {

    // update the timers
   	report.endClicked = Date.now();

    // deactivate the "end" link
    $("#endLink").removeClass("clickable");
    //$("#endLink").addClass("hidden");
   // $("#mapContainer").addClass("hidden");

   // $("#break-screen").removeClass("hidden");

    // update input fields
    fldJsonReport.val(JSON.stringify(report));

    // disable event listeners on the cells
    d3.selectAll("g").on('click', null);
    d3.selectAll("rect").classed('clickable', false);

    // // debug
    // if (debug) {
    //     var report = JSON.parse($("#fldJsonReport").val());
    //     console.log((report.endClicked - report.startClicked) / 1000);
    // }
};

function onCellClick (event,d){

	let timestamp   = Date.now(),
        cell      = d3.select(this),
        correct     = checkCorrect(cell),  // "true" if tfidf higher than 0.8
        selected	= cell.datum().selected;
       

	if (selected === true){

		cell.datum().selected = false;

		cell.select('.marker').remove();

		if (correct){

			correctCount--;

		} else {

			mistakeCount--;
		}

	} else {

		cell.datum().selected = true;

		cell
			.append("rect")
			.attr("x", 0 )
			.attr("y", 0 )
			.attr("width", (heatmapSketch.xScale(heatmapSketch.xMin + heatmapSketch.binStep) - heatmapSketch.xScale(heatmapSketch.xMin)) )
			.attr("height", (heatmapSketch.xScale(heatmapSketch.xMin + heatmapSketch.binStep) - heatmapSketch.xScale(heatmapSketch.xMin)) )
			.style("fill", "#dfdfdf")
			.style("fill-opacity", 0.6)
			.classed("marker", true)
			// .append("text")
			// 	.attr("x", 50)
			// 	.attr("y",50)
			// 	.text( function (d) { return d.selected; })	

		if (correct){

			correctCount++;

		} else {

			mistakeCount++;
		}
	}

	

    // form the "click" object
    let click = {
        time:		timestamp,
        cellID:		cell.attr("id"),
        corr:		correct,
        pos:		cell.attr("transform"),
        cellTop:	$('#' + cell.attr("id") ).position().top,	// Y coordinate of the top left corner of the cell relative to the screen
        cellLeft:	$('#' + cell.attr("id") ).position().left,	// X coordinate of the top left corner of the cell relative to the screen
        locCurX:	d3.pointer(event,this)[0], 	//click coordinate X relative to the cell
        locCurY:	d3.pointer(event,this)[1], 	//click coordinate Y relative to the cell
        globCurX:	event.pageX,				//click coordinate X relative to the screen
        globCurY:	event.pageY					//click coordinate Y relative to the screen
    };

    //console.log(click.cellTop + '  '+ click.cellLeft);

    report.clicks.push(click);

    // update counters

    report.clickNum++; 

    // update input fields
    fldCorrectCount.val(correctCount);
    fldMistakeCount.val(mistakeCount);
    fldJsonReport.val(JSON.stringify(report));
	//console.log(d3.select(this).datum().tf);
	//console.log(d3.select(this).datum().tfidf);

	// d3.select('body')
	// 	.append('div')
	// 		.classed('overlay', true)
	// 		.style('top', click.globCurY-3+'px')
	// 		.style('left', click.globCurX-3+'px')
			
};	

function checkCorrect(cell){

	let tfidfData = cell.datum().tfidf,
		tfidfValues = Object.values(tfidfData);

	for (let v in tfidfValues){
		if (tfidfValues[v] > 0.8){
			return true;
		}
	} 
	
	return false;	
};


// /////////////// testing harness ////////////////////////////////////

function batchTest(rounds) {

    let runs = rounds,
        i;

    for (i = 0; i < runs; i++) {

        // run test
        test();

        // re-initialize
        reInit();
    }

    console.log("batch test complete");

};


function reInit () {

    // clean up
    $("#mapContainer").empty();
    $("#startLink").addClass("clickable").removeClass("unclickable");

    $("#endLink").off("click");             // just in case we interrupted the flow
    $("#endLink").removeClass("clickable").addClass("unclickable");

    correctCount = 0;
    mistakeCount = 0;
    report = {

        clicks:             [],     // clicks, in order they happened
        clickNum:           0,      // total number of clicks (for sanity checks)

        pageInitialized:    -1,     // when the page was initialized
        startClicked:       -1,     // when the "start" link was clicked
        endClicked:         -1,     // when the "done" link was clicked

        treatmentDataTitle:  '',
        treatmentData:		{}

    };

    // re-initialize
    init();

};


function test () {

    let i,
        clickIds = [],
        cells = d3.selectAll('.cellG'),	//d3 selection for clickable cells (g elements)
        correctCount = 0,
        mistakeCount = 0,
        clickNum = 0,
        testClicks = [];

    // generate a list of 25 random numbers for the range of clickable cells
    for (i = 0; i < 25; i++) {
        clickIds.push(Math.floor(Math.random() * cells._groups[0].length));
    }

    // show the map
    let testStarted = Date.now();
    $("#startLink").click();

	// click the words
	clickIds.forEach(function (clickId) {

	    // save the date
	    let clickTime = Date.now();

	    // click the cell
	    let cell = d3.select(cells._groups[0][clickId]);
	        //word = wordSpan.attr("id");

	    cell.dispatch('click');

	    // record other parameters
	    
	    let correct = checkCorrect(cell),           // "true" if cell with high tfidf (>0.8)
	        selected = cell.datum().selected;    	// the logic is opposite, as we are testing after the class has been updated by the click handler
	    
	    if (correct) {

	        // user correctly identified a wrong word
	        if (selected) {
	            correctCount++;
	        } else {
	            correctCount--;
	        }

	    } else {

	        // user clicked on a fruit by mistake
	        if (selected) {
	            mistakeCount++;
	        } else {
	            mistakeCount--;
	        }
	    }

	        clickNum++;

	        testClicks.push({
	            time:   	clickTime,
	            celID: 		cell.attr('id'),
	            corr:   	correct,
	            pos: 		cell.attr("transform"),
	            cellTop:	$('#' + cell.attr("id") ).position().top,	// Y coordinate of the top left corner of the cell relative to the screen
				cellLeft:	$('#' + cell.attr("id") ).position().left,	// X coordinate of the top left corner of the cell relative to the screen
	        });

	    });

        // end the test
        let testEnded = Date.now();
        $("#endLink").click();


        //
        // do the comparisons
        //

        let report = JSON.parse($("#fldJsonReport").val());

        // click num
        if (clickNum !== report.clickNum) {
            console.log("bad clickNum");
        } else {
            //console.log("ok clickNum");
        }

        // correct count
        if (correctCount !== parseInt($("#fldCorrectCount").val())) {
            console.log("bad correctCount " + $("#fldCorrectCount").val() + " " + correctCount);
        } else {
           // console.log("ok correctCount");
        }

        // mistake count
        if (mistakeCount !== parseInt($("#fldMistakeCount").val())) {
            console.log("bad mistakeCount " + $("#fldMistakeCount").val() + " " + mistakeCount);
        } else {
           // console.log("ok mistakeCount");
        }

        // clicks
        testClicks.forEach(function (click, idx) {

            // console.log(" ");

            let reportClick = report.clicks[idx];

            if (click.celID !== reportClick.cellID) {
                console.log("bad cell ID");
                // console.log(click.cellID);
                // console.log(reportClick.cellID);
              
            } else {
                // console.log("ok word");
            }

            if (click.corr !== reportClick.corr) {
                console.log("bad corr");
            } else {
                // console.log("ok corr");
            }

            // if (click.idx !== reportClick.idx) {
            //     console.log("bad idx");
            // } else {
            //     // console.log("ok idx");
            // }

            if (click.pos !== reportClick.pos) {
                console.log("bad position");
            } else {
                // console.log("ok top");
            }

            if (click.cellLeft !== reportClick.cellLeft) {
                console.log("bad left");
            } else {
                // console.log("ok left");
            }

            if (click.cellTop !== reportClick.cellTop) {
                console.log("bad top");
            } else {
                // console.log("ok top");
            }

           // console.log("click time diff " + (reportClick.time - click.time));

        });
    // console.log(" ");

    // timers
   // console.log("start diff " + (report.startClicked - testStarted));
   //  console.log("end diff " + (report.endClicked - testEnded));

    // console.log("end of test");
    // console.log(" ");

};





























