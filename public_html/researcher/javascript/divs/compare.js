function showCompareDiv() {

    // Show only the comparison div
    hideDivs("comp");
}

class ReadingComparisonManager {

    readings = [];
    displayers = [];

    constructor(textData) {
        for (let text of textData) {
            // Declare a recursive function for making post requests for reading data
            let addReadings = (text) => {
                if (text.readers.length > 0) {
                    let nextReader = text.readers.pop();
                    postRequest(
                        ["title=" + text.title, "version=" + text.version, "reader=" + nextReader.username],
                        "../../private/researcher/getWindows.php",
                        () => {
                            this.addReading();
                            this.addReadings(readers);
                        },
                        // Record the next reading when the post request is answered
                        (windows) => {
                            let windowPath = new WindowPath(JSON.parse(windows));
                            this.addReading(nextReader, windowPath);
                            addReadings(text); // The function calls itself
                        }
                    );
                }
            }
            // Start gathering data
            addReadings();
        }
    }


    addReading(reader, windowPath) {
        try {
            let nextReading = new Reading(this.text, reader, windowPath);
            this.readings.push(nextReading);
            this.updateDisplay();
            this.progressDisplayer.addSuccess();
        } catch (e) {
            console.log(e);
            this.progressDisplayer.addFailure();
        }
    }

}
