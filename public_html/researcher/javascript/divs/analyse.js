var analysisManager;

function showAnalyseDiv() {
    // Retrieve the selected text
    let selText = selTexts[0];
    let title = selText.title;
    let version = selText.version;
    // Start analysis
    analysisManager = new AnalysisManager(title, version);
    // Show only the analysis div
    hideDivs("an");
}

class AnalysisManager {

    analyses = []; // Plural of analysis

    constructor(title, version) {
        this.title = title;
        this.version = version;
        postRequest(
            ["title=" + title, "version=" + version],
            "../../private/researcher/getTextString.php", this.handleTextResponse, alert
        );
    }

    handleTextResponse(responseJSON) {
        let response = JSON.parse(responseJSON);
        if (!response.success) {
            alert(response.message);
        } else {
            // Record the text
            this.text = response.message;
            // Request a list of readers who have read the text
            postRequest(
                ["title=" + title, "version=" + version],
                "../../private/researcher/getReaders.php", this.handleReadersResponse, alert
            );
        }
    }

    handleReadersResponse(responseJSON) {
        let response = JSON.parse(responseJSON);
        if (!response.success) {
            alert(response.message);
        } else {
            // Start data analysis
            this.readers = JSON.parse(response.message);
            this.handleWindowsResponse();
        }
    }

    handleWindowsResponse(responseJSON) {
        if (responseJSON !== undefined) {
            let response = JSON.parse(responseJSON);
            if (!response.success) {
                if (!window.confirm(response.message + "\n\nContinue making analysis requests?")) return;
            } else {
                // Process data
                let windows = JSON.parse(response.message);
                let analysis = new WindowPathAnalysis(windows, this.text);
                this.analyses.push({
                    reader: this.readers[this.analyses.length]
                    stats: analysis
                });
                this.updateAnalysis();
            }
        }
        if (this.analyses.length === this.readers.length) return; // All available data has been analysed
        // Request next data set
        postRequest(
            ["title=" + this.title, "version=" + this.version, "reader=" + this.readers[this.analyses.length].username],
            "../../private/researcher/getWindows.php", this.handleWindowsResponse, alert
        );
    }

    getProcessedAnalyses() {

    }

    updateAnalysis() {
        // Process analyses according to user inputs
        let analysisProcessor = new AnalysisProcessor(this.analyses);
        // Display processed list
        let displayer = new AnalysisDisplayer(analysisProcessor.getProcessedAnalyses());
        displayer.display();
    }

}

class AnalysisDisplayer {

    constructor(analyses) {
        this.analyses = analyses;
    }

    display() {

    }

}

class SortedNumberList {

    list = [];

    // O(log(n)) complexity search algorithm
    getIndex(number, list = this.list) {
        if (list.length === 0) return 0;
        let nextIndex = Math.floor(list.length / 2);
        let nextNumber = list[nextIndex];
        if (number === nextNumber) {
            return nextIndex;
        } else if (number > nextNumber) {
            return nextIndex + 1 + this.getIndex(number, list.slice(nextIndex + 1));
        } else {
            return 0 + this.getIndex(number, list.slice(0, nextIndex));
        }
    }

    insert(number) {
        let index = this.getIndex(number);
        this.list.splice(index, 0, number);
    }

    remove(number) {
        let index = this.getIndex(number);
        if (this.list[index] === number) {
            this.list.splice(index, 1);
            return true;
        }
        return false;
    }

    contains(number) {
        let index = this.getIndex(number);
        if (this.list[index] === number) return true;
        return false;
    }

    removeSmallest() {
        return this.list.shift();
    }

    getSmallest() {
        return this.list[0];
    }

}

