function select(title, version) {
    // Remove the version from the unselected texts list
    unselTexts[title].splice(unselTexts[title].indexOf(version), 1);
    if (unselTexts[title].length === 0) delete unselTexts[title];
    // Add the version to the selected texts list
    selTexts.push({
        title: title,
        version: version
    });
    // Update display
    document.getElementById("unsel_nav").onchange();
    document.getElementById("sel_nav").onchange();
    // Update buttons
    updateDivButtons();
}

function unselect(title, version) {
    // Remove the version from the selected texts list
    for (let textIndex in selTexts) {
        if (selTexts[textIndex].title == title && selTexts[textIndex].version == version) {
            selTexts.splice(textIndex, 1);
            break;
        }
    }
    // Add the version to the unselected texts list
    if (!unselTexts.hasOwnProperty(title)) {
        unselTexts[title] = [version];
    } else {
        unselTexts[title].push(version);
    }
    // Update display
    document.getElementById("unsel_nav").onchange();
    document.getElementById("sel_nav").onchange();
    // Update buttons
    updateDivButtons();
}
