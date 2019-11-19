async function importDataset() {
  let dataset = await d3.csv("../files/kleuren.csv");

  // Onderstaande code haalt alle waardes uit de data die niet overeenkomen met het "#000000" format. En past deze aan naar het juiste format.
  let lijst = dataset.map(element => {
    let kleurwaarde = element["Lievelingskleur (HEX code)"];
    kleurwaarde = kleurwaarde.replace("#", "").replace(" ", "");

    if (kleurwaarde.length == 6) {
    } else {
      kleurwaarde = Math.floor(Math.random() * 16777215).toString(16);

      // dit stukje gejat van stackoverflow. Genereert een random hexcode terug zodat de totale data niet extreme waardes aanneemt.
    }

    return "#" + kleurwaarde; //voegt weer een # toe aan de hexcode.
  });
  console.log(lijst);
}
importDataset();
