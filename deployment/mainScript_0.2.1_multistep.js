"use strict";

let succsessfultrials = 0;

// min & max projected coordinates of the OH outline
let heatmapSketch = {
	xMin : -124.54294774946788,   
	xMax : 103.72491858742902,
	yMin : -135.4597580659929,
	yMax : 113.07611418644774
};

heatmapSketch.aspectRatio = (-(heatmapSketch.yMin) + heatmapSketch.yMax + 0.1) / (-(heatmapSketch.xMin) + heatmapSketch.xMax + 0.1)

let uniqueNames = {},

	report = {
		pageInitialized:    -1,
		start: 				-1,
		end: 				-1,
		correctTotal: 		-1,
		mistakeTotal: 		-1,
		rounds: 			[] 
	},

	roundReport = {
		clicks:             [],     // clicks, in order they happened
        clickNum:           0,      // total number of clicks (for sanity checks)
        start: 				-1,     // when the "start/next" link was clicked
        end:				-1,     // when the "done" link was clicked

        treatmentDataTitle:  '',
        correctCount: 		0,
        mistakeCount: 		0, 
        treatmentData:		{}
	},

    correctCount 	=       0,
    mistakeCount 	=       0,

    mapsToShow		=		[], // array holding treatment data for one user 
    mapsShown		=		0,

    treatmentDataTitles	= [],

    fldCorrectCount =    null,
    fldMistakeCount =    null,
    fldJsonReport 	=    null;

    //randomSets	=	[], // array of 2000 sets with 5 unique random integers in each, taken from the [1,69] range. The integers in each set were not sorted. https://www.random.org/
    //treatDataKeys	= 	[]; // array of 70 treatment data set titles
    //mapData 		= 	{}; // 70_collection_of_map_data


function init() {

	fldCorrectCount = $("#fldCorrectCount");
    fldMistakeCount = $("#fldMistakeCount");
    fldJsonReport   = $("#fldJsonReport");
    
    fldCorrectCount.val(0);
    fldMistakeCount.val(0);
    fldJsonReport.val("");

	// Calculate bin step
	let	xSize 	= -(heatmapSketch.xMin) + heatmapSketch.xMax + 0.1,
		xBinNum = 8,
		binStep = xSize / xBinNum;

	heatmapSketch.binStep = binStep;

	// Load data and Draw the d3 sketch
	let flatData = loadData();
	draw(flatData);

	
	d3.select('#startLink').on("click", onStartClick);
	d3.select('#nextLink').on("click", onNextClick);

	report.pageInitialized = Date.now();
};

function reInit () {

    // clean up
    $("#mapContainer").empty();
    $("#startLink").addClass("clickable").removeClass("unclickable");

    $("#endLink").off("click");             // just in case we interrupted the flow
    $("#endLink").removeClass("clickable").addClass("unclickable");
    $("#message1").removeClass("hiddenFurther");
    $("#message4").addClass("hiddenFurther");

    uniqueNames = {};

	report = {
		pageInitialized:    -1,
		start: 				-1,
		end: 				-1,
		correctTotal: 		-1,
		mistakeTotal: 		-1,
		rounds: 			[] 
	};

	roundReport = {
		clicks:             [],     // clicks, in order they happened
        clickNum:           0,      // total number of clicks (for sanity checks)
        start: 				-1,     // when the "start/next" link was clicked
        end:				-1,     // when the "done" link was clicked

        treatmentDataTitle:  '',
        correctCount: 		0,
        mistakeCount: 		0, 
        treatmentData:		{}
	};

    correctCount 	=       0;
    mistakeCount 	=       0;

    mapsToShow		=		[]; // array holding treatment data for one user 
    mapsShown		=		0;

    treatmentDataTitles	= [];

    fldCorrectCount =    null;
    fldMistakeCount =    null;
    fldJsonReport 	=    null;
    // re-initialize
    init();

};


