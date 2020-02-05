'use strict';

class FixationTimer {

    log = [];

    getCurrentTime() {
        return new Date().getTime();
    }

    recordFixationStart(windowBoundaries) {
        this.log.push({
            windowStartIndex: windowBoundaries.startIndex,
            windowEndIndex: windowBoundaries.endIndex,
            startTime: this.getCurrentTime()
        });
    }

    recordFixationEnd() {
        this.log[this.log.length - 1].endTime = this.getCurrentTime();
    }

    uploadLog() {

        xmlhttp.open("POST", "URL");
        xmlhttp.setRequestHeader("Content-Type", "application/json");
        xmlhttp.send(JSON.stringify({name:"John Rambo", time:"2pm"}));
    }

}

function maskCharacter(charIndex) {
    let charSpan = document.getElementById(charIdPrefix + "_" + charIndex);
    if (['\r', '\t', '\v', '\n', '\f'].indexOf(text[charIndex]) === -1) {
        if (charIndex < leftmostUnshownCharIndex) {
            charSpan.innerHTML = shownChar;
        } else {
            charSpan.innerHTML = unshownChar;
        }
    } else {
        // Display newline/tab characters normally
        charSpan.innerText = text[charIndex];
    }
}

function isWhiteSpace(charIndex) {
    return /\s/.test(text[charIndex]);
}

function closeWindow() {
    // Hide characters and remove all items from the currentWindow list
    while (currentWindow.length > 0) {
        maskCharacter(currentWindow.shift());
    }
    // Record fixation end time
    timer.recordFixationEnd();
}

function getWindowBoundaries(originCharIndex) {
    // Get origin line element
    let originChar = document.getElementById(charIdPrefix + "_" + originCharIndex);
    let originLine = originChar.parentElement.parentElement;
    // Calculate the window's start point
    let startCharIndex = originCharIndex - windowSizeLeft;
    let startLineIndex = Number(originLine.firstChild.firstChild.id.split("_")[1]);
    let startIndex = Math.max(startCharIndex, startLineIndex);
    // Calculate the window's end point
    let endCharIndex = originCharIndex + windowSizeRight;
    let endLineIndex = Number(originLine.lastChild.lastChild.id.split("_")[1]);
    let endIndex = Math.min(endCharIndex, endLineIndex);
    // Return the boundary points
    return {
        startIndex: startIndex,
        endIndex: endIndex
    };
}

function openWindow(originCharIndex) {
    // Get window boundary points
    let windowBoundaries = getWindowBoundaries(originCharIndex);
    // Check that no characters have been skipped
    if (windowBoundaries.startIndex <= leftmostUnshownCharIndex) {
        // Show characters
        for (let i = windowBoundaries.startIndex; i <= windowBoundaries.endIndex; i++) {
            let charSpan = document.getElementById(charIdPrefix + "_" + i);
            charSpan.innerText = text[i];
            charSpan.classList.add("shown");
            currentWindow.push(i);
        }
        // Update the boundary of seen text
        leftmostUnshownCharIndex = Math.max(leftmostUnshownCharIndex, windowBoundaries.endIndex + 1);
        if (leftmostUnshownCharIndex === text.length) document.getElementById("text_but").removeAttribute("disabled");
        // Start timing the window fixation
        timer.recordFixationStart(windowBoundaries);
    }
}

function drawCharacters() {
    // Reset the text display
    let textDiv = document.getElementById("text");
    textDiv.innerHTML = "";
    // Create initial line and word elements and form their connections
    let lineDiv = document.createElement("div");
    textDiv.appendChild(lineDiv);
    lineDiv.classList.add("line");
    let wordSpan = document.createElement("span");
    lineDiv.appendChild(wordSpan);
    wordSpan.classList.add("word");
    // Create and display character elements
    for (let i = 0; i < text.length; i++) {
        // Create a new character element
        let charSpan = document.createElement("span");
        // Connect it to a parent word element
        wordSpan.appendChild(charSpan);
        // Set its properties
        charSpan.classList.add("char");
        charSpan.id = charIdPrefix + "_" + i;
        charSpan.onmouseover = function() {openWindow(i)};
        charSpan.onmouseout = function() {closeWindow()};
        maskCharacter(i);
        // Handle word-ending characters
        if (isWhiteSpace(i)) {
            // Handle line-overflowing words
            if (wordSpan.getBoundingClientRect().right >= window.innerWidth*0.97) {
                // Create a new line element and form its connections
                lineDiv = document.createElement("div");
                textDiv.appendChild(lineDiv);
                lineDiv.classList.add("line");
                lineDiv.appendChild(wordSpan);
            }
            // Create a new word and append it to the current line element
            wordSpan = document.createElement("span");
            lineDiv.appendChild(wordSpan);
            wordSpan.classList.add("word");
        }
    }
}

const charIdPrefix = "char";
const shownChar = "&#9618";
const unshownChar = "&#9619";
const windowSizeLeft = 4;
const windowSizeRight = 12;
const timer = new FixationTimer();

var text = 'A computer-based eye-movement controlled, display system was developed for the study of perceptual processes in reading. A study was conducted to identify the region from which skilled readers pick up various types of visual information during a fixation while reading. This study involved making display changes, based on eye position, in the text pattern as the subject was in the act of reading from it, and then examining the effects these changes produced on eye behavior. The results indicated that the subjects acquired word-length pattern information at least 12 to 15 character positions to the right of the fixation point, and that this information primarily influenced saccade lengths. Specific letter- and word-shape information were acquired no further than 10 character positions to the right of the fixation point.'.split("");
var currentWindow = [];
var leftmostUnshownCharIndex = 0;

window.addEventListener('resize', drawCharacters);
drawCharacters();
