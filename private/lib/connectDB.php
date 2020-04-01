<?php

    require_once('../config.php');
    require_once('respond.php');

    function connectDB() {
        $conn = mysqli_init();
        $conn->options(MYSQLI_OPT_INT_AND_FLOAT_NATIVE, 1); // mysqli returns all numbers as strings by default
        $conn->real_connect($GLOBALS['host'], $GLOBALS['username'], $GLOBALS['password'], $GLOBALS['dbname']);
        if ($conn->connect_errno) respond(false, "Connection failed: " . $conn->connect_error);
        return $conn;
    }

?>
