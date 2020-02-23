function showAnalyseDiv() {
    // Retrieve the selected text
    let selText = selTexts[0];
    let title = selText.title;
    let version = selText.version;
    // Request reading data
    let data = [
        "title=" + title,
        "version=" + version
    ];
    postRequest(data, "../../private/researcher/getReadingData.php", success, alert);
    // Show only the analysis div
    hideDivs("an");
}

function success(responseJSON) {
    let response = JSON.parse(responseJSON);
    if (!response.success) {
        alert(response.message);
    } else {
        if (response.message == "") {
            // FINISHED
            console.log("END");
        } else {
            // Process data
            let windows = JSON.parse(response.message);
            let charPath = new WindowToCharPathConvertor(windows).getCriticalCharPath();
            let statistics = getStatistics(charPath);
            // Request next data set
            postRequest([], "../../private/researcher/getReadingData.php", success, alert);
        }
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
        return thresholdValues.getSmallest();
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
    getCriticalCharPath() {
        //
        let prevCriticalWindow = undefined;
        let prevUncriticalWindow = undefined;
        let curCriticalChars = [];
        let criticalCharPath = [];
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
                prevCriticalWindow.endOfLine = true;
                curCriticalChars = this.addWindowToPath(criticalCharPath, curCriticalChars, prevCriticalWindow);
                prevUncriticalWindow.startOfLine = true;
                curCriticalChars = this.addWindowToPath(criticalCharPath, curCriticalChars, prevUncriticalWindow);
                accepted = true;
            }
            // Accept or reject the current window
            if (accepted) {
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
        return criticalCharPath;
    }

}

class Analyser {

    constructor(charPath) {
        this.charPath = charPath;
    }

    getGazeDurations() {
        let seenCharIndexes = new SortedNumberList();
        for (char of this.charPath) {
            if (!seenCharIndexes.contains(char.charIndex)) {
                seenCharIndexes.insert(char.charIndex);
            }
        }
    }

}

// Request data
// Analyse the data on the client side
// For each stat in current analysis data:
    // let dif = curStat - newStat
    // curStat += dif / analysedSessionCount
// Update graphic and loading display
// Repeat from step 1
