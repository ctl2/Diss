'use strict';

function showUploadDiv(isNewText) {
    // Prepare the title and version input elements
    let title_el = document.getElementById("up_title");
    let ver_el = document.getElementById("up_ver");
    if (isNewText) {
        // Title is blank and enabled
        title_el.value = "";
        title_el.removeAttribute("disabled");
        // Version = 1
        ver_el.innerText = "1";
    } else {
        // Title is set and disabled
        let title = selTexts[0].title;
        title_el.value = title;
        title_el.disabled = "disabled";
        // Find the highest current version
        let highestVersion = 0;
        for (let version in allTexts[title].versions) {
            let versionNum = Number(version);
            if (versionNum > highestVersion) highestVersion = versionNum;
        }
        // Version = highest + 1
        ver_el.innerText = highestVersion + 1;
    }
    // Show only the upload div
    hideDivs("up");
}

function upload() {
    // Process user inputs
    let processor = new InputProcessor();
    processor.process().then(() => {
        let data = [];
        for (let datumName in processor.data) {
            let datum = processor.data[datumName];
            if (datum.isValid === false) {
                alert(datum.value);
                data = undefined;
                break;
            }
            if (datum.value !== null) data.push(datumName + "=" + datum.value);
        }
        if (data) {
            let versionEl = document.getElementById("up_ver");
            data.push("version=" + versionEl.innerText);
            postRequest(data, "../../private/researcher/uploadText.php", uploadSuccess, alert, true);
        }
    });
}

function uploadSuccess(responseJSON) {
    let response = JSON.parse(responseJSON);
    if (response.success) {
        document.getElementById("up_reset").reset();
        document.getElementById("up_ver").innerText = "";
        hideDivs();
        alert("New text successfully uploaded!");
    } else {
        alert(response.message);
    }
}

class InputProcessor {

    data = [];

    constructor() {
        this.data["title"] = {el: document.getElementById("up_title")};
        this.data["text"] = {el: document.getElementById("up_file")};
        this.data["isPublic"] = {el: document.getElementById("up_is_public")};
        this.data["minAge"] = {el: document.getElementById("up_min_age")};
        this.data["maxAge"] = {el: document.getElementById("up_max_age")};
        this.data["gender"] = {el: document.getElementById("up_gender")};
    }

    async process() {
        this.processTitle();
        await this.processFile();
        this.processIsPublic();
        this.processMinAge();
        this.processMaxAge();
        this.processGender();
    }

    processTitle() {
        let title = this.data["title"].el.value;
        if (title == "") {
            this.flag("title", false, "Please provide a title.");
        } else if (title.length > 30) {
            this.flag("title", false, "Titles must be 30 characters or less.");
        } else {
            this.flag("title", true, title);
        }
    }

    async processFile() {
        if (!window.File || !window.FileReader || !window.FileList || !window.Blob) {
            this.flag("text", false, "Your browser doesn't support the API's necessary to read files. Please switch to a more modern browser.");
        } else if (this.data["text"].el.files.length == 0) {
            this.flag("text", false, "Please provide a text file.")
        } else {
            try {
                let fileContents = await this.getFileContents(this.data["text"].el.files[0]);
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
        this.flag("isPublic", true, this.data["isPublic"].el.checked);
    }

    processMinAge() {
        if (this.isRelevant(this.data["minAge"].el)) {
            let minAge = this.data["minAge"].el.value;
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
        if (this.isRelevant(this.data["maxAge"].el)) {
            let maxAge = this.data["maxAge"].el.value;
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
        if (this.isRelevant(this.data["gender"].el)) {
            this.flag("maxAge", true, this.data["gender"].el.value);
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
