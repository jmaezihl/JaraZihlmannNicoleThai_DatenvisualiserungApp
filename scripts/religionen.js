
/**
 * initiale Einrichtung der Karte
 * für die weitere Aktualisierung der Webseite können Sie weiterhin  thurgau.geojson verwenden 
 * stellen Sie aber sicher, dass Sie die sk-stat-70.csv mit der neuen csv-Datei, die geladen werden soll, aktualisieren
 * WICHTIG: Stellen Sie auch sicher, dass Sie die gleichen Spaltennamen für die csv-Datei verwenden, die in der ursprünglichen Datei verwendet wurden.
 * Aktualisieren Sie Funktion updateMap() mit den neuen Spaltennamen und der neuen csv-Datei.
 * Vergessen Sie auch nicht, Dropdown-Elemente in der Datei index.hmtl hinzuzufügen, wenn Sie Daten für zusätzliche Jahre hinzufügen.
 * 
 */
const svg1 = d3.select("#map"),
	width1 = svg1.attr("width"),
	height1 = svg1.attr("height"),
	path = d3.geoPath(),
	data = new Map()
	thurgau = "thurgau.geojson",
	tax = "./data/sk-stat-70.csv";

let centered, thurgauMap;
let selectedYear = "2023"; // Setzte Standardjahr auf 2023


const margin = {top: 10, right: 30, bottom: 30, left: 60},
    width = 460 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

// Style der Karte und anfänglicher zoom der Karte
const projection = d3.geoMercator()
  .scale(28000)
  .center([9.073125,47.552858])
  .translate([width1 / 2, height1 / 2]);

// Farbschema
const colorScale = d3.scaleThreshold()
	.domain([245, 255, 260, 265, 270, 275, 285, 295, 305, 315, 325, 335, 345, 355])
	.range(['lime','limegreen','forestgreen','yellowgreen', 'palegreen','mediumseagreen','lightyellow','mistyrose', 'moccasin','salmon','darksalmon','indianred', 'firebrick', 'darkred','red']);

// Tooltip hinzufügen
const tooltip = d3.select("body").append("div")
	.attr("class", "tooltip")
	.style("opacity", 0);

// Daten wie Karte und csv laden
Promise.all([
  d3.json(thurgau),
  d3.csv(tax, function(d) {
    data.set(d.GEMEINDE_NAME, +d.Gemeindesteuerfuss_kath);
    gemeindefuss = +d.Gemeindesteuerfuss_kath;
  })
])
  .then(function([topo, population]) {
    ready(null, topo);
    console.log("Topo JSON data:", topo);

  })
  .catch(function(error) {
    console.error("Error loading data:", error);
  });


// klickbaren hintergrund
svg1.append("rect")
  .attr("class", "background")
	.attr("width", width1)
	.attr("height", height1)
	.on("click", click);


// ----------------------------
//Start der Choropleth "Zeichnung"
// ----------------------------

function ready(error, topo) {
  const button = document.querySelector(".dropdown-toggle");
  button.textContent = selectedYear;

// Hinzufügen eines event listener zu den dropdown items

let currentData = {};


// event listener für dropdown menu hinzufügen
const dropdownMenu = document.querySelector(".dropdown-menu");
dropdownMenu.addEventListener("click", handleDropdownSelection);

// Function um dropdown Auswahl zu handhaben
function handleDropdownSelection(event) {
  event.preventDefault();


// Text des ausgewählten Button holen
  const selectedText = event.target.textContent;

  // Button text mit dem Text des ausgewählten Button ersetzen
  const button = document.querySelector(".dropdown-toggle");
  button.textContent = selectedText;

  // selectedYear anhand von data-year des geklickten buttons setzen
  const selectedYear = event.target.getAttribute("data-year");

  // updateMap anhand selectedYear
  updateMap(selectedYear);
}

updateMap(selectedYear);
// buttonGroup als Gruppe der buttons initialisieren
const buttonGroup = document.querySelector(".btn-group");

// Event listener für einen Button Click
buttonGroup.addEventListener("click", function (event) {
  const activeYear = selectedYear; // selectedYear als activeYear setzen
  const activeButtonId = event.target.id; // setzen der ID anhand des activen Buttons
  updateMap(activeYear, activeButtonId); // updateMap mit selectedYear und activeButtonID aufrufen
});


  // Funktion um die Map mit den neuen Daten zu aktualisieren
  function updateMap(year = selectedYear, activeButtonId) {
    selectedYear = year;
    let csvFile;
    const activeButton = document.querySelector(".btn-group input:checked").id;
    const buttonElements = document.querySelectorAll(".btn-group input");
  
    
    if (activeButton === "option1") {
      csvFile = "./data/sk-stat-70.csv";
    } else if (activeButton === "option2") {
      csvFile = "./data/sk-stat-70.csv";
    } else if (activeButton === "option4") {
      csvFile = "./data/sk-stat-70.csv";
    }



  
    d3.csv(csvFile)
      .then(function (data) {
        const newData = new Map();
  
        // Filtern der Daten anhand von selectedYear
        const filteredData = data.filter(function (d) {
          return d.Jahr === selectedYear;
        });
  
        // Verabreiten der gefilterten Daten
        filteredData.forEach(function (d) {
          const gemeindeName = d.GEMEINDE_NAME;
          let gemeindefuss;
  
          // anpassen anhand der radioButtons welche Spalte der Daten gewählt werden soll
          if (activeButton === "option1") {
            gemeindefuss = +d.Gesamtsteuerfuss_kath;
          } else if (activeButton === "option2") {
            gemeindefuss = +d.Gesamtsteuerfuss_evang;
          }  else if (activeButton === "option4") {
            gemeindefuss = +d.Gesamtsteuerfuss_JP;
          }
  
          // Loggen der Daten zur Fehlererkennung
          console.log(gemeindeName, gemeindefuss);
  
          newData.set(gemeindeName, gemeindefuss);
          currentData[gemeindeName] = gemeindefuss;
        });
  
        // updaten der Karten anhand der neuen Daten
        thurgauMap.selectAll("path")
          .attr("fill", function (d) {
            d.total = newData.get(d.properties.gemeinde_NAME) || 0;
            return colorScale(d.total);
          });
  
      })
      .catch(function (error) {
        console.error("Error loading CSV file:", error);
      });
  }
  

  
  // Event listener für einen button klick
  buttonGroup.addEventListener("click", function (event) {
    const activeYear = selectedYear; // selectedYear als activeYear setzen
    const activeButtonId = event.target.id; // activeButtonId anhand der ID de geklickten Buttons setzen
  
    // updateMap Funktion mit activeYear und activeButtonID aufrufen
    updateMap(activeYear, activeButtonId);
  });
  
  
  
  
  
  



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
    const gemeindefuss = currentData[gemeindeName]; // neue Daten nutzen
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



// definieren von Zoomverhalten
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

		//Namen der Gemeinden holen
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
    if (i === 0) return "< " + ((d[1])-1) + " %";
    if (d[1] < d[0]) return d[0] + " % <";
    return d[0] + " % - " + ((d[1])-1) + " %";
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