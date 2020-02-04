function hideDivs() {
    var divs = array(
        document.getElementByID("filter"),
        document.getElementByID("upload"),
        document.getElementByID("view"),
        document.getElementByID("analyse"),
        document.getElementByID("compare")
    );
    for (let div in divs) {
        if (!div.hasAttribute("hidden")) {
            div.hidden = "hidden";
        }
    }
}

function updateDivButtons() {
    // Get references to the buttons
    let verButton = document.getElementById("but_ver");
    let viewButton = document.getElementById("but_view");
    let anButton = document.getElementById("but_view");
    let compButton = document.getElementById("but_view");
    // Set disabled properties
    switch (selTexts.length) {
        case 0:
            verButton.disabled = "disabled";
            viewButton.disabled = "disabled";
            anButton.disabled = "disabled";
            compButton.disabled = "disabled";
            break;
        case 1:
            let selTextTitle = selTexts[0].title;
            viewButton.removeAttribute("disabled");
            anButton.removeAttribute("disabled");
            compButton.disabled = "disabled";
            break;
        default:
            verButton.disabled = "disabled";
            viewButton.disabled = "disabled";
            anButton.disabled = "disabled";
            compButton.removeAttribute("disabled");
    }
}
