<?php

    error_reporting(E_ALL);
    ini_set('display_errors', 1);

    include ("../lib/connectDB.php");

    function titleIsTaken($conn, $title) {

        $sql = "SELECT title"
            . " FROM Text"
            . " WHERE title='$title'";
        $titles = mysqli_query($conn, $sql);
        
        return mysqli_num_rows($titles) > 0;

    }

    $conn = connectDB();

    if (!isset($_POST["title"])) {
        echo false;
    } else {
        if (titleIsTaken($conn, $_POST["title"])) {
            echo false;
        } else {
            echo true;
        }
    }

?>
