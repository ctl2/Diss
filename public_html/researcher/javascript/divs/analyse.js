var analysisNamespace = {};

analysisNamespace.SortedNumberList = class extends Array {

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

analysisNamespace.Character = class {

    fixations = [];
    regressionsOut = {};
    regressionsIn = {};

    constructor(isLineStart) {
        super();
        this.isLineStart = isLineStart;
    }

    addRegression(regressionType, otherChar, pathDuration) {
        let otherChar = regression.otherChar;
        this.addNewRegressionObject(statistic, otherChar);
        this[regressionType][otherChar].count++;
        this[regressionType][otherChar].pathDuration += pathDuration;
    }

    addNewRegressionObject(statistic, otherChar) {
        if (!this[regressionType].hasOwnProperty(otherChar)) {
            this[regressionType][otherChar] = {
                count: 0,
                pathDuration: 0
            };
        }
    }

}

analysisNamespace.Token = class {

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
            let collectorChar = new Character();
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
            let collectRegressions = (regressionType, newChar) => {
                for (let otherChar in newChar[regressionType]) {
                    collectorChar.addRegression(
                        regressionType,
                        getTokenIndex(otherChar),
                        newChar[regressionType][otherChar].pathDuration
                    );
                }
            };
            for (let char of characters) {
                collectRegressions("regressionsIn", char);
                collectRegressions("regressionsOut", char);
            }
            this.regressionsIn = collectorChar.regressionsIn;
            this.regressionsOut = collectorChar.regressionsOut;
        }
    }

}

