<?php

    function getPostVar($varName) {
        if (!isset($_POST[$varName])) {respond(false, "No $varName value received.");}
        return $_POST[$varName];
    }

    function respond($success, $message) {
        die(json_encode(array("success"=>$success, "message"=>$message)));
    }

?>
