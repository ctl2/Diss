<?php

    session_start();

    error_reporting(E_ALL);
    ini_set('display_errors', 1);

    include ("../lib/connectDB.php");

    function isTaken($conn, $username) {
        if (!$sql = $conn->prepare("SELECT NULL FROM Accounts WHERE username=?")) respond(false, "Preparation failed: $conn->error");
        if (!$sql->bind_param("s", $username)) respond(false, "Binding failed: $conn->error");

        if (!$sql->execute()) respond(false, "Execution failed: $conn->error");

        return $sql->num_rows > 0;
    }

    function createReaderAccount($conn, $username, $password, $dob, $gender, $dis) {

        if (!$sql = $conn->prepare("INSERT INTO Readers (username, password, dob, gender, dis) VALUES (?, ?, ?, ?, ?)")) respond(false, "Preparation failed: $conn->error");
        if (!$sql->bind_param("ssssi", $username, $password, $dob, $gender, $dis)) respond(false, "Binding failed: $conn->error");

        if (!$sql->execute()) respond(false, "Execution failed: $conn->error");

    }

    function createResearcherAccount($conn, $username, $password) {

        if (!$sql = $conn->prepare("INSERT INTO Researchers (username, password) VALUES (?, ?)")) respond(false, "Preparation failed: $conn->error");
        if (!$sql->bind_param("ss", $username, $password)) respond(false, "Binding failed: $conn->error");

        if (!$sql->execute()) respond(false, "Execution failed: $conn->error");

    }

    $conn = connectDB();

    $username = getPostVar("username");
    $password = getPostVar("password1");
    $accType = getPostVar("acc_type");

    if (isTaken($conn, $username)) respond(false, "Username is taken.");

    if ($accType == "reader") {

        $dob = getPostVar("dob");
        $gender = getPostVar("gender");
        $dis = getPostVar("dis");

        createReaderAccount($username, $password, $dob, $gender, $dis);

    } else {

        $firstName = getPostVar("firstName");
        $surname = getPostVar("surname");
        $email = getPostVar("email");

        createResearcherAccount($conn, $username, $password, $firstName, $surname, $email);

    }

    $_SESSION["username"] = $username;
    $_SESSION["accType"] = $accType;

    respond(true, $accType);

?>
