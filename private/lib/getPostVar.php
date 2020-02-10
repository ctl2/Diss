<?php

    require_once('respond.php');

    function getPostVar($varName) {
        if (!isset($_POST[$varName])) respond(false, "No $varName value received.");
        return $_POST[$varName];
    }
    
?>
