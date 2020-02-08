<?php

    function echoTextString($conn, $title, $version) {

        $sql = "
            SELECT chara
            FROM VersionCharacter
            WHERE title='$title' AND version=$version
            ORDER BY index
        ";

        $charRows = mysqli_query($conn, $sql);

        while ($charRow = $charRows->fetch_assoc()) {
            echo $charRow["chara"];
        }

    }

?>
