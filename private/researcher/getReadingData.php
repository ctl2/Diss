<?php

    error_reporting(E_ALL);
    ini_set('display_errors', 1);

    require_once("../lib/connectDB.php");
    require_once("../lib/getPostVar.php");
    require_once("../lib/unboundQuery.php");
    require_once("../lib/respond.php");

    function getReadingData($conn, $reader, $title, $version) {
        // Get all measurements from the given reading session
        $sql = "
            SELECT leftmostChar, rightmostChar, openOffset, closeOffset
            FROM Windows
            WHERE reader='$reader' AND title='$title' AND version=$version
            ORDER BY sequenceNumber
        ";
        $dataRows = getQueryResult($conn, $sql);
        // Return an unprocessed associative array of the result object
        return $dataRows->fetch_all(MYSQLI_ASSOC);
    }

    $conn = connectDB();

    $reader = getPostVar($_POST["reader"]);
    $title = getPostVar($_POST["title"]);
    $version = getPostVar($_POST["version"]);

    $readingData = getReadingData($conn, $reader, $title, $version);

    respond(true, $readingData);

?>
