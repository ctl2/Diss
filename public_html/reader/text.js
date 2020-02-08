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
        document.getElementById("text_but").disabled = 'disabled';
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
            leftmostCharIndex: startIndex,
            rightmostCharIndex: endIndex
        };
    }

    openWindow(originCharIndex) {
        // Get window boundary points
        let windowBoundaries = this.getWindowBoundaries(originCharIndex);
        // Check that no characters have been skipped
        if (windowBoundaries.leftmostCharIndex <= this.leftmostUnshownCharIndex) {
            // Show characters
            for (let i = windowBoundaries.leftmostCharIndex; i <= windowBoundaries.rightmostCharIndex; i++) {
                let charSpan = document.getElementById(this.charIdPrefix + "_" + i);
                charSpan.innerText = this.text[i];
                charSpan.classList.add("shown");
                this.currentWindow.push(i);
            }
            // Update the boundary of seen text
            this.leftmostUnshownCharIndex = Math.max(this.leftmostUnshownCharIndex, windowBoundaries.rightmostCharIndex + 1);
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
            charSpan.onmouseover = function() {this.openWindow(i)};
            charSpan.onmouseout = function() {this.closeWindow()};
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

    constructor() {
        this.startTime = Date.now();
        window.performance.mark("end");
    }

    recordFixationStart(windowBoundaries) {
        window.performance.mark("start");
        this.log.push({
            leftmostCharIndex: windowBoundaries.leftmostCharIndex,
            rightmostCharIndex: windowBoundaries.rightmostCharIndex,
            openOffset: window.performance.measure("", "end", "start").duration;
        });
        window.performance.clearMeasures("");
        window.performance.clearMarks("end");
    }

    recordFixationEnd() {
        window.performance.mark("end");
        this.log[this.log.length - 1].closeOffset = window.performance.measure("", "start", "end").duration;
        window.performance.clearMeasures("");
        window.performance.clearMarks("start");
    }

    uploadLog() {
        postRequest([
            "log=" + JSON.stringify(this.log),
            "availWidth=" + window.screen.availWidth,
            "availHeight=" + window.screen.availHeight
            ], '../../private/reader/uploadReadingData.php', this.success, alert);
    }

    success(response) {
        let responseObject = JSON.parse(response);
        if (responseObject.success == false) {
            alert(responseObject.message);
        } else if (window.confirm("Would you like to read another text?")) {
            startNewSession();
        } else {
            logout();
        }
    }

}

class MediaChecker {

    constructor() {
    }

    // See https://www.w3.org/TR/mediaqueries-4/#mf-interaction for hover/pointer media query documentation
    checkPointer() {
        if (window.matchMedia("(pointer: none)").matches) {
            this.acceptable = false;
            this.errorMessage = "your machine's primary input mechanism is not a pointing device";
        } else if (window.matchMedia("(pointer: coarse)").matches) {
            this.acceptable = false;
            this.errorMessage = "your machine's primary input mechanism is not sufficiently accurate to permit a natural reading style";
        }
    }

    checkHover() {
        if (window.matchMedia("(hover: none)").matches) {
            this.acceptable = false;
            this.errorMessage = "your machine's primary input mechanism does not support hovering over words";
        }
    }

    checkPerformance() {
        if (!window.performance) {
            this.acceptable = false;
            this.errorMessage = "your browser does not support the API used for recording reading data";
        }
    }

    isAcceptable() {
        this.acceptable = true;
        checkPointer();
        checkHover();
        checkPerformance();
        return this.acceptable;
    }

    displayError() {
        // Make a new div for displaying error text
        let errorDiv = document.createElement("div");
        errorDiv.classList.add("error");
        errorDiv.innerText = "Sorry! You are not able to participate in reading studies. This is because "
            + this.errorMessage
            + ". Please switch to an appropriate machine/browser if you would like to participate."
        // Display the div
        let textDiv = document.getElementById("text");
        textDiv.appendChild(errorDiv);
    }

}

function start() {
    let mediaChecker = new MediaChecker();
    if (!mediaChecker.isAcceptable()) {
        mediaChecker.displayError();
    } else {
        startNewReadingSession();
    }
}

function startNewSession() {
    // Get an unread text and pass it to the startSession function
    postRequest(["log=" + JSON.stringify(this.log)], '../../private/reader/getUnreadTextString.php', startSession, alert);
}

function startSession(text) {
    session = new Session(text);
}

function logout() {
    postRequest([], '../../private/lib/logout.php', () => location.href='../login/login.html'), alert);
}

var session;

start();
