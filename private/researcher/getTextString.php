<?php

    error_reporting(E_ALL);
    ini_set('display_errors', 1);

    include ("../lib/connectDB.php");
    include ("../lib/echoTextString.php");

    $conn = connectDB();

    $title = $_POST["title"];
    $version = $_POST["version"];

    echoTextString($conn, $title, $version);

?>
