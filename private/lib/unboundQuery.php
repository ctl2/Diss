<?php

    require_once("respond.php");

    function getQueryResult($conn, $sql) {
        if (!$rows = mysqli_query($conn, $sql)) respond(false, "Query failed: $conn->error");
        return $rows;
    }

?>
