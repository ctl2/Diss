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
                let pathDetails = new WindowToCharPathConvertor(windows).getPathDetails();
                let analyser = new Analyser(pathDetails.charPath, pathDetails.regressions, this.text);
                this.analyses.push({
                    reader: this.readers[this.analyses.length]
                    stats: analyser.analysis
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

class AnalysisProcessor {

    constructor(analyses) {
        this.analyses = analyses;
    }

    // Filters by reader and discards reader information
    getFilteredAnalyses(unprocessedAnalyses) {
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

class AnalysisDisplayer {

    constructor(analyses) {
        this.analyses = analyses;
    }

    display() {

    }

}

class SortedNumberList {

    list = [];

    removeSmallest() {
        return this.list.shift();
    }

    getSmallest() {
        return this.list[0];
    }

    // O(log(n)) complexity search algorithm
    contains(number, list = this.list) {
        if (list.length === 0) return false;
        let nextIndex = Math.floor(list.length / 2);
        let nextNumber = list[nextIndex];
        if (number === nextNumber) {
            return true;
        } else if (number > nextNumber) {
            return this.contains(number, list.slice(nextIndex + 1));
        } else {
            return this.contains(number, list.slice(0, nextIndex));
        }
    }

    // O(log(n)) complexity search algorithm
    getIndex(number, list = this.list) {
        if (list.length === 0) return 0;
        let nextIndex = Math.floor(list.length / 2);
        let nextNumber = list[nextIndex];
        if (number > nextNumber) {
            return nextIndex + 1 + this.getIndex(number, list.slice(nextIndex + 1));
        } else {
            return 0 + this.getIndex(number, list.slice(0, nextIndex));
        }
    }

    insert(number) {
        let index = this.getIndex(number);
        this.list.splice(index, 0, number);
    }

}

class WindowToCharPathConvertor {

    constructor(windowPath) {
        this.windowPath = windowPath;
        this.minPauseTime = this.getMinPauseTime();
    }

    // Get the minimum fixation duration that will be considered a pause
    getMinPauseTime() {
        // Initialise variables
        const pauseThresholdPercent = 5; // A window's openOffset must be in the highest pauseThresholdPercent% to count as a pause
        let windowCount = 0;
        let largestOffsets = new SortedNumberList();
        let offsetQuant = this.windowPath.length * (pauseThresholdPercent / 100);
        // Populate largestOffsets with the first values found
        while (windowCount < offsetQuant) {
            let nextOffset = this.windowPath[windowCount++].openOffset;
            largestOffsets.insert(nextOffset);
        }
        // Populate largestOffsets with the largest values found
        while (windowCount < this.windowPath.length) {
            let nextOffset = this.windowPath[windowCount++].openOffset;
            if (nextOffset > largestOffsets.getSmallest()) {
                largestOffsets.removeSmallest();
                largestOffsets.insert(nextOffset);
            }
        }
        // Return the threshold value
        return largestOffsets.getSmallest();
    }

    isBefore(newWindow, oldWindow) {
        return newWindow.rightmostChar < oldWindow.rightmostChar // The windows are at the start of a line
            || newWindow.leftmostChar < oldWindow.leftmostChar; // The windows are at the end of a line
    }

    isIntraLineSingleStepForward(oldWindow, newWindow) {
        return oldWindow.rightmostChar + 1 === newWindow.rightmostChar // The windows are at the start of a line
            || oldWindow.rightmostChar + 2 === newWindow.rightmostChar
            || oldWindow.leftmostChar + 1 === newWindow.leftmostChar // The windows are at the end of a line
            || oldWindow.leftmostChar + 2 === newWindow.leftmostChar;
    }

    isInterLineSingleStepForward(oldWindow, newWindow) {
        return oldWindow.rightmostChar + 1 === newWindow.leftmostChar;
    }

    getCharTimes(charWindow) {
        let charTimes = [];
        let windowTime = charWindow.closeOffset;
        let windowLength = charWindow.rightmostChar + 1 - charWindow.leftmostChar;
        //
        if (charWindow.startOfLine === charWindow.endOfLine) { // Spread time across all characters evenly
            let timeFragment = windowTime / windowLength;
            for (let i = charWindow.leftmostChar; i <= charWindow.rightmostChar; i++) {
                charTimes.push({
                    charIndex: i,
                    duration: timeFragment
                });
            }
        } else { // Prioritise left or right-side characters in time allocation
            // timeFragment = newWindowTime / (newWindowLength + (newWindowLength-1) + ... + 1)
            let timeFragment = windowTime / (((windowLength * windowLength) + windowLength) / 2);
            for (let i = charWindow.leftmostChar; i <= charWindow.rightmostChar; i++) {
                let duration;
                if (charWindow.startOfLine) { // Prioritise left side
                    duration = timeFragment * (charWindow.rightmostChar + 1 - i);
                } else { // Prioritise right side
                    duration = timeFragment * (i + 1 - charWindow.leftmostChar);
                }
                charTimes.push({
                    charIndex: i,
                    duration: duration
                });
            }
        }
        //
        return charTimes;
    }

    addWindowToPath(path, curCharTimes, newWindow) {
        const durationThreshold = 5;
        // Get time values for the chars in newWindow
        let newCharTimes = newWindow === undefined ? [] : this.getCharTimes(newWindow);
        // Loop through the current list of fixated chars
        for (let curTime of curCharTimes) {
            if (newWindow !== undefined && curTime.charIndex >= newWindow.leftmostChar && curTime.charIndex <= newWindow.rightmostChar) {
                // The currently fixated char is in the new window
                newCharTimes[curTime.charIndex - newWindow.leftmostChar].duration += curTime.duration; // Combine their durations
            } else if (curTime.duration > durationThreshold) {
                // The char was passed and fixated for a substantial length of time
                path.push(curTime);
            }
        }
        // Return the updated list of current char times
        return newCharTimes;
    }

    //
    getPathDetails() {
        //
        let prevCriticalWindow = undefined;
        let prevUncriticalWindow = undefined;
        let curCriticalChars = [];
        let criticalCharPath = [];
        let unpassedRegressions = [];
        let passedRegressions = [];
        //
        for (let curWindow of this.windowPath) {
            let accepted = false;
            let startOfLine = false;
            // Each branch of this if statement corresponds to a different path continuation type
            if (prevCriticalWindow === undefined) {
                // The path's start point was found
                accepted = true;
                startOfLine = true;
            } else if (prevUncriticalWindow === undefined) {
                // The current path is not a regression or line-break
                if (this.isIntraLineSingleStepForward(prevCriticalWindow, curWindow)) {
                    // A normal path-continuation (1 character forward) was found
                    curCriticalChars = this.addWindowToPath(criticalCharPath, curCriticalChars, prevCriticalWindow);
                    accepted = true;
                }
            } else if (this.isInterLineSingleStepForward(prevCriticalWindow, curWindow)) {
                // A line-break from prevCriticalWindow to curWindow was found
                prevCriticalWindow.endOfLine = true;
                curCriticalChars = this.addWindowToPath(criticalCharPath, curCriticalChars, prevCriticalWindow);
                accepted = true;
                startOfLine = true;
            } else if (this.isIntraLineSingleStepForward(prevUncriticalWindow, curWindow) && prevUncriticalWindow.closeOffset > this.minPauseTime) {
                // A regression from prevCriticalWindow to prevUncriticalWindow was found
                unpassedRegressions.push({
                    origin: prevCriticalWindow,
                    destination: prevUncriticalWindow,
                    pathDuration: 0
                });
                prevCriticalWindow.endOfLine = true;
                curCriticalChars = this.addWindowToPath(criticalCharPath, curCriticalChars, prevCriticalWindow);
                prevUncriticalWindow.startOfLine = true;
                curCriticalChars = this.addWindowToPath(criticalCharPath, curCriticalChars, prevUncriticalWindow);
                accepted = true;
            }
            // Accept or reject the current window
            if (accepted) {
                // Update regressions' status and path duration
                for (let i = unpassedRegressions.length - 1; i >= 0; i--) {
                    let unpassedRegression = unpassedRegressions[i];
                    if (this.isBefore(unpassedRegression.origin, curWindow)) {
                        unpassedRegression.pathDuration += curWindow.openOffset + curWindow.closeOffset;
                    } else {
                        unpassedRegression.pathDuration += curWindow.openOffset;
                        passedRegressions.push(unpassedRegression);
                        unpassedRegressions.splice(i, 1);
                    }
                }
                // Update window variables
                prevUncriticalWindow = undefined; // Don't search for a line-break or regression on the next pass
                prevCriticalWindow = Object.assign({}, curWindow); // Update the most recently accepted window (shallow copy)
                prevCriticalWindow.startOfLine = startOfLine;
                prevCriticalWindow.endOfLine = false;
            } else {
                prevUncriticalWindow = curWindow;
            }
        }
        // Treat prevCriticalWindow as a line end
        prevCriticalWindow.endOfLine = true;
        curCriticalChars = this.addWindowToPath(criticalCharPath, curCriticalChars, prevCriticalWindow);
        this.addWindowToPath(criticalCharPath, curCriticalChars); // Add all leftover chars to the path
        // Return path
        return {
            charPath: criticalCharPath,
            regressions: regressions
        };
    }

}

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
        durations associated with characters in this.charPath have been adjusted for line breaks by the
        getCharTimes method in the WindowToCharPathConvertor class.
    */

    // Gaze duration
    // In eye-tracking: the time between the first saccades into and out of a word
    // Here: the time between first unmasking a character and re-masking it
    setGazeDurations() {
        for (char of this.charPath) {
            if (!this.analysis[char.charIndex].hasOwnProperty("gazeDuration")) {
                this.analysis[char.charIndex].gazeDuration = char.duration;
            }
        }
    }

    // Already been done. Use regression.pathDuration
    setRegressionPathDuration() {
        let regressionSourceChar = undefined;
        for (char of this.charPath) {

        }
    }

    setRegressionsOut() {
        let prevChar = this.charPath[0];
        for (let i = 1; i <= this.charPath.length; i++) {
            let nextChar = this.charPath[i];
            if (!this.analysis[prevChar.charIndex].hasOwnProperty("spilloverTime")) {
                this.analysis[prevChar.charIndex].spilloverTime =
                    nextChar === undefined ? 0 : nextChar.duration;
            }
            prevChar = nextChar;
        }
    }

    setRegressionsIn() {

    }

}