/*
    The WindowPathProcessor class takes an array of form:
    [{
        leftmostChar: int
        rightmostChar: int
        openOffset: decimal
        closeOffset: decimal
    }, ...]

    and produces (via getPathDetails) an object of form:
    {
        charPath: [{
            charIndex: int
            gazeDuration: decimal
            firstFixationDuration: decimal
            spilloverTime: decimal
        }, ...]
        regressions: [{
            origin: {leftmostChar: int, rightmostChar: int}
            destination: {leftmostChar: int, rightmostChar, int}
            pathDuration: decimal
        }, ...]
    }
*/
class WindowPathAnalysis {

    characters = [];
    regressions = [];
    durationThreshold = 5; // Minimum gaze duration required for an analysis object to be considered

    constructor(windowPath, text) {
        // Initialise fields
        for (let i = 0; i < text.length; i++) {
            this.characters[i] = []; // Each character will have one analysis object for each time it is unmasked
        }
        // Initialise construction helper functions

        // Get the minimum gaze duration that will be considered a pause
        let getMinPauseTime = () => {
            // Initialise variables
            const pauseThresholdPercent = 5; // A window's openOffset must be in the highest pauseThresholdPercent% to count as a pause
            let windowCount = 0;
            let largestOffsets = new SortedNumberList();
            let offsetQuant = windowPath.length * (pauseThresholdPercent / 100);
            // Populate largestOffsets with the first values found
            while (windowCount < offsetQuant) {
                let nextOffset = windowPath[windowCount++].openOffset;
                largestOffsets.insert(nextOffset);
            }
            // Populate largestOffsets with the largest values found
            while (windowCount < windowPath.length) {
                let nextOffset = windowPath[windowCount++].openOffset;
                if (nextOffset > largestOffsets.getSmallest()) {
                    largestOffsets.removeSmallest();
                    largestOffsets.insert(nextOffset);
                }
            }
            // Return the threshold value
            return largestOffsets.getSmallest();
        }

        let isBefore = (newWindow, oldWindow) => {
            return newWindow.rightmostChar < oldWindow.rightmostChar // The windows are at the start of a line
                || newWindow.leftmostChar < oldWindow.leftmostChar; // The windows are at the end of a line
        }

        let isImmediatelyAfter = (oldWindow, newWindow) => {
            return oldWindow.rightmostChar + 1 === newWindow.rightmostChar // The windows are at the start of a line
                || oldWindow.rightmostChar + 2 === newWindow.rightmostChar
                || oldWindow.leftmostChar + 1 === newWindow.leftmostChar // The windows are at the end of a line
                || oldWindow.leftmostChar + 2 === newWindow.leftmostChar;
        }

        let getFixations = (window) => {
            // Initialise variables
            let fixations = [];
            let firstFixationDuration = 0;
            // Return if no argument
            if (window !== undefined) {
                let windowLength = 1 + window.rightmostChar - window.leftmostChar;
                //
                if (window.startOfLine === window.endOfLine) { // Spread time across all characters evenly
                    firstFixationDuration = window.duration / windowLength;
                    for (let i = window.leftmostChar; i <= window.rightmostChar; i++) {
                        charTimes.push({
                            charIndex: i,
                            duration: firstFixationDuration
                        });
                    }
                } else { // Prioritise left or right-side characters in time allocation
                    // firstFixationDuration = window.duration / (windowLength + (windowLength-1) + ... + 1)
                    firstFixationDuration = window.duration / (((windowLength * windowLength) + windowLength) / 2);
                    for (let i = window.leftmostChar; i <= window.rightmostChar; i++) {
                        charTimes.push({
                            charIndex: i,
                            duration: window.startOfLine ?
                                firstFixationDuration * (window.rightmostChar + 1 - i) : // Prioritise left side
                                firstFixationDuration * (i + 1 - window.leftmostChar) // Prioritise right side
                        });
                    }
                }
            }
            return {
                fixations: fixations,
                firstFixationDuration: firstFixationDuration
            };
        }

        let isWithin(charIndex, window) {
            return window === undefined ?
                false :
                charIndex >= newWindow.leftmostChar && charIndex <= newWindow.rightmostChar;
        }

        let getCurrentAnalysis(charIndex) => {
            let charAnalyses = this.characters[charIndex];
            return charAnalyses[charAnalyses.length-1];
        }

        // Record fixation data
        let recordFixations = (oldWindow, newWindow) => {
            // Initialise variables
            let newFixations = getFixations(newWindow);
            // Handle newly masked chars
            for (let charIndex = oldWindow.leftmostChar; charIndex <= oldWindow.rightmostChar; charIndex++) {
                if (!isWithin(charIndex, newWindow)) {
                    getCurrentAnalysis(charIndex).spilloverTime = newFixations.firstFixationTime;
                }
            }
            // Handle unmasked chars
            for (let fixation of newFixations.fixations) {
                if (isWithin(fixation.charIndex, oldWindow)) {
                    getCurrentAnalysis(charIndex).gazeDuration += fixation.duration;
                } else {
                    // Make a new analysis object for newly unmasked chars
                    this.characters[charIndex].push({
                        gazeDuration: newTime.duration,
                        firstFixationDuration: newFixations.firstFixationTime
                    });
                }
            }
        }

        let getWindowCopy(original) {
            return {
                leftmostChar: original.leftmostChar,
                rightmostChar: original.rightmostChar,
                duration: original.closeOffset,
            };
        }

        // Initialise analysis variables
        let minPauseTime = getMinPauseTime();
        let currentWindows = {
            previous: {
                leftmostChar: 0,
                rightmostChar: -1,
                isEndpoint: true
            },
            current: getWindowCopy(windowPath[0]),
            next: undefined
        };
        let unpassedRegressions = [];
        // Perform analysis
        for (let i = 1; i < windowPath.length; i++) {
            let currentWasAccepted = false;
            currentWindows.next = getWindowCopy(windowPath[i]);
            if (currentWindows.previous.isEndpoint) {
                if (
                    isImmediatelyAfter(currentWindows.current, currentWindows.next) &&
                    currentWindows.current.duration > minPauseTime
                ) {
                    currentWasAccepted = true;
                    currentWindows.current.isStart = true;
                    if (isBefore(currentWindows.current, currentWindows.previous)) {
                        // A regression was found
                        unpassedRegressions.push({
                            origin: currentWindows.previous,
                            destination: currentWindows.current,
                            pathDuration: 0
                        });
                    }
                }
            } else {
                currentWasAccepted = true;
                if (!isImmediatelyAfter(currentWindows.current, currentWindows.next)) {
                    currentWindows.current.isEndpoint = true;
                }
            }
            if (currentWasAccepted) {
                // Perform char analysis
                analyse(currentWindows.previous, currentWindows.current);
                currentWindows.previous = currentWindows.current;
                // Perform regression analysis
                for (let i = unpassedRegressions.length - 1; i >= 0; i--) {
                    let regression = unpassedRegressions[i];
                    regression.pathDuration += currentWindows.current.duration;
                    if (!isBefore(regression.origin, currentWindows.next)) {
                        this.regressions.push(regression);
                        unpassedRegressions.splice(i, 1);
                    }
                }
            }
            currentWindows.current = currentWindows.next;
        }
        // Record the final accepted fixation
        currentWindows.previous.endOfLine = true;
        recordFixations(currentWindows.previous);
    }

