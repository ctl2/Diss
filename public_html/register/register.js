'use strict';

function register(username_el, password1_el, password2_el, acc_type_el, info_divs) {

    let input_els = [acc_type_el, username_el, password1_el, password2_el];
    for (let info_div of info_divs.children) {
        input_els.push(info_div.children[0]);
    }

    let validator = new Validator(input_els);
    validator.validate();
    if (!validator.invalid) {
        postRequest(input_els.map(el => el.id + '=' + el.value), "../../private/register/register.php", login, alert, true);
    }

}

class Validator {

    constructor(account_els) {
        this.input_els = account_els;
        this.invalid = false;
    }

    validate() {

        let el;
        let password;
        for (el of this.input_els) {

            let input = el.value;
            switch (el.type) {
                case 'text':
                    if (el.id == 'username') {
                        this.validateUsername(input);
                    } else {
                        this.validateName(input);
                    }
                    break;
                case 'password':
                    this.validatePassword(input, password);
                    password = input;
                    break;
                case 'date':
                    this.validateDate(input);
                    break;
                case 'email':
                    this.validateEmail(input);
                    break;
                default:
                    // Catches select and checkbox. These can't hold invalid responses.
            }

            if (this.invalid) break;

        }

    }

    validateUsername(username) {

        if (username.length < 3) {
            this.reject('Usernames must be more than 2 characters long.');
        } else if (username.length > 10) {
            this.reject('Usernames must be 10 characters or less.')
        } else if (!(/^[a-z|0-9|-|_]+$/i.test(username))) {
            this.reject('Usernames may only contain alphanumeric characters, hyphens and underscores.')
        }

    }

    validatePassword(password1, password2) {

        if (password2 !== undefined && password1 != password2) {
            this.reject('Passwords must match.');
        } else if (password1.length < 3) {
            this.reject('Passwords must be more than 2 characters long.');
        } else if (password1.length > 10) {
            this.reject('Passwords must be 10 characters or less.')
        } else if (!(/^[a-z|0-9|-|_]+$/i.test(password1))) {
            this.reject('Passwords may only contain alphanumeric characters, hyphens and underscores.')
        }

    }

    validateName(name) {

        if (name.length < 3) {
            this.reject('Names must be more than 2 characters long.');
        } else if (name.length > 30) {
            this.reject('Names must be 20 characters or less.')
        } else if (!(/^[a-z|á|é|í|ó|ú|-|']+$/i.test(name))) {
            this.reject('Names may only contain letters, hyphens and apostrophes.')
        }

    }

    validateEmail(email) {

        if (email.length < 3) {
            this.reject('Emails must be more than 2 characters long.');
        } else if (email.length > 30) {
            this.reject('Emails must be 30 characters or less.')
        } else if (!(/^\S+@\S+$/i.test(email))) {
            this.reject('Email addresses must be correctly formatted.')
        }

    }

    validateDate(date) {

        let date_parts = date.split("-");
        if (date_parts.length != 3) {
            this.reject("Dates must be filled out fully.");
        } else if (Number(date_parts[0]) === NaN || Number(date_parts[1]) === NaN || Number(date_parts[2]) === NaN) {
            this.reject("Dates must not contain non-numeric characters.");
        }

    }

    reject(message) {
        this.invalid = true;
        alert(message);
    }

}
