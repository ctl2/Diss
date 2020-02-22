const minPauseTime = 80;

function isIntraLineSingleStepForward(oldWindow, newWindow) {
    return oldWindow.rightmostChar + 1 === newWindow.rightmostChar // The windows are at the start of a line
        || oldWindow.rightmostChar + 2 === newWindow.rightmostChar
        || oldWindow.leftmostChar + 1 === newWindow.leftmostChar  // The windows are at the end of a line
        || oldWindow.leftmostChar + 2 === newWindow.leftmostChar;
}

function isInterLineSingleStepForward(oldWindow, newWindow) {
    return oldWindow.rightmostChar + 1 === newWindow.leftmostChar;
}

function getPathTime(path) {
    return path.reduce(
        (time, window) => time + window.openOffset + window.closeOffset,
        0
    );
}

// Attempts to remove intermediary windows between reading paths, e.g. line end to next line start
// unseenPath is an array of unseen windows
// criticalPath is an array of accepted windows
// uncriticalPath is an array of rejectable windows along the current path
function getCriticalPath(unseenPath, criticalPath = [], uncriticalPath = []) {
    // Get next window
    let curWindow = unseenPath.shift();
    if (curWindow === undefined) return criticalPath; // End recursion
    if (criticalPath.length === 0) { // Check for start point
        curWindow.openOffset = 0;
        criticalPath.push(curWindow);
    } else if (uncriticalPath.length === 0) { //  Check if the current path is critical
        // Get the previous window
        let prevWindow = criticalPath[criticalPath.length-1];
        // Check if there is a single forward step from the previous window to the current
        if (isIntraLineSingleStepForward(prevWindow, curWindow)) {
            criticalPath.push(curWindow);
        } else {
            // The current path is a regression or line reset
            uncriticalPath.push(curWindow);
        }
    } else { // Current path is uncritical (regression or line-break)
        // Get the previous window
        let prevWindow = uncriticalPath.pop();
        // Check if there is a single forward step from the previous window to the current
        if (isIntraLineSingleStepForward(prevWindow, curWindow)) {
            // If this previous window was paused on, assume that it was a regression target
            if (prevWindow.closeOffset > minPauseTime) {
                // End the uncritical path
                uncriticalPath = [];
                criticalPath.push(prevWindow);
                criticalPath.push(curWindow);
            } else {
                // Continue the uncritical path
                uncriticalPath.push(prevWindow);
                uncriticalPath.push(curWindow);
            }
        } else {
            uncriticalPath.push(prevWindow);
            // Check if the current window is a continuation of the critical path (line break)
            let prevCriticalWindow = criticalPath[criticalPath.length-1];
            if (isInterLineSingleStepForward(prevCriticalWindow, curWindow)) {
                // End the uncritical path
                uncriticalPath = [];
                criticalPath.push(curWindow);
            } else {
                // Continue the uncritical path
                uncriticalPath.push(curWindow);
            }
        }
    }
    // Continue recursion
    return getCriticalPath(unseenPath, criticalPath, uncriticalPath);
}
