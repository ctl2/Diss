// function adapted from https://stackoverflow.com/a/7165616
function postRequest(data, url, failure, success) {

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
            if (req.status === 200) {
                let response = JSON.parse(req.responseText);
                if (response.success) {
                    success(response.message);
                } else {
                    failure(response.message);
                }
            } else {
                failure(req.status);
            }
        }
    };

    req.open('POST', url, true);
    req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    req.send(data.join('&'));
    return req;

}
