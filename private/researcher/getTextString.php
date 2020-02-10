<?php

    error_reporting(E_ALL);
    ini_set('display_errors', 1);

    require_once("../lib/connectDB.php");
    require_once("../lib/getPostVar.php");
    require_once("../lib/getTextString.php");
    require_once("../lib/respond.php");

    $conn = connectDB();

    $title = getPostVar("title");
    $version = getPostVar("version");

    $textString = getTextString($conn, $title, $version);

    respond(true, $textString);

?>
