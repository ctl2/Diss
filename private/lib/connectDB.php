<?php

    function connectDB() {

        $conn = mysqli_connect("mysql-server-1", "ctl2", "7P5V9twqVB");

        if ($conn->connect_error) {
            die("Connection failed: " . $conn->connect_error);
        }

        return $conn;

    }

?>
