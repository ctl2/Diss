// function adapted from https://stackoverflow.com/a/7165616
function postRequest(data, url, success, failure) {

    var req = false;

    try {
        // most browsers
        req = new XMLHttpRequest();
    } catch (e) {
        // IE
        try{
            req = new ActiveXObject('Msxml2.XMLHTTP');
        } catch(e) {
            // try an older version
            try{
                req = new ActiveXObject('Microsoft.XMLHTTP');
            } catch(e) {
                return false;
            }
        }
    }

    if (!req) return false;
    req.onreadystatechange = function() {
        if (req.readyState == 4) {
            return req.status === 200 ?
                success(req.responseText) : failure(req.status);
        }
    };

    req.open('POST', url, true);
    req.send(data.join('&'));
    return req;

}
