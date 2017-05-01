// SPACESHIP EARTH GROUP 1 DATA VISUALIZATION
// Force Simulation and Buttons by Jim Vallandingham http://vallandingham.me/

function bubbleChart() { //sets up chart space
  var width = 940;
  var height = 600;

  // tooltip
  var tooltip = floatingTooltip('gates_tooltip', 240);

  var center = { x: width / 2, y: height / 2 };

  var provCenters = {
    West: { x: width / 3, y: height / 2 },
    Central: { x: width / 2, y: height / 2 },
    East: { x: 2 * width / 3, y: height / 2 }
  };

  // X locations
  var yearsTitleX = {
    West: 160,
    Central: width / 2,
    East: width - 160
  };

  //strength to apply to the position forces
  var forceStrength = 0.03;

  // Init
  var svg = null;
  var bubbles = null;
  var nodes = [];

  // Charge function that is called for each node.
  function charge(d) {
    return -Math.pow(d.radius, 2.0) * forceStrength;
  }

  // Creating force layout and simulation
  var simulation = d3.forceSimulation()
    .velocityDecay(0.2)
    .force('x', d3.forceX().strength(forceStrength).x(center.x))
    .force('y', d3.forceY().strength(forceStrength).y(center.y))
    .force('charge', d3.forceManyBody().strength(charge))
    .on('tick', ticked);

  // Wait until Nodes are created
  simulation.stop();

  //A function that creates node objects from the raw data passed to it in CSV format
  function createNodes(rawData) {
    // Set scale based on data
    var maxAmount = d3.max(rawData, function (d) { return +d.TOTAL_ALL_RELEASES; });

    // Sizes bubbles based on area
    var radiusScale = d3.scalePow()
      .exponent(0.5)
      .range([2, 85])
      .domain([0, maxAmount]);

    // Convert data and create nodes
    var myNodes = rawData.map(function (d) {
      return {
        id: d.NPRI_ID,
        province: d.PROVINCE, 
        city: d.CITY,
        lat: d.LATITUDE, 
        lng: d.LONGITUDE, 
        sector: d.INTUITIVE_SECTOR_NAME_E, 
        magnitude: d.TOTAL_ALL_RELEASES, 
        radius: radiusScale(+d.TOTAL_ALL_RELEASES),
        company: d.COMP_NAME, 
        classification: d.NAICS6_NAME_EN, 
        region: regionSelector(d.PROVINCE),
        year: 2008,
        x: Math.random() * 900,
        y: Math.random() * 800
      };
    });

    // sort them
    myNodes.sort(function (a, b) { return b.value - a.value; });

    return myNodes;
  }

  //bubble chart creation
  var chart = function chart(selector, rawData) {
    // create nodes
    nodes = createNodes(rawData);

    // Create a SVG element 
    svg = d3.select(selector)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    // Bind nodes data
    bubbles = svg.selectAll('.bubble')
      .data(nodes, function (d) { return d.id; });

    // Create circle elements with approproate colour
    var bubblesE = bubbles.enter().append('circle')
      .classed('bubble', true)
      .attr('r', 0)
      .attr('fill', function (d) {return sectorColor(d.sector); })
      .on('mouseover', showDetail)
      .on('mouseout', hideDetail);

    // @v4 Merge the original empty selection and the enter selection
    bubbles = bubbles.merge(bubblesE);

    // transition!
    bubbles.transition()
      .duration(2000)
      .attr('r', function (d) { return d.radius; });

    // Set the simulation's nodes to our newly created nodes array.
    simulation.nodes(nodes);

    // Set initial layout to single group.
    groupBubbles();
  };

  // callback tick for force simulation
  function ticked() {
    bubbles
      .attr('cx', function (d) { return d.x; })
      .attr('cy', function (d) { return d.y; });
  }

  // provides x value for once bubbles are split according to region
  function nodeYearPos(d) {
    return provCenters[d.region].x;
  }


  // groups bubbles together for all of canada
  function groupBubbles() {
    hideYearTitles();

    // @v4 Reset the 'x' force to draw the bubbles to the center.
    simulation.force('x', d3.forceX().strength(forceStrength).x(center.x));

    // @v4 We can reset the alpha value and restart the simulation
    simulation.alpha(1).restart();
  }


  // splits bubbles by region using force sim
  function splitBubbles() {
    showYearTitles();

    // @v4 Reset the 'x' force to draw the bubbles to their year centers
    simulation.force('x', d3.forceX().strength(forceStrength).x(nodeYearPos));

    // @v4 We can reset the alpha value and restart the simulation
    simulation.alpha(1).restart();
  }

  // hides titles
  function hideYearTitles() {
    svg.selectAll('.year').remove();
  }

  //shows titles
  function showYearTitles() {
    // Another way to do this would be to create
    // the year texts once and then just hide them.
    var yearsData = d3.keys(yearsTitleX);
    var years = svg.selectAll('.year')
      .data(yearsData);

    years.enter().append('text')
      .attr('class', 'year')
      .attr('x', function (d) { return yearsTitleX[d]; })
      .attr('y', 40)
      .attr('text-anchor', 'middle')
      .text(function (d) { return d; });
  }


  // shows hover detail bubbles w html descriptions of pollution event
  function showDetail(d) {
    // change outline to indicate hover state.
    d3.select(this).attr('stroke', 'black');

    var content = '<span class="name">CITY: </span><span class="value">' +
                  d.city +
                  '</span><br/>' +
                  '<span class="name">PROVINCE: </span><span class="value">' +
                  d.province +
                  '</span><br/>' +
                  '<span class="name">COMPANY: </span><span class="value">' +
                  d.company +
                  '</span><br/>' +
                  '<span class="name">SECTOR: </span><span class="value">' +
                  d.sector +
                  '</span><br/>' +
                  '<span class="name">AMOUNT POLLUTED: </span><span class="value">' +
                  Math.round(d.magnitude) + " tons"
                  '</span><br/>';

    tooltip.showTooltip(content, d3.event);
  }

  // tooltip stuff
  function hideDetail(d) {
    // reset outline
    d3.select(this)
      .attr('stroke', d3.rgb(sectorColor(d.sector)).darker());

    tooltip.hideTooltip();
  }

  //
  chart.toggleDisplay = function (displayName) {
    if (displayName === 'year') {
      splitBubbles();
    } else {
      groupBubbles();
    }
  };


  // return the chart function from closure.
  return chart;
}

