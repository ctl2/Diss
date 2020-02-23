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

class WindowToCharPathConvertor {

    pauseThresholdPercent = 5;

    constructor(windowPath) {
        this.windowPath = windowPath;
        this.minPauseTime = this.getMinPauseTime();
    }

    // O(log(n)) complexity search algorithm
    getPosition(number, sortedArray) {
        if (sortedArray.length === 0) return 0;
        let nextIndex = Math.floor(sortedArray.length / 2);
        let nextNumber = sortedArray[nextIndex];
        if (number > nextNumber) {
            return nextIndex + 1 + this.getPosition(number, sortedArray.slice(nextIndex + 1));
        } else {
            return 0 + this.getPosition(number, sortedArray.slice(0, nextIndex));
        }
    }

    //
    getMinPauseTime() {
        // Initialise variables
        let windowCount = 0;
        let thresholdValues = [];
        let thresholdValueQuant = this.windowPath.length * (this.pauseThresholdPercent / 100);
        // Populate thresholdValues with the first values found
        while (windowCount < thresholdValueQuant) {
            let nextOffset = this.windowPath[windowCount++].openOffset;
            let nextPosition = this.getPosition(nextOffset, thresholdValues);
            thresholdValues.splice(nextPosition, 0, nextOffset);
        }
        // Populate thresholdValues with the largest values found
        while (windowCount < this.windowPath.length) {
            let nextOffset = this.windowPath[windowCount++].openOffset;
            if (nextOffset > thresholdValues[0]) {
                thresholdValues.shift(); // Remove the smallest number
                let nextPosition = this.getPosition(nextOffset, thresholdValues);
                thresholdValues.splice(nextPosition, 0, nextOffset);
            }
        }
        // Return the minimum value in thresholdValues
        return thresholdValues[0];
    }

    isIntraLineSingleStepForward(oldWindow, newWindow) {
        return oldWindow.rightmostChar + 1 === newWindow.rightmostChar // The windows are at the start of a line
            || oldWindow.rightmostChar + 2 === newWindow.rightmostChar
            || oldWindow.leftmostChar + 1 === newWindow.leftmostChar  // The windows are at the end of a line
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
                    duration = timeFragment * (i + 1 - charWindow.rightmostChar);
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
        // Get time values for the chars in newWindow
        let newCharTimes = newWindow === undefined ? [] : this.getCharTimes(newWindow);
        //
        for (let curTime of curCharTimes) {
            let found = false;
            for (let newTime of newCharTimes) {
                if (curTime.charIndex === newTime.charIndex) {
                    found = true;
                    newTime.duration += curTime.duration;
                }
            }
            // Add passed chars to the path
            if (!found) path.push(curTime);
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
        let windowCount = 0;
        //
        while (windowCount < this.windowPath.length) {
            let curWindow = this.windowPath[windowCount++];
            let accepted = false;
            let startOfLine = false;
            //
            if (windowCount === 1) {
                // This is the first window
                accepted = true;
                startOfLine = true;
            } else if (prevUncriticalWindow === undefined) {
                // The current path is not a regression or line-break
                if (this.isIntraLineSingleStepForward(prevCriticalWindow, curWindow)) {
                    // This is the current path's expected continuation
                    curCriticalChars = this.addWindowToPath(criticalCharPath, curCriticalChars, prevCriticalWindow);
                    accepted = true;
                }
            } else {
                // Search for a line-break or regression from prevCriticalWindow
                if (this.isInterLineSingleStepForward(prevCriticalWindow, curWindow)) {
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
            }
            // Update most recently accepted window
            if (accepted) {
                prevUncriticalWindow = undefined; // Stop/continue not searching for line-breaks or regressions
                prevCriticalWindow = Object.assign({}, curWindow); // Shallow copy
                prevCriticalWindow.startOfLine = startOfLine;
                prevCriticalWindow.endOfLine = false;
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

function getStatistics(charPath) {
    console.log(charPath);
}

// Request data
// Analyse the data on the client side
// For each stat in current analysis data:
    // let dif = curStat - newStat
    // curStat += dif / analysedSessionCount
// Update graphic and loading display
// Repeat from step 1
