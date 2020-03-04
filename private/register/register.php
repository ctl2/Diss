<?php

    session_start();

    require_once("../lib/setHeaders.php");
    require_once("../lib/connectDB.php");
    require_once("../lib/getVariable.php");
    require_once("../lib/boundQuery.php");
    require_once("../lib/respond.php");
    require_once("../lib/login.php");

    function isTaken($conn, $username) {
        $sql = "SELECT NULL FROM Accounts WHERE username=?";
        $typeString = "s";
        $valueArray = array(&$username);
        $rows = makeBoundQuery($conn, $sql, $typeString, $valueArray);
        return $rows->num_rows > 0;
    }

    function createReaderAccount($conn, $username, $password, $dob, $gender, $isImpaired) {
        $passwordHash = password_hash($password, PASSWORD_DEFAULT);
        $sql = "INSERT INTO Readers (username, password, dob, gender, isImpaired) VALUES (?, ?, ?, ?, ?)";
        $typeString = "ssssi";
        $valueArray = array(&$username, &$passwordHash, &$dob, &$gender, &$isImpaired);
        makeBoundQuery($conn, $sql, $typeString, $valueArray);
    }

    function createResearcherAccount($conn, $username, $password) {
        $passwordHash = password_hash($password, PASSWORD_DEFAULT);
        $sql = "INSERT INTO Researchers (username, password) VALUES (?, ?)";
        $typeString = "ss";
        $valueArray = array(&$username, &$passwordHash);
        makeBoundQuery($conn, $sql, $typeString, $valueArray);
    }

    $conn = connectDB();

    $username = getPostVar("username");
    $password = getPostVar("password1");
    $accType = getPostVar("acc_type");

    if (isTaken($conn, $username)) respond(false, "Username is taken.");

    if ($accType == "reader") {

        $dob = getPostVar("dob");
        $gender = getPostVar("gender");
        $isImpaired = getPostVar("isImpaired");

        createReaderAccount($conn, $username, $password, $dob, $gender, $isImpaired);

    } else {

        $firstName = getPostVar("firstName");
        $surname = getPostVar("surname");
        $email = getPostVar("email");

        createResearcherAccount($conn, $username, $password, $firstName, $surname, $email);

    }

    login($username, $accType);

?>
