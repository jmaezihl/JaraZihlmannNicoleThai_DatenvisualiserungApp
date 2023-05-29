/**
 * initiale Einrichtung der Karte
 * für die weitere Aktualisierung der Webseite können Sie weiterhin die thurgau.geojson verwenden 
 * stellen Sie aber sicher, dass Sie die sk-stat-70.csv mit der neuen csv-Datei, die geladen werden soll, aktualisieren
 * WICHTIG: Stellen Sie auch sicher, dass Sie die gleichen Spaltennamen für die csv-Datei verwenden, die in der ursprünglichen Datei verwendet wurden.
 * Aktualisieren Sie Funktion updateMap() mit den neuen Spaltennamen und der neuen csv-Datei.
 * Vergessen Sie auch nicht, Dropdown-Elemente in der Datei index.hmtl hinzuzufügen, wenn Sie Daten für zusätzliche Jahre hinzufügen.
 * 
 */
const svg1 = d3.select("#my_dataviz1"),
	width1 = svg1.attr("width"),
	height1 = svg1.attr("height"),
	path = d3.geoPath(),
	data = new Map(),
	thurgau = "thurgau.geojson",
	tax = "./data/sk-stat-69.csv";

let centered, thurgauMap;
let selectedYear = "2022"; //  Standardjahr auf 2022 setzen


// Geografische Projektion und Skalierung
const projection = d3.geoMercator()
  .scale(28000)
  .center([9.073125,47.552858])
  .translate([width1 / 2, height1 / 2]);

// Farbskala 
const colorScale = d3.scaleThreshold()
	.domain([45,50, 55, 60, 65, 70, 75, 80, 85])
	.range(['forestgreen','yellowgreen', 'palegreen','mediumseagreen', 'moccasin','salmon','indianred', 'firebrick','tomato' ,'red']);

// Tooltip hinzufügen
const tooltip = d3.select("body").append("div")
	.attr("class", "tooltip")
	.style("opacity", 0);

// externe Daten laden und booten
Promise.all([
  d3.json(thurgau),
  d3.csv(tax, function(d) {
    data.set(d.GEMEINDE_NAME, +d.Gemeindesteuerfuss);
  })
])
  .then(function([topo, population]) {
    ready(null, topo);
    console.log("Topo JSON data:", topo);

  })
  .catch(function(error) {
    console.error("Error loading data:", error);
  });


// Klickbarer Hintergrund 
svg1.append("rect")
  .attr("class", "background")
	.attr("width", width1)
	.attr("height", height1)
	.on("click", click);


// ----------------------------
//Start der Choropleth "Zeichung"
// ----------------------------

