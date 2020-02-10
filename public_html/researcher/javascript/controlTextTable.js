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
    document.getElementById("fil_reset").reset();
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
        if (Object.keys(unfilUnselVer).length == 0) delete unfilUnselTexts[selText.title];
    }
    // Return the resulting list
    return unfilUnselTexts;
}

function displayUnselectedTexts(pageNumber) {
    // Define a list of unselected titles
    let titles = Object.keys(unselTexts);
    // Use the list to display texts
    for (let i = 0; i < textRows; i++) {
        let cell = document.getElementById("unsel_" + i);
        let textIndex = ((pageNumber-1) * textRows) + i;
        if (textIndex >= titles.length) {
            // Hide empty cell
            cell.style.visibility = "hidden";
        } else {
            // Unhide non-empty cell
            cell.style.visibility = "visible";
            // Display title
            let titleSpan = document.getElementById("unsel_title_" + i);
            let title = titles[textIndex];
            titleSpan.innerText = title;
            // Display version options
            let verSel = document.getElementById("unsel_ver_" + i);
            verSel.innerHTML = "";
            for (let version of unselTexts[title]) {
                let verOpt = document.createElement("option");
                verOpt.value = version;
                verOpt.innerText = "v" + version;
                verSel.appendChild(verOpt);
            }
        }
    }
    // Update the navigator
    updateNavSel(document.getElementById("unsel_nav"), titles.length, pageNumber);
}

function displaySelectedTexts(pageNumber) {
    // Use the selected texts list to display texts
    for (let i = 0; i < textRows; i++) {
        let cell = document.getElementById("sel_" + i);
        let textIndex = ((pageNumber-1)*textRows) + i;
        if (textIndex >= selTexts.length) {
            // Hide empty cell
            cell.style.visibility = "hidden";
        } else {
            // Unhide non-empty cell
            cell.style.visibility = "visible";
            // Display info
            let text = selTexts[textIndex];
            document.getElementById("sel_title_" + i).innerText = text.title;
            document.getElementById("sel_ver_" + i).innerText = text.version;
        }
    }
    // Update the navigator
    updateNavSel(document.getElementById("sel_nav"), selTexts.length, pageNumber);
}

function updateNavSel(sel, textQuant, pageNumber) {
    // Calculate the required number of pages
    let pageQuant = Math.ceil(textQuant / textRows);
    if (pageQuant === 0) pageQuant = 1;
    // Make one selector option for each page
    sel.innerHTML = "";
    for (let i = 1; i <= pageQuant; i++) {
        let navOpt = document.createElement("option");
        navOpt.value = i;
        navOpt.innerText = i;
        // Maintain user page selection
        if (i === pageNumber) navOpt.selected = "selected";
        sel.appendChild(navOpt);
    }
}

class Filter {

    constructor(texts, title, ownership, minTarAge, maxTarAge) {
        this.setFilteredTexts(
            texts,
            {
                titleKeywords: title.split(" "),
                ownership: ownership,
                minTarAge: minTarAge,
                maxTarAge: maxTarAge
            }
        );
    }

    setFilteredTexts(texts, filter) {
        // Define accepted text collection
        this.filteredTexts = {};
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
            if (acceptedVersions.length > 0) this.filteredTexts[title] = acceptedVersions;
        }
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
        if (ownershipFilter != "all") {
            if (isOwned == false && ownershipFilter == "owned") return false;
            if (isOwned == true && ownershipFilter == "unowned") return false;
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
