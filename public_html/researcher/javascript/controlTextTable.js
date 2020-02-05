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
    // Display first page of filtered texts
    displayUnselectedTexts(1);
    // Reset the filter div
    document.getElementByID("fil_reset").reset();
}

function getUnfilteredUnselectedTexts() {
    // Make a deep copy of the full text list. Necessary to avoid deleting attributes from the original
    let unfilUnselTexts = JSON.parse(JSON.stringify(allTexts));
    // Remove all selected text versions
    for (let selText of selTexts) {
        let unfilUnselText = unfilUnselTexts[selText.title];
        let unfilUnselVer = unfilUnselText.versions;
        delete unfilUnselVer[selText.version];
        // Remove the whole text if all versions have been removed
        if (Object.keys(unfilUnselVer).length == 0) delete unfilUnselText;
    }
    // Return the resulting list
    return unfilUnselTexts;
}

function displayUnselectedTexts(pageNumber) {
    // Define a list of unselected titles
    let titles = Object.keys(unselTexts);
    if ((pageNumber * textRows) > titles.length) {
        pageNumber = Object.keys(unselTexts).length;
    }
    // Use the list to display texts
    for (let i = 0; i < textRows; i++) {
        let cell = document.getElementByID("unsel_" + i);
        let textIndex = ((pageNumber-1) * textRows) + i;
        if (textIndex >= titles.length) {
            // Hide empty cell
            cell.hidden = "hidden";
        } else {
            // Unhide non-empty cell
            cell.removeAttribute("hidden");
            // Display title
            let titleDiv = document.getElementById("unsel_title_" + i);
            let title = titles[textIndex];
            titleDiv.innerText = title;
            // Display version options
            let verSel = document.getElementById("unsel_ver_" + i);
            for (let version in unselTexts[title].versions) {
                let verOpt = document.createElement("option");
                verOpt.value = version;
                verOpt.innerText = version;
                verSel.appendChild(verOpt);
            }
        }
    }
    // Update the navigator
    updateNavSel(document.getElementByID("unsel_nav"), unselTexts.length, pageNumber);
}

function displaySelectedTexts(pageNumber) {
    // Use the selected texts list to display texts
    for (let i = 0; i < textRows; i++) {
        let cell = document.getElementByID("sel_" + i);
        let textIndex = (pageNumber*textRows) + i;
        if (textIndex >= selTexts.length) {
            // Hide empty cell
            cell.hidden = "hidden";
        } else {
            // Unhide non-empty cell
            cell.removeAttribute("hidden");
            // Display info
            let text = selTexts[textIndex];
            document.getElementById("sel_title_" + i).innerText = text.title;
            document.getElementById("sel_ver_" + i).innerText = text.version;
        }
    }
    // Update the navigator
    updateNavSel(document.getElementByID("sel_nav"), selTexts.length, pageNumber);
}

function updateNavSel(sel, textQuant, pageNumber) {
    // Calculate the required number of pages
    let pageQuant = Math.Ceil(textQuant / textRows);
    // Make one selector option for each page
    sel.innerHTML = "";
    for (let i = 1; i <= pageQuant; i++) {
        let navOpt = document.createElement("option");
        navOpt.value = i;
        navOpt.innerText = i;
        // Maintain user page selection
        if (i === pageNumber) navOpt.selected = "selected";
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
            if (!this.passesOwnershipFilter(texts[title].isOwned, filter.ownership)) continue;
            // Define accepted version collection.
            let acceptedVersions = [];
            // loop through versions.
            let text = texts[title];
            for (let version in text.versions) {
                if (!this.passesMinAgeFilter(text.versions[version].targetAgeMin, filter.minTarAge)) continue;
                if (!this.passesMaxAgeFilter(text.versions[version].targetAgeMax, filter.maxTarAge)) continue;
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
    displayUnselectedTexts();
    displaySelectedTexts();
    // Update buttons
    updateDivButtons();
}

function unselect(title, version) {

}