analysisNamespace.CharacterPath = class extends Array {

    constructor(text, windowPath) {
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

    charLength = 1;
    regressionInOrigins = {};
    regressionOutDestinations = {};

    constructor(character = new Character(), tokenisedText) {
        if (character.fixations.length === 0) {
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

    setNewAverage(statistic, newToken) {
        this[statistic] += (newToken[statistic] - this[statistic]) / this.charLength
    }

    mergeAnalysis(analysis) {
        this.charLength += analysis.charLength;
        // First fixation duration is that of the new leftmost character
        // Spillover time is that of the new rightmost character
        this.spilloverTime = analysis.spilloverTime;
        // Regression data is summed
        this.regressionsInCount += analysis.regressionsInCount;
        this.regressionsInTime += analysis.regressionsInTime;
        this.mergeRegressions("regressionInOrigins", analysis);
        this.regressionsOutCount += analysis.regressionsOutCount;
        this.regressionsOutTime += analysis.regressionsOutTime;
        this.mergeRegressions("regressionOutDestinations", analysis);
        // Everything else uses the mean of all character values
        // This prevents longer words from having inherently higher values
        this.setNewAverage("gazeDuration", analysis);
        this.setNewAverage("totalReadingTime", analysis);
    }

}

analysisNamespace.TokenAnalyses = class extends Array {

    toAveragedNumberArray(statistic, average) {
        let numberArrays = [...this].map(
            (token) => token.analyses.map(
                (analysis) => Number(analysis[statistic]) // Convert booleans to binary integers
            )
        );
        return (
            average === "mean"?
            new MeanAveragedArray(numberArrays):
            new MedianAveragedArray(numberArrays)
        );
    }

    getRegressionPaths(tokenIndex, regressionType, regressionStat) {
        let mergedAnalysis = new TokenAnalysis();
        for (let analysis of this[tokenIndex].analyses) {
            mergedAnalysis.mergeRegressions(regressionType, analysis)
        }
        let regressionAnalysis = mergedAnalysis[regressionType];
        let paths = [];
        for (let i = 0; i < this.length; i++) {
            paths[i] =
                !regressionAnalysis.hasOwnProperty(i)?
                0:
                regressionAnalysis[i][regressionStat];
        }
        return paths;
    }

}

analysisNamespace.CharacterAnalyses = class extends analysisNamespace.TokenAnalyses {

    constructor(readings, text) {
        super();
        // Analyse by character
        for (let i = 0; i < text.length; i++) {
            let curChar = ({
                text: text[i],
                analyses: []
            });
            for (let reading of readings) {
                curChar.analyses.push(
                    new TokenAnalysis(reading.characters[i])
                );
            }
            this[i] = curChar;
        }
    }

}

analysisNamespace.WordAnalyses = class extends analysisNamespace.TokenAnalyses {

    constructor(readings, text) {
        super();
        // Analyse by word
        let words = [...this].map(
            (word) => word.text
        );
        for (let reading of readings) {
            let totalCharCount = 0;
            for (let word of this) {
                let analysis = (
                    word.isWord?
                    new TokenAnalysis(reading.characters[totalCharCount], words):
                    new TokenAnalysis() // Regression info on non-word characters is lost
                );
                let endChar = ++totalCharCount + word.text.length - 1;
                while (totalCharCount < endChar) {
                    let nextCharacter = reading.characters[totalCharCount++];
                    analysis.mergeAnalysis(new TokenAnalysis(nextCharacter, words));
                }
                word.analyses.push(analysis);
            }
        }
        for (let word of this) {
            delete word.isWord; // No longer needed
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

analysisNamespace.StatisticDisplayer = class {

    displayers = [];

    constructor(readings, text, filters, statistic, token, average) {
        // Declare variables
        let relevantReadings = readings.filter(
            (reading) =>
                reading.isRelevant(
                    ...filters
                )
        );
        // Set fields
        this.tokenAnalyses = tokenAnalyses;
        this.textHues = textHues; // HSL hue values for heatmap display
        this.borderAlphas = borderAlphas; // HSL alpha values for Line-start indicators
        // Set up display
        let displayDiv = document.getElementById("an_display");
        displayDiv.innerHTML = "";
        for (let token of tokenAnalyses) {
            this.displayers.push(
                new TokenDisplayer(displayDiv, token.text)
            );
        }
    }

    display() {
        for (let i = this.displayers.length - 1; i >= 0; i--) {
            let nextDisplayer = this.displayers[i];
            nextDisplayer.setTokenColour(this.textHues[i]);
            nextDisplayer.setBorderColour(this.borderAlphas[i]);
        }
    }

}

analysisNamespace.PathDisplayer = class extends analysisNamespace.StatisticDisplayer {

    constructor(readings, text, filters, statistic, token, average) {
        super(readings, text, filters, statistic, token, average);
        // Set fields
        this.regressionType = (
            statistic.includes("In")?
            "regressionInOrigins":
            "regressionOutDestinations"
        );
        this.regressionStat = (
            statistic.includes("Count")?
            "count":
            "duration"
        );
    }

    unhighlightDisplayers() {
        for (let i = this.displayers.length - 1; i >= 0; i--) {
            this.displayers[i].unHighlight();
            this.displayers[i].element.onclick =
                () => this.displayPaths(i);
        }
    }

    display() {
        this.unhighlightDisplayers();
        super.display();
    }

    displayPaths(tokenIndex) {
        // Set new highlighting
        this.unhighlightDisplayers();
        this.displayers[tokenIndex].highlight();
        // Set new onclick
        this.displayers[tokenIndex].element.onclick =
            () => this.display();
        // Get paths
        let paths = this.tokenAnalyses.getRegressionPaths(tokenIndex, this.regressionType, this.regressionStat);
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

analysisNamespace.TokenDisplayer = class {

    isHighlighted = false;

    constructor(parentElement, text) {
        this.element = document.createElement("span");
        this.element.classList.add("token");
        this.element.innerText = text;
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

analysisNamespace.Reader = class {

    constructor(reader) {
        this.wpm = reader.wpm; // Reading speed in words per minute
        this.gender = reader.gender;
        this.age = reader.age;
        this.isImpaired = reader.isImpaired;
    }

    isWithinGroup(minWPM, maxWPM, gender, impairment, minAge, maxAge) {
        return (
            winWPM <= this.wpm &&
            maxWPM >= this.wpm
        ) && (
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

analysisNamespace.ReadingManager = class {

    chars = [];
    words = [];

    constructor(text, readers) {
        // Initialise readings field
        this.readings = readers.map(
            (reader) => new Reader(reader)
        );
        // Initialise char field
        for (let char of text) {
            chars.push({
                text: char,
                firstFixationDurations: new analysisNamespace.SortedNumberList(),
                firstFixationDurations: new analysisNamespace.SortedNumberList(),
                firstFixationDurations: new analysisNamespace.SortedNumberList(),
                firstFixationDurations: new analysisNamespace.SortedNumberList(),
                firstFixationDurations: new analysisNamespace.SortedNumberList(),
                firstFixationDurations: new analysisNamespace.SortedNumberList(),
                firstFixationDurations: new analysisNamespace.SortedNumberList(),
                firstFixationDurations: new analysisNamespace.SortedNumberList(),
                firstFixationDurations: {},
                firstFixationDurations: {},
            })
        }
        // Initialise words field
        let totalCharacters = text.length;
        let curWord;
        for (let i = 0; i < totalCharacters; i++) {
            let char = text[i];
            if (/\w/.test(char)) {
                if (curWord === undefined) {
                    curWord = ({
                        text: char,
                        isWord: true
                    });
                } else {
                    curWord.text += char;
                }
                if (i === totalCharacters - 1) this.words.push(curWord);
            } else {
                if (curWord !== undefined) {
                    this.words.push(curWord);
                    curWord = undefined;
                }
                this.words.push({
                    text: char,
                    isWord: false
                });
            }
        }
    }

    addReading(usernameHash, windows) {
        let reading = this.readings[usernameHash];
        reading.windowPath = new analysisNamespace.WindowPath(windows, reading.wpm);
        reading.charPath = new analysisNamespace.CharacterPath(this.chars, reading.windowPath);
        reading.charAnalysis = new analysisNamespace.CharacterAnalysis(reading.characterPath, this.chars);
        for (let statistic of this.averageCharAnalysis) {

        }
        reading.wordAnalysis = new analysisNamespace.WordAnalysis(reading.characterPath, this.words);
    }

    getHueAnalysis(token, statistic, average) {
        let analyses = Object.values(this.readings).map(
            (reading) => reading[token + "Analysis"].toNumberArray(statistic)
        );
        let averageClass = analysisNamespace[average[0].toUpperCase() + average.slice(1) + "AveragedArray"];
        let averageAnalysis = new averageClass(analyses);
        return new analysisNamespace.RatioList(
            averageAnalysis,
            0, // Red
            120, // Green
            true // Reverse since small values should be green and large values red
        );
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

    gender = document.getElementById("an_gender_sel").value;
    impairment = document.getElementById("an_impairment_sel").value;
    minAge = document.getElementById("an_min_age").value;
    maxAge = document.getElementById("an_max_age").value;
    minWPM = document.getElementById("an_min_wpm").value;
    maxWPM = document.getElementById("an_max_wpm").value;
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
                        this.readingManager.addReading(nextReader, JSON.parse(windows));
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
                            this.readingManager = new analysisNamespace.ReadingManager(text, readers);
                            this.progressDisplayer = new analysisNamespace.ProgressDisplayer(readerUsernameHashes.length);
                            addReadings(readerUsernameHashes);
                        }
                    );
                }
            }
        );
    }

    updateFilter(filterKey, filterValue) {
        this[filterKey] = filterValue;
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
        // Get values from elements
        let filters = this.getValues(this.filterElements);
        let others = this.getValues([this.statisticElement, this.tokenElement, this.averageElement]);
        // Perform analysis
        this.analysesDisplayer =
            this.isRegressionStatistic(this.statisticElement.value)?
            new PathDisplayer(this.readings, this.text, filters, ...others):
            new StatisticDisplayer(this.readings, this.text, filters, ...others);
        // Display analysis
        this.ReadingManager.display();
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

function showAnalyseDiv() {
    // Make a new interface for text analysis
    let selText = selTexts[0];
    let title = selText.title;
    let version = selText.version;
    analysisInterface = new analysisNamespace.InterfaceManager(title, version);
    // Show only the analysis div
    hideDivs("an");
}
