<?php

    session_start();

    error_reporting(E_ALL);
    ini_set('display_errors', 1);

    include ("../lib/connectDB.php");
    include ("../lib/respond.php");

    function getAccountTypeResult($conn, $username, $password) {
        $sql = "SELECT accountType FROM Accounts WHERE username='$username' AND password='$password'";
        return mysqli_query($conn, $sql);
    }

    function login($username, $accountType) {
        $_SESSION["username"] = $username;
        $_SESSION["accountType"] = $accountType;
        respond(true, $accountType);
    }

    $conn = connectDB();

    $username = getPostVar("username");
    $password = getPostVar("password");

    $accountTypeRes = getAccountTypeResult($conn, $username, $password);

    if (mysqli_num_rows($accountTypeRes) === 0) respond(false, 'Username was not recognised.');

    switch ($accountTypeRes->fetchAssoc['accountType']) {
        case "reader":
            login($_POST["username"], "reader");
            break;
        case "researcher":
            login($_POST["username"], "researcher");
            break;
        case "reviewer":
            login($_POST["username"], "reviewer");
        default:
            respond(false, "Account type was not recognised.")
    }

?>
