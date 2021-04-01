

let heatmapSketch = {
	xMin : -124.54294774946788,   
	xMax : 103.72491858742902,
	yMin : -135.4597580659929,
	yMax : 113.07611418644774
};

heatmapSketch.aspectRatio = (-(heatmapSketch.yMin) + heatmapSketch.yMax + 0.1) / (-(heatmapSketch.xMin) + heatmapSketch.xMax + 0.1)

let treatmentSample,
	uniqueNames		= {},
	currentRound 	= 0,
	currentUser		= 1,
	record 			= null;


function init() {

	// Calculate bin step
	let	xSize 	= -(heatmapSketch.xMin) + heatmapSketch.xMax + 0.1,
		xBinNum = 8,
		binStep = xSize / xBinNum;

	heatmapSketch.binStep = binStep;

	// Load data and show 1st map
	loadRecord (currentUser);
	
	
	//let flatData = loadData();
	//draw(flatData);

	d3.select('#viewLink').on("click", view);
	// d3.select('#playLink').on("click", play);
	d3.select('#nextLink').on("click", onNextClick);
	d3.select('#nextUserLink').on("click", onNextUserClick);

};

function view(){

	let totalCorrect = record.correctTotal,
		totalMistake = record.mistakeTotal;

	//load round one data
	let currentRoundData	= record.rounds[currentRound],
		flatData			= currentRoundData.treatmentData.flatData,
		treatmentTitle 		= currentRoundData.treatmentDataTitle,
		correctCount 		= currentRoundData.correctCount,
		mistakeCount 		= currentRoundData.mistakeCount;

	//update the list of names and their colors	to current round data
	uniqueNames 	= currentRoundData.treatmentData.nameColors;

	//draw current round map
	draw(flatData);

	//show the map
    $("#mapContainer").removeClass("hidden");
    $("#viewLink").addClass("hidden");

    //update displayed scores
    $("#correctScore").text(correctCount);
    $("#mistakeScore").text(mistakeCount);
    $("#totcorrectScore").text(totalCorrect);
    $("#totmistakeScore").text(totalMistake);
};

// function play(){

// 	//load round one data
// 	let currentRoundData	= record.rounds[currentRound],
// 		flatData			= currentRoundData.treatmentData.flatData;

// 	//update the list of names and their colors	to current round data
// 	uniqueNames 	= currentRoundData.treatmentData.nameColors;

// 	//draw current round map
// 	draw(flatData);

// 	//show the map
//     $("#mapContainer").removeClass("hidden");
// };


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

function loadRecord (userid) {

	let treatmentPath = 'records/' + userid + '.js';

	console.log("loading file from " + treatmentPath)

	let rawdata = document.createElement("script");
	rawdata.setAttribute("src", treatmentPath);
	rawdata.setAttribute("async", "false");
	document.body.appendChild(rawdata);
	//document.head.insertBefore(rawdata, head.firstElementChild);
	rawdata.addEventListener("load", view, false);
}


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
					// .on("click", onCellClick);


	// //cells	

	cellGroups.append("rect")
		.attr("x",0)
		.attr("y",0)
	 	.attr("width", xScale(heatmapSketch.xMin + heatmapSketch.binStep) - xScale(heatmapSketch.xMin))
	 	.attr("height", xScale(heatmapSketch.xMin + heatmapSketch.binStep) - xScale(heatmapSketch.xMin))

	 	.classed("cell", true)
		// .classed("clickable", function (d) {

		// 	if (d.cellData.length) {
		// 		return true;
		// 	}

		// 	return false;
		// })
		// highlight high TFIDF
		.classed("highTFIDF", function (d) {

			if (d.namesCount) {
				for(let name in d.namesCount){
					if(d.tfidf[name] > 0.8){
						d3.select(this.parentNode)
							.append("text")
								.text(d.tfidf[name].toFixed(2))
								.attr("y",15)
								.classed('srv-txt', true)

						return true;
					}
				}
	
			}

			return false;
		})

		//show selected by user
		.classed("user-selected", function(d){

			if (typeof d.selected != 'undefined'){
				if (d.selected == true){
					// d3.select(this.parentNode)
					// 		.append("text")
					// 			.text(d.tfidf[name].toFixed(2))
					// 			.attr("y",15)
					// 			.classed('srv-txt', true)
					return true;
				}
			}
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
					// .classed("clickable", true)
					.style("fill", function (d) {
									
									let color = uniqueNames[d[2]];

									return color;	
					});	


	// TFIDF labels
	// cellGroups.selectAll(".label")
	//  	.data(function(d){return d.cellData;})
};

// function onStartClick () {
// 	// update the timers
// 	let currTime 		= 	Date.now();
//     report.start 		= 	currTime;
//     roundReport.start 	= 	currTime;

//     // show the map
//     $("#mapContainer").removeClass("hidden");

//     // deactivate the "start" link
//     $("#startLink").removeClass("clickable").addClass("unclickable");


//     // activate the "done" link
//     $("#endLink").on("click", onEndClick);
//     $("#endLink").addClass("clickable");
// };

function onNextClick () {
	
     currentRound++;
	// clean up
    $("#mapContainer").empty();

    view();
}

function onNextUserClick () {
	
     currentUser++;
	// clean up
    $("#mapContainer").empty();

    loadRecord (currentUser);

}

function onEndClick () {
	let currTime = Date.now();
	mapsShown++

	// update the timer
	roundReport.end = currTime;
	// save round report
	report.rounds.push(roundReport);

	// deactivate the "end" link
	$("#endLink").off("click");             // just in case we interrupted the flow
    $("#endLink").removeClass("clickable").addClass("unclickable").addClass("hidden");

    // disable event listeners on the cells
	d3.selectAll("g").on('click', null);
	d3.selectAll("rect").classed('clickable', false);

	//hide the map
	$("#mapContainer").addClass("hidden");

	if(mapsShown == mapsToShow){ // if it was the last map to show
		// update the timer
   		report.end = currTime;

   		// update input fields
    	fldJsonReport.val(JSON.stringify(report));

    	//show break screen and change text to "thank you"
    	$("#break-screen").removeClass("hidden");
    	$("#break-screen").first().text("Thank you for participation")

	} else{
		
		//show break screen
   		$("#break-screen").removeClass("hidden");

    	// update input fields
    	fldJsonReport.val(JSON.stringify(report));

	}
    
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

    roundReport.clicks.push(click);

    // update counters

    roundReport.clickNum++; 

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






























