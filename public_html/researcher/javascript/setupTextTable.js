const textRows = 5; // The amount of texts per page

function setupTextTable(responseJSON) {
    let response = JSON.parse(responseJSON);
    if (response.success == false) {
        alert(response.message);
    } else {
        allTexts = JSON.parse(response.message);
        unselTexts = {};
        selTexts = [];
        let textTable = document.getElementById("texts");
        appendTextRows(textTable);
        appendNavRow(textTable);
        document.getElementById("filter_button").click();
        displaySelectedTexts(1);
    }
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
    textCell.id = "unsel_" + index;
    // Make title div
    let titleSpan = document.createElement("span");
    titleSpan.id = "unsel_title_" + index;
    // make version selector
    let verSel = document.createElement("select");
    verSel.id = "unsel_ver_" + index;
    // Make button
    let selectButton = document.createElement("input");
    selectButton.type = "button";
    selectButton.onclick = () => select(
        document.getElementById("unsel_title_" + index).innerText,
        document.getElementById("unsel_ver_" + index).value
    );
    selectButton.value = ">";
    // Connect
    textCell.appendChild(titleSpan);
    textCell.appendChild(verSel);
    textCell.appendChild(selectButton);
    row_el.appendChild(textCell);
}

function appendSelectedTextCell(row_el, index) {
    // Make cell
    let textCell = document.createElement("td");
    textCell.classList.add("selected");
    textCell.id = "sel_" + index;
    // Make button
    let unselectButton = document.createElement("input");
    unselectButton.type = "button";
    unselectButton.onclick = () => unselect(
        document.getElementById("sel_title_" + index).innerText,
        document.getElementById("sel_ver_" + index).innerText
    );
    unselectButton.value = "<";
    // Make title div
    let titleSpan = document.createElement("span");
    titleSpan.id = "sel_title_" + index;
    // make version div
    let verSpan = document.createElement("span");
    verSpan.id = "sel_ver_" + index;
    // Connect
    textCell.appendChild(unselectButton);
    textCell.appendChild(titleSpan);
    textCell.appendChild(document.createTextNode(" v"));
    textCell.appendChild(verSpan);
    row_el.appendChild(textCell);
}

function appendNavRow(table_el) {
    let navRow = document.createElement("tr");
    appendNavCell(navRow, "unsel");
    appendNavCell(navRow, "sel");
    table_el.appendChild(navRow);
}

function appendNavCell(row_el, id) {
    // Create components
    let navCell = document.createElement("td");
    let navCellText = document.createTextNode("Page ");
    let navCellSel = document.createElement("select");
    navCellSel.id = id + "_nav";
    if (id == "unsel") {
        navCellSel.onchange = () => displayUnselectedTexts(navCellSel.value);
    } else {
        navCellSel.onchange = () => displaySelectedTexts(navCellSel.value);
    }
    // Connect components
    navCell.appendChild(navCellText);
    navCell.appendChild(navCellSel);
    row_el.appendChild(navCell);
}

postRequest([], "../../private/researcher/getAvailableTexts.php", setupTextTable, alert);
