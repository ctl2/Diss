const ComparisonNamespace = {};

ComparisonNamespace.StatisticDisplayer = class {

    constructor() {
        this.constructor.ageSlider.noUiSlider.on(
            "slide",
            (values, handleIndex) => this.changeFilter("Age", values[handleIndex], handleIndex)
        );
        this.constructor.wpmSlider.noUiSlider.on(
            "slide",
            (values, handleIndex) => this.changeFilter("WPM", values[handleIndex], handleIndex)
        );
        this.constructor.widthSlider.noUiSlider.on(
            "slide",
            (values, handleIndex) => this.changeFilter("InnerWidth", values[handleIndex], handleIndex)
        );
    }

}

import("../../../../node_modules/nouislider/distribute/nouislider.min.js").then(
    (sliderModule) => {
        // Set up slider elements
        ComparisonNamespace.StatisticDisplayer.ageSlider = new LibNamespace.Slider('comp_age', 0, 100);
        ComparisonNamespace.StatisticDisplayer.wpmSlider = new LibNamespace.Slider('comp_wpm', 0, 500);
        ComparisonNamespace.StatisticDisplayer.widthSlider = new LibNamespace.Slider('comp_inner_width', 0, 2000);
    }
)

ComparisonNamespace.ReadingManager = class {

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

function showCompareDiv() {

    // Show only the comparison div
    hideDivs("comp");
}
