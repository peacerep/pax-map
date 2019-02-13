// js for the filters on the left

d3.select('#selectAllCodes')
	.on('click', function() {
		// check all checkboxes
		d3.selectAll('#codesCheckboxes input').property('checked', true)
	})

d3.select('#deselectAllCodes')
	.on('click', function() {
		// uncheck all checkboxes
		d3.selectAll('#codesCheckboxes input').property('checked', false)
	})

d3.select('#selectAllCons')
	.on('click', function() {
		// check all checkboxes
		d3.selectAll('#conDropdown input').property('checked', true)
	})

d3.select('#deselectAllCons')
	.on('click', function() {
		// uncheck all checkboxes
		d3.selectAll('#conDropdown input').property('checked', false)
	})

d3.csv("../data/paxTimelineData_02092018.csv")
	.row(function(d){ return{ Year:+d.Year,
		Dat:parseDate(d.Dat),
		AgtId:+d.AgtId,
		// Reg:d.Reg,
		Con:d.Con,
		Status:d.Status,
		Agtp:d.Agtp,
		Stage:d.Stage, // "Pre", "SubPar", "SubComp", "Imp", "Cea", "Other"
		StageSub:d.StageSub, // "FrCons"
		Agt:d.Agt,
		GeWom:+d.GeWom, // 1 if topic of Women, girls and gender addressed; 0 if not
		Polps:+d.Polps, // 1-3 indicating increasing level of detail given about Political Power sharing; 0 if none given
		Terps:+d.Terps, // 1-3 indicating increasing level of detail given about Territorial Power sharing; 0 if none given
		Eps:+d.Eps, // 1-3 indicating increasing level of detail given about Economic Power sharing; 0 if none given
		Mps:+d.Mps, // 1-3 indicating increasing level of detail given about Political Power sharing; 0 if none given
		Pol:+d.Pol, // 1-3 indicating increasing level of detail given about political institutions; 0 if none given
		HrFra:+d.HrFra, // 1 if topic of human rights/rule of law addressed; 0 if not
		// HrFra:+d.HrFra, // 1-3 indicating increasing level of detail given about human rights framework to be established; 0 if none given
		TjMech:+d.TjMech // 1-3 indicating increasing level of detail given about a body to deal with the past; 0 if none given
	}; })
	.get(function(error,data){
		if (error) throw error;

		console.log(data)

		// add years to year dropdowns
		var years = getYears(data)
		populateYearDropdowns(years)

		// add countries/entities to dropdown
		var cons = getConNames(data)

		var labels = d3.select('#conDropdown')
			.selectAll('span')
			.data(cons)
			.enter()
			.append('span')
			.html(function(d,i) {
				return "<label><input type='checkbox' id='con" + i +
				"' name='Con'>"+ d + "</label><br/>"
			})

		// update list of selected countries on change
		d3.select('#conDropdown')
			.on('click', function() {
				// update span with list of selected
				d3.select('#selectedCons').html(getSelectedConsString(cons))
			})



	}) // end data


function populateYearDropdowns(years) {

	var minYear = years[0]
	var maxYear = years[1]
	var lst = d3.range(minYear, maxYear+1)

	d3.select('#inputMinYear')
		.selectAll('option .new')
		.data(lst)
		.enter()
		.append('option')
		.text(function(d) {return d})
		.attr('value', function(d) {return d})

	d3.select('#inputMaxYear')
		.selectAll('option .new')
		.data(lst)
		.enter()
		.append('option')
		.text(function(d) {return d})
		.attr('value', function(d) {return d})
}

function getSelectedCons(conlist) {
	// function to get selected countries from 'dropdown'
	var check = []
	for (var i = 0; i < conlist.length; i++) {
		if (document.getElementById('con' + i).checked) {
			check.push(conlist[i])
		}
	}
	return check
}

function getSelectedConsString(conlist) {
	var selected = getSelectedCons(conlist)

	if (selected.length == conlist.length) {
		return 'All'
	}
	else if (selected.length == 0) {
		return 'None'
	}
	else {
		var str = ''
		for (var i = 0; i < selected.length; i++) {
			str += selected[i] + ', '
		}
		str = str.slice(0, -2)
		return str
	}
}