function ready(error, topo) {

  //Variabel zur Aufnahme der neusten Daten
  let currentData = {};


// Abrufen des Dropdown-Menüs und Hinzufügen eines Ereignis-Listeners 
const dropdownMenu = document.querySelector(".dropdown-menu");
dropdownMenu.addEventListener("click", handleDropdownSelection);

// Funktion Auswahl Dropdown Menü
function handleDropdownSelection(event) {
  event.preventDefault();


// Abrufen des Textes der ausgewählten Schaltfläche
  const selectedText = event.target.textContent;

  // Aktualisieren des Textes der Schaltfläche mit dem ausgewählten Text
  const button = document.querySelector(".dropdown-toggle");
  button.textContent = selectedText;

  // Abrufen des ausgewählten Jahres aus dem data-year des angeklickten Dropdown-Elements
  const selectedYear = event.target.getAttribute("data-year");


}
// Aktualisieren des Textes der Schaltfläche mit dem ausgewählten Text
const button = document.querySelector(".dropdown-toggle");
button.textContent = selectedYear;

// Hinzufügen Eventlisener und Dropdownmenü
d3.selectAll(".dropdown-item").on("click", function () {
  const selectedYear = d3.select(this).attr("data-year");
  
  updateMap(selectedYear);
});

//Beim ersten Laden die Karte mit 2022 anzeigen
updateMap(selectedYear);

// Funktion zur Aktualisierung der Karte mit den neuen Daten
function updateMap(selectedYear) {
  const csvFile = "./data/sk-stat-69.csv";

  // laden der csv daten
  d3.csv(csvFile, function (d) {
    // Zeilen anhand selectedYear filtern
    return d.Jahr === selectedYear ? { gemeindeName: d.GEMEINDE_NAME, gemeindefuss: +d.Gemeindesteuerfuss } : null;
  }).then(function (filteredData) {
    const newData = new Map();

    // neue daten speicher für tooltip sowie Farben anpassen
    filteredData.forEach(function (d) {
      newData.set(d.gemeindeName, d.gemeindefuss);
      currentData[d.gemeindeName] = d.gemeindefuss;
    });

    thurgauMap.selectAll("path")
      .attr("fill", function (d) {
        d.total = newData.get(d.properties.gemeinde_NAME) || 0;
        return colorScale(d.total);
      });
  }).catch(function (error) {
    console.error("Error loading CSV file:", error);
  });
}





//mouseOver Funktion um Tooltip anzuzeigen wenn man über gemeinde "hovered"


let mouseOver = function(event, d) {
  d3.selectAll(".Commune")
    .transition()
    .duration(200)
    .style("opacity", 0.5)
    .style("stroke", "transparent");
  d3.select(this)
    .transition()
    .duration(200)
    .style("opacity", 1)
    .style("stroke", "black");

    const { pageX, pageY } = event;
    const tooltipOffsetX = 15;
    const tooltipOffsetY = -30;
    const gemeindeName = d.properties.gemeinde_NAME;
    const gemeindefuss = currentData[gemeindeName]; // geupdatete Daten nutzen um Karte einzufärben
    tooltip.style("left", (pageX + tooltipOffsetX) + "px")
      .style("top", (pageY + tooltipOffsetY) + "px")
      .transition()
      .duration(400)
      .style("opacity", 1)
      .text(gemeindeName + ': ' + gemeindefuss + ' %.');
  };



//mouseLeave Funktion um Tooltip zu verstecken wenn man nicht mehr über eine Gemeinde "hovered"


	let mouseLeave = function() {
		d3.selectAll(".Commune")
			.transition()
			.duration(200)
			.style("opacity", 1)
			.style("stroke", "black");
		tooltip.transition().duration(300)
			.style("opacity", 0);
	}


// definieren von zoomverhalten
const zoom = d3.zoom()
  .scaleExtent([1, 8])
  .on("zoom", zoomed);

// zoom auf SVG anwenden
svg1.call(zoom);

// zoomed Funktion wenn zoom aktiv
function zoomed(event) {
  thurgauMap.attr("transform", event.transform);
}


	// Map "zeichen"
	thurgauMap = svg1.append("g")
    .attr("class", "thurgauMap");
	thurgauMap.selectAll("path")
		.data(topo.features)
		.enter()
		.append("path")
		// Gemeinden "zeichnen"
		.attr("d", d3.geoPath().projection(projection))

		//namen der Gemeinden holen
		.attr("data-name", function(d) {
			return d.properties.gemeinde_NAME
		})

		// Farbe der Gemeinden festlegen
		.attr("fill", function(d) {
      d.total = data.get(d.properties.gemeinde_NAME) || 0;
      			return colorScale(d.total);
		})

		// Funktionen, welche bei Mausover/leave ausgeführt werden
		.style("stroke", "black")
		.attr("class", function(d) {
			return "Commune"
		})
		.attr("name", function(d) {
			return d.properties.gemeinde_NAME
		})
		.style("opacity", 1)
		.on("mouseover", mouseOver)
		.on("mouseleave", mouseLeave)
		.on("click", click);
  


    
	// Länge und Breite der Legende definieren
const legendWidth = 200;
const legendHeight = height1;
const ls_w = 20,
		ls_h = 20;

const x = d3.scaleLinear()
		.domain([2.6, 75.1])
		.rangeRound([600, 860]);

// Legendenkoordinaten
const legendX = width + margin.left;
const legendY = margin.top;

// Legendengruppe kreiren
const legend = svg1.append("g")
  .attr("id", "legend")
  .attr("transform", `translate(${legendX}, ${legendY})`);

// Anhängen der Legendeneinträge
const legendEntry = legend.selectAll("g.legend-entry")
  .data(colorScale.range().map(function(d) {
    d = colorScale.invertExtent(d);
    if (d[0] == null) d[0] = x.domain()[0];
    if (d[1] == null) d[1] = x.domain()[1];
    return d;
  }))
  .enter()
  .append("g")
  .attr("class", "legend-entry")
  .attr("transform", function(d, i) {
    return `translate(0, ${i * ls_h})`;
  });

// Anhängen der farbigen Quadrate
legendEntry.append("rect")
  .attr("x", 0)
  .attr("y", 10)
  .attr("dy", "1.5em")
  .attr("width", ls_w)
  .attr("height", ls_h)
  .style("fill", function(d) {
    return colorScale(d[0]);
  })
  .style("opacity", 0.8);

// Legendenbeschriftung anhängen
legendEntry.append("text")
  .attr("x", ls_w + 5)
  .attr("y", ls_h / 2)
  .attr("dy", "1em")
  .text(function(d, i) {
    if (i === 0) return "< " + d[1] + " %";
    if (d[1] < d[0]) return  ((d[0])-1)  + " % <";
    return d[0]  + " % - " + ((d[1])-1)  + " %";
  });

// Legendentitel setzen
legend.append("text")
  .attr("x", 0)
  .attr("y", -margin.top)
  .attr("dy", "1em")
  .style("font-weight", "bold")
  .text("Steuerfuss (%)");

// Grösse des SVG anpassen 
svg1.attr("width", width + margin.left + legendWidth)
  .attr("height", height + margin.top + margin.bottom);
}
const path1 = d3.geoPath().projection(projection);


