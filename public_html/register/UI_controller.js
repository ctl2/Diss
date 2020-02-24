function updateUI(account_type) {
    // Reset the personal info div
    let div = document.getElementById("personal_info");
    div.innerHTML = "";
    // Append appropriate elements
    if (account_type == 'reader') {
        div.appendChild(getNewDobDiv());
        div.appendChild(getNewGenderDiv());
        div.appendChild(getNewImpairmentDiv());
    } else {
        div.appendChild(getNewFirstNameDiv());
        div.appendChild(getNewSurnameDiv());
        div.appendChild(getNewEmailDiv());
    }
}

function getNewDobDiv() {
    // Create date of birth elements
    let dobDiv = document.createElement('div');
    let dobText = document.createTextNode('Date of Birth ');
    let dobInput = document.createElement('input');
    // Set element properties
    dobDiv.classList.add("inputField");
    dobInput.id = "dob";
    dobInput.type = "date";
    // Connect elements
    dobDiv.appendChild(dobText);
    dobDiv.appendChild(dobInput);
    // Return div
    return dobDiv;
}

function getNewGenderDiv() {
    // Create gender elements
    let genDiv = document.createElement('div');
    let genText = document.createTextNode('Gender ');
    let genSel = document.createElement('select');
    let genOpt1 = document.createElement('option');
    let genOpt2 = document.createElement('option');
    let genOpt3 = document.createElement('option');
    // Set element properties
    genDiv.classList.add("inputField");
    genSel.id = "gender";
    genOpt1.value = "m";
    genOpt1.innerText = "Male";
    genOpt2.value = "f";
    genOpt2.innerText = "Female";
    genOpt3.value = "o";
    genOpt3.innerText = "Other";
    // Connect elements
    genSel.appendChild(genOpt1);
    genSel.appendChild(genOpt2);
    genSel.appendChild(genOpt3);
    genDiv.appendChild(genText);
    genDiv.appendChild(genSel);
    // Return div
    return genDiv;
}

function getNewImpairmentDiv() {
    // Create impairment elements
    let impDiv = document.createElement('div');
    let impText = document.createTextNode('Reading problems due to a disability ');
    let impInput = document.createElement('input');
    // Set element properties
    impDiv.classList.add("inputField");
    impInput.id = "isImpaired";
    impInput.type = "checkbox";
    // Connect elements
    impDiv.appendChild(impText);
    impDiv.appendChild(impInput);
    // Return div
    return impDiv;
}

function getNewFirstNameDiv() {
    // Create name elements
    let nameDiv = document.createElement('div');
    let nameText = document.createTextNode('First name ');
    let nameInput = document.createElement('input');
    // Set element properties
    nameDiv.classList.add("inputField");
    nameInput.id = "firstName";
    nameInput.type = "text";
    // Connect elements
    nameDiv.appendChild(nameText);
    nameDiv.appendChild(nameInput);
    // Return div
    return nameDiv;
}

function getNewSurnameDiv() {
    // Create name elements
    let nameDiv = document.createElement('div');
    let nameText = document.createTextNode('Surname ');
    let nameInput = document.createElement('input');
    // Set element properties
    nameDiv.classList.add("inputField");
    nameInput.id = "surname";
    nameInput.type = "text";
    // Connect elements
    nameDiv.appendChild(nameText);
    nameDiv.appendChild(nameInput);
    // Return div
    return nameDiv;
}

function getNewEmailDiv() {
    // Create gender elements
    let emailDiv = document.createElement('div');
    let emailText = document.createTextNode('Email address ');
    let emailInput = document.createElement('input');
    // Set element properties
    emailDiv.classList.add("inputField");
    emailInput.id = "email";
    emailInput.type = "email";
    // Connect elements
    emailDiv.appendChild(emailText);
    emailDiv.appendChild(emailInput);
    // Return div
    return emailDiv;
}

updateUI('reader');
