<?php

    error_reporting(E_ALL);
    ini_set('display_errors', 1);

    include ("../lib/connectDB.php");

    function echoUnreadTextString($conn, $reader) {

        $sql = "
            SELECT chara
            FROM (
                SELECT TOP 1 title, version
                FROM Version, (
                    SELECT DISTINCT title, version
                    FROM VersionRead
                    WHERE reader='$reader'
                ) AS ReadTexts
                WHERE NOT (Version.title = ReadTexts.title AND Version.version = ReadTexts.version)
                ORDER BY ...
            ) AS UnreadTexts
            INNER JOIN VersionCharacter ON VersionCharacter.title = UnreadTexts.title AND VersionCharacter.version = UnreadTexts.version
            ORDER BY index ASCENDING
        ";

        $dataRows = mysqli_query($conn, $sql);
        $rowQuant = mysqli_num_rows($result);
        if ($rowQuant > 0) {
            $randomIndex = mt_rand(0, $rowQuant - 1);
            mysqli_data_seek($result, $randomIndex);
            $dataArray = $dataRows->fetch_all(MYSQLI_ASSOC);
            $randomIndex = mt_rand(0, count($dataArray) - 1);

        }

    }

    $conn = connectDB();

    $reader = $_POST["reader"];

    echoUnreadText($conn, $reader);

?>
