'use strict';

var allTexts;   // holds all text info
var unselTexts; // holds text=>[ver1, ver2, ...] objects
var selTexts;   // holds {text, version} objects

// Only filters unselected texts
function filterTexts(title, ownership, minTarAge, maxTarAge) {
    // Set the collection of unselected texts to those that pass the filter
    let unfilUnselTexts = getUnfilteredUnselectedTexts();
    let filter = new Filter(unfilUnselTexts, title, ownership, minTarAge, maxTarAge);
    unselTexts = filter.filteredTexts;
    // Display first page of texts
    displayUnselectedTexts(0);
    displaySelectedTexts(0);
}

function getUnfilteredUnselectedTexts() {
    let unfilUnselTexts = {};
    for (let title of allTexts) {
        if (unselTexts)
    }
}

function displayUnselectedTexts() {
    // Define a list of unselected titles
    let titles = Object.keys(unselTexts);
    // Use the list to display texts
    for (let i = 0; i < textRows; i++) {
        let cell = document.getElementByID("unsel_" + i);
        let textIndex = ((unselPageNumber-1) * textRows) + i;
        if (textIndex >= title.length) {
            // Hide empty cells
            cell.hidden = "hidden";
        } else {
            // Unhide non-empty cell
            cell.removeAttribute("hidden");
            // Display title
            let titleDiv = document.getElementById("unsel_title_" + i);
            let title = titles[textIndex];
            titleDiv.innerHTML = title;
            // Display version options
            let verSel = document.getElementById("unsel_ver_" + i);
            for (let version of unselTexts[title]) {
                let verOpt = document.createElement("option");
                verOpt.value = version;
                verOpt.innerText = version;
                verSel.appendChild(verOpt);
            }
        }
    }
    updateNavSel("unsel");
}

function displaySelectedTexts() {
    // Use the selected texts list to display texts
    for (let i = 0; i < textRows; i++) {
        let cell = document.getElementByID("sel_" + i);
        let textIndex = (selPageNumber*textRows) + i;
        if (textIndex >= title.length) {
            // Hide empty cells
            cell.hidden = "hidden";
        } else {
            // Unhide non-empty cell
            cell.removeAttribute("hidden");
            for (let version of unselTexts[title]) {

            }
        }
    }
    updateNavSel("sel");
}

function updateNavSel(id) {
    // Find the desired navigator
    let navSel = document.getElementByID(id + "_nav");
    // Find the number of viewable texts
    let textQuant;
    if (id == "unsel") {
        textQuant = unselTexts.length;
    } else {
        textQuant = selTexts.length;
    }
    // Calculate the number of required pages
    let pageQuant = Math.Ceil(textQuant / textRows);
    // Update the selector
    for (let i = 0; i < pageQuant; i++) {
        let navOpt = document.createElement("option");
        navOpt.value = i;
        navOpt.innerText = i;
        if (p)
        navSel.appendChild(navOpt);
    }
}

class Filter {

    constructor(texts, title, ownership, minTarAge, maxTarAge) {
        this.filteredTexts = getFilteredTexts(
            texts,
            {
                titleKeywords: title.split(" "),
                ownership: ownership,
                minTarAge: minTarAge,
                maxTarAge: maxTarAge
            }
        );
    }

    getFilteredTexts(texts, filter) {
        // Define accepted text collection
        let filteredTexts = {};
        // Loop through available texts.
        for (let title in texts) {
            if (!this.passesTitleFilter(title, filter.titleKeywords)) continue;
            // Define accepted version collection.
            let acceptedVersions = [];
            // loop through versions.
            let text = texts[title];
            for (let version in text) {
                if (!this.passesOwnershipFilter(text[version].isOwned, filter.ownership)) continue;
                if (!this.passesMinAgeFilter(text[version].targetAgeMin, filter.minTarAge)) continue;
                if (!this.passesMaxAgeFilter(text[version].targetAgeMax, filter.maxTarAge)) continue;
                // Accept this text=>version combo.
                acceptedVersions.push(version);
            }
            // Push the text and its accepted versions to the accepted texts collection.
            if (acceptedVersions.length > 0) filterTexts[title] = acceptedVersions;
        }
        // Return the accepted texts=>versions.
        return filterTexts;
    }

    // Title must contain every keyword.
    passesTitleFilter(title, titleFilter) {
        for (let keyword of titleFilter) {
            if (!title.includes(keyword)) {
                return false;
            }
        }
        return true;
    }

    passesOwnershipFilter(isOwned, ownershipFilter) {
        if (ownership != "all") {
            if (isOwned == false && ownership == "owned") return false;
            if (isOwned == true && ownership == "unowned") return false;
        }
        return true;
    }

    passesMinAgeFilter(targetAgeMin, minAgeFilter) {
        return targetAgeMin >= minAgeFilter;
    }

    passesMaxAgeFilter(targetAgeMax, maxAgeFilter) {
        return targetAgeMax <= maxAgeFilter;
    }

}

function setUnselectedPage(pageNumber) {
    unselPageNumber = pageNumber;
    displayUnselectedTexts();
}

function setSelectedPage(pageNumber) {
    selPageNumber = pageNumber;
    displaySelectedTexts();
}

function select(title, version) {
    for (title of selTexts) {
        for (version of selTexts[title]) {
            versions.push({
                title: title,
                version: version
            });
        }
    }
    // Ensure no out of bounds page
    if ((unselPageNumber * textRows) > titles.length) unselPageNumber = Object.keys(unselTexts).length;
    // Upadte display
    displaySelectedTexts();
    displaySelectedTexts();
}

function unselect(title, version) {

}
