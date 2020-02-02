function updateUI(account_type) {

    let div = document.getElementByID("personal_info");
    let html = "";

    if (account_type == 'reader') {

        html += 'Date of Birth' +
            '<input id="dob" type="date">';
        html += 'Gender' +
            '<select id="gender">' +
            '<option value="m">Male</option>' +
            '<option value="f">Female</option>' +
            '<option value="o">Other</option>' +
            '</select>';
        html += 'Reading problems due to a disability' +
            '<input id="dis" type="checkbox">';

    } else {

        html += 'Full Name' +
            '<input id="name" type="text">';
        html += 'Email Address' +
            '<input id="email" type="email">';

    }

    div.innerHTML = html;

}

updateUI('reader');
