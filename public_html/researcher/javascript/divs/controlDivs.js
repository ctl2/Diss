function disableButton(button) {
    if (!button.hasAttribute("disabled")) {
        button.classList.add("new");
    }
    button.disabled = "disabled";
    button.classList.add("disabled");
    button.classList.remove("enabled");
}

function enableButton(button) {
    if (button.hasAttribute("disabled")) {
        button.classList.add("new");
    }
    button.removeAttribute("disabled");
    button.classList.add("enabled");
    button.classList.remove("disabled");
}

function hideDivs(exception) {
    // Define a collection of div IDs to hide
    var divNames = ["fil", "up", "view", "an", "comp"];
    // Hide any unhidden divs
    for (let divName of divNames) {
        let div = document.getElementById(divName);
        if (!div.hasAttribute("hidden")) {
            div.hidden = "hidden";
            let resetForm = document.getElementById(divName + "_reset");
            if (resetForm !== null) resetForm.reset();
        }
    }
    let hideButton = document.getElementById("but_hide");
    if (exception) {
        exceptDiv = document.getElementById(exception);
        exceptDiv.removeAttribute("hidden");
        enableButton(hideButton);
    } else {
        disableButton(hideButton);
    }
}

function updateDivButtons() {
    // Get references to the buttons
    let verButton = document.getElementById("but_ver");
    let viewButton = document.getElementById("but_view");
    let anButton = document.getElementById("but_ana");
    let compButton = document.getElementById("but_comp");
    // Set disabled properties
    switch (selTexts.length) {
        case 0:
            disableButton(verButton);
            disableButton(viewButton);
            disableButton(anButton);
            disableButton(compButton);
            break;
        case 1:
            let selTextTitle = selTexts[0].title;
            if (allTexts[selTextTitle].isOwned == true) {
                enableButton(verButton);
            } else {
                disableButton(verButton);
            }
            enableButton(viewButton);
            enableButton(anButton);
            disableButton(compButton);
            break;
        default:
            disableButton(verButton);
            disableButton(viewButton);
            disableButton(anButton);
            enableButton(compButton);
    }
}
