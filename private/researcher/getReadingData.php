<?php

    error_reporting(E_ALL);
    ini_set('display_errors', 1);

    require_once("../lib/connectDB.php");
    require_once("../lib/getPostVar.php");
    require_once("../lib/unboundQuery.php");
    require_once("../lib/respond.php");

    function getReaders($conn, $title, $version) {
        // Retrieve the usernames of all reader accounts that have been assigned the given text
        $sql = "
            SELECT DISTINCT reader
            FROM Windows
            WHERE title='$title' AND version='$version'
        ";
        $readerRows = getQueryResult($conn, $sql);
        // Process the result object
        $readerArray = array();
        while ($readerRow = $readerRows->fetch_assoc()) {
            array_push($readerArray, $readerRow['reader']);
        }
        // Return the result array
        return $readerArray;
    }

    function getReadingData($conn, $title, $version, $reader) {
        // Get all measurements from the given reading session
        $sql = "
            SELECT leftmostChar, rightmostChar, openOffset, closeOffset
            FROM Windows
            WHERE title='$title' AND version='$version' AND reader='$reader'
            ORDER BY sequenceNumber
        ";
        $dataRows = getQueryResult($conn, $sql);
        // Return an unprocessed associative array of the result object
        return $dataRows->fetch_all(MYSQLI_ASSOC);
    }

    $conn = connectDB();

    if (!isset($_POST["title"]) || !isset($_POST["version"])) {
        if (!isset($_SESSION["title"]) || !isset($_SESSION["version"])) respond(false, "No text provided.");
    } else {
        $_SESSION["title"] = $_POST["title"];
        $_SESSION["version"] = $_POST["version"];
        $_SESSION["remainingReaders"] = getReaders($conn, $_POST["title"], $_POST["version"]);
    }

    $nextReader = array_pop($_SESSION["remainingReaders"]);
    if ($nextReader === NULL) respond(true, "");

    $readingData = getReadingData($conn, $_SESSION["title"], $_SESSION["version"], $nextReader);

    respond(true, json_encode($readingData));

?>