function loadData () {
	if (mapsToShow.length < 1) {
		
		//load a random set of 5 out of 69 random maps from precreated dataset and add 1 map that is the same in each set (treatMapData_5_38)
		
		// let treatSetIndex 		= Math.floor(Math.random() * randomSets.length);
		let treatSetIndex 		= parseInt(${participantId});	// this grabs data from the AMT participant sheet

		let	treatMapIdxSet 		= randomSets[treatSetIndex];
			//console.log(treatSetIndex);

		if (!treatMapIdxSet.includes(0)){
			treatMapIdxSet.splice(Math.floor(Math.random()*4), 0, 0); // insert 0 at random position in a set of 5 maps. 0 is the index of the treatMapData_5_38 map
		}
				
		// console.log(treatSetIndex);
		// console.log(treatMapIdxSet);
		// console.log(fulltreatMapIdxSet);

		treatMapIdxSet.forEach(function(value){

			let treatmentDataKey 	= treatDataKeys[value];

			mapsToShow.push(mapData[treatmentDataKey]);
			treatmentDataTitles.push(treatmentDataKey);
		});

		report.treatMapIdxSet		= treatMapIdxSet;
		report.treatmentDataTitles	= treatmentDataTitles;
	}

	let mapToShow	= mapsToShow[mapsShown],
		flatData	= mapToShow.flatData;

	uniqueNames 					= mapToShow.nameColors;
	
	roundReport.treatmentDataTitle 	= treatmentDataTitles[mapsShown];
	roundReport.treatmentData		= mapToShow;

	return (flatData);
};


