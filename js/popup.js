function mouseoverCountry(that, d) {
	var polygon = d3.select(that);

	polygon.classed("hover", true).moveToFront();

	// add tooltip with country name
	var tooltip = d3
		.select("#tooltipMap")
		.attr(
			"transform",
			"translate(" +
				d3.zoomTransform(svg.node()).apply(projection(d3.geoCentroid(d))) +
				")"
		);
	tooltip.select(".tooltipText").text(d.properties.name);

	// select all glyph containers
	var dots_con = d3.select("#dots" + d.id).selectAll(".glyphContainer");

	// grow flower petals
	// dots_con
	// 	.selectAll(".petal")
	// 	.transition()
	// 	.duration(200)
	// 	.attr("d", arcMax);
}

function mouseoutCountry(that, d) {
	d3.select(that).classed("hover", false);

	// hide tooltip
	d3.select("#tooltipMap").attr("transform", "translate(-100, -100)");

	// select all glyph containers
	var dots_con = d3.select("#dots" + d.id).selectAll(".glyphContainer");

	// shrink petals again
	// dots_con
	// 	.selectAll(".petal")
	// 	.transition()
	// 	.duration(200)
	// 	.attr("d", arcMin);
}

function clickCountry(con, con_data, world, filters) {
	// show the G
	d3.select("#popG").attr("display", null);

	// g for the part of the popup that has to be redrawn
	var g = d3.select("#popupSpiral");

	// initial display
	drawPopupCircles(con_data);

	// when filters are changed:
	// update spiral
	// update timeline

	// d3.selectAll(".input").on("change", function() {
	// 	drawPopupCircles(con_data, path);
	// });

	d3.select("#splitButtonNo").on("click", function() {
		d3.select(this).classed("selected", true);
		d3.select("#splitButtonYes").classed("selected", false);
		drawPopupCircles(con_data, false, path);
	});
	d3.select("#splitButtonYes").on("click", function() {
		d3.select(this).classed("selected", true);
		d3.select("#splitButtonNo").classed("selected", false);
		drawPopupCircles(con_data, true, path);
	});

	function drawPopupCircles(con_data) {
		// get split setting
		var split = d3.select("#splitButtonYes").classed("selected");

		// empty the g before drawing anything new
		g.selectAll("*").remove();

		// SPLIT ------------------------------------------------------------------
		if (split) {
			var con_data_process = d3
				.nest()
				.key(d => d.processid)
				.entries(con_data);

			var radii = [];

			// do this for each peace process separately
			con_data_process.forEach(function(pr_data, index) {
				var g_bubble = g.append("g").attr("id", "bubble" + index);
				// create g's for different parts of vis
				var bgG = g_bubble.append("g").classed("popupBgG", true);
				var glyphG = g_bubble.append("g").classed("popupGlyphG", true);

				// ---------------------------------------------------------------------
				// g for each agreement, positioned correctly
				var glyph = glyphG
					.selectAll(".popupGlyph")
					.data(pr_data.values.sort(sortByDate))
					.enter()
					.append("g")
					.classed("popupGlyph", true)
					.attr("transform", function(d, i) {
						var posOnPath = spiralPath.node().getPointAtLength((i + 1) * delta);
						return "translate(" + posOnPath.x + "," + posOnPath.y + ")";
					});

				// calculate the position and size for the background circle based on
				// the position of the last (most outward) glyph
				// add a bit to cover year labels as well
				var tr = parseTransform(glyph.last().attr("transform")).translate;
				radii.push({
					r: Math.sqrt(Math.pow(+tr[0], 2) + Math.pow(+tr[1], 2)) + glyphR + 10
				});

				// draw big background circle
				bgG
					.append("circle")
					.attr("x", 0)
					.attr("y", 0)
					.attr("r", radii[index].r)
					.classed("popupBgCircle", true);

				// calculate path for visible part of spiral and draw
				var len = (pr_data.values.length + 1) * delta;
				var locs = d3.range(0, len, delta / 2).map(function(d) {
					var pt = spiralPath.node().getPointAtLength(d);
					return [pt.x, pt.y];
				});

				var lineGenerator = d3.line().curve(d3.curveCardinal);
				var pathData = lineGenerator(locs);

				bgG
					.append("path")
					.attr("d", pathData)
					.classed("popupBackgroundSpiral", true);

				// for sorting by date: add year labels
				glyphG
					.append("g")
					.classed("popupDateLabel", true)
					.attr("transform", function(d) {
						var posOnPath = spiralPath.node().getPointAtLength(0);
						return "translate(" + posOnPath.x + "," + posOnPath.y + ")";
					})
					.append("text")
					.text(d3.min(pr_data.values, d => d.year));

				glyphG
					.append("g")
					.classed("popupDateLabel", true)
					.attr("transform", function(d) {
						var posOnPath = spiralPath.node().getPointAtLength(len);
						return "translate(" + posOnPath.x + "," + posOnPath.y + ")";
					})
					.append("text")
					.text(d3.max(pr_data.values, d => d.year));
				// ---------------------------------------------------------------------
			});

			d3.packSiblings(radii);
			radii.forEach(function(r, i) {
				d3.select("#bubble" + i).attr(
					"transform",
					"translate(" + r.x + "," + r.y + ")"
				);
			});

			var offsetControls = d3.max(radii, d => d.r + d.x) + 80;
			var offsetHeading = d3.max([
				20 - h_map / 2,
				d3.min([d3.min(radii, d => d.y - d.r) - 30, -160])
			]);
		}
		// NO SPLIT ----------------------------------------------------------------
		else {
			// create g's for different parts of vis
			var bgG = g.append("g").classed("popupBgG", true);
			var glyphG = g.append("g").classed("popupGlyphG", true);

			// g for each agreement, positioned correctly
			var glyph = glyphG
				.selectAll(".popupGlyph")
				.data(con_data.sort(sortByDate))
				.enter()
				.append("g")
				.classed("popupGlyph", true)
				.attr("transform", function(d, i) {
					var posOnPath = spiralPath.node().getPointAtLength((i + 1) * delta);
					return "translate(" + posOnPath.x + "," + posOnPath.y + ")";
				});

			// calculate radius of background circle based on position of last glyph
			// add 10px to ensure year label fits
			var tr = parseTransform(glyph.last().attr("transform")).translate;
			var outercircle_r =
				Math.sqrt(Math.pow(+tr[0], 2) + Math.pow(+tr[1], 2)) + glyphR + 10;

			// draw big background circle
			bgG
				.append("circle")
				.attr("x", 0)
				.attr("y", 0)
				.attr("r", outercircle_r)
				.classed("popupBgCircle", true);

			// calculate path for visible part of spiral and draw
			var len = (con_data.length + 1) * delta;
			var locs = d3.range(0, len, delta / 2).map(function(d) {
				var pt = spiralPath.node().getPointAtLength(d);
				return [pt.x, pt.y];
			});

			var lineGenerator = d3.line().curve(d3.curveCardinal);
			var pathData = lineGenerator(locs);

			bgG
				.append("path")
				.attr("d", pathData)
				.classed("popupBackgroundSpiral", true);

			// for sorting by date: add year labels
			glyphG
				.append("g")
				.classed("popupDateLabel", true)
				.attr("transform", function(d, i) {
					var posOnPath = spiralPath.node().getPointAtLength(0);
					return "translate(" + posOnPath.x + "," + posOnPath.y + ")";
				})
				.append("text")
				.text(d3.min(con_data, d => d.year));

			glyphG
				.append("g")
				.classed("popupDateLabel", true)
				.attr("transform", function(d, i) {
					var posOnPath = spiralPath.node().getPointAtLength(len);
					return "translate(" + posOnPath.x + "," + posOnPath.y + ")";
				})
				.append("text")
				.text(d3.max(con_data, d => d.year));

			var offsetControls = 80 + outercircle_r;
			var offsetHeading = d3.min([-30 - outercircle_r, -160]);
		}

		// BOTH --------------------------------------------------------------------

		// heading
		d3.select(".popupHeading")
			.attr("y", offsetHeading)
			.text("Agreements signed by " + con);

		// move controls
		d3.select("#popupControls").attr(
			"transform",
			"translate(" + offsetControls + ",0)"
		);

		// draw glyphs
		var glyph = d3.selectAll(".popupGlyph");

		// draw invisible circle for info on mouseover
		glyph
			.append("circle")
			.attr("fill", "transparent")
			.classed("glyphHighlightCircle", true)
			.attr("id", d => "glyph" + d.id)
			.attr("r", popupGlyphR)
			.on("mouseover", onmouseover)
			.on("mouseout", onmouseout)
			.on("click", function(d) {
				selectedAgt.clickOn(d);
				event.stopPropagation();
			});

		// draw centre circle for each agreement
		glyph
			.append("circle")
			.attr("r", popupGlyphR * 0.15)
			.classed("popupGlyphCircle", true);

		// add petals
		glyph
			.selectAll(".petal")
			.data(d => petalData(d))
			.enter()
			.append("path")
			.classed("popupGlyphPetal", true)
			.attr("d", arcPopup)
			.style("fill", d => d.colour);
	}
}

