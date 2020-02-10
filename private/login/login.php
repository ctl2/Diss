<?php

    session_start();

    error_reporting(E_ALL);
    ini_set('display_errors', 1);

    require_once("../lib/connectDB.php");
    require_once("../lib/getPostVar.php");
    require_once("../lib/unboundQuery.php");
    require_once("../lib/respond.php");
    require_once("../lib/login.php");

    function getAccountTypeResult($conn, $username, $password) {
        $sql = "SELECT accountType FROM Accounts WHERE username='$username' AND password='$password'";
        return getQueryResult($conn, $sql);
    }

    $conn = connectDB();

    $username = getPostVar("username");
    $password = getPostVar("password");

    $accountTypeRows = getAccountTypeResult($conn, $username, $password);

    if (mysqli_num_rows($accountTypeRows) === 0) respond(false, 'Account details were not recognised.');

    switch ($accountTypeRows->fetch_assoc()['accountType']) {
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
