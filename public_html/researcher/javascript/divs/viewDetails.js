

function showViewDetailsDiv() {
    // Retrieve the selected text
    let selText = selTexts[0];
    let title = selText.title;
    let version = selText.version;
    // Collect display elements
    let titleSpan = document.getElementById("view_title");
    let uploaderSpan = document.getElementById("view_uploader");
    let verSpan = document.getElementById("view_ver");
    let privSpan = document.getElementById("view_privacy");
    let minAgeSpan = document.getElementById("view_min_age");
    let maxAgeSpan = document.getElementById("view_max_age");
    let genderSpan = document.getElementById("view_gender");
    // Display text meta information
    titleSpan.innerText = title;
    uploaderSpan.innerText = allTexts[title].uploader;
    // Display meta information
    let versionInfo = allTexts[title].versions[version];
    verSpan.innerText = version;
    privSpan.innerText = Boolean(Number(versionInfo.isPublic)) ? "Public" : "Private";
    // Display optional meta information
    showOptionalMetaInfo(minAgeSpan, versionInfo.targetAgeMin);
    showOptionalMetaInfo(maxAgeSpan, versionInfo.targetAgeMax);
    showOptionalMetaInfo(genderSpan, versionInfo.targetGender);
    // Make an ajax call for the text
    document.getElementById("view_text").innerText = "LOADING...";
    postRequest(["title=" + title, "version=" + version], "../../private/researcher/getTextString.php", showText, alert, true);
    // Show only the view div
    hideDivs("view");
}

function showOptionalMetaInfo(span, value) {
    // Hide lines with unset values
    if (value === null) {
        span.parentNode.hidden = 'hidden';
    } else {
        span.parentNode.removeAttribute('hidden');
        span.innerText = value;
    }
}

function showText(resultJSON) {
    let result = JSON.parse(resultJSON);
    if (!result.success) {
        if (confirm(result.message + " Would you like to try again?")) {
            postRequest(["title=" + title, "version=" + version], "../../private/researcher/getTextString.php", showText, alert, true);
        }
    } else {
        document.getElementById("view_text").innerText = result.message;
    }
}
