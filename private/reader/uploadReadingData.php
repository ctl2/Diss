<?php

    session_start();

    error_reporting(E_ALL);
    ini_set('display_errors', 1);

    require_once("../lib/setHeaders.php");
    require_once("../lib/connectDB.php");
    require_once("../lib/getVariable.php");
    require_once("../lib/boundQuery.php");
    require_once("../lib/respond.php");

    function createReadingEntry($conn, $title, $version, $reader, $wpm, $innerWidth, $innerHeight) {
        // Make a bound query for a single insert into the Readings table
        $sql = "INSERT INTO Readings (title, version, reader, wpm, innerWidth, innerHeight) VALUES (?, ?, ?, ?, ?, ?)";
        $typeString = "sssiii";
        $valueArray = array(&$title, &$version, &$reader, &$wpm, &$innerWidth, &$innerHeight);
        makeBoundQuery($conn, $sql, $typeString, $valueArray);
    }

    function createLogEntry($conn, $title, $version, $reader, $log) {
        // Get a bound query for a single insert into the Windows table
        $sql = "
            INSERT INTO Windows (title, version, reader, sequenceNumber, focalChar, leftmostChar, rightmostChar, duration)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ";
        $typeString = "sssiiiid";
        $valueArray = array(&$title, &$version, &$reader, &$sequenceNumber, &$focalChar, &$leftmostChar, &$rightmostChar, &$duration);
        $binding = getBoundQuery($conn, $sql, $typeString, $valueArray);
        // Execute the bound query once for each set of values in the $log array
        for ($sequenceNumber = 0; $sequenceNumber < count($log); $sequenceNumber++) {
            $logEntry = $log[$sequenceNumber];
            $focalChar = $logEntry['focalChar'];
            $leftmostChar = $logEntry['leftmostChar'];
            $rightmostChar = $logEntry['rightmostChar'];
            $duration = $logEntry['duration'];
            executeBoundQuery($conn, $binding);
        }
    }

    $conn = connectDB();

    $title = getSessionVar("title");
    $version = getSessionVar("version");
    $reader = getSessionVar("username");
    $wpm = getPostVar("wpm");
    $innerWidth = getPostVar("innerWidth");
    $innerHeight = getPostVar("innerHeight");
    $log = json_decode(getPostVar("log"), true);
    // Group all queries into a single transaction
    if (!$conn->autocommit(false)) respond(false, "Failed to start transaction: $conn->error");

    createReadingEntry($conn, $title, $version, $reader, $wpm, $innerWidth, $innerHeight);
    createLogEntry($conn, $title, $version, $reader, $log);

    if (!$conn->commit()) respond(false, "Commit failed: $conn->error");

    respond(true, "");

?>
