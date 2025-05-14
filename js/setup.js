"use strict";

// Wait for the DOM to finish loading
// if (document.readyState === "interactive") { init(); }

////////////////////////////////////////////////////////////////////////////////
// Initialise svg and group elements for map and timeline
////////////////////////////////////////////////////////////////////////////////

// Map
var w_map = parseInt(d3.select("#map").style("width"));
var h_map = parseInt(d3.select("#map").style("height"));

var svg = d3
	.select("#map")
	.append("svg")
	.attr("width", w_map)
	.attr("height", h_map);

var mapG = svg.append("g").attr("id", "mapG"); // g for the map
var dotG = svg.append("g").attr("id", "dotG"); // g for dots or anything else we plot on top
var labG = svg.append("g").attr("id", "labG"); // g for country labels
var popG = svg.append("g").attr("id", "popG"); // g for popup circles

////////////////////////////////////////////////////////////////////////////////
// Set up map
////////////////////////////////////////////////////////////////////////////////

// initial scale and translation (makes mercator projection fit screen)
var scaleInit = (h_map / (2 * Math.PI)) * 2.3;
var transInit = [w_map * 0.5, h_map * 0.75];

// define projection
var projection = d3
	.geoMercator()
	.scale(scaleInit)
	.translate(transInit);

// define path generator
var path = d3.geoPath().projection(projection);

// tooltip for country names
var tooltipMap = labG
	.attr("transform", "translate(-100,-100)")
	.attr("id", "tooltipMap")
	.style("pointer-events", "none")
	.append("text")
	.attr("class", "tooltipText");

// set up zoom
var zoom = d3
	.zoom()
	.scaleExtent([0.7, 50])
	.on("zoom", zooming);

svg.call(zoom);

svg.on("click", selectedAgt.clear);

function zooming() {
	mapG.style("stroke-width", 1 / d3.event.transform.k + "px");
	mapG.attr("transform", d3.event.transform);

	// semantic zoom
	dotG
		.selectAll(".glyphContainer")
		.attr(
			"transform",
			d => "translate(" + d3.event.transform.apply(projection(d.loc)) + ")"
		);
}

// zoom buttons (bottom right of map)
var zoomG = svg
	.append("g")
	.attr("transform", "translate(" + (w_map - 35) + "," + (h_map - 60) + ")")
	.classed("zoomButton", true);

// zoom in (+) button
zoomG
	.append("rect")
	.attr("x", 0)
	.attr("y", 0)
	.attr("width", 25)
	.attr("height", 25)
	.on("click", function() {
		zoom.scaleBy(svg.transition().duration(200), 1.3);
	});

// zoom out (-) button
zoomG
	.append("rect")
	.attr("x", 0)
	.attr("y", 25)
	.attr("width", 25)
	.attr("height", 25)
	.on("click", function() {
		zoom.scaleBy(svg.transition().duration(200), 1 / 1.3);
	});

// plus and minus signs on buttons
zoomG
	.selectAll(".zoomLabel")
	.data([
		{ x1: 7.5, x2: 17.5, y1: 12.5, y2: 12.5 },
		{ x1: 12.5, x2: 12.5, y1: 7.5, y2: 17.5 },
		{ x1: 7.5, x2: 17.5, y1: 37.5, y2: 37.5 }
	])
	.enter()
	.append("line")
	.attr("x1", d => d.x1)
	.attr("x2", d => d.x2)
	.attr("y1", d => d.y1)
	.attr("y2", d => d.y2);

////////////////////////////////////////////////////////////////////////////////
// Set up spiral popup background + controls
////////////////////////////////////////////////////////////////////////////////

var popupBGC = popG.append("g").attr("id", "popupBGC"); // g for popup background + controls

// background rectangle to cover entire map
popupBGC
	.append("rect")
	.attr("height", h_map)
	.attr("width", w_map)
	.attr("id", "bgRect")
	.on("mouseover", function() {
		d3.select("#closeButton").classed("hover", true);
	})
	.on("mouseout", function() {
		d3.select("#closeButton").classed("hover", false);
	})
	.on("click", function() {
		// hide popup
		popG.classed("hidden", true);
		// empty spiral G
		d3.select("#popupSpiral")
			.selectAll("*")
			.remove();
		// reset timeline by triggering filter update
		let event = new Event("change");
		eventHandler.dispatchEvent(event);
	});

