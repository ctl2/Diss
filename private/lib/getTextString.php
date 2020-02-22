<?php

    require_once('unboundQuery.php');
    require_once('respond.php');

    function getTextString($conn, $title, $version) {
        $sql = "
            SELECT chara
            FROM Characters
            WHERE title='$title' AND version='$version'
            ORDER BY sequenceNumber
        ";
        $charRows = getQueryResult($conn, $sql);
        $textString = "";
        while ($charRow = $charRows->fetch_assoc()) {
            $textString .= $charRow["chara"];
        }
        return $textString;
    }

?>
