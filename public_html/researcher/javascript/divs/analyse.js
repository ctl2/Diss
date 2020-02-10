function showAnalyseDiv() {
    // Retrieve the selected text
    let selText = selTexts[0];
    let title = selText.title;
    let version = selText.version;


    // Show only the analysis div
    hideDivs("an");
}

// Start by retrieving a list of usernames who have read the text.
// Use a PHP script which takes a reader username, text and version and returns the text's reading session data for that reader.
// Analyse the data on the client side
// Current analysis data += (same - newData) / retrievedDataSets
// Update graphic and loading display
// Repeat from step 2
