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
  let gallerij = data.filter(obj => Object.keys(obj).includes("imgLink"));
  // Delete properties that are not needed
  gallerij.forEach(element => {
    delete element.cho;
    delete element.type;
    delete element.typeLabel;
  });
  // Clean date to uniform
  // console.log("galerij: ", gallerij)
  // const maanden = ["januari", "februari","maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"]

  gallerij.forEach(element => {
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
    element.date.value = parseInt(element.date.value);
    // Titel cleanup
    element.titel.value = element.titel.value.trim();
    // Beschrijving Cleanup
    element.beschrijving.value = element.beschrijving.value.trim();
    // Als er geen beschrijving beschikbaar is. Informeer dan de gebruiker.
    if (element.beschrijving.value == "") {
      element.beschrijving.value = "Er is geen beschrijving beschikbaar";
    }
  });

  // console.log(gallerij)

  // Start Graph section (with help of tutorial: https://www.youtube.com/watch?v=NlBt-7PuaLk)
  const svg = d3.select("svg");
  const width = +svg.attr("width");
  const height = +svg.attr("height");

  //   var groupedByYear = d3.nest()
  //   .key(function(d) { return d.date; })
  //   .entries(data.date);
  //   console.log(groupedByYear)

  // Count total items.
  // For future development
  let arraySize = 0;
  data.forEach(element => {
    arraySize++;
  });

  const render = data => {
    const xValue = d => d.date.value;
    const yValue = d => d.date.value;
    //Add margin to make SVG bit more readable. And space for titles, axisticks and descriptions.
    const margin = { top: 20, right: 40, bottom: 20, left: 100 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Set Domain and Range for xScale
    const xScale = d3
      .scaleLinear()
      .domain([0, d3.max(data, xValue)])
      .range([0, arraySize]);

    // Set Domain and Range for yScale
    //Set distance between bars with Scaleband
    const yScale = d3
      .scaleBand()
      .domain(data.map(yValue))
      .range([0, innerHeight])
      .padding(0.1);

    // const yAxis = d3.axisLeft(yScale);
    // set svg to const g to work with
    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    //Set Axis and ticks to y axis
    g.append("g").call(d3.axisLeft(yScale));
    g.append("g")
      .call(d3.axisBottom(xScale).tickSize(-innerWidth))
      .attr("transform", `translate(0,${innerHeight})`);

    // Set title to graph
    g.append("text")
      .attr("x", width / 2)
      .attr("y", 0 - margin.top / 4)
      .attr("text-anchor", "middle")
      .text("Aantal foto's per jaartal");

    // Display all objects with a rectangle. (to make bars)
    //Set width per bar based on full size SVG
    g.selectAll("rect")
      //What data needs to be added  
      //Check DOM if there are enough elements. If not make extra.
      .data(gallerij)
      //Append the rect value to DOM-element
      .enter()
      .append("rect")
      // Set attributes to display barsizes
      .attr("y", d => yScale(yValue(d)))
      .attr("width", d => xScale(xValue(d)))
      .attr("height", yScale.bandwidth());

    // g.append("legend")
    //     .attr("class","legend")
    //     .attr("transform","translate(50,30)")
    //     .style("font-size","12px")
    //     .call(d3.legend)
  };

  //Activeer render functie met gegeven dataset
  render(gallerij);

  // !!! UNUSED CODE !!!
  // Kept for learning purposes

  //  console.log(gallerij);

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
