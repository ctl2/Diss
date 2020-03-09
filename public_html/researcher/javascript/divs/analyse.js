var analysisNamespace = {};

analysisNamespace.SortedList = class extends Array {

    // O(log(n)) complexity search algorithm
    getInsertionIndex(item, list = this) {
        if (list.length === 0) return 0;
        let nextIndex = Math.floor(list.length / 2);
        let nextItem = list[nextIndex];
        if (this.areEqual(item, nextItem)) {
            return nextIndex;
        } else {
            let number = this.getNumber(item);
            let nextNumber = this.getNumber(nextItem);
            if (number > nextNumber) {
                return nextIndex + 1 + this.getInsertionIndex(number, list.slice(nextIndex + 1));
            } else {
                return 0 + this.getInsertionIndex(number, list.slice(0, nextIndex));
            }
        }
    }

    insert(item) {
        let index = this.getInsertionIndex(item);
        this.splice(index, 0, item);
    }

    removeSmallest() {
        return this.shift();
    }

    getSmallest() {
        return this[0];
    }

    getSum() {
        return this.reduce(
            (total, item) => total + this.getNumber(item)
        );
    }

    getAverage(average) {
        if (this.length === 0) return NaN;
        let averageMethod = "get" + average[0].toUpperCase() + average.slice(1);
        return this[averageMethod]();
    }

}

analysisNamespace.SortedNumberList = class extends analysisNamespace.SortedList {

    getNumber(number) {
        return number;
    }

    areEqual(number1, number2) {
        return number1 === number2;
    }

    contains(number) {
        let index = this.getInsertionIndex(number);
        if (this.areEqual(number, this[index])) return true;
        return false;
    }

    remove(number) {
        let index = this.getInsertionIndex(number);
        if (this.areEqual(number, this[index])) {
            this.splice(index, 1);
            return true;
        }
        return false;
    }

    getMedian() {
        return this.getNumber(this[Math.floor(this.length / 2)]);
    }

    getMean() {
        return (this.length === 0)?
            0:
            this.getSum() / (this.length);
    }

}

analysisNamespace.SortedObjectList = class extends analysisNamespace.SortedList {

    constructor(numberKey) {
        super();
        this.numberKey = numberKey;
    }

    insert(object, id) {
        super.insert({
            id: id,
            value: object[this.numberKey]
        });
    }

    getNumber(object) {
        return object[this.numberKey];
    }

    areEqual(object1, object2) {
        return object1[idKey] == object2[idKey];
    }

    contains(id) {
        for (let objectCount = 0; objectCount < this.length; objectCount++) {
            if (id === this[objectCount][this.idKey]) {
                return true;
            }
        }
        return false;
    }

    remove(id) {
        for (let objectCount = 0; objectCount < this.length; objectCount++) {
            if (id === this[objectCount][this.idKey]) {
                this.splice(objectCount, 1);
                return true;
            }
        }
        return false;
    }

    getMedian() {
        return this.getNumber(this[Math.floor(idList.length / 2)]);
    }

    getMean() {
        return this.reduce(
            (total, object) => total + this.getNumber(object)
        ) / this.length;
    }

}

