'use strict';

function filterTexts(title, ownership, minTarAge, maxTarAge) {
    let filter = new Filter(title, ownership, minTarAge, maxTarAge);
    let titles = Object.keys(filter.filteredTexts);
    for (let i = 0; i < textRows; i++) {
        let title = titles[(pageNumber*textRows) + i];
        document.getElementById("unsel_title" + i).innerHTML = title;
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