function sortGlyphsBy(sortingFunction, that) {
	d3.selectAll(".popupSortButtons .selected").classed("selected", false);
	d3.select(that).classed("selected", true);

	d3.selectAll(".popupGlyphG")
		.selectAll(".popupGlyph")
		.sort(sortingFunction)
		.transition()
		.duration(100)
		.attr("transform", function(d, i) {
			var posOnPath = d3
				.select(".popupBackgroundSpiral")
				.node()
				.getPointAtLength((i + 1) * delta);
			return "translate(" + posOnPath.x + "," + posOnPath.y + ")";
		});
}

function sortByDate(a, b) {
	// writing a.date doesn't work in chrome
	// probably because it's bad practice to name things 'date'
	return a["date"] > b["date"];
}

function sortByNCodes(a, b) {
	var scoreA = 0;
	var scoreB = 0;
	codes.forEach(function(code) {
		scoreA = a[code] > 0 ? scoreA + 1 : scoreA;
		scoreB = b[code] > 0 ? scoreB + 1 : scoreB;
	});
	return scoreA < scoreB;
}

function sortByCode(a, b, code) {
	return a[code] < b[code];
}

function petalData(d) {
	var activeCodes = [];
	for (var i = 0; i < codes.length; i++) {
		if (d[codes[i]]) {
			activeCodes.push(codes[i]);
		}
	}
	if (!activeCodes.length) {
		return [];
	} else {
		var incr = tau / codes.length;
		var obj = [];
		for (var i = 0; i < codes.length; i++) {
			if (activeCodes.includes(codes[i])) {
				obj.push({
					startAngle: i * incr,
					endAngle: (i + 1) * incr,
					colour: codeColour(codes[i]),
					code: codes[i],
					score: d[codes[i]]
				});
			}
		}
		return obj;
	}
}

var arcMin = d3
	.arc()
	.innerRadius(0)
	.outerRadius(function(d) {
		return d3
			.scaleSqrt()
			.domain(codesRange[d.code])
			.range([0, glyphR])(d.score);
	})
	.cornerRadius(5);

var arcPopup = d3
	.arc()
	.innerRadius(0)
	.outerRadius(function(d) {
		return d3
			.scaleSqrt()
			.domain(codesRange[d.code])
			.range([0, popupGlyphR * 0.8])(d.score);
	})
	.cornerRadius(5);

var arcMax = d3
	.arc()
	.innerRadius(0)
	.outerRadius(function(d) {
		return d3
			.scaleSqrt()
			.domain(codesRange[d.code])
			.range([0, glyphR * 1.3])(d.score);
	})
	.cornerRadius(5);
