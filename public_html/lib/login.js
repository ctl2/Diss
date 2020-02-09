function login(responseJSON) {
    let response = JSON.parse(responseJSON);
    if (response.success == false) {
        alert(response.message);
    } else {
        let accountType = response.message;
        switch (accountType) {
            case 'reader':
                window.location.href = '../reader/home';
                break;
            case 'researcher':
                window.location.href = '../researcher/home';
                break;
            case 'reviewer':
                window.location.href = '../reviewer/home';
                break;
            default:
                alert("Unrecognised account type: " + accountType);
        }
    }

}
