<?php

    error_reporting(E_ALL);
    ini_set('display_errors', 1);

    require_once("../lib/setHeaders.php");
    require_once("../lib/connectDB.php");
    require_once("../lib/getVariable.php");
    require_once("../lib/unboundQuery.php");
    require_once("../lib/respond.php");
    require_once("../lib/login.php");

    function getAccount($conn, $username) {
        $sql = "SELECT password, accountType FROM Accounts WHERE username='$username'";
        return getQueryResult($conn, $sql);
    }

    $conn = connectDB();

    $username = getPostVar("username");
    $password = getPostVar("password");

    $accountRows = getAccount($conn, $username);

    if (mysqli_num_rows($accountRows) === 0) respond(false, 'Username was not recognised.');

    $account = $accountRows->fetch_assoc();

    if (!password_verify($password, "" . $account['password'])) respond(false, 'Password was not recognised.');

    switch ($account['accountType']) {
        case "reader":
            login($username, "reader");
            break;
        case "researcher":
            login($username, "researcher");
            break;
        case "reviewer":
            login($username, "reviewer");
        default:
            respond(false, "Account type was not recognised.");
    }

?>