// Zoom funktionalität
function click(event, d) {
  const [[x0, y0], [x1, y1]] = path1.bounds(d);
  event.stopPropagation();

  if (centered === d) {
    centered = null;

    svg1.transition().duration(750).call(
      zoom.transform,
      d3.zoomIdentity,
      d3.pointer(event, svg1.node())
    );
  } else {
    centered = d;

    svg1.transition().duration(750).call(
      zoom.transform,
      d3.zoomIdentity
        .translate(width1 / 2, height1 / 2)
        .scale(Math.min(8, 0.9 / Math.max((x1 - x0) / width1, (y1 - y0) / height1)))
        .translate(-(x0 + x1) / 2, -(y0 + y1) / 2),
      d3.pointer(event, svg1.node())
    );
  }
}

// Zoom Verhalten definieren
const zoom = d3.zoom()
  .scaleExtent([1, 8])
  .on("zoom", zoomed);

// Anwenden des Zoomverhaltens auf den SVG-Container
svg1.call(zoom);

// Zoom Funktion
function zoomed(event) {
  thurgauMap.attr("transform", event.transform);
}













//initialisieren der Variablen für die folgenden 3 Diagramme
var widthDiag = 500;
var heightDiag = 400;
var marginDiag = 50;
var durationDiag = 100;

var lineOpacityDiag = "0.25";
var lineOpacityHoverDiag = "0.85";
var otherLinesOpacityHoverDiag = "0.1";
var lineStrokeDiag = "1.5px";
var lineStrokeHoverDiag = "2.5px";

var circleOpacityDiag = '0.85';
var circleOpacityOnLineHoverDiag = "0.25"
var circleRadiusDiag = 3;
var circleRadiusHoverDiag = 6;



