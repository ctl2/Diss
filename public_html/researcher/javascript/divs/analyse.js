var readingManager;

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
                        readingManager = new ReadingManager(text, title, version, readers);
                    }
                );
            }
        }
    );
    // Show only the analysis div
    hideDivs("an");
}

class SortedNumberList extends Array {

    constructor() {
        super();
    }

    // O(log(n)) complexity search algorithm
    getIndex(number, list = this) {
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
        this.splice(index, 0, number);
    }

    remove(number) {
        let index = this.getIndex(number);
        if (this[index] === number) {
            this.splice(index, 1);
            return true;
        }
        return false;
    }

    contains(number) {
        let index = this.getIndex(number);
        if (this[index] === number) return true;
        return false;
    }

    removeSmallest() {
        return this.shift();
    }

    getSmallest() {
        return this[0];
    }

    getSum() {
        return this.reduce(
            (total, curNumber) => total + curNumber
        );
    }

    getMedian() {
        return this[Math.floor(this.length / 2)];
    }

    getMean() {
        return (this.length === 0)?
            0:
            this.getSum() / (this.length);
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

    durationThreshold = 8; // Minimum gaze duration required for an analysis object to be considered

    constructor(charIndex, firstFixationDuration, gazeDuration) {
        this.charIndex = charIndex;
        this.firstFixationDuration = firstFixationDuration;
        this.gazeDuration = gazeDuration;
    }

    extendFixation(fixation) {
        this.gazeDuration += fixation.gazeDuration;
    }

    // The argument is the first window that doesn't include this character after its initial fixation
    endFixation(spilloverWindow) {
        this.spilloverTime = spilloverWindow.firstFixationDuration;
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
            this.isPathEnd = true;
            this.duration = 0;
        } else {
            this.focalChar = data.focalChar;
            this.leftmostChar = data.leftmostChar;
            this.rightmostChar = data.rightmostChar;
            this.duration = data.duration;
            this.isPathEnd = false;
            this.isPathStart = false;
        }
    }

    isSmallerThan(window) {
        return (this.rightmostChar - this.leftmostChar) < (window.rightmostChar - window.leftmostChar);
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
        let windowLength = 1 + this.rightmostChar - this.leftmostChar;
        let fixations = [];
        let firstFixationDuration;
        //
        if (windowLength > 0) {
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
                    let gazeDuration =
                        this.isPathStart?
                        firstFixationDuration * (this.rightmostChar + 1 - i): // Prioritise left side
                        firstFixationDuration * (i + 1 - this.leftmostChar); // Prioritise right side
                     // The first fixation on a line tends to be longer than other fixations due to a lack of preprocessing
                     // K Rayner, 1977, Visual attention in reading: Eye movements reflect cognitive processes
                    if (this.isPathStart) gazeDuration *= 0.7;
                    let newFixation = new Fixation(i, firstFixationDuration, gazeDuration);
                    fixations.push(newFixation);
                }
            }
            if (this.isPathStart) fixations[0].isPathStart = true;
            if (this.isPathEnd) fixations[windowLength-1].isPathEnd = true;
        }
        //
        return {
            fixations: fixations,
            firstFixationDuration: firstFixationDuration
        };
    }

    contains(charIndex) {
        return charIndex >= this.leftmostChar && charIndex <= this.rightmostChar;
    }

}

class WindowPath extends Array {

    constructor(windows) {
        super();
        for (let window of windows) {
            this.push(new Window(window));
        }
    }

    // Get the minimum gaze duration that will be considered a pause
    getMinPauseTime() {
        // Initialise variables
        const pauseThresholdPercent = 5; // A window's openOffset must be in the highest pauseThresholdPercent% to count as a pause
        let windowCount = 0;
        let largestOffsets = new SortedNumberList();
        let offsetQuant = this.length * (pauseThresholdPercent / 100);
        // Populate largestOffsets with the first values found
        while (windowCount < offsetQuant) {
            let nextOffset = this.getWindow(windowCount++).duration;
            largestOffsets.insert(nextOffset);
        }
        // Populate largestOffsets with the largest values found
        while (windowCount < this.length) {
            let nextOffset = this.getWindow(windowCount++).duration;
            if (nextOffset > largestOffsets.getSmallest()) {
                largestOffsets.removeSmallest();
                largestOffsets.insert(nextOffset);
            }
        }
        // Return the threshold value
        return largestOffsets.getMean();
    }

    getWindow(pathIndex) {
        return (pathIndex < 0)?
            new Window():
            this[pathIndex];
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
        return this.origin < window.focalChar;
    }

}

class Character {

