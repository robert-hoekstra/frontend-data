![header](https://i.imgur.com/Onk9BIy.png)
# Frontend Data

# Interactive Picture Exhibition
This application is about putting everybody's personal heritage on screen by collecting all kinds of portret pictures taken around the world. These pictures are collected and digitalized by the Nationale Vereniging voor Wereldculturen.

[![Image from Gyazo](https://i.gyazo.com/512d98854c916e6cf0a3fe653906dbdb.gif)](https://gyazo.com/512d98854c916e6cf0a3fe653906dbdb)

## Getting Started
To start the application you need to clone the repository to your local machine. Once you have done that. Open the `index.html` file with a web-browser. I advise to use Chrome. You can download Chrome [here](https://www.google.com/intl/nl/chrome/).

You can also open the app live at: [Github Pages](https://robert-hoekstra.github.io/functional-programming/)

### Want to run local?

Use the following commands or download as zip:
```
https://github.com/robert-hoekstra/functional-programming.git

open terminal

run: npm install
run: npm run

Go to localhost:#### whatever you set your host to.
```

## How to use the application
The app displays some options / filters that need to be selected in order to work properly.

**1. Choosing a timestamp**

You can now cycle through all the years to explore different collections of pictures that are taken within the selected year. Notice the difference in material and quality? What else can you explore?

[![Image from Gyazo](https://i.gyazo.com/70b2f3142035f6aea3cba90273e6f343.gif)](https://gyazo.com/70b2f3142035f6aea3cba90273e6f343)

**2. Explore pictures**
[![Explore images](https://i.gyazo.com/4c0b57ad9d72336422d6e663175df078.gif)](https://gyazo.com/4c0b57ad9d72336422d6e663175df078)

![explore-options](https://i.imgur.com/7dSvB0f.png)

Select a picture to learn more about it. And about it's statistics.

## How does the Application work (dev part)?

### Data
Data is imported trough a SparQL query that is connecten with an API to the national collection of the Nationaal Museum van Wereldculturen.

#### Collectie Wereldculturen
The collection can be found [here](https://collectie.wereldculturen.nl/). The collection contains every piece that can be found at the 4 musea that are part of the NMVW-group. Those are:

- TropenMuseum
- AfrikaMuseum
- WereldMuseum
- VolkenkundeMuseum

The collection can be used to browse and explore through the collection. But you can also see where the items are located and if they can be visited in real life.

##### Focus on Portrait pictures
There are a lot of pictures about all kinds of subjects in the collection. For this project I want to showcase all the faces behind a heritage. What face forms and displays a specific culture? In order to get to that part we'll move on to the next section: SparQL

###### SparQL
In order to 'talk' with and retrieve data from the collection we make use of a database written in a SparQl environment. This is cool because we can write and test queries in the environment. The query sends back results in a JSON format which we can use with D3.JavaScript!

My query looks like this:

```sparql
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
```

#### JSON Objects
The data is being retrieved through the Query but needs to be parsed into the application. We do so by using the `d3.json` method that comes with the D3.js package.

The data is given in 1 array that contains loads of objects. In our case 7130 objects to be exact. These objects contains 7 properties such as: Date, Materials, Title, Description, Image etc,

To read more about the data modiyfing and cleaning. Go to this [wiki]()

These properties are being read by D3 functionalities to produce a chart.

### Browser-based
The application is run within a browser environment. The application is a prototype for something that could be a exhibition at the museum.

For this application a internetconnection is needed to retrieve ((dynamic)) data from the database.

## Who is the target audience?
Visitors of the musea in the Netherlands. Specifically young people that are interested in their roots and their ancestors. I want to showcase something that can be found in the collection that is so broad that hopefully the visitors might visit the online collection or different exhibitionts/musea found in the NMVW group.

#### functional-programming
Basics of D3. Visualizing data. Part of the Tech Track course given @ Amsterdam University of Applied Sciences.

# Documentation
[Documentation](https://github.com/robert-hoekstra/frontend-data/wiki)

# Update Pattern (Dynamic Data)
* [Explanation Update Pattern](https://github.com/robert-hoekstra/frontend-data/wiki/D3)
* [How I used the pattern](https://github.com/robert-hoekstra/frontend-data/wiki/D3-Bar-Chart#selecting-specific-data-enter-update-exit)

# Acknowledgements 
* [Eyob Dejene](https://github.com/EyobDejene) for helping with enter, update exit pattern of D3.
* [Nick Meijer](https://github.com/CountNick)for helping out with arrow notations and scoops.