var parseDate = d3.timeParse("%Y");
//Initialisierung der Daten, die aus der CSV-Datei geladen werden sollen
d3.csv("./data/dataChangeMax.csv").then(function(dataMax) {
  dataMax.forEach(function(d) {
    d.date = parseDate(d.Jahr);
    d.price = +d.Gemeindesteuerfuss;
    d.nameMax = d.GEMEINDE_NAME;
    console.log(d.price); // Werte überprüfen

  });

  //definieren x-Achse
  var xScaleMax = d3.scaleTime()
    .domain(d3.extent(dataMax, d => d.date))
    .range([0, widthDiag - marginDiag]);

  //definieren y-Achse
  var yScaleMax = d3.scaleLinear()
    .domain([0, d3.max(dataMax, d => d.price)])
    .range([heightDiag - marginDiag, 0]);

  var color = d3.scaleOrdinal(d3.schemeCategory10);

  // Anhängen der Karte im svg
  var svgMax = d3.select("#chart").append("svg")
  .attr("width", (widthDiag + marginDiag) + "px")
  .attr("height", (heightDiag + marginDiag) + "px")
  .append('g')
  .attr("transform", `translate(${marginDiag}, ${marginDiag})`);

  var lineMax = d3.line()
  .defined(d => !isNaN(d.price)) // Nan Werte verhindern
    .x(d => xScaleMax(d.date))
    .y(d => yScaleMax(d.price));

  let linesMax = svgMax.append('g')
    .attr('class', 'lines');

  var dataGroupMax = d3.group(dataMax, d => d.GEMEINDE_NAME);

  //Gruppe von Linien bilden
  linesMax.selectAll('.line-group')
  .data(Array.from(dataGroupMax.entries()))
  .enter()
  .append('g')
  .attr('id', function(d, i) {
    return "line-" + i;
  })
  .attr('class', 'line-group')
  .on("mouseover", function(d, i) {
  svgMax.append("text")
    .attr("class", "title-text")
    .style("fill", color(i))
    .text(d[0]) 
    .attr("text-anchor", "middle")
    .attr("x", (widthDiag - marginDiag) / 2)
    .attr("y", 5);
  
  // Die Hervorhebung des entsprechenden Legendenelements
  legendItems
    .filter((_, index) => index === i)
    .classed("legend-highlight", true);
})
.on("mouseout", function(d, i) {
  svgMax.select(".title-text").remove();
  
  // Die Hervorhebung des entsprechenden Legendenelements zurücksetzen
  legendItems
    .filter((_, index) => index === i)
    .classed("legend-highlight", false);
})
//Linie hinzufügen und Hover Effekte
  .append('path')
  .attr('class', 'line')
  .attr('d', d => lineMax(d[1]))
  .style('stroke', (d, i) => color(i))
  .style('opacity', lineOpacityDiag)
  .on("mouseover", function(d) {
    d3.selectAll('.line')
      .style('opacity', otherLinesOpacityHoverDiag);
    d3.selectAll('.circle')
      .style('opacity', circleOpacityOnLineHoverDiag);
    d3.select(this)
      .style('opacity', lineOpacityHoverDiag)
      .style("stroke-width", lineStrokeHoverDiag)
      .style("cursor", "pointer");
  })
  .on("mouseout", function(d) {
    d3.selectAll(".line")
      .style('opacity', lineOpacityDiag);
    d3.selectAll('.circle')
      .style('opacity', circleOpacityDiag);
    d3.select(this)
      .style("stroke-width", lineStrokeDiag)
      .style("cursor", "none");
  });
//Punkte auf den Linien im Koordinatensystem, welche anklickbar sind
  linesMax.selectAll("circle-group")
    .data(Array.from(dataGroupMax.entries()))
    .enter()
    .append("g")
    .attr('id', function(d, i) {
      return "circle-" + i;
    })
    .style("fill", (d, i) => color(i))
    .selectAll("circle")
    .data(d => d[1])
    .enter()
    .append("g")
    .attr("class", "circle")
    .on("mouseover", function(d) {
      d3.select(this)
        .style("cursor", "pointer")
        .append("text")
        .attr("class", "text")
        .text(d => d.price)
        .attr("x", d => xScaleMax(d.date) + 5)
        .attr("y", d => yScaleMax(d.price) - 10);
    })
    .on("mouseout", function(d) {
      d3.select(this)
        .style("cursor", "none")
        .transition()
        .duration(durationDiag)
        .selectAll(".text").remove();
    })
    //Kreise anfügen und definieren Hover Effekt
    .append("circle")
    .attr("cx", d => xScaleMax(d.date))
    .attr("cy", d => yScaleMax(d.price))
    .attr("r", circleRadiusDiag)
    .style('opacity', circleOpacityDiag)
    .on("mouseover", function(d) {
      d3.select(this)
        .transition()
        .duration(durationDiag)
        .attr("r", circleRadiusHoverDiag);
    })
    .on("mouseout", function(d) {
      d3.select(this)
        .transition()
        .duration(durationDiag)
        .attr("r", circleRadiusDiag);
    });

  // Achsen deklarieren und svg anfügen
  var xAxisMax = d3.axisBottom(xScaleMax).ticks(5);
  var yAxisMax = d3.axisLeft(yScaleMax).ticks(5);

  svgMax.append("g")
  .attr("class", "x axis")
  .attr("transform", `translate(0, ${heightDiag - marginDiag})`)
  .call(xAxisMax);

  svgMax.append("g")
    .attr("class", "y axis")
    .call(yAxisMax)
    .append('text')
    .attr("y", 15)
    .attr("transform", "rotate(-90)")
    .attr("fill", "#000");

    var yAxisLabel = svgMax.append("text")
  .attr("class", "y-axis-label")
  .attr("x", -heightDiag / 2)
  .attr("y", -marginDiag / 2)
  .attr("transform", "rotate(-90)")
  .attr("text-anchor", "middle")
  .attr("fill", "#000")
  .text("Gemeindesteuerfuss (%)");






  //Definieren einer Legende
  var legendMax = svgMax.append("g")
  .attr("class", "legend")
  .attr("transform", `translate(${widthDiag - marginDiag -70}, 0)`); // Angepasste Übersetzung für die Position der Legende auf der rechten Seite


var legendSpacing = 20;
//Definieren und Anhängen der Achsen
var legendItems = legendMax.selectAll(".legend-item")
  .data(Array.from(dataGroupMax.entries()))
  .enter()
  .append("g")
  .attr("class", "legend-item")
  .attr("transform", function(d, i) {
    return `translate(0, ${i * legendSpacing})`;
  });

legendItems.append("rect")
  .attr("x", 0)
  .attr("y", -10)
  .attr("width", 10)
  .attr("height", 10)
  .style("fill", function(d, i) {
    return color(i);
  });

legendItems.append("text")
  .attr("x", 20)
  .attr("y", 0)
  .text(function(d) {
    return d[0];
  })
  .style("fill", function(d, i) {
    return color(i);
  });
});



