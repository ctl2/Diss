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
            SELECT DISTINCT username, dob, gender, isImpaired
            FROM Readers
            INNER JOIN Windows ON username = reader
            WHERE title='$title' AND version='$version'
        ";
        $readerRows = getQueryResult($conn, $sql);
        // Process the result object
        $readerArray = array();
        $curDate = date_create();
        while ($readerRow = $readerRows->fetch_assoc()) {
            $reader = array(
                "username" => $readerRow["username"],
                "age" => (int) date_diff($curDate, date_create($readerRow["dob"])),
                "gender" => $readerRow["gender"],
                "isImpaired" => (bool) $readerRow["isImpaired"],
            );
            array_push($readerArray, $readerRow['reader']);
        }
        // Return the result array
        return $readerArray;
    }

    $conn = connectDB();

    $title = getPostVar("title");
    $version = getPostVar("version");

    $readers = getReaders($conn, $title, $version);

    respond(true, json_encode($readers));

?>
