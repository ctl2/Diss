<?php

    error_reporting(E_ALL);
    ini_set('display_errors', 1);

    include ("../lib/connectDB.php");

    function echoTextString($conn, $title, $version) {

        $sql = "
            SELECT chara
            FROM VersionCharacter
            WHERE title='$title' AND version=$version
            ORDER BY index ASCENDING
        ";

        $charRows = mysqli_query($conn, $sql);

        while ($charRow = $charRows->fetch_assoc()) {
            echo $charRow["chara"];
        }

    }

    $conn = connectDB();

    $title = $_POST["title"];
    $version = $_POST["version"];

    echoTextString($conn, $title, $version);

?>
