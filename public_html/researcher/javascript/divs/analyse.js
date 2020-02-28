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

    constructor(charIndex, firstFixationDuration, gazeDuration) {
        this.charIndex = charIndex;
        this.firstFixationDuration = firstFixationDuration;
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
        let firstFixationDuration;
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
        return {
            fixations: fixations,
            firstFixationDuration: firstFixationDuration
        };
    }

    contains(charIndex) {
        return charIndex >= this.leftmostChar && charIndex <= this.rightmostChar;
    }

}

class WindowPath {

    constructor(windows) {
        this.path = windows.map(
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
        return this.origin < window.focalChar;
    }

}

class Character {

    fixations = [];
    regressionsOut = [];
    regressionsIn = [];

}

class Reading {

    characters = [];

    constructor(text, reader, windowPath) {
        // Initialise fields
        this.reader = new Reader(reader);
        for (let i = 0; i < text.length; i++) {
            this.characters[i] = new Character();
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
                    currentFixation.spilloverTime = newFixations.firstFixationDuration;
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
                    newFixation.endFixation();
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
        for (let i = 1; i < windowPath.getLength(); i++) {
            let currentWasAccepted = false;
            currentWindows.next = windowPath.getWindow(i);
            if (currentWindows.previous.isPathEnd) {
                if (
                    currentWindows.current.contains(leftmostUnfixatedCharIndex) ||
                    (
                        currentWindows.current.isImmediatelyBefore(currentWindows.next) &&
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
                if (!currentWindows.current.isImmediatelyBefore(currentWindows.next)) {
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
                            destination: regression.destination,
                            pathDuration: regression.pathDuration
                        });
                        this.characters[regression.destination].regressionsIn.push({
                            origin: regression.origin,
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

    constructor(character = new Character()) {
        if (character.fixations.length === 0) {
            this.firstFixationDuration = NaN;
            this.gazeDuration = NaN;
            this.spilloverTime = NaN;
            this.totalReadingTime = NaN;
            this.regressionsInCount = NaN;
            this.regressionsInTime = NaN;
            this.regressionsOutCount = NaN;
            this.regressionsOutTime = NaN;
        } else {
            // Get the first substantial fixation of this character
            // Default to the first fixation
            let firstFixation = character.fixations.reduceRight(
                (firstFixation, character) =>
                    character.isSubstantial()?
                    character:
                    firstFixation
                , character.fixations[0]
            );
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
            this.regressionsOutCount = character.regressionsOut.length; // Total regressions out
            this.regressionsOutTime = character.regressionsOut.reduce(
                (regressionsOutTime, nextRegression) => regressionsOutTime + nextRegression.pathDuration,
                0
            ); // Total path time of of all regessions out
        }
    }

    addCharacter(character) {
        let characterAnalysis = new TokenAnalysis(character);
        // First fixation duration is not affected
        // Spillover time is set to the new rightmost character's
        this.spilloverTime = characterAnalysis.spilloverTime;
        // Everything else is added to the current total
        this.gazeDuration += characterAnalysis.gazeDuration;
        this.totalReadingTime += characterAnalysis.totalReadingTime;
        this.regressionsInCount += characterAnalysis.regressionsInCount;
        this.regressionsInTime += characterAnalysis.regressionsInTime;
        this.regressionsOutCount += characterAnalysis.regressionsOutCount;
        this.regressionsOutTime += characterAnalysis.regressionsOutTime;
    }

}

class TextAnalyses {

    analyses = [];

    constructor(readings, text, token) {
        // Initialise variables
        let totalReadings = readings.length;
        // Get token list
        switch (token) {
            case "char":
                // Analyse by char
                for (let i = 0; i < totalReadings; i++) {
                    this.analyses.push(
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
                    this.analyses[i] = [];
                    let curReading = readings[i];
                    let curAnalysis;
                    for (let j = 0; j < totalCharacters; j++) {
                        if (isWord[j]) {
                            if (curAnalysis === undefined) {
                                curAnalysis = new TokenAnalysis(curReading.characters[j]);
                            } else {
                                curAnalysis.addCharacter(curReading.characters[j]);
                            }
                            if (j === totalCharacters - 1) this.analyses[i].push(curAnalysis);
                        } else {
                            if (curAnalysis !== undefined) {
                                for (let k = j - 1; isWord[k]; k--) {
                                    this.analyses[i].push(curAnalysis);
                                }
                                curAnalysis = undefined;
                            }
                            this.analyses[i].push(new TokenAnalysis());
                        }
                    }
                }
                break;
            default:
                window.alert("Unrecognised token type: " + token);
        }
    }

}

class AveragedTextAnalysis {

    averages = [];

    constructor(analyses, average, statistic) {
        // Declare variables
        let totalReadings = analyses.length;
        let totalCharacters = analyses[0].length;
        // Initialise characters
        for (let i = 0; i < totalCharacters; i++) {
            this.averages[i] = 0;
        }
        // Set averages
        switch (average) {
            case "mean":
                for (let i = 0; i < totalReadings; i++) {
                    let nextAnalysis = analyses[i];
                    // Set new averages
                    for (let j = 0; j < totalCharacters; j++) {
                        this.averages[j] += ((nextAnalysis[j][statistic] - this.averages[j]) / (i + 1));
                    }
                }
                break;
            case "median":
                break;
            default:
                window.alert("Unrecognised average type: " + average);
        }
    }

}

class ColourAnalysis {

    constructor(numbers) {
        // Define variables
        const minHue = 0; // Red
        const maxHue = 120; // Green
        // Get maximum and minimum numbers
        let maxNumber = numbers[0];
        let minNumber = numbers[0];
        for (let i = 1; i < numbers.length; i++) {
            let nextNumber = numbers[i];
            if (nextNumber < minNumber) {
                minNumber = nextNumber;
            } else if (nextNumber > maxNumber) {
                maxNumber = nextNumber;
            }
        }
        // Convert numbers to hues
        let numberRange = maxNumber - minNumber;
        let percentageDividor = numberRange / 100;
        this.hues = numbers.map(
            (number) => (maxNumber - number) / percentageDividor
        );
    }

}

class CharacterDisplayer {

    saturation = 100;
    lightness = 50;
    alpha = 0.6;

    constructor(parentElement, character) {
        this.element = document.createElement("span");
        this.element.innerText = character;
        parentElement.appendChild(this.element);
    }

    setHue(hue) {
        if (Number.isNaN(hue)) {
            this.alpha = 0;
            hue = 0;
        } else {
            this.alpha = 0.6;
        }
        this.element.style.setProperty(
            "background-color",
            "hsla(" + hue + "," + this.saturation + "%," + this.lightness + "%," + this.alpha + ")"
        );
    }

}

class AnalysesDisplayer {

    constructor(readings, text, filters, statistic, token, average, displayers) {
        this.readings = readings;
        this.text = text;
        this.filters = filters;
        this.statistic = statistic;
        this.token = token;
        this.average = average;
        this.displayers = displayers;
    }

    getColourAnalysis() {
        // Filter by reader
        let relevantReadings = this.readings.filter(
            (reading) =>
                reading.isRelevant(
                    ...this.filters
                )
        );
        // Get text analyses
        let textAnalyses = new TextAnalyses(
            relevantReadings,
            this.text,
            this.token
        );
        // Get average analysis
        let averageAnalysis = new AveragedTextAnalysis(
            textAnalyses.analyses,
            this.average,
            this.statistic
        );
        return new ColourAnalysis(averageAnalysis.averages);
    }

}

class FixationsDisplayer extends AnalysesDisplayer {

    constructor(readings, text, filters, statistic, token, average, displayers) {
        super(readings, text, filters, statistic, token, average, displayers);
    }

    display() {
        let colourAnalysis = this.getColourAnalysis();
        for (let i = this.displayers.length - 1; i >= 0; i--) {
            this.displayers[i].setHue(colourAnalysis.hues[i]);
        }
    }

}

class RegressionsDisplayer extends AnalysesDisplayer {

    constructor(readings, text, filters, statistic, token, average, displayers) {
        super(readings, text, filters, statistic, token, average, displayers);
    }

    display() {
        let colourAnalysis = this.getColourAnalysis();
        for (let i = this.displayers.length - 1; i >= 0; i--) {
            this.displayers[i].setHue(colourAnalysis.hues[i]);
        }
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
            new RegressionsDisplayer(this.readings, this.text, filters, ...others, this.displayers):
            new FixationsDisplayer(this.readings, this.text, filters, ...others, this.displayers);
        analysesDisplayer.display();
    }

}
