<?php

    require_once('respond.php');

    function login($username, $accountType) {
        $_SESSION["username"] = $username;
        $_SESSION["accountType"] = $accountType;
        respond(true, $accountType);
    }
    
?>
