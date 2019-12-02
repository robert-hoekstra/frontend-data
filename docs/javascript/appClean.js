// setup api url and query
const url =
  "https://api.data.netwerkdigitaalerfgoed.nl/datasets/ivo/NMVW/services/NMVW-27/sparql";
const query = `
    PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX dc: <http://purl.org/dc/elements/1.1/>
    PREFIX dct: <http://purl.org/dc/terms/>
    PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
    PREFIX edm: <http://www.europeana.eu/schemas/edm/>
    PREFIX foaf: <http://xmlns.com/foaf/0.1/>
    SELECT * 
    WHERE {
        <https://hdl.handle.net/20.500.11840/termmaster1397> skos:narrower* ?type .
        ?type skos:prefLabel ?typeLabel.
        ?cho edm:object ?type.
        # ?cho dc:title ?title.
        # FILTER langMatches(lang(?title), "ned")

        # kijk of het woord portret voorkomt in de title of de description
                ?cho (dc:title | dc:description) ?beschrijving.   
                FILTER(REGEX(?beschrijving, "portret"))  
            

                # Geef evt. een verwijzing naar het plaatje als het er is
                OPTIONAL {
                    ?cho dc:title ?titel.
                    ?cho dct:created ?date.
                    ?cho foaf:depiction ?imgLink.

                }

            }LIMIT 600`;

const fetchData = d3
  .json(url + "?query=" + encodeURIComponent(query) + "&format=json")
  .then(function(data) {
    console.log(data);
    return data.results.bindings;
  });

