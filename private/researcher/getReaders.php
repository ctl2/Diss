<?php

    error_reporting(E_ALL);
    ini_set('display_errors', 1);

    require_once("../lib/setHeaders.php");
    require_once("../lib/connectDB.php");
    require_once("../lib/getVariable.php");
    require_once("../lib/unboundQuery.php");
    require_once("../lib/respond.php");

    function getReadings($conn, $title, $version) {
        // Retrieve data on all reader accounts that have been assigned the given text
        $sql = "
            SELECT DISTINCT SHA2(username, 224) AS usernameHash, dob, gender, isImpaired, wpm, readDate
            FROM Readers
            INNER JOIN Readings ON reader = username
            WHERE title = '$title' AND version = '$version'
        ";
        $readerRows = getQueryResult($conn, $sql);
        // Process the result object
        $readerArray = array();
        while ($readerRow = $readerRows->fetch_assoc()) {
            // Calculate the reader's age at the time of reading
            $readDate = date_create($readerRow["readDate"]);
            $birthDate = date_create($readerRow["dob"]);
            $age = date_diff($readDate, $birthDate);
            // Record data
            $readerArray[$readerRow["usernameHash"]] = array(
                "wpm" => $readerRow["wpm"],
                "age" => (int) date_interval_format($age, "%y"), // Get the year part without leading/trailing zeroes
                "gender" => $readerRow["gender"],
                "isImpaired" => (bool) $readerRow["isImpaired"]
            );
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
