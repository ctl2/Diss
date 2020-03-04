<?php

    error_reporting(E_ALL);
    ini_set('display_errors', 1);

    require_once("../lib/setHeaders.php");
    require_once("../lib/connectDB.php");
    require_once("../lib/getVariable.php");
    require_once("../lib/unboundQuery.php");
    require_once("../lib/respond.php");

    function getWindows($conn, $title, $version, $readerHash) {
        // Get all measurements from the given reading session
        $sql = "
            SELECT focalChar, leftmostChar, rightmostChar, duration
            FROM Windows
            WHERE title = '$title' AND version = '$version' AND SHA2(reader, 224) = '$readerHash'
            ORDER BY sequenceNumber
        ";
        $dataRows = getQueryResult($conn, $sql);
        // Process the result object
        $dataArray = array();
        while ($dataRow = $dataRows->fetch_assoc()) {
            // Even using the MYSQLI_OPT_INT_AND_FLOAT_NATIVE option, mysqli returns values of type DECIMAL as strings
            // https://stackoverflow.com/questions/18362598/mysql-decimal-fields-returned-as-strings-in-php
            $dataRow['duration'] = (float) $dataRow['duration'];
            array_push($dataArray, $dataRow);
        }
        // Return the result array
        return $dataArray;
    }

    $conn = connectDB();

    $title = getPostVar("title");
    $version = getPostVar("version");
    $readerHash = getPostVar("readerHash");

    $windows = getWindows($conn, $title, $version, $readerHash);

    respond(true, json_encode($windows));

?>