var parseDate = d3.timeParse("%Y");

d3.csv("./data/dataConst.csv").then(function(dataConst) {
  dataConst.forEach(function(d) {
    d.date = parseDate(d.Jahr);
    d.price = +d.Gemeindesteuerfuss;
    d.nameConst = d.GEMEINDE_NAME;
    console.log(d.price); // Werte überprüfen

  });

  var xScaleConst = d3.scaleTime()
    .domain(d3.extent(dataConst, d => d.date))
    .range([0, widthDiag - marginDiag]);

  var yScaleConst = d3.scaleLinear()
    .domain([0, d3.max(dataConst, d => d.price)+30])
    .range([heightDiag - marginDiag, +30]);

  var color = d3.scaleOrdinal(d3.schemeCategory10);

  var svgConst = d3.select("#chartConst").append("svg")
  .attr("width", (widthDiag + marginDiag) + "px")
  .attr("height", (heightDiag + marginDiag) + "px")
  .append('g')
  .attr("transform", `translate(${marginDiag}, ${marginDiag})`);

  var lineConst = d3.line()
  .defined(d => !isNaN(d.price)) // Nan Werte verhindern
    .x(d => xScaleConst(d.date))
    .y(d => yScaleConst(d.price));

  let linesConst = svgConst.append('g')
    .attr('class', 'lines');

  var dataGroupConst = d3.group(dataConst, d => d.GEMEINDE_NAME);

  linesConst.selectAll('.line-group')
  .data(Array.from(dataGroupConst.entries()))
  .enter()
  .append('g')
  .attr('id', function(d, i) {
    return "line-" + i;
  })
  .attr('class', 'line-group')
  .on("mouseover", function(d, i) {
  svgConst.append("text")
    .attr("class", "title-text")
    .style("fill", color(i))
    .text(d[0]) 
    .attr("text-anchor", "middle")
    .attr("x", (widthDiag - marginDiag) / 2)
    .attr("y", 5);
  
  // Suchen des entsprechende Legendenelement und einer Klasse hinzufügen, um es hervorzuheben
  legendItems
    .filter((_, index) => index === i)
    .classed("legend-highlight", true);
})
.on("mouseout", function(d, i) {
  svgConst.select(".title-text").remove();
  
  //Zurücksetzen der Hervorhebung des entsprechenden Legendenelements
  legendItems
    .filter((_, index) => index === i)
    .classed("legend-highlight", false);
})
  .append('path')
  .attr('class', 'line')
  .attr('d', d => lineConst(d[1]))
  .style('stroke', (d, i) => color(i))
  .style('opacity', lineOpacityDiag)
  .on("mouseover", function(d) {
    d3.selectAll('.line')
      .style('opacity', otherLinesOpacityHoverDiag);
    d3.selectAll('.circle')
      .style('opacity', circleOpacityOnLineHoverDiag);
    d3.select(this)
      .style('opacity', lineOpacityHoverDiag)
      .style("stroke-width", lineStrokeHoverDiag)
      .style("cursor", "pointer");
  })
  .on("mouseout", function(d) {
    d3.selectAll(".line")
      .style('opacity', lineOpacityDiag);
    d3.selectAll('.circle')
      .style('opacity', circleOpacityDiag);
    d3.select(this)
      .style("stroke-width", lineStrokeDiag)
      .style("cursor", "none");
  });

  linesConst.selectAll("circle-group")
    .data(Array.from(dataGroupConst.entries()))
    .enter()
    .append("g")
    .attr('id', function(d, i) {
      return "circle-" + i;
    })
    .style("fill", (d, i) => color(i))
    .selectAll("circle")
    .data(d => d[1])
    .enter()
    .append("g")
    .attr("class", "circle")
    .on("mouseover", function(d) {
      d3.select(this)
        .style("cursor", "pointer")
        .append("text")
        .attr("class", "text")
        .text(d => d.price)
        .attr("x", d => xScaleConst(d.date) + 5)
        .attr("y", d => yScaleConst(d.price) - 10);
    })
    .on("mouseout", function(d) {
      d3.select(this)
        .style("cursor", "none")
        .transition()
        .duration(durationDiag)
        .selectAll(".text").remove();
    })
    .append("circle")
    .attr("cx", d => xScaleConst(d.date))
    .attr("cy", d => yScaleConst(d.price))
    .attr("r", circleRadiusDiag)
    .style('opacity', circleOpacityDiag)
    .on("mouseover", function(d) {
      d3.select(this)
        .transition()
        .duration(durationDiag)
        .attr("r", circleRadiusHoverDiag);
    })
    .on("mouseout", function(d) {
      d3.select(this)
        .transition()
        .duration(durationDiag)
        .attr("r", circleRadiusDiag);
    });

  var xAxisConst = d3.axisBottom(xScaleConst).ticks(5);
  var yAxisConst = d3.axisLeft(yScaleConst).ticks(5);

  svgConst.append("g")
  .attr("class", "x axis")
  .attr("transform", `translate(0, ${heightDiag - marginDiag})`)
  .call(xAxisConst);

  svgConst.append("g")
    .attr("class", "y axis")
    .call(yAxisConst)
    .append('text')
    .attr("y", 15)
    .attr("transform", "rotate(-90)")
    .attr("fill", "#000");

    var yAxisLabel = svgConst.append("text")
  .attr("class", "y-axis-label")
  .attr("x", -heightDiag / 2)
  .attr("y", -marginDiag / 2)
  .attr("transform", "rotate(-90)")
  .attr("text-anchor", "middle")
  .attr("fill", "#000")
  .text("Gemeindesteuerfuss (%)");






  
  var legendConst = svgConst.append("g")
  .attr("class", "legend")
  .attr("transform", `translate(${widthDiag - marginDiag -70}, 0)`); 


var legendSpacing = 20;

var legendItems = legendConst.selectAll(".legend-item")
  .data(Array.from(dataGroupConst.entries()))
  .enter()
  .append("g")
  .attr("class", "legend-item")
  .attr("transform", function(d, i) {
    return `translate(0, ${i * legendSpacing})`;
  });

legendItems.append("rect")
  .attr("x", 0)
  .attr("y", -10)
  .attr("width", 10)
  .attr("height", 10)
  .style("fill", function(d, i) {
    return color(i);
  });

legendItems.append("text")
  .attr("x", 20)
  .attr("y", 0)
  .text(function(d) {
    return d[0];
  })
  .style("fill", function(d, i) {
    return color(i);
  });
});