analysisNamespace.Window = class {

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
                    let newFixation = new analysisNamespace.Fixation(i, firstFixationDuration, firstFixationDuration);
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
                    let newFixation = new analysisNamespace.Fixation(i, firstFixationDuration, gazeDuration);
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

analysisNamespace.WindowPath = class extends Array {

    constructor(wpm, windows) {
        super();
        // Normalise window durations by reader reading speed
        // This prevents slower readers from having a greater impact on analysis results
        let speedDivider = wpm / 250; // 250 words per minute is around average
        for (let window of windows) {
            window.duration /= speedDivider;
            this.push(new analysisNamespace.Window(window));
        }
    }

    // Get the minimum gaze duration that will be considered a pause
    getMinPauseTime() {
        // Initialise variables
        const pauseThresholdPercent = 15; // A window's openOffset must be in the highest pauseThresholdPercent% to count as a pause
        let windowCount = 0;
        let largestOffsets = new analysisNamespace.SortedNumberList();
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
            new analysisNamespace.Window():
            this[pathIndex];
    }

}

analysisNamespace.Fixation = class {

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

analysisNamespace.Regression = class {

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

analysisNamespace.RegressionSet = class extends Array {

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

analysisNamespace.Character = class {

    fixations = [];
    regressionsIn = new analysisNamespace.RegressionSet();
    regressionsOut = new analysisNamespace.RegressionSet();

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

analysisNamespace.Text = class extends Array {

    constructor(windowPath, totalCharacters) {
        super();
        // Get line end info
        let lineStartIndexes = new analysisNamespace.SortedNumberList();
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
            this[i] = new analysisNamespace.Character(isLineStart);
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
                        let newRegression = new analysisNamespace.Regression(
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
        recordFixations(currentWindows.previous, new analysisNamespace.Window());
    }

}

analysisNamespace.CharacterAnalysis = class {

    regressions = {
        regressionsOut: new analysisNamespace.RegressionSet(),
        regressionsIn: new analysisNamespace.RegressionSet()
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
            this.regressionsOutCount = character.regressionsOut.length;
            this.regressionsOutTime = character.regressionsOut.reduce(
                (total, regressionOut) => total + regressionOut.pathDuration,
                0
            );
            this.regressionsInCount = character.regressionsIn.length;
            this.regressionsInTime = character.regressionsIn.reduce(
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

analysisNamespace.TextAnalysis = class extends Array {

    constructor(text) {
        super();
        // Analyse by character
        for (let char of text) {
            this.push(new analysisNamespace.CharacterAnalysis(char));
        }
    }

}

analysisNamespace.RatioList = class extends Array {

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

analysisNamespace.Reader = class {

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

analysisNamespace.TextAnalysisList = class extends Array {

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
                statistics[statisticName] = new analysisNamespace.SortedNumberList();
            }
            this.push({
                statistics: statistics,
                regressionsIn: new analysisNamespace.RegressionSet(),
                regressionsOut: new analysisNamespace.RegressionSet()
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

    getHues(statistic, average) {
        let averageList = [...this].map(
            (char) => char.statistics[statistic].getAverage(average)
        );
        return new analysisNamespace.RatioList(
            averageList,
            0, // Red
            120, // Green
            true // Reverse since small values should be green and large values red
        );
    }

    getBorderAlphas() {
        let averageList = [...this].map(
            (char) => char.statistics.isLineStart.getMean()
        );
        return new analysisNamespace.RatioList(
            averageList,
            0, // transparent
            1, // opaque
            false
        );
    }

    getRegressionPathHues(tokenIndex, regressionType, regressionStat) {
        let regressions = this[tokenIndex][regressionType];
        let paths = [];
        for (let i = 0; i < this.length; i++) {
            paths[i] = (
                !regressions.hasOwnProperty(i)?
                0:
                regressions[i][regressionStat]
            );
        }
        return new analysisNamespace.RatioList(
            paths,
            0, // Red
            120, // Green
            true // Reverse since low values should be green and vice versa
        );
    }

}

analysisNamespace.ReadingManager = class {

    constructor(textLength, readers, filters) {
        this.filters = filters;
        this.textLength = textLength;
        // Initialise readings field
        this.readers = readers.map(
            (reader) => new analysisNamespace.Reader(reader)
        );
    }

    addReading(readerIndex, windows) {
        let reader = this.readers[readerIndex];
        let windowPath = new analysisNamespace.WindowPath(reader.wpm, windows);
        let text = new analysisNamespace.Text(windowPath, this.textLength);
        reader.textAnalysis = new analysisNamespace.TextAnalysis(text);
        // Return true if the reading affects the analysis requested by the reader
        if (reader.isWithinGroup(...Object.values(this.filters))) {
            return true;
        }
        return false;
    }

    getNewTextAnalysis() {
        let newAnalysisList = new analysisNamespace.TextAnalysisList(this.textLength);
        for (let reader of this.readers) {
            if (reader.isWithinGroup(...Object.values(this.filters)) && reader.hasOwnProperty("textAnalysis")) {
                newAnalysisList.addTextAnalysis(reader.textAnalysis);
            }
        }
        return newAnalysisList;
    }

    changeFilter(filterName, filterValue) {
        this.filters[filterName] = filterValue;
    }

}

analysisNamespace.DisplayerTree = class {

    isHighlighted = false;

    constructor(parentElement, text, highlightedOnclick, unHighlightedOnclick) {
        this.element = document.createElement("span");
        this.element.classList.add("token");
        this.element.innerText = text;
        parentElement.appendChild(this.element);
        this.activeOnclick = () => unhighlightedOnclick(this);
        this.inactiveOnclick = () => highlightedOnclick(this);
        this.element.onclick = this.activeOnclick;
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

    reset() {
        this.unHighlight();
        this.setHue(NaN);
        this.setBorderAlpha(NaN);
    }

    highlight() {
        if (this.isHighlighted === true) return;
        this.element.onclick = this.highlightedOnclick;
        swapValues(this, "activeOnclick", "inactiveOnclick");
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

    unHighlight() {
        if (this.isHighlighted === false) return;
        this.isHighlighted = false;
        this.element.onclick = this.unHighlightedOnclick;
        swapValues(this, "activeOnclick", "inactiveOnclick");
        this.setStyle(
            "font-weight",
            "normal"
        );
        this.setStyle(
            "border-bottom-style",
            "none"
        );
    }

}

analysisNamespace.DisplayerTreeRoot = class extends Array {

    maxDepth = 4;

    constructor(text, onclick1, onclick2) {
        super();
        // Group by sentence
        let tokenEnders = [
            /\.|!|\?/,
            /,|;|:|{|}|\(|\)|\[|\]/,
            /\s/
        ];
        let formSubTree = (parentElement, parentText = text, depth = 0) => {
            let displayerArray = [];
            let ender = tokenEnders[depth];
            let curToken = "";
            for (let char of parentText) {
                if (/\w/.test(char) && ender !== undefined) {
                    curToken += char;
                } else {
                    if (curToken === "") {
                        displayerArray.push(new analysisNamespace.DisplayerTree(parentElement, char, onclick1, onclick2));
                    } else if (ender.test(char)) {
                        // Recursion case
                        let tokenDisplayer = new analysisNamespace.DisplayerTree(parentElement, "", onclick1, onclick2);
                        tokenDisplayer.children = formSubTree(tokenDisplayer.element, curToken, depth + 1);
                        displayerArray.push(tokenDisplayer);
                        displayerArray.push(new analysisNamespace.DisplayerTree(parentElement, char, onclick1, onclick2));
                        curToken = "";
                    } else {
                        curToken += char;
                    }
                }
            }
            if (curToken !== "") {
                let tokenDisplayer = new analysisNamespace.DisplayerTree(parentElement, "", onclick1, onclick2);
                tokenDisplayer.children = formSubTree(tokenDisplayer.element, curToken, depth + 1);
                displayerArray.push(tokenDisplayer);
            }
            return displayerArray;
        };
        let root = document.getElementById("an_text");
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

    getDisplayers(depth, displayerList = [...this]) {
        if (depth === -1) {
            // Return all leaves (chars)
            return this.getLeaves();
        }
        // Only return nodes with children (reject leaves)
        let branches = displayerList.filter(
            (displayer) => displayer.hasOwnProperty("children")
        );
        return (
            depth === 0?
            branches:
            branches.reduce(
                (displayers, branch) => displayers.concat(this.getDisplayers(depth - 1, branch.children)),
                []
            )
        );
    }

    resetDisplayers(depth) {
        for (let displayer of this.getDisplayers(depth)) {
            displayer.reset();
        }
    }

    setHues(depth, hues, deriveHue, nextHueIndex = 0, displayers = this) {
        if (depth === -1) {
            this.getLeaves().forEach(
                (leaf, index) => leaf.setHue(hues[index])
            );
        } else {
            for (let displayer of displayers) {
                if (displayer.hasOwnProperty("children")) {
                    if (depth === 0) {
                        let totalChildChars = displayer.getLeaves().length;
                        let childHues = [...hues].slice(nextHueIndex, nextHueIndex + totalChildChars);
                        displayer.setHue(deriveHue(childHues));
                        nextHueIndex += totalChildChars;
                    } else {
                        this.setHues(depth - 1, hues, deriveHue, nextHueIndex, displayer.children);
                    }
                } else {
                    nextHueIndex++;
                }
            }
        }
    }

    setBorderAlphas(borderAlphas) {
        this.getLeaves().forEach(
            (leaf, index) => leaf.setBorderAlpha(borderAlphas[index])
        );
    }

}

analysisNamespace.StatisticDisplayer = class {

    depth = -1;
    statistic = document.getElementById("an_statistic_sel").value;
    average = document.getElementById("an_average_sel").value;
    filters = {
        gender: document.getElementById("an_gender_sel").value,
        impairment: document.getElementById("an_impairment_sel").value,
        minAge: document.getElementById("an_min_age").value,
        maxAge: document.getElementById("an_max_age").value,
        minWPM: document.getElementById("an_min_wpm").value,
        maxWPM: document.getElementById("an_max_wpm").value,
        minInnerWidth: document.getElementById("an_min_inner_width").value,
        maxInnerWidth: document.getElementById("an_max_inner_width").value
    };

    constructor(text, readers) {
        // Make text DOM elements
        this.displayerTree = new analysisNamespace.DisplayerTreeRoot(text, this.displayPaths, this.setHues);
        this.readingManager = new analysisNamespace.ReadingManager(text.length, readers, this.filters);
    }

    setHues(displayer) {
        //this.displayerTree.resetDisplayers();
        if (displayer !== undefined) displayer.unHighlight();
        this.displayerTree.setHues(this.depth, this.currentTextAnalysis.getHues(this.statistic, this.average), this.getHueDeriver());
    }

    setBorderAlphas() {
        this.displayerTree.setBorderAlphas(this.currentTextAnalysis.getBorderAlphas());
    }

    changeToken(token) {
        this.displayerTree.resetDisplayers(this.depth);
        this.depth = (
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
        this.setHues();
    }

    changeStatistic(statistic) {
        this.resetDisplayers();
        this.statistic = statistic;
        this.setHues();
    }

    changeAverage(average) {
        this.average = average;
        this.setHues();
    }

    changeFilter(filterName, filterValue) {
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

    isRegressionStatistic(statistic) {
        return this.statistic[0] === "r";
    }

    getHueDeriver() {
        switch (this.statistic) {
            case "firstFixationDuration":
                return (hueList) => hueList[0];
            case "spilloverTime":
                return (hueList) => hueList[hueList.length - 1];
            default:
                return (hueList) =>
                hueList.reduce(
                    (total, hue) => total + hue
                ) / hueList.length;
        }
    }

    displayPaths(displayer) {
        if (!this.isRegressionStatistic()) return;
        // Set new highlighting
        displayer.highlight();
        // Set hues
        this.displayerTree.setHues(this.depth, this.currentTextAnalysis.getRegressionPathHues(tokenIndex, regressionType, regressionStat), this.getHueDeriver());
    }

}

analysisNamespace.ProgressDisplayer = class {

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

analysisNamespace.InterfaceManager = class {

    constructor(title, version) {
        // Define a recursive helper function for asynchronous requests for reading data
        let addReadings = (readers, curIndex = 0) => {
            if (curIndex < readers.length) {
                postRequest(
                    ["title=" + title, "version=" + version, "readerHash=" + readers[curIndex].usernameHash],
                    "../../private/researcher/getWindows.php",
                    () => {
                        this.progressDisplayer.addFailure();
                        addReadings(readers, curIndex + 1);
                    },
                    // Add the next reading
                    (windows) => {
                        this.progressDisplayer.addSuccess();
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
                            this.statisticDisplayer = new analysisNamespace.StatisticDisplayer(text, readers);
                            this.progressDisplayer = new analysisNamespace.ProgressDisplayer(readers.length);
                            addReadings(readers);
                        }
                    );
                }
            }
        );
    }

    getFileContents(asCSV) {
        let analyses = this.analysesDisplayer.tokenAnalyses;
        if (!asCSV) return JSON.stringify(analyses);
        let csv = [];
        for (let lineCount = 0; lineCount < json.length; lineCount++) {
            let analysis = json[lineCount];
            let csvLine = [];
            let reader = json.
            csv.push(csvLine.toString());
        }
        return JSON.stringify(csv.join("\n"));
    }

    // Adapted from https://ourcodeworld.com/articles/read/189/how-to-create-a-file-and-generate-a-download-with-javascript-in-the-browser-without-a-server
    download(asCSV) {
        // Get the contents of the file to be downloaded
        let fileContents = getFileContents(asCSV);
        // Add a hidden download link to the document
        var downloadLink = document.createElement('a');
        downloadLink.setAttribute(
            'href',
            'data:text/plain;charset=utf-8,' + encodeURIComponent(fileContents)
        );
        downloadLink.setAttribute('download', filename);
        downloadLink.style.display = 'none';
        document.body.appendChild(downloadLink);
        // Trigger the download
        downloadLink.click();
        // Remove the link from the document
        document.body.removeChild(downloadLink);
    }



}

var analysisInterface;

function showAnalyseDiv() {
    // Make a new interface for text analysis
    let selText = selTexts[0];
    let title = selText.title;
    let version = selText.version;
    analysisInterface = new analysisNamespace.InterfaceManager(title, version);
    // Show only the analysis div
    hideDivs("an");
}
