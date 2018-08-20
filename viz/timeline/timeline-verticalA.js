/*
Vertical Timeline
*/

var paxHrFra = window.localStorage.setItem("paxHrFraV",0); // Human rights framework
var paxHrGen = window.localStorage.setItem("paxHrGenV",0); // Human rights/Rule of law
var paxMps = window.localStorage.setItem("paxPolV",0); // Military power sharing
var paxEps = window.localStorage.setItem("paxEpsV",0); // Economic power sharing
var paxTerps = window.localStorage.setItem("paxMpsV",0); // Territorial power sharing
var paxPolps = window.localStorage.setItem("paxPolpsV",0); // Political power sharing
var paxPol = window.localStorage.setItem("paxTerpsV",0); // Political institutions
var paxGeWom = window.localStorage.setItem("paxTjMechV",0); // Women, girls and gender
var paxTjMech = window.localStorage.setItem("paxGeWomV",0); // Transitional justice past mechanism

var paxANY = window.localStorage.setItem("paxANYV",0); // Selected ANY filter rule
var paxALL = window.localStorage.setItem("paxALLV",1); // Selected ALL filter rule

d3.select(window).on("resize", callFunction);
window.addEventListener("storage", toUpdate);

function toUpdate(){
  if (window.localStorage.getItem("updateVertical") == "true"){
    return callFunction();
  }
}

