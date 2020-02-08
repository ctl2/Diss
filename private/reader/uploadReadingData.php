<?php

    session_start();

    error_reporting(E_ALL);
    ini_set('display_errors', 1);

    include ("../lib/connectDB.php");
    include ("../lib/respond.php");



    function createReadingEntry($conn, $title, $version, $reader, $availWidth, $availHeight) {

        $sql = $conn->prepare("INSERT INTO Readings (title, version, reader, availWidth, availHeight) VALUES (?, ?, ?, ?, ?)");
        if (!$sql->bind_param("sisii", $title, $version, $reader, $availWidth, $availHeight)) respond(false, "Execution failed: " + $conn->error);

        if (!$sql->execute()) respond(false, "Execution failed: " + $conn->error);

    }

    function createLogEntry($conn, $title, $version, $reader, $log) {

        $sql = $conn->prepare("
            INSERT INTO Windows (title, version, reader, index, leftmostCharIndex, rightmostCharIndex, openOffset, closeOffset)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");
        if (!$sql->bind_param("sisiiidd", $title, $version, $reader, $readIndex, $windowStartIndex, $windowEndIndex, $openOffset, $closeOffset))
            respond(false, "Execution failed: " + $conn->error);

        for ($i = 0; $i < count($log); $i++) {
            $readIndex = $i;
            $logEntry =$log[$i];
            $windowStartIndex = $logEntry['leftmostCharIndex'];
            $windowEndIndex = $logEntry['rightmostCharIndex'];
            $openOffset = $logEntry['openOffset'];
            $closeOffset = $logEntry['closeOffset'];
            if (!$sql->execute()) respond(false, "Execution failed: " + $conn->error);
        }

    }

    $conn = connectDB();

    $title = getPostVar("title");
    $version = getPostVar("version");
    $reader = $_SESSION['username'];
    $availWidth = getPostVar("availWidth");
    $availHeight = getPostVar("availHeight");
    $log = json_decode(getPostVar("log"), true);

    $conn->autocommit(FALSE);

    createReadingEntry($conn, $title, $version, $reader, $availWidth, $availHeight);
    createLogEntry($conn, $title, $version, $reader, $log);

    if (!$mysqli->commit()) respond(false, "Commit failed: " + $conn->error);

    respond(true, "");

?>