// Initalizing
var myBubbleChart = bubbleChart();

// callback from CSV GET request
function display(error, data) {
  if (error) {
    console.log(error);
  }

  myBubbleChart('#vis', data);
}

// button stuff
function setupButtons() {
  d3.select('#toolbar')
    .selectAll('.button')
    .on('click', function () {
      // Remove active class from all buttons
      d3.selectAll('.button').classed('active', false);
      // Find the button just clicked
      var button = d3.select(this);

      // Set it as the active button
      button.classed('active', true);

      // Get the id of the button
      var buttonId = button.attr('id');

      // Toggle the bubble chart based on
      // the currently clicked button.
      myBubbleChart.toggleDisplay(buttonId);
    });
}
///////////////////////////////////////////////////////////
// Colour Selector by Sector
//////////////////////////////
var sectorColor = function(x){
  var color = "";
  console.log(typeof x);

  //metal sectors

  if(x===("Aluminum") || x===("Metals (Except Aluminum and Iron and Steel)") || x===("Iron and Steel")){
             color = "yellow";
            }

  //other sectors
  else if(x===("Other (Except Manufacturing)") ||x===("Chemicals")||x===("Transportation Equipment Mfg.")||x===("Electricity")){
            color = "purple";
  }

  //natural resource sectors
  else if(x===("Conventional Oil and Gas Extraction")||x===("Non-Conventional Oil Extraction (including Oilsands and Heavy Oil)")||x===("Mining and Quarrying")||x===("Oil & Gas Pipelines and Storage")||x===("Petroleum and Coal Product Refining and Mfg.")||x===("Cement, Lime and Other Non-Metallic Minerals")){
            color = "green";
  }

  //manufacturing sectors
  else if(x===("Wood Products")||x===("Pulp and Paper")||x===("Other Manufacturing")||x===("Plastics and Rubber")){
            color =  "red";
  }
  //waste/water sectors
  else if(x===("Water and Wastewater Systems")||x===("Waste Treatment and Disposal")){
            color ="blue";
  }
  else{
            color = "black";
  }
  console.log(color);
  return color;
};

///////////////////
// sets region based on prov
///////////////////
function regionSelector (x) {
  var rgn = "";
  switch (x) {
    case "ON":
      rgn = "Central";
      break;
    case "QC":
      rgn = "Central";
      break;
    case "NT":
      rgn = "Central";
      break;
    case "NU":
      rgn = "Central";
      break;
    case "YK":
      rgn = "Central";
      break;
    case "MB":
      rgn = "West";
      break;
    case "SK":
      rgn = "West";
      break;
    case "AB":
      rgn = "West";
      break;
    case "BC":
      rgn = "West";
      break;
    default:
      rgn = "East";
      break;
  }
  console.log(x);
  console.log(rgn);
  return rgn;
}

// Load the data.
d3.csv('http://neogeoweb.ca/384group1/waterPollution.csv', display);

// setup the buttons.
setupButtons();
