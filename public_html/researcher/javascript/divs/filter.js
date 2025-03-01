'use strict';

var username;   // logged in account's username
var allTexts;   // holds all text info
var unselTexts = {}; // holds text=>[ver1, ver2, ...] objects
var selTexts = [];   // holds {text, version} objects

function showFilterDiv(button) {
    // Show only the filter div
    hideDivs(button, "fil");
}

// Filter commands only filter unselected texts.
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

function displayUnselectedTexts(pageNumber = document.getElementById("unsel_nav").value) {
    pageNumber = Number(pageNumber);
    // Decrement pageNumber if the current page has no texts and isn't page 1
    if (pageNumber > 1) {
        if ((pageNumber-1) * textRows >= Object.keys(unselTexts).length) {
            pageNumber--;
        }
    }
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
                verOpt.innerText = version;
                verSel.appendChild(verOpt);
            }
        }
    }
    // Update the navigator
    updateNavSel(document.getElementById("unsel_nav"), titles.length, pageNumber);
}

function displaySelectedTexts(pageNumber = document.getElementById("sel_nav").value) {
    pageNumber = Number(pageNumber);
    // Decrement pageNumber if the current page has no texts and isn't page 1
    if (pageNumber > 1) {
        if ((pageNumber-1) * textRows >= selTexts.length) {
            pageNumber--;
        }
    }
    // Use the selected texts list to display texts
    for (let i = 0; i < textRows; i++) {
        let cell = document.getElementById("sel_" + i);
        let textIndex = ((pageNumber-1) * textRows) + i;
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
        if (i == pageNumber) navOpt.selected = "selected";
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
            if (!this.passesOwnershipFilter(texts[title].uploader, filter.ownership)) continue;
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

    passesOwnershipFilter(owner, ownershipFilter) {
        if (ownershipFilter != "all") {
            if (owner != username && ownershipFilter == "owned") return false;
            if (owner == username && ownershipFilter == "unowned") return false;
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
