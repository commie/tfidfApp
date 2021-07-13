

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
	currentUser		= 0,
	record 			= null,
    selectedDotsCoordinates = [];


function init() {

	// Calculate bin step
	let	xSize 	= -(heatmapSketch.xMin) + heatmapSketch.xMax + 0.1,
		xBinNum = 8,
		binStep = xSize / xBinNum;

	heatmapSketch.binStep = binStep;

	//view();
	plotDataPerMap();
	
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


// Function to generate random number 
function jitterCoefficient(min, max) { 

	let sign = Math.random() < 0.5 ? -1 : 1
    return (Math.random() * (max - min) + min) * sign;
};


function draw (treatmentDataTitle) {
	
	let flatData 	= mapData[treatmentDataTitle].flatData,
		canvasWidth = 800,
		margin 		= 10,
	    mapWidth 	= canvasWidth -50,//1000,
		mapHeight 	= mapWidth * heatmapSketch.aspectRatio,
		canvasHeight = mapHeight + 50;//1000

	uniqueNames 	= mapData[treatmentDataTitle].nameColors;
		

	let mainSvgGroup = d3.select("#my_dataviz")
		.append('div')
			.attr("id", treatmentDataTitle)
			.append("svg")
				.attr("id", treatmentDataTitle + "_svgCanvas")
				.attr("width", canvasWidth)
				.attr("height", canvasHeight)
				.append("g")
					.attr("transform", "translate(" + margin + "," + margin + ")");


	let symbolRadius = 3,
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

	// add OH outline /////////////////////////////////////////////////

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
					//.on("click", onCellClick);


	// //cells	

	cellGroups.append("rect")
		.attr("x",0)
		.attr("y",0)
	 	.attr("width", xScale(heatmapSketch.xMin + heatmapSketch.binStep) - xScale(heatmapSketch.xMin))
	 	.attr("height", xScale(heatmapSketch.xMin + heatmapSketch.binStep) - xScale(heatmapSketch.xMin))
	 	.style("fill-opacity", 0)
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

};



function plotDataPerMap (){
	
	let viewedMaps = {};
		
	//iterate the array of records
	records.forEach(function(report,reportIdx){
		
		if(report.rounds){
			
			//go through each round, draw each map on a unique svg canvas, imitate clicks and count correct/incorrect cells
			report.rounds.forEach(function(round){

				let currentClickedCells 	= {},
					currentNotSelectedCells = {},
					currentMapTitle 		= round.treatmentDataTitle;

				//if map has not been shown before
				if (viewedMaps[currentMapTitle] == undefined){
					
					//create counter for how many times current map was viewed and clicked
					viewedMaps[currentMapTitle] 							= {};
					viewedMaps[currentMapTitle].clickedCells 				= {};
					viewedMaps[currentMapTitle].notSelectedCells 			= {};
					viewedMaps[currentMapTitle].totalSelectedCellsCount 	= {};
					viewedMaps[currentMapTitle].totalNotSelectedCellsCount 	= {};
					viewedMaps[currentMapTitle].views 						= 1;
					viewedMaps[currentMapTitle].allSelectedCells 			= [];
					viewedMaps[currentMapTitle].allNotSelectedCells 		= [];
					
				} else {
					//increase map view counter for corresponding map
					viewedMaps[currentMapTitle].views ++;
				}
				

				//for current map and round, go through all clicks and set flags for clicked cells
				round.clicks.forEach(function(click){


					if (currentClickedCells[click.cellID]){
						//set to opposite if already clicked before
						currentClickedCells[click.cellID] = !currentClickedCells[click.cellID]; 

					} else {
						// set to true if clicked for the first time
						currentClickedCells[click.cellID] = true;

					}

				});

				//for current map and round, go through all cell and collect IDs of all unselected cells
				mapData[currentMapTitle].flatData.forEach(function(cell,idx){
					if (currentClickedCells[idx]){
						//do nothing
					} else {
						if (cell.cellData.length){
							currentNotSelectedCells[idx] = true;
						}
						
					}
				});



				//save clicked and not selected cells for current map by current user(reportIdx) 
				viewedMaps[currentMapTitle].clickedCells['user_' + reportIdx] 		= currentClickedCells;
				viewedMaps[currentMapTitle].notSelectedCells['user_' + reportIdx] 	= currentNotSelectedCells;
				//console.log(currentClickedCells);

				//count total number of times a cell was celected on current map (by all users)
				for (let selectedCellID in currentClickedCells){

					if(currentClickedCells[selectedCellID] == true){

						viewedMaps[currentMapTitle].allSelectedCells.push(selectedCellID);

						if (viewedMaps[currentMapTitle].totalSelectedCellsCount[selectedCellID]){

							viewedMaps[currentMapTitle].totalSelectedCellsCount[selectedCellID] ++;

						} else {

							viewedMaps[currentMapTitle].totalSelectedCellsCount[selectedCellID] = 1;
						}
 
					} 

				}


				//	count total number of times a cell was not celected on current map (by all users)
				for (let notSelectedCellID in currentNotSelectedCells){

					if(currentNotSelectedCells[notSelectedCellID] == true){

						viewedMaps[currentMapTitle].allNotSelectedCells.push(notSelectedCellID);

						if (viewedMaps[currentMapTitle].totalNotSelectedCellsCount[notSelectedCellID]){

							viewedMaps[currentMapTitle].totalNotSelectedCellsCount[notSelectedCellID] ++;

						} else {

							viewedMaps[currentMapTitle].totalNotSelectedCellsCount[notSelectedCellID] = 1;
						}
 
					} 

				}

			});	
		}
		
		// end of records.forEach()
	});
	
	//for each map get highest TFIDF for selected and not selected cells
	let selectedCelsTfIdfScores 	= [],
		notSelectedCelsTfIdfScores 	= [];

	for (let mapKey in viewedMaps) {

		let map					= mapData[mapKey],
			selectedCells 		= viewedMaps[mapKey].totalSelectedCellsCount,
			notSelectedCells 	= viewedMaps[mapKey].totalNotSelectedCellsCount;


		for (let cellID in selectedCells){

			let maxScore = -Infinity;
			
			for (let name in map.flatData[cellID].tfidf){
				if (map.flatData[cellID].tfidf[name] > maxScore){
					maxScore = map.flatData[cellID].tfidf[name];
				}
			}

			for (let selectedCount = 0; selectedCount < selectedCells[cellID] ; selectedCount ++){

				//dump selected cell TFIDF
				selectedCelsTfIdfScores.push(maxScore);
			}



		};

		for (let cellID in notSelectedCells){

			let maxScore = -Infinity;
			
			for (let name in map.flatData[cellID].tfidf){
				if (map.flatData[cellID].tfidf[name] > maxScore){
					maxScore = map.flatData[cellID].tfidf[name];
				}
			}

			for (let notSelectedCount = 0; notSelectedCount < notSelectedCells[cellID] ; notSelectedCount ++){

				//dump selected cell TFIDF
				notSelectedCelsTfIdfScores.push(maxScore);
			}



		};


		// map.flatData.forEach(function(cell,idx){

		// 	if (cell.cellData.length){

		// 		let maxScore = -Infinity;

		// 		for (let name in cell.tfidf){
		// 			if (cell.tfidf[name] > maxScore){
		// 				maxScore = cell.tfidf[name];
		// 			}
		// 		}

		// 		if (selectedCells[idx]){
					
		// 			for (let selectedCount = 0; selectedCount < selectedCells[idx] ; selectedCount ++){

		// 				//dump selected cell TFIDF
		// 				selectedCelsTfIdfScores.push(maxScore);
		// 			}
					

		// 		} else {

		// 			dump not selected cell TFIDF
		// 			notSelectedCelsTfIdfScores.push(maxScore);
						
		// 		}
		// 	}
		// });

		viewedMaps[mapKey].selected 	= selectedCelsTfIdfScores;
		viewedMaps[mapKey].notSelected  = notSelectedCelsTfIdfScores;
		
		// reset selected scores between maps
		selectedCelsTfIdfScores 	= [];
		notSelectedCelsTfIdfScores 	= [];

	}
	console.log(viewedMaps);
	drawMapScatterplot(viewedMaps);
}


function drawMapScatterplot(mapViewCounter){
	//sort maps by amount of viewers
	let sortedKeys = Object.entries(mapViewCounter).sort((a,b)=>b[1].views-a[1].views).map(el=>el[0]);
	
	// set the dimensions and margins of the graph
	let margin = {top: 10, right: 30, bottom: 30, left: 60},
	    width = 800 - margin.left - margin.right,
	    height = 840 - margin.top - margin.bottom;

	//iterate sorted list of maps and draw map and dot plot
	sortedKeys.forEach(function(mapTitle){

	// append a new unique div and svg object to my_dataviz and draw a map				
	draw(mapTitle);

	//Highlight  selected cells on current map

	let currentSvgCanvasID 	= '#' + mapTitle + '_svgCanvas',
		cells 				= d3.select(currentSvgCanvasID).selectAll('g');

	//iterate selected cells by ID for current map
	for (let cellID in mapViewCounter[mapTitle].totalSelectedCellsCount){

		let targetCell	= d3.select(cells._groups[0][1+parseInt(cellID)]);

		targetCell
		.append("rect")
		.attr("x", 0 )
		.attr("y", 0 )
		.attr("width", (heatmapSketch.xScale(heatmapSketch.xMin + heatmapSketch.binStep) - heatmapSketch.xScale(heatmapSketch.xMin)) )
		.attr("height", (heatmapSketch.xScale(heatmapSketch.xMin + heatmapSketch.binStep) - heatmapSketch.xScale(heatmapSketch.xMin)) )
		.style("fill", "#dfdfdf")
		.style("fill-opacity", 0)
		.classed("marker", true)
		.classed("user-selected",true);

		targetCell
			.append("text")
		    .attr("x", 15)             
		    .attr("y", 30)
		    .attr("text-anchor", "middle")
		    .attr("font-family", "Saira") 
		    .attr("font-weight", "600")
		    .style("font-size", "16px")
		    .style("fill", "#000")
		    .text(mapViewCounter[mapTitle].totalSelectedCellsCount[cellID]);

	}
	

	// append svg object to corresponding map div
	let currentMapDivID = '#' + mapTitle,
		svg = d3.select(currentMapDivID)
		  .append("svg")
		  	.attr("id", mapTitle + "_svgCanvas")
		    .attr("width", width + margin.left + margin.right)
		    .attr("height", height + margin.top + margin.bottom)
		  .append("g")
		    .attr("transform",
		          "translate(" + margin.left + "," + margin.top + ")");

	//Add X axis
	let x = d3.scaleLinear()
	.domain([0, 4])
	.range([ 0, width ]);
  
	svg.append("g")
	.attr("transform", "translate(0," + height + ")")
	.call(d3.axisBottom(x).tickValues([]));

	// Add Y axis
	let y = d3.scaleLinear()
	.domain([0, 3.3])
	.range([ height, 0]);
	svg.append("g")
	.call(d3.axisLeft(y));

	// Add the area
    svg.append("path")
      .datum([{x: 0, y: 0.8}, {x: 4, y: 0.8}])
      .attr("fill", "#dfdfdf")
      .attr("fill-opacity", .3)
      .attr("stroke", "none")
      .attr("d", d3.area()
        .x(function(d) { return x(d.x) })
        .y0(height)
        .y1(function(d) { return y(d.y) })
        )

	// Add selected dots
	selectedDotsCoordinates = [];
	svg.append('g')
	.selectAll("dot")
	.data(mapViewCounter[mapTitle].selected)
	.enter()
	.append("circle")
	  // .attr("cx", function (d) { return x(d.Correct); } )
	  .attr("cy", function (d,i) {selectedDotsCoordinates.push([d]); return y(d);})
	  .attr("cx", function(d,i)	 {
	  	let xCoord = 1,
	  		yCoord = d;

	  	if (selectedDotsCoordinates.length > 1){
	  		xCoord = getCoord(yCoord, xCoord);
	  	} 

	  	selectedDotsCoordinates[i].push(xCoord);
	  	return x(xCoord);
	  })
	  .attr("r", 3)
	  .style("fill", "#69b3a2")
	  .style("fill-opacity", .8)

	// Add not selected dots  
	svg.append('g')
	.selectAll("dot")
	.data(mapViewCounter[mapTitle].notSelected)
	.enter()
	.append("circle")
	  // .attr("cx", function (d) { return x(d.Correct); } )
	  .attr("cx", function(d){return x(3 + jitterCoefficient(0.05, 0.5));})
	  .attr("cy", function (d){ return y(d);})
	  .attr("r", 3)
	  .style("fill", "#f0847d")
	  .style("fill-opacity", .8)
	
	 //add map title
	 svg.append("text")
        .attr("x", (width / 2))             
        .attr("y", 5)
        .attr("text-anchor", "middle")  
        .style("font-size", "16px") 
        .text(mapTitle);
     //add view count
	 svg.append("text")
        .attr("x", (width / 2))             
        .attr("y", 20)
        .attr("text-anchor", "middle")  
        .style("font-size", "16px") 
        .text(`viewed by ${mapViewCounter[mapTitle].views} testers`);
	});

};


function getCoord (yCoord, xCoord){

		
	//console.log('coordinate is '+value);

	selectedDotsCoordinates.every(function(existingCoord){

		if (existingCoord[0] == yCoord){

			let difference = Math.abs(existingCoord[1] - xCoord);
			//console.log('diff is '+difference);

	  		if ( difference < 0.05){

	  			xCoord = xCoord + jitterCoefficient(0.0, 0.3);
	  			xCoord = getCoord(yCoord, xCoord);
	  			return false;
	  		}
		}

		return true;
  	});

  	//console.log('final coordinate is '+value);
  	return xCoord;	
};