    // Filters by reader and discards reader information
    getFilteredAnalyses() {
        // Get filters
        let gender = document.getElementById("an_gender_sel").value;
        let impairment = document.getElementById("an_impairment_sel").value;
        let minAge = document.getElementById("an_min_age_sel").value;
        let maxAge = document.getElementById("an_max_age_sel").value;
        // Apply filters
        let filteredAnalyses = [];
        for (let analysis of unprocessedAnalyses) {
            let reader = analysis.reader;
            if (gender == "all" || reader.gender == gender) {
                if (impairment == "all" || (reader.isImpaired == true && impairment == "y") || (reader.isImpaired == false && impairment == "n")) {
                    if (reader.age >= minAge && reader.age <= maxAge) {
                        filteredAnalyses.push(analysis.stats); // reader is no longer relevant
                    }
                }
            }
        }
        // Return filtered list
        return filteredAnalyses;
    }

    // Discards undesired statistics and averages the requested statistic over the full list of analyses
    getAnalysis(unprocessedAnalyses) {
        let analyses = getFilteredAnalyses(unprocessedAnalyses);
        // Get reduction preferences
        let average = document.getElementById("an_average_sel").value;
        let statistic = document.getElementById("an_statistic_sel").value;
        // Perform reduction
        let reducedAnalyses = [];
        for (let analysis of analyses) {

        }
        // Return reduced list
        return reducedAnalyses;
    }

