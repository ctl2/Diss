<?php

    require_once('respond.php');

    function getPostVar($varName) {
        if (!isset($_POST[$varName])) respond(false, "No $varName value received.");
        return $_POST[$varName];
    }

    function getSessionVar($key) {
        if (!isset($_SESSION[$key])) respond(false, "No '$key' session variable.");
        return $_SESSION[$key];
    }

?>
