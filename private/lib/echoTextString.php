<?php

    function echoTextString($conn, $title, $version) {

        $sql = "
            SELECT chara
            FROM Characters
            WHERE title='$title' AND version=$version
            ORDER BY sequenceNumber
        ";

        $charRows = mysqli_query($conn, $sql);

        while ($charRow = $charRows->fetch_assoc()) {
            echo $charRow["chara"];
        }

    }

?>
