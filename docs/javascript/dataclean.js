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