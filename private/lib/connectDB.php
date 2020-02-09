<?php

    include ("../lib/respond.php");

    function connectDB() {

        $conn = mysqli_connect("mysql-server-1", "ctl2", "7P5V9twqVB", "ctl2");

        if ($conn->connect_error) respond(false, "Connection failed: " . $conn->connect_error);

        return $conn;

    }

?>
