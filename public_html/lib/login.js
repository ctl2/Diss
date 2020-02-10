function login(responseJSON) {
    let response = JSON.parse(responseJSON);
    if (!response.success) {
        alert(response.message);
    } else {
        redirect(response.message);
    }
}