// (X) button to close
popupBGC
	.append("circle")
	.attr("id", "closeButton")
	.attr("cx", w_map - 40)
	.attr("cy", 40)
	.attr("r", 30);

popupBGC
	.selectAll("line")
	.data([[[0, 30], [0, 30]], [[0, 30], [30, 0]]])
	.enter()
	.append("line")
	.classed("closeButtonLines", true)
	.attr("transform", "translate(" + (w_map - 55) + "," + 25 + ")")
	.attr("x1", d => d[0][0])
	.attr("x2", d => d[0][1])
	.attr("y1", d => d[1][0])
	.attr("y2", d => d[1][1]);

// g in the centre
var popupCenter = popG
	.append("g")
	.attr("id", "popupCenter")
	.attr("transform", "translate(" + 0.5 * w_map + "," + 0.5 * h_map + ")");

// g for controls
var popupControls = popupCenter.append("g").attr("id", "popupControls");

// g for spiral (added on click)
var popupSpiral = popupCenter.append("g").attr("id", "popupSpiral");

// heading - updated dynamically
popupCenter
	.append("text")
	.attr("x", 0)
	.classed("popupHeading", true);

// add buttons to the side of the circle
var popupSplitButtons = popupControls
	.append("g")
	.classed("popupSplitButtons", true);

var textOffset = 5;
var fontSize = 15;

// split by peace process?

// button2.attr("transform", "translate(100,0)");
popupSplitButtons.attr("transform", "translate(50,0)");

var text0 = popupSplitButtons.append("text").attr("y", -55);
text0
	.selectAll("tspan")
	.data(["SPLIT BY", "PEACE PROCESS?"])
	.enter()
	.append("tspan")
	.attr("x", 0)
	.attr("y", text0.attr("y"))
	.attr("dy", function(d, i) {
		return ((i * 2 - 1) * fontSize) / 2;
	})
	.text(d => d)
	.style("fill", "#333");

popupSplitButtons
	.append("circle")
	.attr("id", "splitButtonYes")
	.attr("cy", -20)
	.attr("r", 20);

popupSplitButtons
	.append("text")
	.style("font-size", fontSize + "px")
	.text("Yes")
	.attr("y", -20 + textOffset);

popupSplitButtons
	.append("circle")
	.attr("id", "splitButtonNo")
	.classed("selected", true)
	.attr("cy", 25)
	.attr("r", 20);

popupSplitButtons
	.append("text")
	.style("font-size", fontSize + "px")
	.text("No")
	.attr("y", 25 + textOffset);

// hide the whole thing
d3.select("#popG").classed("hidden", true);

var selectedCon = "";

////////////////////////////////////////////////////////////////////////////////
// Initialise event listeners, buttons, etc.
////////////////////////////////////////////////////////////////////////////////

// Button to hide / show global filters
d3.select("#expandFilters").on("click", function() {
	// check if currently hidden
	var currentState = d3.select("#filterContainer").classed("hidden");

	// change button text
	d3.select("#expandFilters").text(
		currentState ? "Hide Filters" : "Show Filters"
	);

	// toggle filter visibility
	d3.select("#filterContainer").classed("hidden", !currentState);

	// enable pointer-events
	// necessary for scroll to work on Chrome
	d3.select("#sidebar").classed("visible", currentState);
});

// Buttons to select all / deselect all in the global filters box

d3.select("#selectAllCodes").on("click", function() {
	// check all checkboxes
	d3.selectAll("#codesCheckboxes input").property("checked", true);
	let event = new Event("change");
	eventHandler.dispatchEvent(event);
});

d3.select("#deselectAllCodes").on("click", function() {
	// uncheck all checkboxes
	d3.selectAll("#codesCheckboxes input").property("checked", false);
	let event = new Event("change");
	eventHandler.dispatchEvent(event);
});

d3.select("#selectAllCons").on("click", function() {
	// check all checkboxes
	d3.selectAll("#conDropdown input").property("checked", true);
	let event = new Event("change");
	eventHandler.dispatchEvent(event);
});

d3.select("#deselectAllCons").on("click", function() {
	// uncheck all checkboxes
	d3.selectAll("#conDropdown input").property("checked", false);
	let event = new Event("change");
	eventHandler.dispatchEvent(event);
});

