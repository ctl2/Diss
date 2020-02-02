function login(accountType) {

    switch accountType {
        case 'reader':
            window.location.href = '../reader/home';
        case 'researcher':
            window.location.href = '../researcher/home';
        case 'reviewer':
            window.location.href = '../reviewer/home';
        default:
            alert(accountType);
    }

}
