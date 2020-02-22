function reviewPrivileges(responseJSON) {
    let response = JSON.parse(responseJSON);
    if (!response.success) {
        redirect("");
    }
}

function checkPrivileges(accountType) {
    let req = postRequest(["accountType=" + accountType], "../../private/lib/checkPrivileges.php", reviewPrivileges, redirect);
}