fetchData.then(function(data) {
  // Check if properties contain images.
  let gallery = data.filter(obj => Object.keys(obj).includes("imgLink"));
  // Delete properties that are not needed
  gallery.forEach(element => {
    delete element.cho;
    delete element.type;
    delete element.typeLabel;
  });
  // Clean date to uniform
  // console.log("galerij: ", gallery)
  // const maanden = ["januari", "februari","maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"]

  gallery.forEach(element => {
    element.date.value = element.date.value
      .toLowerCase()
      .replace("ca. ", "")
      .replace("ca.", "")
      .replace("voor", "")
      .replace("/", " ")
      //vervang alle streepjes in de data
      .replace(/-/g, " ")
      //.replace(/\D/g, "") <-- not handy for this data. But removes every single non-digit char.
      //Vervang alle maanden
      .replace("januari", "")
      .replace("februari", "")
      .replace("maart", "")
      .replace("april", "")
      .replace("mei", "")
      .replace("juni", "")
      .replace("juli", "")
      .replace("augustus", "")
      .replace("september", "")
      .replace("oktober", "")
      .replace("november", "")
      .replace("december", "")
      //Verwijder alle witruimte voor en aan het end van de string
      .trim(" ")
      //only keep last year from entry
      .substr(-4, 4);
    // String naar nummer
    element.date = parseInt(element.date.value);
    if (element.date.length <= 4) {
      delete element.date;
    }
    // Titel cleanup
    element.titel = element.titel.value.trim();
    // Beschrijving Cleanup
    element.beschrijving = element.beschrijving.value.trim();

    // Als er geen beschrijving beschikbaar is. Informeer dan de gebruiker.
    if (element.beschrijving == "") {
      element.beschrijving = "Er is geen beschrijving beschikbaar";
    }
  });

  // Start Graph section (with help of tutorial: https://www.youtube.com/watch?v=NlBt-7PuaLk)

  const nestedData = d3
    .nest()
    .key(function(d) {
      return d.date;
    })
    .sortKeys(d3.ascending)
    .rollup(function(v) {
      return {
        count: v.length
      };
    })
    .entries(gallery);

  const svg = d3.select("svg#chart1");
  const width = window.innerWidth;
  const height = nestedData.length * 40;
  
  // Start render
  const render = data => {
    const xValue = d => d.value.count;
    const yValue = d => d.key;

    const tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "toolTip");
    //Add margin to make SVG bit more readable. And space for titles, axisticks and descriptions.
    const margin = { top: 100, right: 40, bottom: 40, left: 100 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const xScale = d3
      .scaleLinear()
      .domain([0, d3.max(data, xValue)])
      .range([0, innerWidth]);

    const yScale = d3
      .scaleBand()
      .domain(data.map(yValue))
      .range([0, innerHeight])
      .padding(0.05);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    //Set Axis and ticks to y and x axis
    g.append("g")
      .classed("y-axis", true)
      .call(d3.axisLeft(yScale));

    g.append("g")
      .classed("x-axis", true)
      .call(d3.axisBottom(xScale))
      .attr("transform", `translate(0,${innerHeight})`);

    // Set title to graph
    g.append("text")
      .attr("x", width / 3)
      .attr("y", 0 - margin.top / 4)
      .attr("text-anchor", "middle")
      .classed("graphTitle", true)
      .text("Aantal foto's per jaartal");

    // Set title to Y-axis
    g.append("text")
      .attr("y", -50)
      .attr("x", -width / 2)
      .attr("text-anchor", "middle")
      .classed("yTitle", true)
      .text("Jaartal")
      .attr("transform", function(d) {
        return "rotate(-90)";
      });

    // Set title to X-Axis
    g.append("text")
      .attr("x", width / 3)
      .attr("y", innerHeight * 1.023)
      .attr("text-anchor", "middle")
      .classed("xTitle", true)
      .text("Aantal Foto's");

    g.selectAll("rectangle")
      .data(nestedData)
      .enter()
      .append("rect")
      .attr("class", "rectangle")
      .attr("y", d => yScale(yValue(d)))
      .attr("width", d => xScale(xValue(d)))
      .attr("height", yScale.bandwidth())

      // retrieve image links
      .on("click", function(d) {
        const selectedYearCollection = [];
        gallery.forEach(element => {
          if (element.date == d.key) {
            selectedYearCollection.push(element.imgLink.value);
          }
          d3.select("#selectionHead")
          .text("De foto's uit het jaar: " + d.key);
          d3.select("ul").remove(); // Delete gallery section
        });

        // create new list with images. (source: http://bl.ocks.org/ne8il/5131235)
        const ul = d3
          .select("#selectionSection")
          .append("ul")
          .attr("class", "selectionList")
          .data(selectedYearCollection);

        ul.selectAll("li")
          .data(selectedYearCollection)
          .enter()
          .append("li")
          .append("a")
          .attr("href", String)
          .append("img")
          .attr("src", String)
          .html(String);
      })

      // Tooltip  (source: https://bl.ocks.org/alandunning/274bf248fd0f362d64674920e85c1eb7)
      .on("mousemove", function(d) {
        tooltip
          .style("left", d3.event.pageX - 50 + "px")
          .style("top", d3.event.pageY - 100 + "px")
          .style("display", "inline-block")
          .html("Jaartal: " + d.key + "<br>" + "Aantal foto: " + d.value.count + "<br>" + "Klik voor foto's");
      })
      .on("mouseout", function(d) {
        tooltip.style("display", "none");
      });

    // Code from Razpudding. (Source: https://vizhub.com/Razpudding/4a61de4a4034423a98ae79d0135781f7)
    // Edit to own datastructure
    d3
      .select("form")
      .style("left", "16px")
      .style("top", "16px")
      .append("select")
      .on("change", function() {
        let selectedYear = this.value;
        let filterData = nestedData.filter(function(d) {
          return d.key == selectedYear;
        });

        d3.select("svg#chart1")
          .selectAll("rect")
          .data(filterData)
          .exit()
          .remove();

        //setup scales
        const xValue = d => d.value.count;
        const yValue = d => d.key;
        const margin = { top: 40, right: 40, bottom: 40, left: 100 };
        let innerWidth = 500 - margin.left - margin.right;
        let innerHeight = 300 - margin.top - margin.bottom;
        const xScale = d3
          .scaleLinear()
          .domain([0, d3.max(nestedData, xValue)])
          .range([0, innerWidth]);

        const yScale = d3   // set y-Scale
          .scaleBand()      // Adjust to size based on data
          .domain(filterData.map(yValue))
          .range([0, innerHeight])
          .padding(0.05);

        const g = svg    // Create SVG as group
          .select("g")
          .attr("transform", `translate(${margin.left},${margin.top})`);

        d3.select(".y-axis").call(d3.axisLeft(yScale)); // //Set Axis and ticks to y axis

        d3.select(".x-axis")      // Set Axis and ticks to x-axis
          .call(d3.axisBottom(xScale))
          .attr("transform", `translate(0,${innerHeight})`);

        g.select(".graphTitle") // Set title to graph
          .attr("x", innerWidth / 2)
          .attr("text-anchor", "middle")
          .text("Aantal foto's in de periode: " + filterData[0].key);

        g.select(".yTitle") // Set title to Y-axis
          .attr("y", -50)
          .attr("x", -innerWidth / 3)
          .attr("text-anchor", "middle")
          .text("Jaartal")
          .attr("transform", function(d) {
            return "rotate(-90)";
          });

        g.select(".xTitle") // Set title to X-Axis
          .attr("x", innerWidth / 3)
          .attr("y", innerHeight + 50)
          .attr("text-anchor", "middle")
          .text("Aantal Foto's");

        g.selectAll("rectangle")
          .data(filterData)
          .enter()
          .select("rect")
          .attr("class", "rectangle")
          .attr("y", d => yScale(yValue(d)))
          .attr("width", d => xScale(xValue(d)))
          .attr("height", yScale.bandwidth());

        
      })
      .selectAll("option")
      .data(nestedData)
      .enter()
      .append("option")
      .attr("value", d => d.key)
      .text(d => d.key);
  };
  render(nestedData);
});

