<?php

    session_start();

    error_reporting(E_ALL);
    ini_set('display_errors', 1);

    require_once("../lib/connectDB.php");
    require_once("../lib/getPostVar.php");
    require_once("../lib/boundQuery.php");
    require_once("../lib/respond.php");

    function createReadingEntry($conn, $title, $version, $reader, $availWidth, $availHeight) {
        // Make a bound query for a single insert into the Readings table
        $sql = "INSERT INTO Readings (title, version, reader, availWidth, availHeight) VALUES (?, ?, ?, ?, ?)";
        $typeString = "sssii";
        $valueArray = array(&$title, &$version, &$reader, &$availWidth, &$availHeight);
        makeBoundQuery($conn, $sql, $typeString, $valueArray);
    }

    function createLogEntry($conn, $title, $version, $reader, $log) {
        // Get a bound query for a single insert into the Windows table
        $sql = "
            INSERT INTO Windows (title, version, reader, sequenceNumber, leftmostChar, rightmostChar, openOffset, closeOffset)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ";
        $typeString = "sssiiidd";
        $valueArray = array(&$title, &$version, &$reader, &$sequenceNumber, &$leftmostChar, &$rightmostChar, &$openOffset, &$closeOffset);
        $binding = getBoundQuery($conn, $sql, $typeString, $valueArray);
        // Execute the bound query once for each set of values in the $log array
        for ($sequenceNumber = 0; $sequenceNumber < count($log); $sequenceNumber++) {
            $logEntry = $log[$sequenceNumber];
            $leftmostChar = $logEntry['leftmostChar'];
            $rightmostChar = $logEntry['rightmostChar'];
            $openOffset = $logEntry['openOffset'];
            $closeOffset = $logEntry['closeOffset'];
            executeBoundQuery($conn, $binding);
        }
    }

    $conn = connectDB();

    if (!$title = $_SESSION["title"]) respond(false, "No 'title' session variable.");
    if (!$version = $_SESSION["version"]) respond(false, "No 'version' session variable.");
    $reader = $_SESSION['username'];
    $availWidth = getPostVar("availWidth");
    $availHeight = getPostVar("availHeight");
    $log = json_decode(getPostVar("log"), true);
    // Group all queries into a single transaction
    if (!$conn->autocommit(false)) respond(false, "Failed to start transaction: $conn->error");

    createReadingEntry($conn, $title, $version, $reader, $availWidth, $availHeight);
    createLogEntry($conn, $title, $version, $reader, $log);

    if (!$conn->commit()) respond(false, "Commit failed: $conn->error");

    respond(true, "");

?>