/**
 * 
 * JS für Koordinatensystem, wo die Steuern zugenommen haben
 * */



var parseDate = d3.timeParse("%Y");

d3.csv("./data/dataAdd.csv").then(function(dataAdd) {
  dataAdd.forEach(function(d) {
    d.date = parseDate(d.Jahr);
    d.price = +d.Gemeindesteuerfuss;
    d.nameAdd = d.GEMEINDE_NAME;
    console.log(d.price); // Werte überprüfen

  });

  var xScaleAdd = d3.scaleTime()
    .domain(d3.extent(dataAdd, d => d.date))
    .range([0, widthDiag - marginDiag]);

  var yScaleAdd = d3.scaleLinear()
    .domain([0, d3.max(dataAdd, d => d.price)+30])
    .range([heightDiag - marginDiag, +30]);

  var color = d3.scaleOrdinal(d3.schemeCategory10);

  var svgAdd = d3.select("#chartAdd").append("svg")
  .attr("width", (widthDiag + marginDiag) + "px")
  .attr("height", (heightDiag + marginDiag) + "px")
  .append('g')
  .attr("transform", `translate(${marginDiag}, ${marginDiag})`);

  var lineAdd = d3.line()
  .defined(d => !isNaN(d.price)) // <NaN Werte herausfiltern>
    .x(d => xScaleAdd(d.date))
    .y(d => yScaleAdd(d.price));

  let linesAdd = svgAdd.append('g')
    .attr('class', 'lines');

  var dataGroupAdd = d3.group(dataAdd, d => d.GEMEINDE_NAME);

  linesAdd.selectAll('.line-group')
  .data(Array.from(dataGroupAdd.entries()))
  .enter()
  .append('g')
  .attr('id', function(d, i) {
    return "line-" + i;
  })
  .attr('class', 'line-group')
  .on("mouseover", function(d, i) {
  svgAdd.append("text")
    .attr("class", "title-text")
    .style("fill", color(i))
    .text(d[0]) 
    .attr("text-anchor", "middle")
    .attr("x", (widthDiag - marginDiag) / 2)
    .attr("y", 5);
  
  // Suchen des entsprechende Legendenelement und einer Klasse hinzufügen, um es hervorzuheben
  legendItems
    .filter((_, index) => index === i)
    .classed("legend-highlight", true);
})
.on("mouseout", function(d, i) {
  svgAdd.select(".title-text").remove();
  
  // Zurücksetzen der Hervorhebung des entsprechenden Legendenelements
  legendItems
    .filter((_, index) => index === i)
    .classed("legend-highlight", false);
})
  .append('path')
  .attr('class', 'line')
  .attr('d', d => lineAdd(d[1]))
  .style('stroke', (d, i) => color(i))
  .style('opacity', lineOpacityDiag)
  .on("mouseover", function(d) {
    d3.selectAll('.line')
      .style('opacity', otherLinesOpacityHoverDiag);
    d3.selectAll('.circle')
      .style('opacity', circleOpacityOnLineHoverDiag);
    d3.select(this)
      .style('opacity', lineOpacityHoverDiag)
      .style("stroke-width", lineStrokeHoverDiag)
      .style("cursor", "pointer");
  })
  .on("mouseout", function(d) {
    d3.selectAll(".line")
      .style('opacity', lineOpacityDiag);
    d3.selectAll('.circle')
      .style('opacity', circleOpacityDiag);
    d3.select(this)
      .style("stroke-width", lineStrokeDiag)
      .style("cursor", "none");
  });

  linesAdd.selectAll("circle-group")
    .data(Array.from(dataGroupAdd.entries()))
    .enter()
    .append("g")
    .attr('id', function(d, i) {
      return "circle-" + i;
    })
    .style("fill", (d, i) => color(i))
    .selectAll("circle")
    .data(d => d[1])
    .enter()
    .append("g")
    .attr("class", "circle")
    .on("mouseover", function(d) {
      d3.select(this)
        .style("cursor", "pointer")
        .append("text")
        .attr("class", "text")
        .text(d => d.price)
        .attr("x", d => xScaleAdd(d.date) + 5)
        .attr("y", d => yScaleAdd(d.price) - 10);
    })
    .on("mouseout", function(d) {
      d3.select(this)
        .style("cursor", "none")
        .transition()
        .duration(durationDiag)
        .selectAll(".text").remove();
    })
    .append("circle")
    .attr("cx", d => xScaleAdd(d.date))
    .attr("cy", d => yScaleAdd(d.price))
    .attr("r", circleRadiusDiag)
    .style('opacity', circleOpacityDiag)
    .on("mouseover", function(d) {
      d3.select(this)
        .transition()
        .duration(durationDiag)
        .attr("r", circleRadiusHoverDiag);
    })
    .on("mouseout", function(d) {
      d3.select(this)
        .transition()
        .duration(durationDiag)
        .attr("r", circleRadiusDiag);
    });

  var xAxisAdd = d3.axisBottom(xScaleAdd).ticks(5);
  var yAxisAdd = d3.axisLeft(yScaleAdd).ticks(5);

  svgAdd.append("g")
  .attr("class", "x axis")
  .attr("transform", `translate(0, ${heightDiag - marginDiag})`)
  .call(xAxisAdd);

  svgAdd.append("g")
    .attr("class", "y axis")
    .call(yAxisAdd)
    .append('text')
    .attr("y", 15)
    .attr("transform", "rotate(-90)")
    .attr("fill", "#000");

    var yAxisLabel = svgAdd.append("text")
  .attr("class", "y-axis-label")
  .attr("x", -heightDiag / 2)
  .attr("y", -marginDiag / 2)
  .attr("transform", "rotate(-90)")
  .attr("text-anchor", "middle")
  .attr("fill", "#000")
  .text("Gemeindesteuerfuss (%)");






  
  var legendAdd = svgAdd.append("g")
  .attr("class", "legend")
  .attr("transform", `translate(${widthDiag - marginDiag -150}, 0)`); 


var legendSpacing = 20;

var legendItems = legendAdd.selectAll(".legend-item")
  .data(Array.from(dataGroupAdd.entries()))
  .enter()
  .append("g")
  .attr("class", "legend-item")
  .attr("transform", function(d, i) {
    return `translate(0, ${i * legendSpacing})`;
  });

legendItems.append("rect")
  .attr("x", 0)
  .attr("y", -10)
  .attr("width", 10)
  .attr("height", 10)
  .style("fill", function(d, i) {
    return color(i);
  });

legendItems.append("text")
  .attr("x", 20)
  .attr("y", 0)
  .text(function(d) {
    return d[0];
  })
  .style("fill", function(d, i) {
    return color(i);
  });
});




           
// Dimensionen setzen für Koordinatensystem aus D3 Dokumentation
const margin = {top: 10, right: 30, bottom: 30, left: 60},
    width = 460 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

