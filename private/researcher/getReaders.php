<?php

    error_reporting(E_ALL);
    ini_set('display_errors', 1);

    include ("../lib/connectDB.php");

    function getReaders($conn, $title, $version) {

        $sql = "
            SELECT DISTINCT reader
            FROM WindowRead
            WHERE title='$title' AND version=$version
        ";

        $readerRows = mysqli_query($conn, $sql);

        $readerArray = array();
        while ($readerRow = $readerRows->fetch_assoc()) {
            array_push($readerArray, $readerRow['reader']);
        }

        return $readerArray;

    }

    $conn = connectDB();

    $title = $_POST["title"];
    $version = $_POST["version"];

    $readerArray = getReaders($conn, $title, $version);

    echo json_encode($readerArray);

?>
