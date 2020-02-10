function redirect(accountType) {
    switch (accountType) {
        case 'reader':
            window.location.href = '../reader/home.html';
            break;
        case 'researcher':
            window.location.href = '../researcher/home.html';
            break;
        case 'reviewer':
            window.location.href = '../reviewer/home.html';
            break;
        default:
            window.location.href = '../login/login.html';
    }
}
