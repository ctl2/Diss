const minPathLength = 10;
const minFixationTime = 20;

function showAnalyseDiv() {
    // Retrieve the selected text
    let selText = selTexts[0];
    let title = selText.title;
    let version = selText.version;
    // Request reading data
    let data = [
        "title=" + title,
        "version=" + version
    ];
    postRequest(data, "../../private/researcher/getReadingData.php", success, alert);
    // Show only the analysis div
    hideDivs("an");
}

function success(responseJSON) {
    let response = JSON.parse(responseJSON);
    if (!response.success) {
        alert(response.message);
    } else {
        if (response.message == "") {
            // FINISHED
        } else {
            // Process data
            let windows = JSON.parse(response.message);
            cleanedWindows = getCleanedWindows(windows);
            let statistics = getStatistics(cleanedWindows);
            // Request next data set
            postRequest("", "../../private/researcher/getReadingData.php", success, alert);
        }
    }
}

function getStatistics(windows) {
    let window = getNextWindow(windows);
}

// Request data
// Analyse the data on the client side
// For each stat in current analysis data:
    // let dif = curStat - newStat
    // curStat += dif / analysedSessionCount
// Update graphic and loading display
// Repeat from step 1
