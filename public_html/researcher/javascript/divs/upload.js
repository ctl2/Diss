'use strict';

function showUploadDiv(button, isNewText) {
    // Prepare the title input element
    let title_el = document.getElementById("up_title");
    if (isNewText) {
        // Title is blank and enabled
        title_el.value = "";
        title_el.removeAttribute("disabled");
    } else {
        // Title is set and disabled
        let title = selTexts[0].title;
        title_el.value = title;
        title_el.disabled = "disabled";
    }
    // Show only the upload div
    hideDivs(button, "up");
}

function upload() {
    // Process user inputs
    let processor = new InputProcessor();
    processor.process().then(() => {
        let data = [];
        let textData = {};
        for (let datumName in processor.data) {
            let datum = processor.data[datumName];
            if (datum.isValid === false) {
                window.alert(datum.value);
                data = undefined;
                break;
            }
            textData[datumName] = datum.value;
            if (datum.value !== null) data.push(datumName + "=" + datum.value);
        }
        if (data !== undefined) {
            let titleEl = document.getElementById("up_title");
            data.push("isNew=" + Number(!titleEl.hasAttribute("disabled")));
            postRequest(data, "../../private/researcher/uploadText.php", window.alert, () => uploadSuccess(textData));
        }
    });
    processor.process();
}

function uploadSuccess(textData) {
    // Reset upload div
    document.getElementById("up_reset").reset();
    document.getElementById("up_ver").innerText = "";
    hideDivs();
    // Add text to selection options
    if (!allTexts.hasOwnProperty(textData.title)) {
        allTexts[textData.title] = {
            uploader: username,
            versions: {}
        };
    }
    let version = {};
    version[textData.version] = {
        isPublic: textData.isPublic,
        targetAgeMin: textData.minAge,
        targetAgeMax: textData.maxAge,
        targetGender: textData.gender
    };
    allTexts[textData.title].versions = Object.assign(
        allTexts[textData.title].versions,
        version
    );
    if (unselTexts.hasOwnProperty(textData.title)) {
        unselTexts[textData.title].unshift(textData.version);
    } else {
        unselTexts[textData.title] = [textData.version];
    }
    displayUnselectedTexts();
    // Inform user of success
    window.alert("New text successfully uploaded!");
}

class InputProcessor {

    data = {};

    constructor() {
        this.data.title = {el: document.getElementById("up_title")};
        this.data.version = {el: document.getElementById("up_ver")};
        this.data.text = {el: document.getElementById("up_file")};
        this.data.isPublic = {el: document.getElementById("up_is_public")};
        this.data.minAge = {el: document.getElementById("up_min_age")};
        this.data.maxAge = {el: document.getElementById("up_max_age")};
        this.data.gender = {el: document.getElementById("up_gender")};
    }

    process() {
        return new Promise(async (resolve) => {
            this.processTitle();
            this.processVersion();
            await this.processFile();
            this.processIsPublic();
            this.processMinAge();
            this.processMaxAge();
            this.processGender();
            resolve();
        });
    }

    // Checks for duplicate titles are done on the server side.
    processTitle() {
        let title = this.data.title.el.value;
        if (title == "") {
            this.flag("title", false, "Please provide a title.");
        } else if (title.length > 30) {
            this.flag("title", false, "Titles must be 30 characters or less.");
        } else {
            this.flag("title", true, title);
        }
    }

    // Checks for duplicate versions are done on the server side
    processVersion() {
        let version = this.data.version.el.value;
        if (version == "") {
            this.flag("version", false, "Please provide a version name.");
        } else if (version.length > 10) {
            this.flag("version", false, "Version names must be 10 characters or less.");
        } else {
            this.flag("version", true, version);
        }
    }

    async processFile() {
        if (!window.File || !window.FileReader || !window.FileList || !window.Blob) {
            this.flag("text", false, "Your browser doesn't support the API's necessary to read files. Please update your browser.");
        } else if (this.data.text.el.files.length == 0) {
            this.flag("text", false, "Please provide a text file.")
        } else {
            try {
                let fileContents = await this.getFileContents(this.data.text.el.files[0]);
                if (fileContents == "") {
                    this.flag("text", false, "Please provide a non-empty text file.");
                } else if (fileContents.length > 30000) {
                    this.flag("text", false, "Text files must not contain more than 30,000 characters.");
                } else {
                    this.flag("text", true, fileContents);
                }
            } catch(e) {
                this.flag("text", false, "File took too long to load.");
            }
        }
    }

    getFileContents(file) {
        let fileReader = new FileReader();
        fileReader.readAsText(file);
        // Wait a while for the file to load.
        return new Promise((resolve, reject) => {
            let patience = 10;
            let checkFile = setInterval(() => {
                if (fileReader.readyState === 2) {
                    clearInterval(checkFile);
                    resolve(fileReader.result);
                } else {
                    // Abort the file read operation if it has taken too long
                    if (patience-- === 0) {
                        clearInterval(checkFile);
                        fileReader.abort();
                        reject();
                    }
                }
            }, 100);
        });
    }

    processIsPublic() {
        this.flag("isPublic", true, Number(this.data.isPublic.el.checked));
    }

    processMinAge() {
        if (this.isRelevant(this.data.minAge.el)) {
            let minAge = this.data.minAge.el.value;
            if (isNaN(minAge)) {
                this.flag("minAge", false, 'Minimum age must be a number.');
            } else if (minAge < 0 || minAge > 255) {
                this.flag("minAge", false, 'Minimum age must be between 0 and 255.');
            } else {
                this.flag("minAge", true, minAge);
            }
        } else {
            this.flag("minAge", true, null);
        }
    }

    processMaxAge() {
        if (this.isRelevant(this.data.maxAge.el)) {
            let maxAge = this.data.maxAge.el.value;
            if (isNaN(maxAge)) {
                this.flag("maxAge", false, 'Maximum age must be a number.');
            } else if (maxAge < 0 || maxAge > 255) {
                this.flag("maxAge", false, 'Maximum age must be between 0 and 255.');
            }
        } else {
            this.flag("maxAge", true, null);
        }
    }

    processGender() {
        if (this.isRelevant(this.data.gender.el)) {
            this.flag("maxAge", true, this.data.gender.el.value);
        } else {
            this.flag("gender", true, null);
        }
    }

    flag(key, isValid, message) {
        this.data[key].isValid = isValid;
        this.data[key].value = message;
    }

    isRelevant(input_el) {
        return !input_el.hasAttribute("disabled") && input_el.value != '';
    }

}
