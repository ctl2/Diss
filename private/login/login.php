<?php

    session_start();

    error_reporting(E_ALL);
    ini_set('display_errors', 1);

    include ("../lib/connectDB.php");
    include ("../lib/accountExists.php");

    function login($username, $accountType) {
        echo $accountType;
        $_SESSION["username"] = $username;
    }

    if (!isset($_POST["username"])) {
        echo 'No username sent to php script.';
    } else {

        $conn = connectDB();

        if (readerAccountExists($conn, $_POST["username"])) {
            login($_POST["username"], "reader");
        } else if (researcherAccountExists($conn, $_POST["username"])) {
            login($_POST["username"], "researcher");
        } else if (reviewerAccountExists($conn, $_POST["username"])) {
            login($_POST["username"], "reviewer");
        } else {
            echo "No account with username '" . $_POST["username"] . "'.";
        }

    }

?>
