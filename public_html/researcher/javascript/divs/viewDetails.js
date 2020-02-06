

function showViewDetailsDiv() {
    // Retrieve the selected text
    let selText = selTexts[0];
    let title = selText.title;
    let version = selText.version;
    // Display text meta information
    document.getElementById("view_title").innerText = title;
    document.getElementById("view_uploader").innerText = allTexts[title].uploader;
    // Display version meta information
    let versionInfo = allTexts[title].versions[version];
    document.getElementById("view_ver").innerText = version;
    document.getElementById("view_privacy").innerText = versionInfo.isPublic ? "Public" : "Private";
    document.getElementById("view_age_range").innerText = versionInfo.targetAgeMin + " to " + versionInfo.targetAgeMax;
    document.getElementById("view_gender").innerText = versionInfo.targetGender;
    // Make an ajax call for the text
    document.getElementById("view_text").innerText = "LOADING...";
    postRequest(["title=" + title, "version=" + version], "../../private/researcher/getTextString.php", showText, alert);
    // Show only the view div
    hideDivs();
    document.getElementByID("view").removeAttribute('hidden');
}

function showText(textString) {
    document.getElementById("view_text").innerText = textString;
}