// svg einfügen
const svg = d3.select("#my_dataviz")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

//Daten einfügen
d3.csv("./data/sk-stat-69.csv").then( function(data) {

    
    const allGroup = new Set(data.map(d => d.GEMEINDE_NAME))

    // Optionen hinzufügen
    d3.select("#selectButton")
      .selectAll('myOptions')
     	.data(allGroup)
      .enter()
    	.append('option')
      .text(function (d) { return d; }) // im Menü angezeigter Text
      .attr("value", function (d) { return d; }) // entsprechender Wert, der von der Schaltfläche zurückgegeben wird

    // Eine Farbskala: eine Farbe für jede Gruppe
    const myColor = d3.scaleOrdinal()
      .domain(allGroup)
      .range(d3.schemeSet2);

    // X-Achse hinzufügen --> es handelt sich um ein Datumsformat
    const x = d3.scaleLinear()
      .domain(d3.extent(data, function(d) { return d.Jahr; }))
      .range([ 0, width ]);
    svg.append("g")
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(x).ticks(7));

    // Y-Achse hinzufügen 
    const y = d3.scaleLinear()
      .domain([0, d3.max(data, function(d) { return +d.Gemeindesteuerfuss; })])
      .range([ height, 0 ]);
    svg.append("g")
      .call(d3.axisLeft(y));

    // Zeile mit der ersten Gruppe der Liste initialisieren
    const line = svg
      .append('g')
      .append("path")
        .datum(data.filter(function(d){return d.GEMEINDE_NAME=="Affeltrangen"}))
        .attr("d", d3.line()
          .x(function(d) { return x(d.Jahr) })
          .y(function(d) { return y(+d.Gemeindesteuerfuss) })
        )
        .attr("stroke", function(d){ return myColor("valueA") })
        .style("stroke-width", 4)
        .style("fill", "none")

    // Funktion um Diagramm zu aktualisieren
    function update(selectedGroup) {

      
      const dataFilter = data.filter(function(d){return d.GEMEINDE_NAME==selectedGroup})

      // Neue Daten für die Aktualisierung der Zeile
      line
          .datum(dataFilter)
          .transition()
          .duration(1000)
          .attr("d", d3.line()
            .x(function(d) { return x(d.Jahr) })
            .y(function(d) { return y(+d.Gemeindesteuerfuss) })
          )
          .attr("stroke", function(d){ return myColor(selectedGroup) })
    }

    // Wenn die Schaltfläche (der Button Dropdown) geändert wird, führt es  die Funktion updateChart aus
    d3.select("#selectButton").on("change", function(event,d) {
        // die gewählte Option herstellen
        const selectedOption = d3.select(this).property("value")
        // Führen Sie die Funktion updateChart mit dieser ausgewählten Option aus
        update(selectedOption)
    })

})






