'use strict';

function showUploadDiv() {
    hideDivs();
    document.getElementByID("upload").removeAttribute('hidden');
}

function upload() {

    let title_el = document.getElementByID("up_title");
    let file_el = document.getElementByID("up_file");
    let minAge_el = document.getElementByID("up_min_age");
    let maxAge_el = document.getElementByID("up_max_age");
    let isPublic_el = document.getElementByID("up_is_public");



    postRequest(["value"=>title_el.value], "../../private/researcher/checkTitleAvailability.php", );


}

class Validator {

    constructor(title_el, file_el, minAge_el, maxAge_el, isPublic_el) {
        this.title_el = title_el;
        this.file_el = file_el;
        this.min_age_el = min_age_el;
        this.max_age_el = max_age_el;
        this.is_public_el = is_public_el;
    }

    validate() {
        // Perform validation tests in ascending order of importance so that less important messages will be overwritten.
        this.validateIsPublic();
        this.validateMaxAge();
        this.validateMinAge();
        this.validateFile();
        this.validateTitle();
    }

    validateTitle() {
        if (title == "") {
            this.flagInvalid(title_el, "Please provide a title.");
        } else if (title_el.value.length > 30) {
            this.flagInvalid(title_el, "Titles must be 30 characters or less.");
        }
    }

    validateFile() {
        if (!window.File || !window.FileReader || !window.FileList || !window.Blob) {
            this.flagInvalid(file_el, "Your browser doesn't support the API's necessary to read files. Please switch to a more modern browser.");
        } else if (file_el.files.length == 0) {
            this.flagInvalid(file_el, "Please provide a text file.")
        } else {
            var fileReader = new FileReader();
            reader.onload = function() {
                if (fileReader.result == "") {
                    this.flagInvalid(file_el, "Please provide a non-empty text file.");
                } else if (fileReader.result.length > 30000) {
                    this.flagInvalid(file_el, "Text files must not contain more than 30,000 characters.");
                }
            };
            fileReader.readAsText(file_el.files[0]);
        }
    }

    validateMinAge() {
        if (isRelevant(min_age_el)) {
            if (isNaN(min_age_el.value)) {
                this.flagInvalid(min_age_el, 'Minimum age must be a number.');
            } else if (min_age_el.value < 0 || min_age_el.value > 255) {
                this.flagInvalid(min_age_el, 'Minimum age must be between 0 and 255.');
            }
        }
    }

    validateMaxAge() {
        if (isRelevant(max_age_el)) {
            if (isNaN(max_age_el.value)) {
                this.flagInvalid(max_age_el, 'Maximum age must be a number.');
            } else if (max_age_el.value < 0 || max_age_el.value > 255) {
                this.flagInvalid(max_age_el, 'Maximum age must be between 0 and 255.');
            }
        }
    }

    validateIsPublic() {}

    flagInvalid(element, message) {
        this.invalid = {
            element: element,
            message: message
        };
    }

    isRelevant(input_el) {
        return !input_el.disabled = "disabled" && input_el.value != '';
    }

}
