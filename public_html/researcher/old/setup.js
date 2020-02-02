const textRows = 5;

function buildBlankRows() {

    // Find the table to build rows for.
    let textTable = document.getElementById("texts");

    // Build rows for storing texts.
    for (let i = 0; i < textRows; i++) {
        let textRow = document.createElement("tr");
        textRow.appendChild(getBlankTextCell("owned", i));
        textRow.appendChild(getBlankTextCell("selected", i));
        textRow.appendChild(getBlankTextCell("unowned", i));
        textTable.appendChild(textRow);
    }

    // Build row for search bar.
    let searchRow = document.createElement("tr");
    searchRow.appendChild(getBlankSearchCell("owned"));
    searchRow.appendChild(document.createElement("td"));
    searchRow.appendChild(getBlankSearchCell("unowned"));

    // Build row for navigation.
    textTable.appendChild(getBlankNavCell("owned"));
    textRow.appendChild(document.createElement("td"));
    searchRow.appendChild(getBlankNavCell("unowned"));

}

function getBlankTextCell(type, index) {
    // Build cell
    let textCell = document.createElement("td");
    textCell.id = type + "_text_" + index;
    // Build the div for holding title/version info.
    let textDiv = document.createElement("div");

    return textCell;
}

function getBlankSearchCell(type) {

    let searchCell = document.createElement("td");
    searchCell.id = type + "_search";

    return searchCell;

}

function getBlankNavCell(type) {

    let navCell = document.createElement("td");
    navCell.id = type + "_nav";

    return navCell;

}














function buildTextTable(ownedTextsQuant, unownedTextsQuant) {
    let textTable = getElementByID('texts');
    addTextRows(textTable);
    addSearchRow(textTable);
    addNavRow(textTable, Math.ceil(ownedTextsQuant / textRows), Math.ceil(unownedTextsQuant / textRows));
}

function addTextRows(textTable) {

    for (let rowCount = 0; rowCount < textRows; rowCount++) {

        let newRow = document.createElement("tr");
        let newCell = document.createElement("td");

        newCell.id = "owned" + rowCount;
        newRow.appendChild(newCell);

        newCell.id = "selected" + rowCount;
        newRow.appendChild(newCell);

        newCell.id = "unowned" + rowCount;
        newRow.appendChild(newCell);

        textTable.appendChild(newRow);

    }

}

function addSearchRow(textTable) {

    let searchRow = document.createElement("tr");
    let searchBar;
    let searchCell;

    searchCell = document.createElement("td");
    searchCell.appendChild(getSearchDiv("owned", "filterOwnedTexts"));
    searchRow.appendChild(searchCell);

    searchCell = document.createElement("td");
    searchRow.appendChild(searchCell);

    searchCell = document.createElement("td");
    searchCell.appendChild(getSearchDiv("unowned", "filterUnownedTexts"));
    searchRow.appendChild(searchCell);

    textTable.appendChild(searchRow);

}

function getSearchBar(textType, onclick) {

    let searchDiv = document.createElement("div");
    searchDiv.classList.add("search");

    let searchBar = document.createElement("input");
    searchBar.id = textType + "_search";
    searchBar.type = "text";
    searchBar.placeholder = "Search";
    searchDiv.appendChild(searchBar);

    let searchButton = document.createElement("input");
    searchButton.type = "button";
    searchButton.value = "Go";
    searchButton.onclick = onclick + "(" + textType + "_search.value)";
    searchDiv.appendChild(searchButton);

    return searchDiv;

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

function getNavButton(value, onclick) {

}