function draw (flatData) {
	
	let canvasWidth 	= 1000,
		margin 			= 10,
	    mapWidth 		= canvasWidth - 50,//1000, magic number to adjust the size of the map so it fits within the svg canvas
		mapHeight 		= mapWidth * heatmapSketch.aspectRatio,
		canvasHeight 	= mapHeight + 50,//1000, magic number to adjust the size of the map so it fits within the svg canvas
		symbolRadius 	= 5;
		

	let mainSvgGroup = d3.select("#mapContainer")
		.append("svg")
			.attr("id", "svgCanvas")
			.attr("width", canvasWidth)
			.attr("height", canvasHeight)
			.append("g")
				.attr("transform", "translate(" + margin + "," + margin + ")");

		
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
					.classed('clickable-cell-G-element', function (d) {

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
	 	.style("stroke", "#f3f3f3") // light gray color for cell stroke (grid lines on the map. not used in the latest version)
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
	let currTime 			= 	Date.now();
    	report.start 		= 	currTime;
    	roundReport.start 	= 	currTime;

    // show the map
    $("#mapContainer").removeClass("hidden").removeClass("hiddenFurther");

    // deactivate the "start" link
    $("#startLink").removeClass("clickable").addClass("unclickable");	// has a side effect of setting "display: none"
    $("#message1").addClass("hiddenFurther");

    // activate the "done" link
    $("#endLink").on("click", onEndClick);
    $("#endLink").addClass("clickable").removeClass("unclickable");
    $("#message3").removeClass("hiddenFurther");
};

function onEndClick () {
	
	let currTime = Date.now();
	
	mapsShown++;

	// update the timer and global scores count
	roundReport.end	= currTime;
	correctCount 	+= roundReport.correctCount;
	mistakeCount 	+= roundReport.mistakeCount;
	
	// save round report
	report.rounds.push(roundReport);

	// deactivate the "end" link
	$("#endLink").off("click");             // just in case we interrupted the flow
    $("#endLink").removeClass("clickable").addClass("unclickable");
    $("#message3").addClass("hiddenFurther");

    // disable event listeners on the cells
	d3.selectAll("g").on('click', null);
	d3.selectAll("rect").classed('clickable', false);

	//hide the map
	$("#mapContainer").addClass("hidden");

	if(mapsShown == mapsToShow.length){ // if it was the last map to show
		
		// update the timer
   		report.end 			= currTime;
   		report.correctTotal = correctCount;
   		report.mistakeTotal = mistakeCount;

   		// update input fields
    	fldJsonReport.val(JSON.stringify(report));
    	fldCorrectCount.val(correctCount);
    	fldMistakeCount.val(mistakeCount);

    	//show break screen and change text to "thank you"
    	$("#message4").removeClass("hiddenFurther");

    	// really hide the map
    	$("#mapContainer").addClass("hiddenFurther");

    	// hide the "don't submit yet" message
    	$("#message5").addClass("hiddenFurther");

    	// download report for test and debug
    	//download_report();

	} else {

		// update progress bar
		$("#msgCurrMap").text(" " + mapsShown + " ");
		$("#msgTotalMap").text(" " + mapsToShow.length + " ");
		
		//show break screen
   		$("#message2").removeClass("hiddenFurther");

    	// update input fields
    	fldCorrectCount.val(correctCount);
    	fldMistakeCount.val(mistakeCount);
    	fldJsonReport.val(JSON.stringify(report));

	}  
};

function onNextClick () {
	// update the timers
	let currTime =	Date.now();

    // deactivate the break screen
    $("#message2").addClass("hiddenFurther");
    // deactivate the "next" link
	$("#nextLink").off("click");             // just in case we interrupted the flow

    // activate the "done" link
    $("#endLink").on("click", onEndClick);
    $("#endLink").addClass("clickable").removeClass("hidden").removeClass("unclickable");
    $("#message3").removeClass("hiddenFurther");

	// clean up
    $("#mapContainer").empty();

    //reset round report
    
    roundReport = {

		clicks:             [],     	// clicks, in order they happened
        clickNum:           0,      	// total number of clicks (for sanity checks)
        start: 				currTime,	// when the "start/next" link was clicked
        end:				-1,			// when the "done" link was clicked

        correctCount: 0,
        mistakeCount: 0,
        treatmentDataTitle:  '',
        treatmentData:		{}
	};

    // load and draw new map
    let flatData = loadData();
    draw(flatData);

    // show the map
    $("#mapContainer").removeClass("hidden");
};

function onCellClick (event,d){

	let timestamp	= Date.now(),
        cell   		= d3.select(this),
        correct     = checkCorrect(cell),  // "true" if tfidf higher than 0.8
        selected	= cell.datum().selected;
       

	if (selected === true){

		cell.datum().selected = false;

		cell.select('.marker').remove();

		if (correct){

			roundReport.correctCount--; 

		} else {

			roundReport.mistakeCount--;
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

			roundReport.correctCount++;

		} else {

			roundReport.mistakeCount++;
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

    roundReport.clicks.push(click);

    // update counters

    roundReport.clickNum++; 

    // update input fields
    
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

// /////////////// temp for debug and locat results saving ////////////

function download_report() {
  let textToSave = 'record = ' + fldJsonReport.val();
  let hiddenElement = document.createElement('a');

  hiddenElement.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(textToSave);
  hiddenElement.target = '_blank';
  hiddenElement.download = 'report.js';
  hiddenElement.click();
};



// /////////////// testing harness ////////////////////////////////////

function batchTest(trials) {

    let runs = trials,
        i;

    for (i = 0; i < runs; i++) {

        // run test
        test();
        succsessfultrials++

        // re-initialize
        reInit();
    }

    console.log(succsessfultrials + " batch tests complete");

};


function tryClickNext () {
	const el = $('#message2');

	if (el.css('display') != 'none') {
		$("#nextLink").click();
	} else {
		setTimeout(tryClickNext, 300); // try again in 300 milliseconds
	}
};

function test () {

	let rounds 			= [],
		trialStarted 	= -1,
		trialEnded 		= -1,
		totalTestCorrectCount = 0,
		totalTestMistakeCount =	0;

	//go through all maps
	for (let round = 0; round < mapsToShow.length; round++){

		let i,
			testRoundReport = {
				roundStart			: -1,
				roundEnd			: -1,
		        roundCorrectCount	: 0,
		        roundMistakeCount	: 0,
		        clickNum			: 0,
		        testClicks			: []
			},

			clickIds	= [],
		    cells		= d3.selectAll('.clickable-cell-G-element');	//d3 selection for clickable cells (g elements)
		        
        // generate a list of 25 random numbers for the range of clickable cells
	    for (i = 0; i < 25; i++) {
	        clickIds.push(Math.floor(Math.random() * cells._groups[0].length));
	    }

	    // show the map if it is the 1st round
	    if (mapsShown == 0){
			trialStarted = Date.now();		
			$("#startLink").click();
	    }

	    //log round start time
	    testRoundReport.roundStart = Date.now();

	    // click the cells
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

		        // user correctly identified a cell
		        if (selected) {
		            testRoundReport.roundCorrectCount++;
		            totalTestCorrectCount++;
		        } else {
		            testRoundReport.roundCorrectCount--;
		            totalTestCorrectCount--;
		        }

		    } else {

		        // user clicked on a fruit by mistake
		        if (selected) {
		            testRoundReport.roundMistakeCount++;
		            totalTestMistakeCount++;
		        } else {
		            testRoundReport.roundMistakeCount--;
		            totalTestMistakeCount--;
		        }
		    }

		    testRoundReport.clickNum++;
		    // totalTestCorrectCount += testRoundReport.roundCorrectCount;
		    // totalTestMistakeCount += testRoundReport.roundMistakeCount;

	        testRoundReport.testClicks.push({
	            time:   	clickTime,
	            celID: 		cell.attr('id'),
	            corr:   	correct,
	            pos: 		cell.attr("transform"),
	            cellTop:	$('#' + cell.attr("id") ).position().top,	// Y coordinate of the top left corner of the cell relative to the screen
				cellLeft:	$('#' + cell.attr("id") ).position().left,	// X coordinate of the top left corner of the cell relative to the screen
	        });

	    });

	    //end round
	    $("#endLink").click();
	    testRoundReport.roundEnd = Date.now();
	    rounds.push(testRoundReport);
	    

	    // end the trial if it was the last round
	    if (mapsShown == 6){
	    	trialEnded = Date.now();

	    	//console.log('trial ended, comparing');
	    } else{
	    	tryClickNext ();
	    }
	   
	 
	}

    
    //
    // do the comparisons
    //

    let report = JSON.parse($("#fldJsonReport").val());

    
    rounds.forEach(function(roundReport,idx){
    	let roundIndex = idx;
    	//console.log('comparing round ' + roundIndex);
    	// round click num
    	if (roundReport.clickNum !== report.rounds[roundIndex].clickNum) {
        console.log("bad round clickNum");
    	} else {
        //console.log("ok clickNum");
    	}

    	// round correct count 
	    if (roundReport.roundCorrectCount !== report.rounds[roundIndex].correctCount) {
	        console.log("bad round correctCount " + report.rounds[roundIndex].correctCount + " " + roundReport.roundCorrectCount);
	    } else {
	       // console.log("ok correctCount");
	    }

	     //round  mistake count
	    if (roundReport.roundMistakeCount !== report.rounds[roundIndex].mistakeCount) {
	        console.log("bad round mistakeCount " + report.rounds[roundIndex].mistakeCount + " " + roundReport.roundMistakeCount);
	    } else {
	        //console.log("ok mistakeCount");
	    }

	    //compare round clicks
    	roundReport.testClicks.forEach(function (click, idx) {
     		let clickIndex = idx,
				reportClick = report.rounds[roundIndex].clicks[clickIndex];

	        if (click.celID !== reportClick.cellID) {
	            console.log("bad cell ID");
	            // console.log(click.cellID);
	            // console.log(reportClick.cellID);
	          
	        } else {
	            // console.log("ok cell ID");
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

	        //console.log("click time diff " + (reportClick.time - click.time));

    	});

    });



    // total correct count
    if (totalTestCorrectCount !== parseInt($("#fldCorrectCount").val())) {
	        console.log("bad total correctCount " + $("#fldCorrectCount").val() + " " + totalTestCorrectCount);
    } else {
       // console.log("ok correctCount " + $("#fldCorrectCount").val() + " " + totalTestCorrectCount);
    }
    
    //total  mistake count
    if (totalTestMistakeCount !== parseInt($("#fldMistakeCount").val())) {
        console.log("bad total mistakeCount " + $("#fldMistakeCount").val() + " " + totalTestMistakeCount);
    } else {
        //console.log("ok mistakeCount");
    }

    
    // console.log(" ");

    // timers
    //console.log("start diff " + (report.start - trialStarted));
    //console.log("end diff " + (report.end - trialEnded));

    //console.log("end of trial " + succsessfultrials);
    //console.log(" ");

};





