    fixations = [];
    regressionsOut = [];
    regressionsIn = [];

    constructor(isLineStart) {
        this.isLineStart = isLineStart
    }

}

class Reading {

    characters = [];

    constructor(text, reader, windowPath) {
        // Initialise fields
        this.reader = new Reader(reader);

        // Get line end info
        let lineStartIndexes = new SortedNumberList();
        let curWindow = windowPath[windowPath.length - 1];
        let foundLineEnd = false;
        // Search the path
        for (let nextWindow of windowPath) {
            if (curWindow.isSmallerThan(nextWindow) && curWindow.leftmostChar  === nextWindow.leftmostChar) {
                lineStartIndexes.insert(curWindow.leftmostChar);
            }
            curWindow = nextWindow;
        }

        // Make character objects
        for (let i = 0; i < text.length; i++) {
            let isLineStart = lineStartIndexes.contains(i);
            this.characters[i] = new Character(isLineStart);
        }

        // Declare construction helper functions

        // Record fixation data
        let recordFixations = (oldWindow, newWindow) => {
            // Initialise variables
            let newFixations = newWindow.getFixations();
            // Handle newly masked chars
            for (let charIndex = oldWindow.leftmostChar; charIndex <= oldWindow.rightmostChar; charIndex++) {
                if (!newWindow.contains(charIndex)) {
                    let charFixations = this.characters[charIndex].fixations;
                    let currentFixation = charFixations[charFixations.length-1];
                    currentFixation.endFixation(newFixations);
                }
            }
            // Handle unmasked chars
            for (let newFixation of newFixations.fixations) {
                let charFixations = this.characters[newFixation.charIndex].fixations;
                if (oldWindow.contains(newFixation.charIndex)) {
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
        let leftmostUnfixatedCharIndex = 0;
        // Perform analysis
        for (let i = 1; i < windowPath.length; i++) {
            let currentWasAccepted = false;
            currentWindows.next = windowPath.getWindow(i);
            if (currentWindows.previous.isPathEnd) {
                if (
                    currentWindows.current.isImmediatelyBefore(currentWindows.next) &&
                    (
                        currentWindows.current.contains(leftmostUnfixatedCharIndex) ||
                        currentWindows.current.duration > minPauseTime
                    )
                ) {
                    // A new path start-point was found. May be a jump forward, a regression or a new line.
                    currentWasAccepted = true;
                    currentWindows.current.isPathStart = true;
                    if (currentWindows.current.isBefore(currentWindows.previous)) {
                        // A regression was found
                        let newRegression = new Regression(
                            currentWindows.previous.focalChar,
                            currentWindows.current.focalChar
                        );
                        unpassedRegressions.push(newRegression);
                    }
                }
            } else {
                currentWasAccepted = true;
                if (!currentWindows.current.isImmediatelyBefore(currentWindows.next) || currentWindows.next.duration < 8) {
                    currentWindows.current.isPathEnd = true;
                }
            }
            if (currentWasAccepted) {
                // Update leftmost unseen char index
                leftmostUnfixatedCharIndex = Math.max(
                    leftmostUnfixatedCharIndex,
                    currentWindows.current.rightmostChar + 1
                );
                // Perform char analysis
                recordFixations(currentWindows.previous, currentWindows.current);
                // Perform regression analysis
                for (let i = unpassedRegressions.length - 1; i >= 0; i--) {
                    let regression = unpassedRegressions[i];
                    regression.addToPath(currentWindows.current);
                    if (regression.startedBefore(currentWindows.next)) {
                        this.characters[regression.origin].regressionsOut.push({
                            other: regression.destination,
                            pathDuration: regression.pathDuration
                        });
                        this.characters[regression.destination].regressionsIn.push({
                            other: regression.origin,
                            pathDuration: regression.pathDuration
                        });
                        unpassedRegressions.splice(i, 1);
                    }
                }
                // Update most recently accepted char
                currentWindows.previous = currentWindows.current;
            }
            // Update current candidate char
            currentWindows.current = currentWindows.next;
        }
        // Record the final accepted fixation
        currentWindows.previous.isPathEnd = true;
        recordFixations(currentWindows.previous, new Window());
    }

    isRelevant(gender, impairment, minAge, maxAge) {
        return this.reader.isWithinGroup(gender, impairment, minAge, maxAge);
    }

}

class TokenAnalysis {

    charLength = 1;
    regressionInOrigins = {};
    regressionOutDestinations = {};

    constructor(character = new Character()) {
        if (character.fixations.length === 0) {
            this.isLineStart = NaN;
            this.isLineStart = NaN;
            this.firstFixationDuration = NaN;
            this.gazeDuration = NaN;
            this.spilloverTime = NaN;
            this.totalReadingTime = NaN;
            this.regressionsInCount = NaN;
            this.regressionsInTime = NaN;
            this.regressionsOutCount = NaN;
            this.regressionsOutTime = NaN;
        } else {
            // Helper function
            let addRegressions = (regressions, statistic) => {
                for (let regression of regressions) {
                    this.addNewRegressionObject(statistic, regression.other);
                    this[statistic][regression.other].count++;
                    this[statistic][regression.other].duration += regression.pathDuration;
                }
            };
            // Get the first fixation of this character
            let firstFixation = character.fixations[0]
            // Set fields
            this.isLineStart = character.isLineStart;
            this.firstFixationDuration = firstFixation.firstFixationDuration; // First fixation's first-fixation time
            this.gazeDuration = firstFixation.gazeDuration; // First fixation's gaze duration
            this.spilloverTime = firstFixation.spilloverTime; // First fixation's spillover time
            this.totalReadingTime = character.fixations.reduce(
                (totalReadingTime, nextFixation) => totalReadingTime + nextFixation.gazeDuration,
                0
            ); // Sum of gaze durations over all fixations
            this.regressionsInCount = character.regressionsIn.length; // Total regressions in
            this.regressionsInTime = character.regressionsIn.reduce(
                (regressionsInTime, nextRegression) => regressionsInTime + nextRegression.pathDuration,
                0
            ); // Total path time of of all regessions in
            addRegressions(character.regressionsIn, "regressionInOrigins");
            this.regressionsOutCount = character.regressionsOut.length; // Total regressions out
            this.regressionsOutTime = character.regressionsOut.reduce(
                (regressionsOutTime, nextRegression) => regressionsOutTime + nextRegression.pathDuration,
                0
            ); // Total path time of of all regessions out
            addRegressions(character.regressionsOut, "regressionOutDestinations");
        }
    }

    addNewRegressionObject(statistic, key) {
        if (!this[statistic].hasOwnProperty(key)) {
            this[statistic][key] = {
                count: 0,
                duration: 0
            };
        }
    }

    mergeRegressions(statistic, newToken) {
        for (let key in newToken[statistic]) {
            this.addNewRegressionObject(statistic, key);
            this[statistic][key].count++;
            this[statistic][key].duration += newToken[statistic][key].duration;
        }
    }

    setNewAverage(statistic, newToken) {
        this[statistic] += (newToken[statistic] - this[statistic]) / this.charLength
    }

    addCharacter(character) {
        this.charLength++;
        let characterAnalysis = new TokenAnalysis(character);
        // First fixation duration is that of the new leftmost character
        // Spillover time is that of the new rightmost character
        this.spilloverTime = characterAnalysis.spilloverTime;
        // Regression path data is summed
        this.mergeRegressions("regressionInOrigins", characterAnalysis);
        this.mergeRegressions("regressionOutDestinations", characterAnalysis);
        // Everything else uses the mean of all character values
        // This prevents longer words from having inherently higher gaze durations, etc.
        this.setNewAverage("gazeDuration", characterAnalysis);
        this.setNewAverage("totalReadingTime", characterAnalysis);
        this.setNewAverage("regressionsInCount", characterAnalysis);
        this.setNewAverage("regressionsInTime", characterAnalysis);
        this.setNewAverage("regressionsOutCount", characterAnalysis);
        this.setNewAverage("regressionsOutTime", characterAnalysis);
    }

    getAnalyses() {
        let analyses = [this]; // First character may be a line start
        let analysisCopy = {
            ...this,
            isLineStart: false
        }; // Latter characters may not
        for (let i = 1; i < this.charLength; i++) {
            analyses.push(analysisCopy);
        }
        return analyses;
    }

}

class TokenAnalyses extends Array {

    constructor(readings, text, token) {
        super();
        // Initialise variables
        let totalReadings = readings.length;
        // Check for no readings
        if (totalReadings === 0) {
            this[0] = text.split("").map(
                (character) => new TokenAnalysis()
            );
        } else {
            // Get token list
            switch (token) {
                case "char":
                    // Analyse by char
                    for (let i = 0; i < totalReadings; i++) {
                        this.push(
                            readings[i].characters.map(
                                (character) => new TokenAnalysis(character)
                            )
                        );
                    }
                    break;
                case "word":
                    // Analyse by word
                    let totalCharacters = text.length;
                    let isWord = text.split("").map(
                        (character) => /\w/.test(character)
                    );
                    for (let i = 0; i < totalReadings; i++) {
                        this[i] = [];
                        let curReading = readings[i];
                        let curAnalysis;
                        for (let j = 0; j < totalCharacters; j++) {
                            if (isWord[j]) {
                                if (curAnalysis === undefined) {
                                    curAnalysis = new TokenAnalysis(curReading.characters[j]);
                                } else {
                                    curAnalysis.addCharacter(curReading.characters[j]);
                                }
                                if (j === totalCharacters - 1) this[i].push(curAnalysis);
                            } else {
                                if (curAnalysis !== undefined) {
                                    let curAnalyses = curAnalysis.getAnalyses();
                                    this[i].push(...curAnalyses);
                                    curAnalysis = undefined;
                                }
                                this[i].push(new TokenAnalysis());
                            }
                        }
                    }
                    break;
                default:
                    window.alert("Unrecognised token type: " + token);
            }
        }
    }

}

class AveragedTextAnalysis extends Array {

    constructor(analyses, average, statistic) {
        super();
        // Declare variables
        let totalReadings = analyses.length;
        let totalCharacters = analyses[0].length;
        // Initialise characters
        for (let i = 0; i < totalCharacters; i++) {
            this[i] = 0;
        }
        // Set averages
        switch (average) {
            case "mean":
                for (let i = 0; i < totalReadings; i++) {
                    let nextAnalysis = analyses[i];
                    // Set new averages
                    for (let j = 0; j < totalCharacters; j++) {
                        this[j] +=
                            (Number(nextAnalysis[j][statistic]) - // Convert booleans to binary integers
                            this[j]) / (i + 1);
                    }
                }
                break;
            case "median":
                for (let i = 0; i < totalCharacters; i++) {
                    let sortedValues = new SortedNumberList();
                    for (let j = 0; j < totalReadings; j++) {
                        sortedValues.insert(
                            Number(analyses[j][i][statistic])  // Convert booleans to binary integers
                        );
                    }
                    this[i] = sortedValues.getMedian();
                }
                break;
            default:
                window.alert("Unrecognised average type: " + average);
        }
    }

}

class RatioList extends Array {

    constructor(numbers, min, max, reverse) {
        super();
        // Get maximum and minimum numbers
        let maxNumber = numbers[0];
        let minNumber = numbers[0];
        let totalNumbers = numbers.length;
        for (let i = 1; i < totalNumbers; i++) {
            let nextNumber = numbers[i];
            if (nextNumber < minNumber) {
                minNumber = nextNumber;
            } else if (nextNumber > maxNumber) {
                maxNumber = nextNumber;
            }
        }
        // Convert numbers to ratios
        let numberRange = maxNumber - minNumber;
        if (numberRange === 0) {
            // Avoid divides by zero
            for (let i = 0; i < totalNumbers; i++) {
                this.push(max);
            }
        } else {
            let multiplier = (max - min) / numberRange;
            let getMultiplicand =
                reverse?
                (number) => maxNumber - number:
                (number) => number - minNumber;
            for (let number of numbers) {
                this.push(multiplier * getMultiplicand(number) + min);
            }
        }
    }

}

class AnalysesDisplayer {

    constructor(readings, text, filters, statistic, token, average, displayers) {
        this.displayers = displayers;
        let relevantReadings = readings.filter(
            (reading) =>
                reading.isRelevant(
                    ...filters
                )
        );
        // Set token analyses
        this.tokenAnalyses = new TokenAnalyses(
            relevantReadings,
            this.text,
            this.token
        );
        // Set text HSL hue values for heatmap display
        let averageAnalysis = new AveragedTextAnalysis(
            this.tokenAnalyses,
            this.average,
            this.statistic
        );
        this.textHues = new RatioList(
            averageAnalysis,
            0, // Red
            120, // Green
            true // Reverse since low values should be green and vice versa
        );
        // Set line-start indicator alpha values
        let lineStarts = new AveragedTextAnalysis(
            this.tokenAnalyses,
            "mean",
            "isLineStart"
        );
        this.borderAlphas = new RatioList(
            lineStarts,
            0, // transparent
            1, // opaque
            false
        );
    }

    display() {
        for (let i = this.displayers.length - 1; i >= 0; i--) {
            let nextDisplayer = this.displayers[i];
            nextDisplayer.setTextColour(this.textHues[i]);
            nextDisplayer.setBorderColour(this.borderAlphas[i]);
        }
    }

}

class PathDisplayer extends AnalysesDisplayer {

    constructor(readings, text, filters, statistic, token, average, analysisDisplayers, pathDisplayers) {
        super(readings, text, filters, statistic, token, average, analysisDisplayers);
        // Helper function
        let getPathHues = (regressionType, statistic) => {
            //
            let pathAnalyses = this.tokenAnalyses.map(
                (analysis) => analysis[regressionType][statistic]
            );
            //
            let averagedPathAnalysis =
            //
            return new RatioList(
                averagedPathAnalysis,
                0, // Red
                120, // Green
                true // Reverse since low values should be green and vice versa
            );
        };
        // Set fields
        this.pathDisplayers = pathDisplayers;
        this.pathHues = statistic.includes("InCount")?
            this.pathHues = getPathHues("regressionInOrigins", "count"):
            statistic.includes("InTime")?
            this.pathHues = getPathHues("regressionInOrigins", "duration"):
            statistic.includes("OutCount")?
            this.pathHues = getPathHues("regressionOutDestinations", "count"):
            this.pathHues = getPathHues("regressionOutDestinations", "duration"):

    }

    display() {
        super.display();
        for (let i = this.displayers.length - 1; i >= 0; i--) {
            this.displayers.onmouseover =
                (i) => this.displayPaths(i);
        }
    }

}

class CharacterDisplayer {

    constructor(parentElement, character) {
        this.element = document.createElement("span");
        this.element.classList.add("character");
        this.element.innerText = character;
        parentElement.appendChild(this.element);
    }

    setProperty(property, value) {
        this.element.style.setProperty(
            property,
            value
        );
    }

    setColour(property, hue, saturation, lightness, alpha) {
        this.setProperty(
            property,
            "hsla(" + hue + "," + saturation + "%," + lightness + "%," + alpha + ")"
        );
    }

    setBorderColour(alpha) {
        if (Number.isNaN(alpha) || alpha === 0) {
            this.setProperty(
                "border-left-style",
                "none"
            );
        } else {
            this.setProperty(
                "border-left-style",
                "solid"
            );
            this.setColour(
                "border-color",
                0, 0, 0, alpha
            );
        }
    }

    setTextColour(hue) {
        let alpha;
        if (Number.isNaN(hue)) {
            alpha = 0;
            hue = 0;
        } else {
            alpha = 0.6;
        }
        this.setColour(
            "background-color",
            hue, 100, 50, alpha
        );
    }

}

class ProgressDisplayer {

    successes = 0;
    failures = 0;

    constructor(total) {
        this.total = total;
    }

    addSuccess() {

    }

    addFailure() {

    }

    updateDisplay() {

    }

}

class ReadingManager {

    filterElements = [
        document.getElementById("an_gender_sel"),
        document.getElementById("an_impairment_sel"),
        document.getElementById("an_min_age_sel"),
        document.getElementById("an_max_age_sel")
    ];
    statisticElement = document.getElementById("an_statistic_sel");
    tokenElement = document.getElementById("an_token_sel");
    averageElement = document.getElementById("an_average_sel");
    readings = [];
    displayers = [];

    constructor(text, title, version, readers) {
        // Initialise fields
        this.text = text;
        this.progressDisplayer = new ProgressDisplayer(readers.length);
        // Display text
        let displayDiv = document.getElementById("an_display");
        displayDiv.innerHTML = "";
        for (let char of text) {
            let displayer = new CharacterDisplayer(displayDiv, char);
            this.displayers.push(displayer);
        }
        // Get data
        let addReadings = (readers) => {
            if (readers.length > 0) {
                let nextReader = readers.pop();
                postRequest(
                    ["title=" + title, "version=" + version, "reader=" + nextReader.username],
                    "../../private/researcher/getWindows.php",
                    () => {
                        this.addReading();
                        addReadings(readers);
                    },
                    // Add the next reading
                    (windows) => {
                        let windowPath = new WindowPath(JSON.parse(windows));
                        this.addReading(nextReader, windowPath);
                        addReadings(readers);
                    }
                );
            }
        };
        addReadings(readers);
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

    getValues(elementArray) {
        return elementArray.map(
            (element) => element.value
        );
    }

    isRegressionStatistic(statistic) {
        return (
            statistic != "firstFixationDuration" &&
            statistic != "gazeDuration" &&
            statistic != "spilloverTime" &&
            statistic != "totalReadingTime"
        );
    }

    updateDisplay() {
        let filters = this.getValues(this.filterElements);
        let others = this.getValues([this.statisticElement, this.tokenElement, this.averageElement]);
        let analysesDisplayer =
            this.isRegressionStatistic(this.statisticElement.value)?
            new PathDisplayer(this.readings, this.text, filters, ...others, this.displayers):
            new AnalysesDisplayer(this.readings, this.text, filters, ...others, this.displayers);
        analysesDisplayer.display();
    }

}
