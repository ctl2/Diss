<?php

    error_reporting(E_ALL);
    ini_set('display_errors', 1);

    include ("../lib/connectDB.php");

    function getReadingData($conn, $reader, $title, $version) {

        $sql = "
            SELECT windowStartIndex, windowEndIndex, duration
            FROM WindowRead
            WHERE reader='$reader' AND title='$title' AND version=$version
            ORDER BY index ASCENDING
        ";

        $dataRows = mysqli_query($conn, $sql);

        return $dataRows->fetch_all(MYSQLI_ASSOC);

    }

    $conn = connectDB();

    $reader = $_POST["reader"];
    $title = $_POST["title"];
    $version = $_POST["version"];

    $readingData = getReadingData($conn, $reader, $title, $version);

    echo json_encode($readingData);

?>
