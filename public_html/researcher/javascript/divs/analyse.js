'use-strict';

const AnalysisNamespace = {};

AnalysisNamespace.SortedNumberList = class extends Array {

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

AnalysisNamespace.Window = class {

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
                    let newFixation = new AnalysisNamespace.Fixation(i, firstFixationDuration, firstFixationDuration);
                    fixations.push(newFixation);
                }
            } else { // Prioritise left or right-side characters in time allocation
                // firstFixationDuration = window.duration / (windowLength + (windowLength-1) + ... + 1)
                firstFixationDuration = this.duration / (((windowLength * windowLength) + windowLength) / 2);
                 /* The first fixation on a line tends to be longer than other fixations due to a lack of preprocessing
                    K Rayner, 1977, Visual attention in reading: Eye movements reflect cognitive processes
                 */ if (this.isPathStart) firstFixationDuration *= 0.7;
                for (let i = this.leftmostChar; i <= this.rightmostChar; i++) {
                    let gazeDuration = (
                        this.isPathStart?
                        firstFixationDuration * (this.rightmostChar + 1 - i): // Prioritise left side
                        firstFixationDuration * (i + 1 - this.leftmostChar) // Prioritise right side
                    );
                    let newFixation = new AnalysisNamespace.Fixation(i, firstFixationDuration, gazeDuration);
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

AnalysisNamespace.WindowPath = class extends Array {

    constructor(wpm, windows) {
        super();
        // Normalise window durations by reader reading speed
        // This prevents slower readers from having a greater impact on analysis results
        let speedDivider = wpm / 250; // 250 words per minute is around average
        for (let window of windows) {
            window.duration /= speedDivider;
            this.push(new AnalysisNamespace.Window(window));
        }
    }

    // Get the minimum gaze duration that will be considered a pause
    getMinPauseTime() {
        // Initialise variables
        const pauseThresholdPercent = 15; // A window's openOffset must be in the highest pauseThresholdPercent% to count as a pause
        let windowCount = 0;
        let largestOffsets = new AnalysisNamespace.SortedNumberList();
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
            new AnalysisNamespace.Window():
            this[pathIndex];
    }

}

AnalysisNamespace.Fixation = class {

    constructor(charIndex, firstFixationDuration, gazeDuration) {
        this.charIndex = charIndex;
        this.firstFixationDuration = firstFixationDuration;
        this.gazeDuration = gazeDuration;
    }

    extendFixation(gazeDuration) {
        this.gazeDuration += gazeDuration;
    }

    // The argument is the first window that doesn't include this character after its initial fixation
    endFixation(spilloverTime) {
        this.spilloverTime = spilloverTime;
    }

    isSubstantial() {
        return this.gazeDuration > 8; // Minimum gaze duration required for an analysis object to be considered
    }

}

AnalysisNamespace.Regression = class {

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

AnalysisNamespace.RegressionSet = class {

    addRegressionSet(regressionSet) {
        for (let otherChar in regressionSet) {
            let regression = regressionSet[otherChar];
            this.addRegression(otherChar, regression.pathDuration, regression.count);
        }
    }

    addRegression(otherChar, pathDuration, count = 1) {
        this.addNewRegressionObject(otherChar);
        this[otherChar].count += count;
        this[otherChar].pathDuration += pathDuration;
    }

    addNewRegressionObject(otherChar) {
        if (!this.hasOwnProperty(otherChar)) {
            this[otherChar] = {
                count: 0,
                pathDuration: 0
            };
        }
    }

}

AnalysisNamespace.Character = class {

    fixations = [];
    regressionsIn = new AnalysisNamespace.RegressionSet();
    regressionsOut = new AnalysisNamespace.RegressionSet();

    constructor(isLineStart) {
        this.isLineStart = isLineStart;
    }

    startNewFixation(fixation) {
        this.fixations.push(fixation);
    }

    extendCurrentFixation(gazeDuration) {
        this.fixations[this.fixations.length-1].extendFixation(gazeDuration);
    }

    endCurrentFixation(spilloverTime) {
        this.fixations[this.fixations.length-1].endFixation(spilloverTime);
    }

}

AnalysisNamespace.Text = class extends Array {

    constructor(windowPath, totalCharacters) {
        super();
        // Get line end info
        let lineStartIndexes = new AnalysisNamespace.SortedNumberList();
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
        for (let i = 0; i < totalCharacters; i++) {
            let isLineStart = lineStartIndexes.contains(i);
            this[i] = new AnalysisNamespace.Character(isLineStart);
        }

        // Declare construction helper functions

        // Record fixation data
        let recordFixations = (oldWindow, newWindow) => {
            // Initialise variables
            let newFixations = newWindow.getFixations();
            // Handle newly masked chars
            for (let charIndex = oldWindow.leftmostChar; charIndex <= oldWindow.rightmostChar; charIndex++) {
                if (!newWindow.contains(charIndex)) {
                    this[charIndex].endCurrentFixation(newFixations.firstFixationDuration);
                }
            }
            // Handle unmasked chars
            for (let newFixation of newFixations.fixations) {
                if (oldWindow.contains(newFixation.charIndex)) {
                    this[newFixation.charIndex].extendCurrentFixation(newFixation.gazeDuration);
                } else {
                    // Make a new fixation object for newly unmasked chars
                    this[newFixation.charIndex].startNewFixation(newFixation);
                }
            }
        }

        // Initialise analysis variables
        const minFixationTime = 8;
        const minPauseTime = windowPath.getMinPauseTime();
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
                        currentWindows.current.isImmediatelyBefore(currentWindows.next) && (
                            currentWindows.current.duration > minPauseTime || (
                                currentWindows.current.contains(leftmostUnfixatedCharIndex) &&
                                currentWindows.current.duration > minFixationTime
                            )
                        )
                ) {
                    // A new path start-point was found. May be a jump forward, a regression or a new line.
                    currentWasAccepted = true;
                    currentWindows.current.isPathStart = true;
                    if (currentWindows.current.isBefore(currentWindows.previous)) {
                        // A regression was found
                        let newRegression = new AnalysisNamespace.Regression(
                            currentWindows.previous.focalChar,
                            currentWindows.current.focalChar
                        );
                        unpassedRegressions.push(newRegression);
                    }
                }
            } else {
                currentWasAccepted = true;
                if (
                    !currentWindows.current.isImmediatelyBefore(currentWindows.next) ||
                    currentWindows.next.duration < minFixationTime // Catches forward skips
                ) {
                    // A path end-point was found.
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
                        this[regression.origin].regressionsOut.addRegression(
                            regression.destination,
                            regression.pathDuration
                        );
                        this[regression.destination].regressionsIn.addRegression(
                            regression.origin,
                            regression.pathDuration
                        );
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
        recordFixations(currentWindows.previous, new AnalysisNamespace.Window());
    }

}

AnalysisNamespace.CharacterAnalysis = class {

    regressions = {
        regressionsOut: new AnalysisNamespace.RegressionSet(),
        regressionsIn: new AnalysisNamespace.RegressionSet()
    };

    constructor(character) {
        if (character === undefined) {
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
            // Record fixation data
            this.isLineStart = character.isLineStart;
            this.firstFixationDuration = character.fixations[0].firstFixationDuration;
            this.gazeDuration = character.fixations[0].gazeDuration;
            this.spilloverTime = character.fixations[0].spilloverTime;
            this.totalReadingTime = character.fixations.reduce(
                (total, fixation) => total + fixation.gazeDuration,
                0
            );
            this.regressionsOutCount = Object.values(character.regressionsOut).reduce(
                (total, regressionOut) => total + regressionOut.count,
                0
            );
            this.regressionsOutTime = Object.values(character.regressionsOut).reduce(
                (total, regressionOut) => total + regressionOut.pathDuration,
                0
            );
            this.regressionsInCount = Object.values(character.regressionsIn).reduce(
                (total, regressionIn) => total + regressionIn.count,
                0
            );
            this.regressionsInTime = Object.values(character.regressionsIn).reduce(
                (total, regressionIn) => total + regressionIn.pathDuration,
                0
            );
            // Record regression paths
            let addRegressions = (regressionType) => {
                for (let otherChar in character[regressionType]) {
                    this.regressions[regressionType].addRegression(
                        otherChar,
                        character[regressionType][otherChar].pathDuration
                    );
                }
            };
            addRegressions("regressionsIn");
            addRegressions("regressionsOut");
        }
    }

}

AnalysisNamespace.TextAnalysis = class extends Array {

    constructor(text) {
        super();
        // Analyse by character
        for (let char of text) {
            this.push(new AnalysisNamespace.CharacterAnalysis(char));
        }
    }

}

AnalysisNamespace.RatioList = class extends Array {

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
        let multiplier = (max - min) / numberRange;
        let getMultiplicand =
            reverse?
            (number) => maxNumber - number:
            (number) => number - minNumber;
        for (let number of numbers) {
            this.push(
                number === 0?
                NaN:
                multiplier * getMultiplicand(number) + min
            );
        }
    }

}

AnalysisNamespace.Reader = class {

    constructor(reader) {
        this.usernameHash = reader.usernameHash;
        this.gender = reader.gender;
        this.age = reader.age;
        this.isImpaired = reader.isImpaired;
        this.wpm = reader.wpm; // Reading speed in words per minute
        this.innerWidth = reader.innerWidth; // Reading speed in words per minute
    }

    isWithinGroup(gender, impairment, minAge, maxAge, minWPM, maxWPM, minInnerWidth, maxInnerWidth) {
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
        ) && (
            // Reading speed check
            minWPM <= this.wpm &&
            maxWPM >= this.wpm
        ) && (
            // Reading speed check
            minInnerWidth <= this.innerWidth &&
            maxInnerWidth >= this.innerWidth
        );
    }

}

AnalysisNamespace.TextAnalysisList = class extends Array {

    constructor(textLength) {
        super();
        let statisticNameList = [
            "isLineStart",
            "firstFixationDuration",
            "gazeDuration",
            "spilloverTime",
            "totalReadingTime",
            "regressionsInCount",
            "regressionsInTime",
            "regressionsOutCount",
            "regressionsOutTime"
        ];
        while (textLength-- > 0) {
            let statistics = {};
            for (let statisticName of statisticNameList) {
                statistics[statisticName] = new AnalysisNamespace.SortedNumberList();
            }
            this.push({
                statistics: statistics,
                regressionsIn: new AnalysisNamespace.RegressionSet(),
                regressionsOut: new AnalysisNamespace.RegressionSet()
            });
        }
    }

    addTextAnalysis(textAnalysis) {
        for (let i = textAnalysis.length - 1; i >= 0; i--) {
            let charAnalysis = textAnalysis[i];
            this[i].regressionsOut.addRegressionSet(charAnalysis.regressions.regressionsOut);
            this[i].regressionsIn.addRegressionSet(charAnalysis.regressions.regressionsIn);
            let charStatList = this[i].statistics;
            for (let stat in charStatList) {
                charStatList[stat].insert(charAnalysis[stat]);
            }
        }
    }

    getAverage(statistic, average) {
        let averageMethodName = "get" + average[0].toUpperCase() + average.slice(1);
        return (
            statistic === undefined?
            // Return all statistics
            [...this].map(
                (token) => {
                    let averages = {};
                    for (let statistic of token.statistics) {
                        averages[statistic] = statistic[averageMethodName]();
                    }
                    return averages;
                }
            ):
            // Return a single statistic
            [...this].map(
                (char) => char.statistics[statistic][averageMethodName]()
            )
        );
    }

    getRegressionTotals(charIndexList, regressionType, regressionStat) {
        let regressions = charIndexList.reduce(
            (total, index) => {
                total.addRegressionSet(this[index][regressionType]);
                return total;
            },
            new AnalysisNamespace.RegressionSet()
        );
        let totals = [];
        for (let i = 0; i < this.length; i++) {
            totals[i] = (
                !regressions.hasOwnProperty(i)?
                0:
                regressions[i][regressionStat]
            );
        }
        return totals;
    }

}

AnalysisNamespace.LoadFeedbackDisplayer = class {

    available = Object.assign(
        {
            label: "available",
            count: 0,
            isPaused: false,
            queuedAnimation: undefined
        },
        this.constructor.available
    );
    used = Object.assign(
        {
            label: "used",
            count: 0,
            isPaused: false,
            queuedAnimation: undefined
        },
        this.constructor.used
    );

    // Calls to the animate method of progressbar.js throw an error if a previous animation is still ongoing
    // https://github.com/kimmobrunfeldt/progressbar.js/issues/257
    // The pause/queue mechanism in this class mitigates these errors.

    constructor(total) {
        this.total = total;
        this.available.element.parentElement.classList.remove("hidden");
    }

    unpause(displayer) {
        displayer.isPaused = false;
        if (displayer.queuedAnimation !== undefined) {
            displayer.queuedAnimation();
            displayer.queuedAnimation = undefined;
        }
    }

    animate(displayer, progress, options) {
        if (displayer.hasOwnProperty("bar") && !displayer.isPaused) {
            displayer.isPaused = true;
            displayer.bar.animate(progress, options,
                () => this.unpause(displayer) // This function is called when the animation ends
            );
            displayer.bar.setText(
                displayer.count + (
                    displayer.count === 1?
                    " analysis ":
                    " analyses "
                ) + displayer.label
            );
        } else {
            displayer.queuedAnimation = () => this.animate(displayer, progress);
        }
    }

    addReading(isUsed) {
        this.available.count++;
        let progress = this.available.count / this.total;
        this.animate(this.available, progress);
        if (isUsed) {
            this.setUsed(this.used.count + 1);
        }
    }

    setUsed(newUsed) {
        this.used.count = newUsed;
        let progress = newUsed / this.available.count;
        this.animate(this.used, progress);
    }

    destroy() {
        this.available.element.parentElement.classList.add("hidden");
        this.animate(this.available, 0, {duration: 0});
        this.animate(this.used, 0, {duration: 0});
    }

}

import("../../../../node_modules/progressbar.js/dist/progressbar.js").then(
    (progressBarModule) => {
        AnalysisNamespace.LoadFeedbackDisplayer.available = new LibNamespace.ProgressBar("an_available-feedback");
        AnalysisNamespace.LoadFeedbackDisplayer.used = new LibNamespace.ProgressBar("an_used-feedback");
    }
);

AnalysisNamespace.ReadingManager = class {

    constructor(textLength, readers, filters) {
        this.loadFeedbackDisplayer = new AnalysisNamespace.LoadFeedbackDisplayer(readers.length);
        this.filters = filters;
        this.textLength = textLength;
        // Initialise readings field
        this.readers = readers.map(
            (reader) => new AnalysisNamespace.Reader(reader)
        );
    }

    addReading(readerIndex, windows) {
        let reader = this.readers[readerIndex];
        let windowPath = new AnalysisNamespace.WindowPath(reader.wpm, windows);
        let text = new AnalysisNamespace.Text(windowPath, this.textLength);
        reader.textAnalysis = new AnalysisNamespace.TextAnalysis(text);
        // Return true if the reading affects the analysis requested by the reader
        let isRelevant = reader.isWithinGroup(...Object.values(this.filters));
        this.loadFeedbackDisplayer.addReading(isRelevant);
        return isRelevant;
    }

    getRelevantReaders() {
        return this.readers.filter(
            (reader) => reader.isWithinGroup(...Object.values(this.filters)) && reader.hasOwnProperty("textAnalysis")
        );
    }

    getNewTextAnalysis() {
        let newAnalysisList = new AnalysisNamespace.TextAnalysisList(this.textLength);
        let usedReadings = 0;
        for (let reader of this.readers) {
            if (reader.isWithinGroup(...Object.values(this.filters)) && reader.hasOwnProperty("textAnalysis")) {
                newAnalysisList.addTextAnalysis(reader.textAnalysis);
                usedReadings++;
            }
        }
        this.loadFeedbackDisplayer.setUsed(usedReadings);
        return newAnalysisList;
    }

    changeFilter(filterName, filterValue) {
        this.filters[filterName] = filterValue;
    }

    destroy() {
        this.loadFeedbackDisplayer.destroy();
    }

}

AnalysisNamespace.DisplayerTree = class {

    isHighlighted = false;

    constructor(parentElement, unhighlightedOnclick, highlightedOnclick) {
        this.element = document.createElement("span");
        this.element.classList.add("token");
        parentElement.appendChild(this.element);
        this.unhighlightedOnclick = () => unhighlightedOnclick(this);
        this.highlightedOnclick = () => highlightedOnclick();
    }

    getLeaves() {
        if (!this.hasOwnProperty("children")) return [this];
        let leaves = [];
        for (let child of this.children) {
            leaves.push(...child.getLeaves());
        }
        return leaves;
    }

    setStyle(property, value) {
        this.element.style.setProperty(
            property,
            value
        );
    }

    setColour(property, hue, saturation, lightness, alpha) {
        this.setStyle(
            property,
            "hsla(" + hue + "," + saturation + "%," + lightness + "%," + alpha + ")"
        );
    }

    setBorderAlpha(alpha) {
        if (Number.isNaN(alpha) || alpha === 0) {
            this.setStyle(
                "border-left-style",
                "none"
            );
        } else {
            this.setStyle(
                "border-left-style",
                "solid"
            );
            this.setColour(
                "border-left-color",
                0, 0, 0, alpha
            );
        }
    }

    setHue(hue) {
        let alpha;
        if (Number.isNaN(hue)) {
            alpha = 0;
            hue = 0;
            if (!this.isHighlighted) {
                this.setStyle(
                    "opacity",
                    0.4
                );
            }
        } else {
            alpha = 0.6;
            this.setStyle(
                "opacity",
                1
            );
        }
        this.setColour(
            "background-color",
            hue, 100, 50, alpha
        );
    }

    highlight() {
        // if (this.isHighlighted === true) return;
        this.isHighlighted = true;
        this.element.onclick = this.highlightedOnclick;
        this.setStyle(
            "opacity",
            1
        );
        this.setStyle(
            "font-weight",
            "bold"
        );
        this.setStyle(
            "border-bottom-style",
            "solid"
        );
    }

    unhighlight() {
        // if (this.isHighlighted === false) return;
        this.isHighlighted = false;
        this.element.onclick = this.unhighlightedOnclick;
        this.setStyle(
            "font-weight",
            ""
        );
        this.setStyle(
            "border-bottom-style",
            "none"
        );
    }

}

AnalysisNamespace.DisplayerLeaf = class extends AnalysisNamespace.DisplayerTree {

    constructor(parentElement, unhighlightedOnclick, highlightedOnclick, text, index) {
        super(parentElement, unhighlightedOnclick, highlightedOnclick);
        this.element.innerText = text;
        this.index = index;
    }

}

AnalysisNamespace.DisplayerTreeRoot = class extends Array {

    constructor(root, text, onclick1, onclick2) {
        super();
        // Group by sentence
        let tokenEnders = [
            /\.|!|\?/,
            /,|;|:|{|}|\(|\)|\[|\]/,
            /\s/
        ];
        let formSubTree = (parentElement, tokenStartIndex = 0, tokenEndIndex = text.length, depth = 0) => {
            let displayerArray = [];
            let ender = tokenEnders[depth];
            let isTracingToken = false;
            for (let i = tokenStartIndex; i < tokenEndIndex; i++) {
                let char = text[i];
                if (/\w/.test(char) && ender !== undefined) {
                    if (!isTracingToken) {
                        tokenStartIndex  = i;
                        isTracingToken = true;
                    }
                } else {
                    if (!isTracingToken) {
                        displayerArray.push(new AnalysisNamespace.DisplayerLeaf(parentElement, onclick1, onclick2, char, i));
                    } else if (ender.test(char)) {
                        // Recursion case
                        let tokenDisplayer = new AnalysisNamespace.DisplayerTree(parentElement, onclick1, onclick2);
                        tokenDisplayer.children = formSubTree(tokenDisplayer.element, tokenStartIndex, i, depth + 1);
                        displayerArray.push(tokenDisplayer);
                        displayerArray.push(new AnalysisNamespace.DisplayerLeaf(parentElement, onclick1, onclick2, char, i));
                        isTracingToken = false;
                    }
                }
            }
            if (isTracingToken) {
                let tokenDisplayer = new AnalysisNamespace.DisplayerTree(parentElement, onclick1, onclick2);
                tokenDisplayer.children = formSubTree(tokenDisplayer.element, tokenStartIndex, tokenEndIndex, depth + 1);
                displayerArray.push(tokenDisplayer);
            }
            return displayerArray;
        };
        root.innerHTML = "";
        this.push(...formSubTree(root));
    }

    getLeaves() {
        let leaves = [];
        for (let displayer of this) {
            leaves.push(...displayer.getLeaves());
        }
        return leaves;
    }

    getDisplayers(depth, includeLeaves, displayerList = [...this]) {
        if (depth === -1) {
            // Return all leaves (chars)
            return this.getLeaves();
        }
        // Return all nodes
        if (depth === 0) return (
            includeLeaves?
            displayerList:
            displayerList.filter(
                (displayer) => displayer.hasOwnProperty("children")
            )
        );
        // Recurse on all nodes
        let displayers = [];
        for (let branch of displayerList) {
            if (branch.hasOwnProperty("children")) {
                displayers.push(...this.getDisplayers(depth - 1, includeLeaves, branch.children));
            } else {
                if (includeLeaves) displayers.push(branch);
            }
        }
        return displayers;
    }

    resetHues(depth) {
        let displayers = this.getDisplayers(depth, false);
        for (let displayer of displayers) {
            displayer.setHue(NaN);
            displayer.element.onclick = null;
            displayer.setStyle(
                "opacity",
                1
            );
        }
    }

    setHues(depth, averages, deriveValue) {
        let displayers = this.getDisplayers(depth, true);
        let usedDisplayers = [];
        let tokenisedAverages = [];
        let nextIndex = 0;
        for (let displayer of displayers) {
            if (displayer.hasOwnProperty("children") || depth === -1) {
                usedDisplayers.push(displayer);
                let totalChildChars = displayer.getLeaves().length;
                let childAverages = [...averages].slice(nextIndex, nextIndex + totalChildChars);
                tokenisedAverages.push(deriveValue(childAverages));
                nextIndex += totalChildChars;
            } else {
                displayer.setHue(NaN);
                nextIndex++;
            }
        }
        let hues = new AnalysisNamespace.RatioList(
            tokenisedAverages,
            0, // Red
            120, // Green
            true // Reverse since small values should be green and large values red
        );
        for (let i = usedDisplayers.length - 1; i >= 0; i--) {
            if (!usedDisplayers[i].isHighlighted) usedDisplayers[i].element.onclick = usedDisplayers[i].unhighlightedOnclick;
            usedDisplayers[i].setHue(hues[i]);
        }
    }

    resetBorderAlphas(depth) {
        this.getLeaves().forEach(
            (leaf) => leaf.setBorderAlpha(NaN)
        );
    }

    setBorderAlphas(borderAverages) {
        let borderAlphas = new AnalysisNamespace.RatioList(
            borderAverages,
            0, // transparent
            1, // opaque
            false
        );
        this.getLeaves().forEach(
            (leaf, index) => leaf.setBorderAlpha(borderAlphas[index])
        );
    }

}

AnalysisNamespace.StatisticDisplayer = class {

    depth = this.getDepth(document.getElementById("an_token_sel").value);
    statistic = document.getElementById("an_statistic_sel").value;
    average = document.getElementById("an_average_sel").value;

    constructor(root, text, readers) {
        // Make text elements
        this.displayerTree = new AnalysisNamespace.DisplayerTreeRoot(
            root,
            text,
            (displayer) => this.displayPaths(displayer),
            () => this.setHues()
        );
        let onclick = (values, handleIndex, filterName) => this.changeFilter(filterName, values[handleIndex], handleIndex);
        this.constructor.ageSlider.replaceListener("slide", onclick, ["Age"]);
        this.constructor.wpmSlider.replaceListener("slide", onclick, ["WPM"]);
        this.constructor.widthSlider.replaceListener("slide", onclick, ["InnerWidth"]);
        let filters = {
            gender: document.getElementById("an_gender_sel").value,
            impairment: document.getElementById("an_impairment_sel").value,
            minAge: this.constructor.ageSlider.getValue(0),
            maxAge: this.constructor.ageSlider.getValue(1),
            minWPM: this.constructor.wpmSlider.getValue(0),
            maxWPM: this.constructor.wpmSlider.getValue(1),
            minInnerWidth: this.constructor.widthSlider.getValue(0),
            maxInnerWidth: this.constructor.widthSlider.getValue(1)
        };
        // Initialise a new ReadingManager for text analysis
        this.readingManager = new AnalysisNamespace.ReadingManager(text.length, readers, filters);
    }

    setHues() {
        if (this.highlightedDisplayer !== undefined) {
            this.highlightedDisplayer.unhighlight();
            this.highlightedDisplayer = undefined;
        }
        this.displayerTree.setHues(this.depth, this.currentTextAnalysis.getAverage(this.statistic, this.average), this.getValueDeriver());
    }

    setBorderAlphas() {
        this.displayerTree.setBorderAlphas(this.currentTextAnalysis.getAverage("isLineStart", "mean"));
    }

    getDepth(token) {
        return (
            token === "char"? // Most inclusive
            -1:
            token === "sentence"?
            0:
            token === "clause"?
            1:
            token === "word"? // Least inclusive
            2:
            undefined
        );
    }

    changeToken(token) {
        if (this.highlightedDisplayer !== undefined) {
            this.highlightedDisplayer.unhighlight();
            this.highlightedDisplayer = undefined;
        }
        this.displayerTree.resetHues(this.depth);
        this.depth = this.getDepth(token);
        this.setHues();
    }

    changeStatistic(statistic) {
        this.statistic = statistic;
        this.setHues();
    }

    changeAverage(average) {
        this.average = average;
        this.setHues();
    }

    changeFilter(filterName, filterValue, handleIndex) {
        this.displayerTree.resetBorderAlphas(this.depth);
        if (handleIndex !== undefined) {
            filterName = (
                handleIndex === 0?
                "min":
                "max"
            ) + filterName;
        }
        this.readingManager.changeFilter(filterName, filterValue);
        this.currentTextAnalysis = this.readingManager.getNewTextAnalysis();
        this.setHues();
        this.setBorderAlphas();
    }

    addReading(readerIndex, windows) {
        if (this.readingManager.addReading(readerIndex, windows)) {
            this.currentTextAnalysis = this.readingManager.getNewTextAnalysis();
            this.setHues();
            this.setBorderAlphas();
        }
    }

    // Returns a function for finding a token's value from its characters' averages
    getValueDeriver() {
        switch (this.statistic) {
            case "firstFixationDuration":
                return (averages) => averages[0];
            case "spilloverTime":
                return (averages) => averages[averages.length - 1];
            default:
                return (
                    (averages) => averages.reduce(
                        (total, average) => total + average
                    ) / averages.length
                );
        }
    }

    getRegressionStat() {
        if (this.statistic[0] !== "r") return false;
        return {
            type: (
                this.statistic[11] === "I"?
                "regressionsIn":
                "regressionsOut"
            ),
            measure: (
                this.statistic[this.statistic.length-1] === "e"?
                "pathDuration":
                "count"
            )
        };
    }

    displayPaths(displayer) {
        let regressionStat = this.getRegressionStat();
        if (!regressionStat) return;
        if (this.highlightedDisplayer !== undefined) {
            this.highlightedDisplayer.unhighlight();
        }
        this.highlightedDisplayer = displayer;
        // Set new highlighting
        displayer.highlight();
        // Set hues
        let subChars = displayer.getLeaves().map(
            (leaf) => leaf.index
        );
        this.displayerTree.setHues(this.depth, this.currentTextAnalysis.getRegressionTotals(subChars, regressionStat.type, regressionStat.measure), this.getValueDeriver());
    }

    destroy() {
        this.readingManager.destroy();
    }

}

import("../../../../node_modules/nouislider/distribute/nouislider.min.js").then(
    (sliderModule) => {
        // Set up slider elements
        AnalysisNamespace.StatisticDisplayer.ageSlider = new LibNamespace.Slider('an_age', 0, 100);
        AnalysisNamespace.StatisticDisplayer.wpmSlider = new LibNamespace.Slider('an_wpm', 0, 500);
        AnalysisNamespace.StatisticDisplayer.widthSlider = new LibNamespace.Slider('an_inner_width', 0, 2000);
    }
);

AnalysisNamespace.InterfaceManager = class {

    constructor(title, version) {
        this.textDiv = document.getElementById("an_text");
        this.textInfo = {
            title: title,
            version: version
        };
        // Define a recursive helper function for asynchronous requests for reading data
        let addReadings = (readers, curIndex = 0) => {
            if (curIndex < readers.length) {
                postRequest(
                    ["title=" + title, "version=" + version, "readerHash=" + readers[curIndex].usernameHash],
                    "../../private/researcher/getWindows.php",
                    () => {
                        addReadings(readers, curIndex + 1);
                    },
                    // Add the next reading
                    (windows) => {
                        this.statisticDisplayer.addReading(curIndex, JSON.parse(windows));
                        addReadings(readers, curIndex + 1);
                    }
                );
            }
        };
        // Request readers
        postRequest(
            ["title=" + title, "version=" + version],
            "../../private/researcher/getReaders.php",
            window.alert,
            (readersJSON) => {
                // Handle readers
                let readers = JSON.parse(readersJSON);
                if (readers.length === 0) {
                    window.alert("No reading data is yet available for this text.");
                } else {
                    // Request text
                    postRequest(
                        ["title=" + title, "version=" + version],
                        "../../private/researcher/getTextString.php",
                        window.alert,
                        (text) => {
                            // Handle text
                            this.text = text;
                            this.statisticDisplayer = new AnalysisNamespace.StatisticDisplayer(
                                this.textDiv,
                                text,
                                readers
                            );
                            addReadings(readers);
                        }
                    );
                }
            }
        );
    }

    hideFilters(button) {
        document.getElementById("an_filters").classList.add("hidden");
        button.value = "Show Filters";
        button.onclick = () => this.showFilters(button);
    }

    showFilters(button) {
        document.getElementById("an_filters").classList.remove("hidden");
        button.value = "Hide Filters";
        button.onclick = () => this.hideFilters(button);
    }

    getFiles(asCSV) {
        let readers = this.statisticDisplayer.readingManager.getRelevantReaders();
        if (!asCSV) return [{
            name: "readings.json",
            text: JSON.stringify(readers)
        }];
        // Make CSV files
        let textCSV = Array.from(this.text).reduce(
            (csv, char, index) => csv + "\n" + index + "," + char,
            "sequenceNumber,character"
        );
        let readerCSV = [["usernameHash", "gender", "age", "isImpaired"]];
        let readingCSV = [["usernameHash", "wpm", "innerWidth"]];
        let analysisCSV = [["usernameHash", "charIndex", "isLineStart", "firstFixationDuration", "gazeDuration", "spilloverTime", "totalReadingTime", "regressionsOutCount", "regressionsOutTime", "regressionsInCount", "regressionsInTime"]];
        for (let reader of readers) {
            let readerLine = [];
            for (let heading of readerCSV[0]) {
                readerLine.push(reader[heading]);
            }
            let readingLine = [];
            for (let heading of readingCSV[0]) {
                readingLine.push(reader[heading]);
            }
            let usernameHash = reader.usernameHash;
            reader.textAnalysis.forEach(
                (analysis, index) => {
                    let analysisLine = [];
                    for (let heading of analysisCSV[0]) {
                        analysisLine.push(
                            heading === "usernameHash"?
                            usernameHash:
                            heading === "charIndex"?
                            index:
                            analysis[heading]
                        );
                    }
                    analysisCSV.push(analysisLine.toString());
                }
            );
            readerCSV.push(readerLine.toString());
            readingCSV.push(readingLine.toString());
        }
        readerCSV[0] = readerCSV[0].toString();
        readingCSV[0] = readingCSV[0].toString();
        analysisCSV[0] = analysisCSV[0].toString();
        return [
            {
                name: "text.csv",
                text: textCSV
            },
            {
                name: "readers.csv",
                text: readerCSV.join("\n")
            },
            {
                name: "readings.csv",
                text: readingCSV.join("\n")
            },
            {
                name: "analyses.csv",
                text: analysisCSV.join("\n")
            }
        ];
    }

    download(asCSV) {
        // Get the contents of the file to be downloaded
        let fileContents = this.getFiles(asCSV);
        import("../../../../node_modules/jszip/dist/jszip.js").then(
            (zipModule) => {
                let zip = new JSZip();
                for (let file of fileContents) {
                    zip.file(file.name, file.text);
                }
                zip.generateAsync({type:"blob"}).then(
                    (blob) => import("../../../../node_modules/file-saver/dist/FileSaver.js").then(
                        (fileModule) => {
                            saveAs(blob, this.textInfo.title + "[" + this.textInfo.version + "] - " + new Date().toLocaleDateString() + ".zip");
                        }
                    )
                );
            }
        );
    }

    destroy() {
        if (this.hasOwnProperty("statisticDisplayer")) {
            this.textDiv.innerHTML = ""; // Reset display
            this.statisticDisplayer.destroy();
        }
    }

}

var analysisInterface;

function showAnalyseDiv(button) {
    // Make a new interface for text analysis
    let selText = selTexts[0];
    let title = selText.title;
    let version = selText.version;
    if (analysisInterface === undefined || analysisInterface.textInfo.title !== selText.title || analysisInterface.textInfo.version !== selText.version) {
        if (analysisInterface !== undefined) {
            analysisInterface.destroy();
        }
        analysisInterface = new AnalysisNamespace.InterfaceManager(title, version);
    }
    // Show only the analysis div
    hideDivs(button, "an");
}
