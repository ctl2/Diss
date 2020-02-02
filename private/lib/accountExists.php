<?php

    function readerAccountExists($conn, $username) {

        $stmt = 'SELECT * FROM Reader WHERE username = "' . $username . '"';
        $result = mysqli_query($conn, $stmt);

        return mysqli_num_rows($result) > 0;

    }

    function researcherAccountExists($conn, $username) {

        $stmt = 'SELECT * FROM Researcher WHERE username = "' . $username . '"';
        $result = mysqli_query($conn, $stmt);

        return mysqli_num_rows($result) > 0;

    }

    function reviewerAccountExists($conn, $username) {

        $stmt = 'SELECT * FROM Reviewer WHERE username = "' . $username . '"';
        $result = mysqli_query($conn, $stmt);

        return mysqli_num_rows($result) > 0;

    }

    function accountExists($conn, $username) {
        return readerAccountExists($conn, $username) || readerAccountExists($conn, $username) || readerAccountExists($conn, $username);
    }

 ?>
