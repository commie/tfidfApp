let plotData = "Correct,Incorrect\n6,2\n8,4\n6,1\n2,3\n6,2\n1,7"

function init(){
// set the dimensions and margins of the graph
let margin = {top: 10, right: 30, bottom: 30, left: 60},
    width = 460 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

// append the svg object to the body of the page
let svg = d3.select("#my_dataviz")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")");

//Read the data

let mydata = d3.csvParse(plotData)
  // Add X axis
  var x = d3.scaleLinear()
    .domain([0, 4])
    .range([ 0, width ]);
  
  svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x).tickValues([]));

  // Add Y axis
  var y = d3.scaleLinear()
    .domain([0, 20])
    .range([ height, 0]);
  svg.append("g")
    .call(d3.axisLeft(y));

  // Add correct dots
  svg.append('g')
    .selectAll("dot")
    .data(mydata)
    .enter()
    .append("circle")
      // .attr("cx", function (d) { return x(d.Correct); } )
      .attr("cx", x(Math.random()*0.1+0.95) )
      .attr("cy", function (d) { return y(d.Correct); } )
      .attr("r", 1.5)
      .style("fill", "#69b3a2")

  // Add mistake dots  
  svg.append('g')
    .selectAll("dot")
    .data(mydata)
    .enter()
    .append("circle")
      // .attr("cx", function (d) { return x(d.Correct); } )
      .attr("cx", x(Math.random()*0.1+2.95) )
      .attr("cy", function (d) { return y(d.Incorrect); } )
      .attr("r", 1.5)
      .style("fill", "#f0847d")


}

function loadData () {
  //

  if (mapsToShow.length <1){
    
    //load a random set of 5 out of 69 random maps from precreated dataset and add 1 map that is the same in each set (treatMapData_5_38)
    
    let treatSetIndex     = Math.floor(Math.random() * randomSets.length);
    // let treatSetIndex    = parseInt(${participantId}); // this grabs data from the AMT participant sheet

    let treatMapIdxSet    = randomSets[treatSetIndex];
      //console.log(treatSetIndex);

    if (!treatMapIdxSet.includes(0)){
      treatMapIdxSet.splice(Math.floor(Math.random()*4), 0, 0); // insert 0 at random position in a set of 5 maps. 0 is the index of the treatMapData_5_38 map
    }
      
    // console.log(treatSetIndex);
    // console.log(treatMapIdxSet);
    // console.log(fulltreatMapIdxSet);

    treatMapIdxSet.forEach(function(value){

      let treatmentDataKey  = treatDataKeys[value];

      mapsToShow.push(mapData[treatmentDataKey]);
      treatmentDataTitles.push(treatmentDataKey);
    });

    report.treatMapIdxSet   = treatMapIdxSet;
    report.treatmentDataTitles  = treatmentDataTitles;
  }

  let mapToShow = mapsToShow[mapsShown],
    flatData  = mapToShow.flatData;

  uniqueNames           = mapToShow.nameColors;
  
  roundReport.treatmentDataTitle  = treatmentDataTitles[mapsShown];
  roundReport.treatmentData   = mapToShow;

  return (flatData);
};