// Add codes checkboxes
makeCodesCheckboxes(true);

// Initialise infobox
agtDetails(null);

// Initialise slider
var timeSlider = initSlider();

////////////////////////////////////////////////////////////////////////////////
// Load data
////////////////////////////////////////////////////////////////////////////////

d3.csv("data/pax_all_agreements_data_v9.csv", parseData)
	.then(function(data) {
		console.log(data);

		// Add countries/entities to dropdown
		var cons = getConNames(data);
		d3.select("#conDropdown")
			.selectAll("span")
			.data(cons)
			.enter()
			.append("span")
			.html(function(d, i) {
				return (
					"<label><input type='checkbox' id='checkboxCon" +
					i +
					"' name='Con' class='input'>" +
					d +
					"</label><br/>"
				);
			});

		// Update list of selected countries on change
		d3.select("#conDropdown").on("click", function() {
			// update span with list of selected
			d3.select("#selectedCons").html(getSelectedConsString(cons));
		});

		// Initialise reset button for filters
		d3.select("#reset-filters").on("click", resetFilters);
		resetFilters();

		// Draw timeline
		initTimeline(data, [minYear, maxYear]);

		// Load geojson world map
		d3.json("data/world-110m-custom.geojson")
			.then(function(world) {
				// draw map
				mapG
					.append("g")
					.selectAll("path")
					.data(world.features)
					.enter()
					.append("path")
					.attr("id", function(d) {
						return "path" + d.id;
					})
					.attr("d", path)
					.classed("land", true)
					.on("mouseover", function(d) {
						mouseoverCountry(this, d);
					})
					.on("mouseout", function(d) {
						mouseoutCountry(this, d);
					})
					.on("click", function(d) {
						var filters = {
							year: timeSlider.getRange(),
							cons: { any: true, cons: [d.properties.name] },
							codes: getSelectedCodes()
						};
						drawPopupCircles(
							filterData(
								locdata[locdata.findIndex(e => e.con == d.properties.name)]
									.agts,
								filters
							),
							d.properties.name
						);
						selectedCon = d.properties.name;
						// update timeline
						initTimeline(filterData(data, filters), filters.year);
					});

				// Match data points with locations on the map and draw dot map
				const locdata = makeDotmapData(data, world);
				drawDotmap(locdata);

				console.log(data, locdata);

				// Listen for changes in filters
				d3.selectAll(".input").on("change", function() {
					var filters = {
						year: timeSlider.getRange(),
						cons: getSelectedCons(cons),
						codes: getSelectedCodes()
					};

					drawDotmap(
						locdata.map(function(d) {
							return {
								agts: filterData(d.agts, filters),
								con: d.con,
								count: d.count,
								id: d.id
							};
						})
					);

					// check if spiral is visible and redraw if yes
					if (!popG.classed("hidden")) {
						filters.cons.cons = [selectedCon];
						drawPopupCircles(
							filterData(
								locdata[locdata.findIndex(e => e.con == selectedCon)].agts,
								filters
							),
							selectedCon
						);
						initTimeline(filterData(data, filters), filters.year);
					} else {
						initTimeline(filterData(data, filters), filters.year);
					}
				});
			})
			.catch(function(error) {
				throw error;
			});
	})
	.catch(function(error) {
		throw error;
	});

// SPIRAL

function drawSpiral() {
	var hiddenG = popG
		.append("g")
		.attr("transform", "translate(-600, -600)")
		.attr("id", "hiddenSpiral");

	var start = 0,
		end = 1,
		numSpirals = 20, // 1 = a half turn
		spiralRadius = numSpirals * glyphR * 1.1;

	var theta = function(r) {
		return numSpirals * Math.PI * r;
	};

	var radius = d3
		.scaleLinear()
		.domain([start, end])
		.range([10, spiralRadius]);

	var points = d3.range(start, end + 0.001, (end - start) / 1000);

	var spiral = d3
		.radialLine()
		.curve(d3.curveCardinal)
		.angle(theta)
		.radius(radius);

	var path = hiddenG
		.append("path")
		.datum(points)
		.attr("id", "spiral")
		.attr("d", spiral)
		.style("fill", "none")
		.style("stroke", "none");

	return path;
}

const spiralPath = drawSpiral();
const spiralLength = spiralPath.node().getTotalLength();
