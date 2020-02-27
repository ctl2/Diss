function checkPrivileges(accountType) {
    let req = postRequest(
        ["accountType=" + accountType],
        "../../private/lib/checkPrivileges.php",
        redirect, // Redirect to the login screen on failure
        () => {} // No action if access granted
    );
}
