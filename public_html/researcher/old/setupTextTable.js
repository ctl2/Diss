function formTextRows() {

        // Find the table to form rows for.
        let textTable = document.getElementById("texts");

        // Form blank rows for storing texts.
        for (let i = 0; i < textRows; i++) {
            let textRow = document.createElement("tr");
            textRow.appendChild(getNewTextCell("owned", i));
            textRow.appendChild(getNewTextCell("selected", i));
            textRow.appendChild(getNewTextCell("unowned", i));
            textTable.appendChild(textRow);
        }

}

function getNewTextCell(type, index, buttonIsFirst) {
    let el_array = [];
    let next_index = 0;
    // Build the button.
    let button = document.createElement("input");
    button.type = "button";
    button.onclick = "addToSelected(" + type + "_title_" + index + ")"
    if (buttonIsFirst) {
        button.value = ">";
    }
    // Build the text title div.
    let title = document.createElement("div");
    title.id = type + "_title_" + index;
    text.appendChild(title);
    // Build the text title div.
    let version = document.createElement("select");
    version.id = type + "_version_" + index;
    text.appendChild(version);
    // Build the cell.
    let text = document.createElement("td");

    return textCell;
}