    //
    getTokenisedAnalysis(unprocessedAnalyses) {
        let analysis = getAnalysis(unprocessedAnalyses);
        // Get token
        let token = document.getElementById("an_token_sel").value;
        if (token == "char") {
            return analysis;
        } else {
            // Tokenise by word
            let tokenisedAnalyses = [];
            ...
            // Return tokenised list
            return tokenisedAnalyses;
        }
    }

    getProcessedAnalyses() {
        return getTokenisedAnalysis(this.analyses);
    }

}

// No longer used
class Analyser {

    constructor(charPath, regressions, text) {
        this.charPath = charPath;
        this.regressions = regressions;
        this.analysis = [];
        for (let charIndex in text) {
            this.analysis[charIndex] = {
                char: text[charIndex],
                gazeDuration: 0,
                spilloverTime: 0,
                regressionPathDuration: 0,
                regressionsIn: [],
                regressionsOut: []
            };
        }
        setGazeDurations();
        setRegressionPathDuration();
        setRegressionPathDuration();
        setRegressionPathDuration();

    }

    /*
        Note that the 'fixation' (where a character is considered fixated as long as it is unmasked)
        gaze durations associated with characters in this.charPath have been adjusted for line breaks
        by the getCharTimes method in the WindowPathProcessor class.
    */

    // First-fixation duration
    // In eye-tracking: the time between the reader's first fixation on a word and their next saccade
    // Here:
    setFirstFixationDuration() {

    }

    // Gaze duration
    // In eye-tracking: the time between the first saccades into and out of a word
    // Here: the time between first unmasking a character and re-masking it
    setGazeDurations() {
        for (char of this.charPath) {
            if (!this.analysis[char.charIndex].hasOwnProperty("gazeDuration")) {
                this.analysis[char.charIndex].gazeDuration = char.gazeDuration;
            }
        }
    }

    // Spillover time
    // In eye-tracking: the duration of the first fixation made after saccading past a word
    // Here: the assumed time spent looking at each character in the first window opened after first passing a character
    setSpilloverTimes() {

    }

    // Regression path duration
    // In eye-tracking: The time between first fixating a word and moving past it
    // Here: Same but for individual characters
    setRegressionPathDuration() {
        let regressionSourceChar = undefined;
        for (char of this.charPath) {
            // Already been done. Use regression.pathDuration

        }
    }

    // Regressions out
    // In eye-tracking: The number of times that a word is regressed from
    // Here: Same but for individual characters
    setRegressionsOut() {
        let prevChar = this.charPath[0];
        for (let i = 1; i <= this.charPath.length; i++) {
            let nextChar = this.charPath[i];
            if (!this.analysis[prevChar.charIndex].hasOwnProperty("spilloverTime")) {
                this.analysis[prevChar.charIndex].spilloverTime =
                    nextChar === undefined ? 0 : nextChar.gazeDuration;
            }
            prevChar = nextChar;
        }
    }

    // Regressions in
    // In eye-tracking: The number of times that a word is regressed to
    // Here: Same but for individual characters
    setRegressionsIn() {

    }

}
