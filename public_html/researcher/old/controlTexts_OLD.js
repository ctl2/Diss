'use strict';

// store as Text objects
var allTexts = {
    ownedTexts: [],
    unownedTexts: []
};

// store as objects with title=>element properties
var displayedTexts = {
    ownedTexts: [],
    selectedTexts: [],
    unownedTexts: []
};

class Text {

    constructor(title, versions) {
        this.title = title;
        this.versions = versions;
    }

    getVersion(versionNumber) {
        return this.versions[versionNumber];
    }

}

class Version {

    constructor(isPublic, targetAgeMin, targetAgeMax, targetGender) {
        this.isPublic = isPublic;
        this.targetAgeMin = targetAgeMin;
        this.targetAgeMax = targetAgeMax;
        this.targetGender = targetGender;
    }

}

function addSelectedText(text_el) {

}

function removeSelectedText(text_el) {

}

function setTexts(texts) {
    setOwnedTexts(allTexts.ownedTexts);
    setUnownedTexts(allTexts.unownedTexts);
}

function receiveJSON(jsonString) {
    allTexts = JSON.parse(jsonString);
    buildTextTable(allTexts.ownedTexts.size, allTexts.unownedTexts.size);
    setTexts(allTexts);
}

function filterOwnedTexts(searchPhrase) {
    displayOwned()
}

function filterUnownedTexts(searchPhrase) {
    // Find texts with matching title.
    // Calculate number of necessary pages.
    // Redraw the nav div accordingly.
    // Set to page 1 and display first 'textRows' texts.
}

postRequest([], "../../private/researcher/getAvailableTexts.php", receiveJSON, alert);
populate();
