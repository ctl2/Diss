function hideDivs() {
    // Get an array of hidable div names
    var divNames = array("fil", "up", "view", "an", "comp");
    // Hide any unhidden divs
    for (let divName of divNames) {
        let div = document.getElementById(divName);
        if (!div.hasAttribute("hidden")) {
            div.hidden = "hidden";
            let resetForm = document.getElementById(divName + "_reset");
            if (resetForm !== null) resetForm.reset();
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
            if (allTexts[selTextTitle].isOwned == true) {
                verButton.removeAttribute("disabled");
            } else {
                verButton.disabled = "disabled";
            }
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
