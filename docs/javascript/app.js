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

            }LIMIT 500`;

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

  console.log("nested: ", nestedData);
  console.log("gallery: ", gallery);

  // for (let i = 0; i < nestedData.length; i++) {
  //    console.log(nestedData[i].values.length)

  // }
  const svg = d3.select("svg#chart1");
  const width = window.innerWidth;
  const height = nestedData.length * 40;

  // Count total items.
  // For future development

  const render = data => {
    const xValue = d => d.value.count;
    const yValue = d => d.key;
    const tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "toolTip");
    //Add margin to make SVG bit more readable. And space for titles, axisticks and descriptions.
    const margin = { top: 20, right: 40, bottom: 40, left: 100 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Set Domain and Range for xScale
    const xScale = d3
      .scaleLinear()
      .domain([0, d3.max(data, xValue)])
      .range([0, innerWidth]);

    // Set Domain and Range for yScale
    //Set distance between bars with Scaleband
    const yScale = d3
      .scaleBand()
      .domain(data.map(yValue))
      .range([0, innerHeight])
      .padding(0.05);

    // const yAxis = d3.axisLeft(yScale);
    // set svg to const g to work with
    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    //Set Axis and ticks to y axis
    g.append("g").call(d3.axisLeft(yScale));

    g.append("g")
      .call(d3.axisBottom(xScale))
      .attr("transform", `translate(0,${innerHeight})`);

    // Set title to graph
    g.append("text")
      .attr("x", width / 3)
      .attr("y", 0 - margin.top / 4)
      .attr("text-anchor", "middle")
      .text("Aantal foto's per jaartal");

    // Set title to Y-axis
    g.append("text")
      .attr("y", -50)
      .attr("x", -width / 2)
      .attr("text-anchor", "middle")
      .text("Jaartal")
      .attr("transform", function(d) {
        return "rotate(-90)";
      });

    // Set title to X-Axis
    g.append("text")
      .attr("x", width / 3)
      .attr("y", innerHeight * 1.023)
      .attr("text-anchor", "middle")
      .text("Aantal Foto's");

    // Display all objects with a rectangle. (to make bars)
    //Set width per bar based on full size SVG
    g.selectAll("rectangle")
      //What data needs to be added
      //Check DOM if there are enough elements. If not make extra.
      .data(nestedData)
      //Append the rect value to DOM-element
      .enter()
      .append("rect")
      .attr("class", "rectangle")
      // Set attributes to display barsizes
      .attr("y", d => yScale(yValue(d)))
      .attr("width", d => xScale(xValue(d)))
      .attr("height", yScale.bandwidth())

      // retrieve image links
      .on("click", function(d) {
        const selectedYearCollection = [];
        gallery.forEach(element => {
          if (element.date == d.key) {
            console.log(element.date);
            console.log(element.imgLink.value);
            selectedYearCollection.push(element.imgLink.value);
            console.log(selectedYearCollection);
          }
        });
        // console.log("Jaar: " + d.key)
        // console.log("Aantal: " + d.value.count)

        var ul = d3.select("body").append("ul");

        ul.selectAll("li")
          .data(selectedYearCollection)
          .enter()
          .append("li")
          .append("a")
          .attr("href", String)
          .html(String);
      })

      // Tooltip  (source: https://bl.ocks.org/alandunning/274bf248fd0f362d64674920e85c1eb7)
      .on("mousemove", function(d) {
        tooltip
          .style("left", d3.event.pageX - 50 + "px")
          .style("top", d3.event.pageY - 70 + "px")
          .style("display", "inline-block")
          .html("Jaartal: " + d.key + "<br>" + "Aantal foto: " + d.value.count);
      })
      .on("mouseout", function(d) {
        tooltip.style("display", "none");
      });

    var quantize = d3
      .scaleOrdinal()
      .domain([0, d3.max(data, xValue)])
      .range([0, innerWidth]);

    svg
      .append("rect")
      .attr("class", "legendBox")
      .attr("width", "200px")
      .attr("height", "200px")
      .attr("fill", "pink")
      .attr("transform", "translate(900,50)");

    svg
      .append("g")
      .attr("class", "legendQuant")
      .attr("transform", "translate(900,50)")
      .attr("fill", "steelblue");

    var colorLegend = d3
      .legendColor()
      .labelFormat(d3.format(""))
      .useClass(true)
      .scale(quantize);

    svg.select(".legendQuant").call(colorLegend);

    //Sort
    d3.select("#wrapper")
      .append("button")
      .text("Delete data")
      .on("click", function() {
        //select new data
        d3.remove(gallery);
      });
  };

  // Legend maken yippie

  //Activeer render functie met gegeven dataset
  // render(gallery);
  render(nestedData);

  // add a data-legend attribute to your path

  // !!! UNUSED CODE !!!
  // Kept for learning purposes

  //  console.log(gallery);

  // for (let i=0; i < data.length; i++){
  //     let objectItem = data[i];
  //     // objectItem.cho = objectItem.cho.value;
  //     // objectItem.type = objectItem.type.value;
  //     // console.log(i)
  //     // objectItem.date = objectItem.date.value;

  //     // if (objectItem.image == undefined) {
  //     //     objectItem.image = null
  //     //     return objectItem.image
  //     // }

  //     if (objectItem.imgLink) {
  //         objectItem.image = objectItem.imgLink.value

  //     } else {
  //         delete objectItem
  //     }

  // if objectItem.

  //     console.log(objectItem.image)

  // }
  // return data

  // handle data
  //    const handleData = (json) =>{
  //        let bindings =  json.results.bindings;
  //        for (let i=0; i < bindings.length; i++){
  //            let objectItem = bindings[i];
  //            objectItem.cho = objectItem.cho.value;
  //            objectItem.placeName = objectItem.placeName.value;
  //            objectItem.title = objectItem.title.value;
  //            objectItem.type = objectItem.type.value;
  //            objectItem.image = objectItem.imageLink.value;
  //        }
  //        console.log(bindings);
  //        return bindings
  //    };
  // fetch data

  //    fetch(url+'?query='+encodeURIComponent(query)+'&format=json')
  //        .then(res => res.json())
  //        .then(handleData => {

  //         console.log(handleData)
  //         handleData.map()

  //        })
  //        .catch(err => console.error(err));

  // Fetch Query
});
