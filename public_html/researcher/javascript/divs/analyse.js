var analysisNamespace = {};

analysisNamespace.SortedList = class extends Array {

    // O(log(n)) complexity search algorithm
    getInsertionIndex(item, list = this) {
        if (list.length === 0) return 0;
        let nextIndex = Math.floor(list.length / 2);
        let nextItem = list[nextIndex];
        if (this.areEqual(item, nextItem) {
            return nextIndex;
        } else {
            let number = this.getNumber(item);
            let nextNumber = this.getNumber(nextItem);
            if (number > nextNumber) {
                return nextIndex + 1 + this.getIndex(number, list.slice(nextIndex + 1));
            } else {
                return 0 + this.getIndex(number, list.slice(0, nextIndex));
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

}

analysisNamespace.SortedNumberList = class extends SortedList {

    getNumber(number) {
        return number;
    }

    areEqual(number1, number2) {
        return number1 === number2;
    }

    contains(number) {
        let index = this.getInsertionIndex(number);
        if (this.areEqual(number, this[index]) return true;
        return false;
    }

    remove(number) {
        let index = this.getInsertionIndex(number);
        if (this.areEqual(number, this[index]) {
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

analysisNamespace.SortedObjectList = class extends SortedList {

    constructor(idKey, numberKey) {
        super();
        this.idKey = idKey;
        this.numberKey = numberKey;
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

    getAverage(average, idList) {
        if (idList.length === 0) return NaN;
        let averageMethod = this[average[0].toUpperCase() + average.slice(1)];
        return averageMethod(idList);
    }

    getMedian(idList) {
        let positionsFromMedian = Math.floor(idList.length / 2);
        for (let object of this) {
            if (idList.some(
                (id) => id === object[this.idKey]
            )) {
                if (positionsFromMedian-- === 0) {
                    return this.getNumber(object);
                }
            }
        }
    }

    getMean(idList) {
        if (idList.length === 0) return NaN;
        let total = 0;
        for (let object of this) {
            if (idList.some(
                (id) => id === object[this.idKey]
            )) {
                total += this.getNumber(object);
            }
        }
        return total / idList.length;
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

analysisNamespace.WindowPath = class extends Array {

    constructor(windows, wpm) {
        super();
        // Normalise window durations by reader reading speed
        // This prevents slower readers from having a greater impact on analysis results
        let speedDivider = wpm / 250; // 250 words per minute is around average
        for (let window of windows) {
            window.duration /= speedDivider;
            this.push(new Window(window));
        }
    }

    // Get the minimum gaze duration that will be considered a pause
    getMinPauseTime() {
        // Initialise variables
        const pauseThresholdPercent = 15; // A window's openOffset must be in the highest pauseThresholdPercent% to count as a pause
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

analysisNamespace.Fixation = class {

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
        for (let otherChar of regressionSet) {
            let regression = regressionSet[otherChar];
            this.addRegression(otherChar, regression.pathDuration, regression.count);
        }
    }

    addRegression(otherChar, pathDuration, count = 1) {
        this.addNewRegressionObject(statistic, otherChar);
        this[otherChar].count += count;
        this[otherChar].pathDuration += pathDuration;
    }

    addNewRegressionObject(statistic, otherChar) {
        if (!this.hasOwnProperty(otherChar)) {
            this[otherChar] = {
                count: 0,
                pathDuration: 0
            };
        }
    }

}

analysisNamespace.Character = class extends analysisNamespace.RegressionSet {

    fixations = [];

    constructor(isLineStart) {
        super();
        this.isLineStart = isLineStart;
    }

}

analysisNamespace.CharacterPath = class extends Array {

    constructor(windowPath, text) {
        super();
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
            this[i] = new Character(isLineStart);
        }

        // Declare construction helper functions

        // Record fixation data
        let recordFixations = (oldWindow, newWindow) => {
            // Initialise variables
            let newFixations = newWindow.getFixations();
            // Handle newly masked chars
            for (let charIndex = oldWindow.leftmostChar; charIndex <= oldWindow.rightmostChar; charIndex++) {
                if (!newWindow.contains(charIndex)) {
                    let charFixations = this[charIndex].fixations;
                    let currentFixation = charFixations[charFixations.length-1];
                    currentFixation.endFixation(newFixations);
                }
            }
            // Handle unmasked chars
            for (let newFixation of newFixations.fixations) {
                let charFixations = this[newFixation.charIndex].fixations;
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
                        this[regression.origin].addRegression(
                            "regressionsOut",
                            regression.destination,
                            regression.pathDuration
                        );
                        this[regression.destination].addRegression(
                            "regressionsIn",
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
        recordFixations(currentWindows.previous, new Window());
    }

}

analysisNamespace.TokenAnalysis = class {

    constructor(characters, tokenisedText) {
        super();
        if (characters === undefined) {
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
            let tokenLength = characters.length;
            this.isLineStart = characters[0].isLineStart;
            this.firstFixationDuration = characters[0].fixations[0].firstFixationDuration;
            this.gazeDuration = characters.reduce(
                (tokenTotal, char) => tokenTotal + char.fixations[0].gazeDuration
            ) / tokenLength;
            this.spilloverTime = characters.reduce(
                (tokenTotal, char) => tokenTotal + char.fixations[0].spilloverTime
            ) / tokenLength;
            this.totalReadingTime = characters.reduce(
                (tokenTotal, char) => tokenTotal + char.fixations.reduce(
                    (charTotal, fixation) => charTotal + fixation.gazeDuration
                )
            ) / tokenLength;
            this.regressionsOutCount = characters.reduce(
                (tokenTotal, char) => tokenTotal + char.regressionsOut.length
            ) / tokenLength;
            this.regressionsOutTime = characters.reduce(
                (tokenTotal, char) => tokenTotal + char.regressionsOut.reduce(
                    (charTotal, regressionOut) => charTotal + regressionOut.pathDuration
                )
            ) / tokenLength;
            this.regressionsInCount = characters.reduce(
                (tokenTotal, char) => tokenTotal + char.regressionsIn.length
            ) / tokenLength;
            this.regressionsInTime = characters.reduce(
                (tokenTotal, char) => tokenTotal + char.regressionsIn.reduce(
                    (charTotal, regressionIn) => charTotal + regressionIn.pathDuration
                )
            ) / tokenLength;
            // Record regression paths
            this.regressions = {}
            this.regressions.regressionsOut = new analysisNamespace.RegressionSet();
            this.regressions.regressionsIn = new analysisNamespace.RegressionSet();
            let getTokenIndex = (charIndex) => {
                if (tokenisedText === undefined) return charIndex;
                let charCount = 0;
                for (let tokenCount in tokenisedText) {
                    charCount += tokenisedText[tokenCount].length;
                    if (charCount > charIndex) {
                        return tokenCount;
                    }
                }
            };
            let addRegressions = (regressionType, newChar) => {
                for (let otherChar in newChar[regressionType]) {
                    this[regressionType].addRegression(
                        getTokenIndex(otherChar),
                        newChar[regressionType][otherChar].pathDuration
                    );
                }
            };
            for (let char of characters) {
                addRegressions("regressionsIn", char);
                addRegressions("regressionsOut", char);
            }
        }
    }

}

analysisNamespace.TokenAnalysisList = class extends Array {

    getRegressionPaths(tokenIndex, regressionType, regressionStat) {
        let regressions = this[tokenIndex].analyses.regressions[regressionType];
        let paths = [];
        for (let i = 0; i < this.length; i++) {
            paths[i] =
                !regressions.hasOwnProperty(i)?
                0:
                regressions[i][regressionStat];
        }
        return paths;
    }

}

analysisNamespace.CharacterAnalysisList = class extends analysisNamespace.TokenAnalysisList {

    constructor(readings, chars) {
        super();
        // Analyse by character
        let characterAnalysisList = Array.from(chars)
        this.push
        for (let i = 0; i < text.length; i++) {
            for (let reading of readings) {
                curChar.analyses.push(
                    new TokenAnalysis(reading.characters[i])
                );
            }
            this[i] = curChar;
        }
    }

}

analysisNamespace.WordAnalysisList = class extends analysisNamespace.TokenList {

    constructor(reading, words) {
        super();
        // Analyse by word
        let totalCharCount = 0;
        for (let word of words) {
            if (!word.isIgnored) {
                let characterAnalysisList = Array.from(word.text).map(
                    (char, index) => reading.characters[totalCharCount + index]
                );
                let wordAnalysis = new TokenAnalysis(characterAnalysisList);
                this.push(wordAnalysis);
                totalCharCount += word.length;
            }
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
        this.wpm = reader.wpm; // Reading speed in words per minute
        this.gender = reader.gender;
        this.age = reader.age;
        this.isImpaired = reader.isImpaired;
    }

    isWithinGroup(gender, impairment, minAge, maxAge, minWPM, maxWPM) {
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
            winWPM <= this.wpm &&
            maxWPM >= this.wpm
        );
    }

}

analysisNamespace.Text = class extends Array {

    constructor(rawTokens) {
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
        let addStatisticTrackers = (tokenList) => {
            for (let token of tokenList) {
                let statistics = {};
                for (let statisticName of statisticNameList) {
                    statistics[statisticName] = new analysisNamespace.SortedObjectList("usernameHash", "value");
                }
                let statisticTracker = Object.assign({statistics: statistics}, token);
                this.push(statisticTracker);
            }
        };
    }

    addTokenList(tokenList) {
        let totalTokens = tokenList.length;
        for (let tokenCount = 0; tokenCount < totalTokens; tokenCount++) {
            let newToken = tokenList[i];
            let averageToken = this[i];
            for (let statistic of this.statisticNames) {
                averageToken.statistics[statistic].insert(newToken[statistic]);
            }
        }
    }

    getAverage(average, statistic, idList) {
        let averageMethodName = "get" + average[0].toUpperCase() + average.slice(1);
        return (
            statistic === undefined?
            // Return all statistics
            this.map(
                (token) => {
                    let averages = {};
                    for (let statistic of token.statistics) {
                        averages[statistic] = statistic[averageMethodName](idList);
                    }
                    return averages;
                }
            ):
            // Return a single statistic
            this.map(
                (token) => token.statistics[statistic][averageMethodName](idList)
            );
        );
    }

}

analysisNamespace.ReadingManager = class {

    readers = {};

    constructor(readers, chars, words) {
        // Initialise readings field
        for (let identifier in readers) {
            this.readers[identifier] = new analysisNamespace.Reader(readers[identifier]);
        }
        // Initialise text fields
        this.chars = new analysisNamespace.Text(chars);
        this.words = new analysisNamespace.Text(words);
    }

    addReading(usernameHash, windows) {
        let reader = this.readers[usernameHash];
        reader.windowPath = new analysisNamespace.WindowPath(windows, reading.wpm);
        reader.charPath = new analysisNamespace.CharacterPath(readers[usernameHash].windowPath, this.chars);
        reader.charAnalysis = new analysisNamespace.CharacterAnalysis(readers[usernameHash].characterPath, this.chars);
        reader.wordAnalysis = new analysisNamespace.WordAnalysis(readers[usernameHash].characterPath, this.words);
        //
        this.chars.addTokenList(reader.charAnalysis);
        this.words.addTokenList(reader.wordAnalysis);
    }

    getColourData(token, statistic, average, filters) {
        let relevantReaders = [];
        for (let usernameHash in this.readers) {
            if (this.readers[usernameHash].isWithinGroup(...filters)) {
                relevantReaders.push(usernameHash);
            }
        }
        let tokenList = this[token + "s"];
        return {
            hueList: getHueList(tokenList, statistic, average, relevantReaders),
            borderAlphaList: getBorderAlphaList(tokenList, relevantReaders)
        }
    }

    getHueList(tokenList, statistic, average, relevantReaders) {
        let average = tokenList.map(
            (token) => token.statistics[statistic].getAverage(average, relevantReaders)
        );
        return new analysisNamespace.RatioList(
            average,
            0, // Red
            120, // Green
            true // Reverse since small values should be green and large values red
        );
    }

    getBorderAlphaList(tokenList, relevantReaders) {
        let average = tokenList.map(
            (token) => token.statistics.isLineStart.getMean(relevantReaders)
        );
        return new analysisNamespace.RatioList(
            average,
            0, // transparent
            1, // opaque
            false
        );
    }

}

analysisNamespace.TokenDisplayer = class {

    isHighlighted = false;

    constructor(parentElement, text) {
        this.element = document.createElement("span");
        this.element.classList.add("token");
        this.element.innerText = text;
        parentElement.appendChild(this.element);
    }

}

analysisNamespace.TokenAnalysisDisplayer = class extends TokenDisplayer {

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
                "border-left-color",
                0, 0, 0, alpha
            );
        }
    }

    setTokenColour(hue) {
        let alpha;
        if (Number.isNaN(hue)) {
            alpha = 0;
            hue = 0;
            if (!this.isHighlighted) {
                this.setProperty(
                    "opacity",
                    0.4
                );
            }
        } else {
            alpha = 0.6;
            this.setProperty(
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
        this.isHighlighted = true;
        this.setProperty(
            "opacity",
            1
        );
        this.setProperty(
            "font-weight",
            "bold"
        );
        this.setProperty(
            "border-bottom-style",
            "solid"
        );
    }

    unHighlight() {
        this.isHighlighted = false;
        this.setProperty(
            "font-weight",
            "normal"
        );
        this.setProperty(
            "border-bottom-style",
            "none"
        );
    }

}

analysisNamespace.TokenAnalysisDisplayerList = class extends Array {

    constructor(parentDiv, tokens) {
        super();
        this.tokenDisplayerList.wordList.displayerList = tokens.map(
            (token) => (
                token.isIgnored?
                new analysisNamespace.TokenDisplayer(parentDiv, token.text):
                new analysisNamespace.TokenAnalysisDisplayer(parentDiv, token.text)
            )
        );
    }

    setColours(hueList, borderAlphaList) {
        for (let i = this.length - 1; i >= 0; i--) {
            let nextDisplayer = this[i];
            nextDisplayer.setTokenColour(hueList[i]);
            nextDisplayer.setBorderColour(borderAlphaList[i]);
        }
    }

    reset() {
        for (let i = this.length - 1; i >= 0; i--) {
            this[i].unHighlight();
            this[i].element.onclick = (
                () => this.displayPaths(i)
            );
        }
    }

    highlight(tokenIndex) {
        this.unhighlightDisplayers();
        this[tokenIndex].highlight();
    }

}

analysisNamespace.StatisticDisplayer = class {

    tokenDisplayerList = {
        charList: {
            isActive: false
        },
        wordList: {
            isActive: false
        }
    }
    regressionStat;

    constructor(text, readers) {
        // Initialise text fields
        let totalCharacters = text.length;
        let chars = [];
        let words = [];
        let curWord;
        for (let i = 0; i < totalCharacters; i++) {
            let char = text[i];
            chars[i] = {
                text: char,
                isIgnored: false
            };
            if (/\w/.test(char)) {
                if (curWord === undefined) {
                    curWord = ({
                        text: char,
                        isIgnored: false
                    });
                } else {
                    curWord.text += char;
                }
                if (i === totalCharacters - 1) words.push(curWord);
            } else {
                if (curWord !== undefined) {
                    words.push(curWord);
                    curWord = undefined;
                }
                words.push({
                    text: char,
                    isIgnored: true
                });
            }
        }
        this.readingManager = new analysisNamespace.ReadingManager(readers, chars, words);
        // Initialise displayers
        let parentDiv = document.getElementById("an_display");
        this.tokenDisplayerList.charList.displayerList = new analysisNamespace.TokenAnalysisDisplayerList(parentDiv, chars);
        this.tokenDisplayerList.wordList.displayerList = new analysisNamespace.TokenAnalysisDisplayerList(parentDiv, words);
    }

    addReading(usernameHash, windows) {
        this.readingManager.addReading(usernameHash, windows);
        this.display();
    }

    isRegressionStatistic(statistic) {
        return statistic[0] === "r";
        // return (
        //     statistic != "firstFixationDuration" &&
        //     statistic != "gazeDuration" &&
        //     statistic != "spilloverTime" &&
        //     statistic != "totalReadingTime"
        // );
    }

    display(token, statistic, average, filters) {
        this.regressionStat = (
            this.isRegressionStatistic(statistic)?
            statistic:
            undefined
        );
        this.resetDisplayers();
        let tokenList = this.tokenDisplayerList[token + "List"];
        tokenList.isActive = true;
        let colourData = this.readingManager.getColourData(token, statistic, average, filters);
        tokenList.displayerList.setColours(colourData);
    }

    resetDisplayers() {
        for (let tokenList of this.tokenDisplayerList) {
            tokenList.displayerList.reset();
        }
    }

    unhighlightDisplayers() {
        for (let tokenList of this.tokenDisplayerList) {
            tokenList.displayerList.unhighlight();
        }
    }

    displayPaths(tokenIndex, regressionType, regressionStat) {
        if (this.regressionStat === undefined) return;
        // Set new highlighting
        let activeDisplayerList = (
            this.tokenDisplayerList.charList.isActive?
            this.tokenDisplayerList.charList.displayerList:
            this.tokenDisplayerList.wordList.displayerList
        );
        activeDisplayerList.highlight(tokenIndex);
        // Set new onclick
        activeDisplayerList[tokenIndex].element.onclick =
            () => this.display();
        // Get paths
        let paths = this.readingManager.getRegressionPaths(tokenIndex, regressionType, regressionStat);
        // Get path hues
        let pathHues = new RatioList(
            paths,
            0, // Red
            120, // Green
            true // Reverse since low values should be green and vice versa
        );
        for (let i = this.displayers.length - 1; i >= 0; i--) {
            let nextDisplayer = this.displayers[i];
            nextDisplayer.setTokenColour(pathHues[i]);
        }
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

    filters = {
        gender: document.getElementById("an_gender_sel").value,
        impairment: document.getElementById("an_impairment_sel").value,
        minAge: document.getElementById("an_min_age").value,
        maxAge: document.getElementById("an_max_age").value,
        minWPM: document.getElementById("an_min_wpm").value,
        maxWPM: document.getElementById("an_max_wpm").value
    };
    statistic = document.getElementById("an_statistic_sel").value;
    token = document.getElementById("an_token_sel").value;
    average = document.getElementById("an_average_sel").value;

    constructor(title, version) {
        // Define a recursive helper function for asynchronous requests for reading data
        let addReadings = (usernameHashes) => {
            if (readers.length > 0) {
                let nextReader = usernameHashes.pop();
                postRequest(
                    ["title=" + title, "version=" + version, "reader=" + nextReader],
                    "../../private/researcher/getWindows.php",
                    () => {
                        this.progressDisplayer.addFailure();
                        addReadings(usernameHashes);
                    },
                    // Add the next reading
                    (windows) => {
                        this.progressDisplayer.addSuccess();
                        this.statisticDisplayer.addReading(nextReader, JSON.parse(windows));
                        addReadings(usernameHashes);
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
                let readerUsernameHashes = Object.keys(readers);
                if (readerUsernameHashes.length === 0) {
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
                            this.progressDisplayer = new analysisNamespace.ProgressDisplayer(readerUsernameHashes.length);
                            addReadings(readerUsernameHashes);
                        }
                    );
                }
            }
        );
    }

    update(field, value) {
        this[field] = value;
        this.updateDisplay();
    }

    updateDisplay() {
        this.statisticDisplayer.display(this.token, this.statistic, this.average, this.filters);
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
