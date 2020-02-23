'use strict';

class Session {

    charIdPrefix = "char";
    shownChar = "&#9618";
    unshownChar = "&#9619";
    windowSizeLeft = 4;
    windowSizeRight = 12;
    timer = new FixationTimer();

    constructor(text) {
        this.text = text;
        this.currentWindow = [];
        this.leftmostUnshownCharIndex = 0;
        let finishButton = document.getElementById("text_but");
        // finishButton.disabled = 'disabled';
        finishButton.onclick = () => this.uploadSession();
        window.addEventListener('resize', () => this.drawCharacters());
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
        if (this.currentWindow.length > 0) {
            // Hide characters and remove all items from the currentWindow list
            while (this.currentWindow.length > 0) {
                this.maskCharacter(this.currentWindow.shift());
            }
            // Record fixation end time
            this.timer.recordFixationEnd();
        }
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
            if (this.leftmostUnshownCharIndex === this.text.length) document.getElementById("text_but").removeAttribute("disabled");
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
        for (let i = 0; i < this.text.length; i++) {
            // Create a new character element
            let charSpan = document.createElement("span");
            // Connect it to a parent word element
            wordSpan.appendChild(charSpan);
            // Set its properties
            charSpan.classList.add("char");
            charSpan.id = this.charIdPrefix + "_" + i;
            charSpan.onmouseover = () => this.openWindow(i);
            charSpan.onmouseout = () => this.closeWindow();
            this.maskCharacter(i);
            // Handle word-endings
            if (this.isWhiteSpace(i) || i === this.text.length - 1) {
                // Handle line-overflowing words
                if (wordSpan.getBoundingClientRect().right >= window.innerWidth*0.96) {
                    // Create a new line element and form its connections
                    lineDiv = document.createElement("div");
                    textDiv.appendChild(lineDiv);
                    lineDiv.classList.add("line");
                    lineDiv.appendChild(wordSpan);
                }
                if (i !== this.text.length - 1) {
                    // Create a new word and append it to the current line element
                    wordSpan = document.createElement("span");
                    lineDiv.appendChild(wordSpan);
                    wordSpan.classList.add("word");
                }
            }
        }
    }

    uploadSession() {
        this.timer.endTimer();
        postRequest([
            "log=" + JSON.stringify(this.timer.log),
            "availWidth=" + window.screen.availWidth,
            "availHeight=" + window.screen.availHeight
            ], '../../private/reader/uploadReadingData.php', this.success, alert
        );
    }

    success(responseJSON) {
        let response = JSON.parse(responseJSON);
        if (response.success == false) {
            alert(response.message);
        }
        if (window.confirm("Would you like to read another text?")) {
            startNewSession();
        } else {
            logout();
        }
    }

    showReplay(windows, prevChar) {
        if (prevChar !== undefined) prevChar.onmouseout();
        if (windows.length > 0) {
            let curWindow = windows.shift();
            let curChar = document.getElementById("char_" + (curWindow.leftmostChar + this.windowSizeLeft));
            curChar.onmouseover();
            window.setTimeout((windows, curChar) => this.showReplay(windows, curChar), curWindow.closeOffset, windows, curChar);
        }
    }

}

class FixationTimer {

    log = [];

    constructor() {
        window.performance.mark("end");
    }

    recordFixationStart(windowBoundaries) {
        window.performance.mark("start");
        this.log.push({
            leftmostChar: windowBoundaries.leftmostCharIndex,
            rightmostChar: windowBoundaries.rightmostCharIndex,
            openOffset: window.performance.measure("", "end", "start").duration
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

    endTimer() {
        window.performance.clearMarks("end");
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
        this.checkPointer();
        this.checkHover();
        this.checkPerformance();
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
        startNewSession();
    }
}

function startNewSession() {
    // Get an unread text and pass it to the startSession function
    postRequest([], '../../private/reader/getUnreadTextString.php', startSession, alert);
}

function startSession(responseJSON) {
    let response = JSON.parse(responseJSON);
    if (response.success) {
        session = new Session(response.message);
    } else {
        if (confirm(response.message + " Would you like to retry?")) {
            startNewSession();
        } else {
            redirect("");
        }
    }
}

function logout() {
    postRequest([], '../../private/lib/logout.php', () => location.href='../login/login.html', alert);
}

var session;

start();
