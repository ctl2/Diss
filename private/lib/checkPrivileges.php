<?php

    session_start();

    require_once('respond.php');

    if (isset($_POST['accountType']) && isset($_SESSION['accountType'])) {
        if($_POST['accountType'] == $_SESSION['accountType']) {
            respond(true, "");
        }
    }
    respond(false, "");

?>
