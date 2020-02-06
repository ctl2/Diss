'use strict';

class Session {

    const charIdPrefix = "char";
    const shownChar = "&#9618";
    const unshownChar = "&#9619";
    const windowSizeLeft = 4;
    const windowSizeRight = 12;
    const timer = new FixationTimer();

    constructor(text) {
        this.text = text;
        this.currentWindow = [];
        this.leftmostUnshownCharIndex = 0;
        window.addEventListener('resize', drawCharacters);
        this.drawCharacters();
    }

    maskCharacter(charIndex) {
        let charSpan = document.getElementById(this.charIdPrefix + "_" + charIndex);
        if (['\r', '\t', '\v', '\n', '\f'].indexOf(this.text[charIndex]) === -1) {
            if (charIndex < this.leftmostUnshownCharIndex) {
                charSpan.innerHTML = this.shownChar;
            } else {
                charSpan.innerHTML = this.unshownChar;
            }
        } else {
            // Display newline/tab characters normally
            charSpan.innerText = this.text[charIndex];
        }
    }

    isWhiteSpace(charIndex) {
        return /\s/.test(this.text[charIndex]);
    }

    closeWindow() {
        // Hide characters and remove all items from the currentWindow list
        while (this.currentWindow.length > 0) {
            this.maskCharacter(this.currentWindow.shift());
        }
        // Record fixation end time
        this.timer.recordFixationEnd();
    }

    getWindowBoundaries(originCharIndex) {
        // Get origin line element
        let originChar = document.getElementById(this.charIdPrefix + "_" + originCharIndex);
        let originLine = originChar.parentElement.parentElement;
        // Calculate the window's start point
        let startCharIndex = originCharIndex - this.windowSizeLeft;
        let startLineIndex = Number(originLine.firstChild.firstChild.id.split("_")[1]);
        let startIndex = Math.max(startCharIndex, startLineIndex);
        // Calculate the window's end point
        let endCharIndex = originCharIndex + this.windowSizeRight;
        let endLineIndex = Number(originLine.lastChild.lastChild.id.split("_")[1]);
        let endIndex = Math.min(endCharIndex, endLineIndex);
        // Return the boundary points
        return {
            startIndex: startIndex,
            endIndex: endIndex
        };
    }

    openWindow(originCharIndex) {
        // Get window boundary points
        let windowBoundaries = this.getWindowBoundaries(originCharIndex);
        // Check that no characters have been skipped
        if (windowBoundaries.startIndex <= this.leftmostUnshownCharIndex) {
            // Show characters
            for (let i = windowBoundaries.startIndex; i <= windowBoundaries.endIndex; i++) {
                let charSpan = document.getElementById(this.charIdPrefix + "_" + i);
                charSpan.innerText = this.text[i];
                charSpan.classList.add("shown");
                this.currentWindow.push(i);
            }
            // Update the boundary of seen text
            this.leftmostUnshownCharIndex = Math.max(this.leftmostUnshownCharIndex, windowBoundaries.endIndex + 1);
            if (this.leftmostUnshownCharIndex === text.length) document.getElementById("text_but").removeAttribute("disabled");
            // Start timing the window fixation
            this.timer.recordFixationStart(windowBoundaries);
        }
    }

    drawCharacters() {
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
            this.maskCharacter(i);
            // Handle word-ending characters
            if (this.isWhiteSpace(i)) {
                // Handle line-overflowing words
                if (wordSpan.getBoundingClientRect().right >= window.innerWidth*0.96) {
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

}

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
        postRequest(["log=" + JSON.stringify(this.log)], '../../private/reader/uploadReadingData.php', this.success, alert);
    }

    success() {
        if (window.confirm("Would you like to read another text?")) {
            startSession();
        } else {
            logout();
        }
    }

}

var session = new Session();

function uploadLog() {
    postRequest(["log=" + JSON.stringify(this.log)], '../../private/reader/uploadReadingData.php', this.success, alert);
}

function startSession() {
    var text = 'A computer-based eye-movement controlled, display system was developed for the study of perceptual processes in reading. A study was conducted to identify the region from which skilled readers pick up various types of visual information during a fixation while reading. This study involved making display changes, based on eye position, in the text pattern as the subject was in the act of reading from it, and then examining the effects these changes produced on eye behavior. The results indicated that the subjects acquired word-length pattern information at least 12 to 15 character positions to the right of the fixation point, and that this information primarily influenced saccade lengths. Specific letter- and word-shape information were acquired no further than 10 character positions to the right of the fixation point.'.split("");

}

function logout() {
    postRequest([], '../../private/lib/logout.php', () => location.href='../login/login.html'), alert);
}
