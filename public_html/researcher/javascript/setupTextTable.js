const textRows = 5;

function setupTextTable(textsJSON) {
    allTexts = JSON.parse(jsonString);
    let textTable = document.getElementById("texts");
    appendTextRows(textTable);
    appendNavRow(textTable);
    document.getElementById("filter_button").click();
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
    // Make title div
    let titleDiv = document.createElement("div");
    titleDiv.id = "unsel_title_" + index;
    // make version selector
    let verSel = document.createElement("select");
    verSel.id = "unsel_ver_" + index;
    // Make button
    let selectButton = document.createElement("input");
    selectButton.type = "button";
    selectButton.onclick = "select(unsel_title_" + index + ".value, unsel_ver_" + index + ".value)"
    selectButton.value = ">";
    // Connect
    textCell.appendChild(titleDiv);
    textCell.appendChild(verSel);
    textCell.appendChild(selectButton);
    row_el.appendChild(textCell);
}

function appendSelectedTextCell(row_el, index) {
    // Make cell
    let textCell = document.createElement("td");
    textCell.classList.add("selected");
    // Make button
    let deselectButton = document.createElement("input");
    deselectButton.type = "button";
    deselectButton.onclick = "unselect(sel_title_" + index + ".value, sel_ver_" + index + ".innerText)"
    deselectButton.value = "<";
    // Make title div
    let titleDiv = document.createElement("div");
    titleDiv.id = "sel_title_" + index;
    // make version div
    let verDiv = document.createElement("div");
    verDiv.id = "sel_ver_" + index;
    // Connect
    textCell.appendChild(deselectButton);
    textCell.appendChild(titleDiv);
    textCell.appendChild(verDiv);
    row_el.appendChild(textCell);
}

function appendNavRow(table_el) {
    let navRow = document.createElement("tr");
    appendNavCell(navRow, "sel");
    appendNavCell(navRow, "unsel");
    table_el.appendChild(navRow);
}

function appendNavCell(row_el, id) {
    // Create components
    let navCell = document.createElement("td");
    let navCellText = document.createTextNode("Page ");
    let navCellSel = document.createElement("select");
    navCellSel.id = id + "_nav";
    if (id = "unsel") {
        navCellSel.onchange = "setUnselectedPage(this.value)";
    } else {
        navCellSel.onchange = "setSelectedPage(this.value)";
    }
    // Connect components
    selNavCell.appendChild(navCellText);
    selNavCell.appendChild(navCellSel);
    row_el.appendChild(selNavCell);
}

postRequest([], "../../private/researcher/getAvailableTexts.php", setupTextTable, alert);