function callFunction() {
  console.log("Drawing left vertical timeline of yearly grouping");
  getFilters();

  function getFilters(){
    var locStor = window.localStorage;
    // Filter rule
    // paxRule = locStor.getItem("paxRule");
    paxANY = locStor.getItem("paxANYV");
    paxALL = locStor.getItem("paxALLV");
    // Filter codes
    paxHrFra = locStor.getItem("paxHrFraV");
    paxHrGen = locStor.getItem("paxHrGenV");
    paxMps = locStor.getItem("paxMpsV");
    paxEps = locStor.getItem("paxEpsV");
    paxTerps = locStor.getItem("paxTerpsV");
    paxPolps = locStor.getItem("paxPolpsV");
    paxPol = locStor.getItem("paxPolV");
    paxGeWom = locStor.getItem("paxGeWomV");
    paxTjMech = locStor.getItem("paxTjMechV");
  };

  // Date parsers & formatters
  var parseDate = d3.timeParse("%d/%m/%Y");
  var parseMonth = d3.timeParse("%m");
  var parseYear = d3.timeParse("%Y");
  var parseDay = d3.timeParse("%j");
  var formatDate = d3.timeFormat("%d %B %Y");
  var formatMonth = d3.timeFormat("%m");
  var formatDay = d3.timeFormat("%j");  // day of the year as decimal number
  var formatYear = d3.timeFormat("%Y");

  var margin = {top: 5, right: 65, bottom: 5, left: 25}, //read clockwise from top
      // width = parseInt(d3.select("body").style("width"), 10),
      height = 880 - margin.top - margin.bottom,
      width = width = parseInt(d3.select("body").style("width"), 10),
      width = width - margin.left - margin.right,
      yWidth = 10,
      agtPadding = 2,
      agtSpacing = 1;

  // Obtain data
  d3.csv("PAX_with_additional.csv")
      .row(function(d){ return{ Year:+d.Year, //parseYear(d.Year),
                                Day:+d.Day,
                                Month:+d.Month,
                                Dat:parseDate(d.Dat),
                                AgtId:Number(d.AgtId),
                                Reg:d.Reg,
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
                                HrGen:+d.HrGen, // 1 if topic of human rights/rule of law addressed; 0 if not
                                HrFra:+d.HrFra, // 1-3 indicating increasing level of detail given about human rights framework to be established; 0 if none given
                                TjMech:+d.TjMech // 1-3 indicating increasing level of detail given about a body to deal with the past; 0 if none given
                              }; })
      .get(function(error,data){

          var svgTest = d3.select("body").select("svg");
          if (!svgTest.empty()) {
            svgTest.remove();
          };

          // Create bar chart tooltip
          var tooltip = d3.select("body").append("div")
              .style("opacity","0")
              .style("position","absolute")
              .attr("class","tooltip");

          // Group agreements by Year (create an array of objects whose key is the year and value is an array of objects (one per agreement))
          var years = d3.nest()
               .key(function(d){ return d.Year; }).sortKeys(d3.ascending)
               .sortValues(function(a,b){ return d3.descending(a.Dat, b.Dat); })
               .entries(data);
          var yrList = (d3.map(years, function(year){ return year.key; })).keys(); // array of year values
          // console.log(years); // an array of objects
          // console.log(years[0].values); // array of objects (one for each agreement in 1990)
          // console.log(years[0].values[0]); // first agreement object from 1990
          // console.log(years[0].values[0].Year); // Year (as number) of the first agreement object from 1990

          // Find the maximum number of agreements in a single year for a single country/entity
          var con_year_nest = d3.nest()
              .key(function(d){ return d.Con; })
              .key(function(d){ return d.Year; })
              .rollup(function(leaves){ return leaves.length; })
              .entries(data);
          var maxAgts = 1;
          for (c = 0; c < con_year_nest.length; c++){
            var sub = con_year_nest[c].values;
            // console.log(sub);
            var agts = d3.max(sub, function(d){ return d.value; });
            if (agts > maxAgts){
              maxAgts = agts;
            }
          }
          // Set the agreement width (pixels) based on the maximum possible agts to display in a year
          var agtWidth = (width-yWidth)/(maxAgts);

          // Calculate the size of each agreement in the display space
          var agtHeight = (height/(yrList.length))-agtPadding;

          // Set up the x axis
          var minYear = d3.min(data,function(d){ return parseYear(d.Year-1); });
          var maxYear = d3.max(data,function(d){ return parseYear(d.Year+1); });
          var y = d3.scaleTime()
                      .domain([minYear,maxYear])  // data space
                      .range([margin.top,height]);  // display space

          // Define the full timeline chart SVG element
          var svg = d3.select("body").select("#chartA").append("svg")
              .attr("height", height + (margin.top*8) + margin.bottom)
              .attr("width", width + margin.left + margin.right)
              .attr("class","A");

          // Define the color scale for agreement stages
          var stageColors = ["#377eb8","#ffff33","#ff7f00","#4daf4a","#e41a1c","#a65628","#984ea3"];   //from: http://colorbrewer2.org/#type=qualitative&scheme=Set1&n=7
          var stageValues = ["Pre", "SubPar", "SubComp", "Imp", "Cea", "Other", "FrCons"];

          for (year = 0; year < yrList.length; year++){
            var chartGroup = svg.append("g")
                        .attr("class","chartGroup") //
                        .attr("transform","translate("+margin.left+","+margin.top+")")

            var rects = chartGroup.selectAll("rects.agt")
                .data(years[year].values)
              .enter().append("rect")
              .filter(function(d){ return pickAgtCon(d); })
              .filter(function(d){ return setVertAgtFilters(d); })
                .attr("class","agt")
                .attr("id",function(d){ return d.AgtId; })
                .attr("name",function(d){ return d.Agt; })
                .attr("value",function(d){ return d.Year; })
                .attr("fill", function(d){ return getStageFill(d, stageValues, stageColors); })//"black")
                .attr("stroke","#c4c4c4")  // same as html background-color
                .attr("stroke-width","1px")
                .style("opacity", "0.7")
                .attr("x",function(d,i){ return (yWidth+margin.left+((agtWidth)*(i*agtSpacing)))+"px"; })
                .attr("y", function(d){ return y(parseYear(d.Year)) - (agtHeight/2) + (margin.top*7); })
                .attr("width", agtWidth+"px")
                .attr("height", agtHeight+"px");

            rects.on("mousemove",function(d){
                  // Get core agreement information (name, date, region, country/entity, status, type & stage)
                  agt = d.Agt;
                  dat = formatDate(d.Dat);
                  reg = d.Reg;
                  con = d.Con;
                  status = d.Status;
                  agtp = d.Agtp;
                  stage = d.Stage;
                  substage = d.StageSub;
                  // Display core information in tooltip
                  this.style.fill = "#ffffff";
                  tooltip.style("opacity","0.9")
                    .style("left", (d3.event.pageX/2)+"px")
                    .style("top", (d3.event.pageY)+"px")
                    .style("background","#ffffff")
                    .style("padding","10px")
                    .attr("class","tooltip");
                  tooltip.html("<p><em>"+agt+"</em><br/><br/><b>Date Signed:</b> "+dat+"<br/><b>Region:</b> "+reg+"</br><b>Country/Entity:</b> "+con+"<br/><b>Status:</b> "+status+"<br/><b>Type:</b> "+agtp+"<br/><b>Stage:</b> "+stage+"<br/><b>Substage:</b> "+substage);
                 });
            rects.on("mouseout",function(d) {
                   this.style.fill = getStageFill(d, stageValues, stageColors) //"black"
                   this.style.stroke = "#c4c4c4"
                   tooltip.style("opacity","0");
                 });
          }

          /*
          TIMELINE DESCRIPTION
          */
          chartGroup.append("text")
                      .attr("x","0px")
                      .attr("y", margin.top*2)
                      .attr("class","description")
                      .text("Country/Entity: "+(localStorage.getItem("paxVertConA")));
          chartGroup.append("text")
                      .attr("x", "0px")
                      .attr("y", margin.top*5)
                      .attr("class","description")
                      .text("Selected Codes: "+String(getCodeCount()));

          /*
          DRAW Y AXIS
          */
          var yAxis = d3.axisLeft(y).tickFormat(d3.timeFormat("%Y")).tickPadding([5]);

          var gY = chartGroup.append("g")
               .attr("class","yaxis")
               .attr("transform","translate("+(yWidth+margin.left)+","+(margin.top*7)+")") //(height-xHeight-margin.bottom)+
               .call(yAxis);

          /*
          FUNCTIONS
          */
          function getCodeCount(){
            var codeFilters = [+paxHrFra, +paxHrGen, +paxPol, +paxEps, +paxMps, +paxPolps, +paxTerps, +paxTjMech, +paxGeWom];
            var codeFilterCount = codeFilters.length;
            var codeText = 0;
            for (i = 0; i < codeFilterCount; i++){
              if (codeFilters[i] > 0){ codeText += 1; }
            } return codeText;
          }

          function pickAgtCon(d){
            var con = String(localStorage.getItem("paxVertConA"));
            var agmtCon = String(d.Con);
            if (agmtCon.includes(con)){
             return d;
            }
          }

          function setVertAgtFilters(d){
            var agmtCodes = [d.GeWom, d.HrFra, d.HrGen, d.Eps, d.Mps, d.Pol, d.Polps, d.Terps, d.TjMech];
            var codeFilters = [+paxGeWom, +paxHrFra, +paxHrGen, +paxEps, +paxMps, +paxPol, +paxPolps, +paxTerps, +paxTjMech];
            var codeFilterCount = codeFilters.length;
            if (paxANY == 1){
             for (i = 0; i < codeFilterCount; i++){
               if ((+codeFilters[i] == 1) && (+agmtCodes[i] > 0)){
                 return d;
               }
             }
            } else { // if paxALL == 1
             var mismatch = false;
             for (j = 0; j < codeFilterCount; j++){
               if ((+codeFilters[j] == 1) && (+agmtCodes[j] == 0)){
                 mismatch = true;
               }
             }
             if (!mismatch){
               return d;
             }
            }
          }

          function getStageFill(d, stageValues, stageColors){
            // d.StageSub value to color: "FrCons"
            // d.Stage possible values to color: "Pre", "SubPar", "SubComp", "Imp", "Cea", "Other"
            if (d.StageSub == stageValues[6]){ //"FrCons"
             return stageColors[6];
            } else {
             var stageI = stageValues.indexOf(d.Stage);
             if (stageI != -1){
               return stageColors[stageI];
             } else {
               return "black";
             }
            }
          }

      }) // end of .get(error,data)

  }; // end of callFunction()