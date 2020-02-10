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
            WHERE title='$title' AND version=$version
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

    $conn = connectDB();

    $title = getPostVar($_POST["title"]);
    $version = getPostVar($_POST["version"]);

    $readerArray = getReaders($conn, $title, $version);

    respond(true, $readerArray);

?>
