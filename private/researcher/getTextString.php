<?php

    error_reporting(E_ALL);
    ini_set('display_errors', 1);

    include ("../lib/connectDB.php");

    function echoTextString($conn, $title, $version) {

        $sql = "SELECT index, char"
            . " FROM TextChar"
            . " WHERE title='$title' AND version=$version"
            . " ORDER BY index ASCENDING";

        $charRows = mysqli_query($conn, $sql);

        while ($textRow = $textRows->fetch_assoc()) {
            echo $textRow["char"];
        }

        return $string;

    }

    $conn = connectDB();

    $title = $_POST["title"];
    $version = $_POST["version"];
    echoTextString($conn, $title, $version);

?>
