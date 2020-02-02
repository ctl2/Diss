var unselectedTexts;
var selectedTexts;
var pageNumber = 0; // start page is page 0.
const textRows = 5;

function setupTextTable(textsJSON) {
    unselectedTexts = JSON.parse(jsonString);
    let textTable = document.getElementById("texts");
    appendTextRows(textTable);
    appendNavRow(textTable);
    document.getElementById("filter_button").onclick();
}

function appendTextRows(table_el) {
    for (let i = 0; i < textRows; i++) {
        let textRow = document.createElement("tr");
        appendUnselectedTextCell(textRow, i);
        appendSelectedTextCell(textRow, i);
        table_el.appendChild(textRow);
    }
}

function appendUnselectedTextCell(row_el, index) {
    // Make cell
    let textCell = document.createElement("td");
    textCell.classList.add("unselected");
    // Make title
    let titleDiv = document.createElement("div");
    titleDiv.id = "unsel_title_" + index;
    // Make button
    let selectButton = document.createElement("input");
    selectButton.type = "button";
    selectButton.onclick = "select(unsel_title_" + index + ".value, this)"
    selectButton.value = ">";
    // Connect
    textCell.appendChild(titleDiv);
    textCell.appendChild(selectButton);
    row_el.appendChild(textCell);
}

function appendSelectedTextCell(row_el, index) {
    // Make cell
    let textCell = document.createElement("td");
    textCell.classList.add("selected");
    // Make title
    let titleDiv = document.createElement("div");
    titleDiv.id = "sel_title_" + index;
    // Make button
    let deselectButton = document.createElement("input");
    deselectButton.type = "button";
    deselectButton.onclick = "deselect(sel_title_" + index + ".value, this)"
    deselectButton.value = "<";
    // Connect
    textCell.appendChild(deselectButton);
    textCell.appendChild(titleDiv);
    row_el.appendChild(textCell);
}

function appendNavRow(table_el) {

}

function addNavRow(textTable, ownedPageQuant, unownedPageQuant) {

    let navRow = document.createElement("tr");
    let navCell;

    navCell = document.createElement("td");
    navCell.appendChild(getNavDiv(ownedPageQuant, "navOwned"));
    navRow.appendChild(navCell);

    navCell = document.createElement("td");
    navRow.appendChild(navCell);

    navCell = document.createElement("td");
    navCell.appendChild(getNavDiv(ownedPageQuant, "navUnowned"));
    navRow.appendChild(navCell);

}

function getNavDiv(pageQuant, onclick) {

    let navDiv = document.createElement("div");
    navDiv.classList.add("nav");
    navDiv.appendChild(document.createTextNode("Page "));
    let navButton = document.createTextNode("input");
    navButton.type = "button";
    navButton.onclick = onclick + "(this.value)";

    for (let i = 1; i <= pageQuant; i++) {
        navButton.value = i;
        navDiv.appendChild(navButton);
    }

    return navDiv;

}

postRequest([], "../../private/researcher/getAvailableTexts.php", setupTextTable, alert);
