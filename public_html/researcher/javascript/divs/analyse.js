function showAnalyseDiv() {
    // Retrieve the selected text
    let selText = selTexts[0];
    let title = selText.title;
    let version = selText.version;
    // Request readers
    postRequest(
        ["title=" + title, "version=" + version],
        "../../private/researcher/getReaders.php",
        window.alert,
        (readersJSON) => {
            // Handle readers
            let readers = JSON.parse(readersJSON);
            if (Object.keys(readers).length === 0) {
                window.alert("No reading data is yet available for this text.");
            } else {
                // Request text
                postRequest(
                    ["title=" + title, "version=" + version],
                    "../../private/researcher/getTextString.php",
                    window.alert,
                    (text) => {
                        // Handle text
                        let readings = new Readings(text, readers);
                        // readings.something()
                    }
                );
            }
        }
    );
    // Show only the analysis div
    hideDivs("an");
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

class Reader {

    constructor(reader) {
        this.gender = reader.gender;
        this.age = reader.age;
        this.isImpaired = reader.isImpaired;
    }

    isWithinGroup(gender, impairment, minAge, maxAge) {
        return (
            // Gender check
            gender == "all" ||
            gender == this.gender
        ) && (
            // Impairment check
            impairment == "all" ||
            (impairment == "y" && this.isImpaired == true) ||
            (impairment == "n" && this.isImpaired == false)
        ) && (
            // Age check
            minAge <= this.age &&
            maxAge >= this.age
        )
    }

}

class Fixation {

    durationThreshold = 5; // Minimum gaze duration required for an analysis object to be considered

    constructor(charIndex, firstFixationTime, gazeDuration) {
        this.charIndex = charIndex;
        this.firstFixationTime = firstFixationTime;
        this.gazeDuration = gazeDuration;
    }

    extendFixation(fixation) {
        this.gazeDuration += fixation.gazeDuration;
    }

    endFixation(spilloverTime) {
        this.spilloverTime = spilloverTime;
    }

    isSubstantial() {
        return this.gazeDuration > this.durationThreshold;
    }

}

class Window {

    constructor(data) {
        if (data === undefined) {
            // Represents the first window of a reading session
            this.leftmostChar = 0;
            this.rightmostChar = -1;
            this.duration = 0;
            this.isPathStart = true;
            this.isPathEnd = true;
        } else {
            this.leftmostChar = data.leftmostChar;
            this.rightmostChar = data.rightmostChar;
            this.duration = data.duration;
            this.isPathEnd = false;
            this.isPathStart = false;
        }
    }

    isBefore(window) {
        return this.rightmostChar < window.rightmostChar // The windows are at the start of a line
            || this.leftmostChar < window.leftmostChar; // The windows are at the end of a line
    }

    isImmediatelyBefore(window) {
        return this.rightmostChar + 1 === window.rightmostChar // The windows are at the start of a line
            || this.rightmostChar + 2 === window.rightmostChar
            || this.leftmostChar + 1 === window.leftmostChar // The windows are at the end of a line
            || this.leftmostChar + 2 === window.leftmostChar;
    }

    getFixations() {
        // Initialise variables
        let fixations = [];
        let windowLength = 1 + this.rightmostChar - this.leftmostChar;
        //
        if (this.isPathStart === this.isPathEnd) { // Spread time across all characters evenly
            firstFixationDuration = this.duration / windowLength;
            for (let i = this.leftmostChar; i <= this.rightmostChar; i++) {
                let newFixation = new Fixation(i, firstFixationDuration, firstFixationDuration);
                fixations.push(newFixation);
            }
        } else { // Prioritise left or right-side characters in time allocation
            // gazeDuration = window.duration / (windowLength + (windowLength-1) + ... + 1)
            firstFixationDuration = this.duration / (((windowLength * windowLength) + windowLength) / 2);
            for (let i = this.leftmostChar; i <= this.rightmostChar; i++) {
                let gazeDuration = this.isPathStart ?
                    firstFixationDuration * (this.rightmostChar + 1 - i): // Prioritise left side
                    firstFixationDuration * (i + 1 - this.leftmostChar); // Prioritise right side
                let newFixation = new Fixation(i, firstFixationDuration, gazeDuration);
                fixations.push(newFixation);
            }
        }
        return fixations;
    }

    contains(charIndex) => {
        charIndex >= this.leftmostChar && charIndex <= this.rightmostChar;
    }

}

class WindowPath {

    constructor(path) {
        this.path = path.map(
            (window) => new Window(window)
        );
    }

    getLength() {
        return this.path.length;
    }

    // Get the minimum gaze duration that will be considered a pause
    getMinPauseTime() {
        // Initialise variables
        const pauseThresholdPercent = 5; // A window's openOffset must be in the highest pauseThresholdPercent% to count as a pause
        let windowCount = 0;
        let largestOffsets = new SortedNumberList();
        let offsetQuant = this.getLength() * (pauseThresholdPercent / 100);
        // Populate largestOffsets with the first values found
        while (windowCount < offsetQuant) {
            let nextOffset = this.getWindow(windowCount++).duration;
            largestOffsets.insert(nextOffset);
        }
        // Populate largestOffsets with the largest values found
        while (windowCount < this.getLength()) {
            let nextOffset = this.getWindow(windowCount++).duration;
            if (nextOffset > largestOffsets.getSmallest()) {
                largestOffsets.removeSmallest();
                largestOffsets.insert(nextOffset);
            }
        }
        // Return the threshold value
        return largestOffsets.getSmallest();
    }

    getWindow(pathIndex) {
        return pathIndex < 0 ?
            new Window():
            this.path[pathIndex];
    }

}

class Regression {

    pathDuration = 0;

    constructor(origin, destination) {
        this.origin = origin;
        this.destination = destination;
    }

    addToPath(window) {
        this.pathDuration += window.duration;
    }

    startedBefore(window) {
        return this.origin.isBefore(currentWindows.next);
    }

}

class Reading {

    fixations = [];
    regressions = [];

    constructor(text, reader, windowPath) {
        // Initialise fields
        this.reader = new Reader(reader);
        for (let i = 0; i < text.length; i++) {
            this.fixations[i] = []; // Each character will have one Fixation object for each time it is newly unmasked
        }

        // Declare construction helper functions

        // Record fixation data
        let recordFixations = (oldWindow, newWindow) => {
            // Initialise variables
            let newFixations = newWindow.getFixations();
            // Handle newly masked chars
            for (let charIndex = oldWindow.leftmostChar; charIndex <= oldWindow.rightmostChar; charIndex++) {
                if (!newWindow.contains(charIndex)) {
                    let charFixations = this.fixations[charIndex];
                    let currentFixation = charFixations[charFixations.length-1];
                    if (!currentFixation.isSubstantial()) {
                        // Discard fixation
                        charFixations.pop();
                    } else {
                        // Accept fixation
                        currentFixation.spilloverTime = newFixations.firstFixationTime;
                    }
                }
            }
            // Handle unmasked chars
            for (let newFixation of newFixations.fixations) {
                let charFixations = this.fixations[newFixation.charIndex];
                if (oldWindow.contains(charIndex)) {
                    let currentFixation = charFixations[charFixations.length-1];
                    currentFixation.extendFixation(newFixation);
                } else {
                    // Make a new analysis object for newly unmasked chars
                    charFixations.push(newFixation);
                }
            }
        }

        // Initialise analysis variables
        let minPauseTime = windowPath.getMinPauseTime();
        let currentWindows = {
            previous: windowPath.getWindow(-1),
            current: windowPath.getWindow(0),
            next: undefined
        };
        let unpassedRegressions = [];
        // Perform analysis
        for (let i = 1; i < windowPath.getLength(); i++) {
            let currentWasAccepted = false;
            currentWindows.next = windowPath.getWindow(i);
            if (currentWindows.previous.isPathEnd) {
                if (
                    currentWindows.current.isImmediatelyBefore(currentWindows.next) &&
                    currentWindows.current.duration > minPauseTime
                ) {
                    // A new path start-point was found. May be a jump forward, a regression or a new line.
                    currentWasAccepted = true;
                    currentWindows.current.isPathStart = true;
                    if (currentWindows.current.isBefore(currentWindows.previous)) {
                        // A regression was found
                        let newRegression = new Regression(
                            currentWindows.previous,
                            currentWindows.current
                        );
                        unpassedRegressions.push(newRegression);
                    }
                }
            } else {
                currentWasAccepted = true;
                if (!currentWindows.current.isImmediatelyBefore(currentWindows.next)) {
                    currentWindows.current.isPathEnd = true;
                }
            }
            if (currentWasAccepted) {
                // Perform char analysis
                recordFixations(currentWindows.previous, currentWindows.current);
                currentWindows.previous = currentWindows.current;
                // Perform regression analysis
                for (let i = unpassedRegressions.length - 1; i >= 0; i--) {
                    let regression = unpassedRegressions[i];
                    regression.addToPath(currentWindows.current);
                    if (regression.startedBefore(currentWindows.next)) {
                        this.regressions.push(regression);
                        unpassedRegressions.splice(i, 1);
                    }
                }
            }
            currentWindows.current = currentWindows.next;
        }
        // Record the final accepted fixation
        currentWindows.previous.isPathEnd = true;
        recordFixations(currentWindows.previous);
    }

    isRelevant(gender, impairment, minAge, maxAge) {
        return this.reader.isWithinGroup(gender, impairment, minAge, maxAge);
    }

    getStatisticByToken(statistic, token) {
        if (token == "char") {
            return analysis;
        } else {
            // Tokenise by word
            let tokenisedAnalyses = [];
            //...
            // Return tokenised list
            return tokenisedAnalyses;
        }
    }

}

class Readings {

    readings = [];

    constructor(text, title, version, readers) {
        this.text = text;
        //
        let addReadings = (readers) => {
            if (readers.length === 0) return;
            let nextReader = readers.pop();
            postRequest(
                ["title=" + title, "version=" + version, "reader=" + nextReader.username,
                "../../private/researcher/getWindows.php",
                window.alert,
                // Add the next reading
                (windows) => {
                    let nextReading = new Reading(text, reader, windows);
                    this.readings.push(nextReading);
                    addReadings(readers);
                }
            );
        };
        addReadings(Object.assign({}, readers));
    }

    getMean(statistics) {
        let reductionStartPoint = statistics[0];
        if (isNaN(reductionStartPoint[0])) {
            // Regression statistic
            return statistics.reduce(
                (averageStats, curStats, statCount) => {
                    for (let charIndex in curStats) {
                        let curStat = curStats[charIndex];
                        let averageStat = averageStats[charIndex];
                        let difference = curStat.value - averageStat.value;
                        return {
                            value: averageStat.value + (difference / (statCount + 1)),
                            windows: averageStat.windows.concat(curStat.windows)
                        };
                    }
                }, reductionStartPoint.map(
                    (stat) => {
                        value: stat.value,
                        windows: [] // Remove windows to avoid including two copies of reductionStartPoint's windows
                    }
                )
            );
        } else {
            // Fixation statistic
            return statistics.reduce(
                (averageStats, curStats, statCount) => {
                    for (let charIndex in curStats) {
                        let curStat = curStats[charIndex];
                        let averageStat = averageStats[charIndex];
                        let difference = curStat - averageStat;
                        return averageStat + (difference / (statCount + 1));
                    }
                }, reductionStartPoint
            )
        }
    }

    // Should be feasible via the SortedList class
    getMedian() {

    }

    getRelevantStatisticAverageByToken(statistic, token, average, gender, impairment, minAge, maxAge) {
        let relevantReadings = this.readings.filter(
            (reading) => reading.isRelevant(gender, impairment, minAge, maxAge)
        )
        let statistics = relevantReadings.map(
            (reading) => getStatisticByToken(statistic, token);
        );
        return this.getMean(statistics);
    }

}

class AnalysisDisplayer {

    constructor(readings, isFinished) {
        let relevantReadings = readings.getRelevantReadings(
            document.getElementById("an_gender_sel").value,
            document.getElementById("an_impairment_sel").value,
            document.getElementById("an_min_age_sel").value,
            document.getElementById("an_max_age_sel").value,
        );
        let relevantReadingValues = relevantReadings.map(
            (reading) => {
                reading.getValues(
                    document.getElementById("an_statistic_sel").value,
                    document.getElementById("an_first_only_check").checked,
                    document.getElementById("an_token_sel").value,
                )
            }
        );

        this.isFinished = isFinished;
    }

    display() {

    }

}
