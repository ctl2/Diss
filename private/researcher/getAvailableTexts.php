<?php

    session_start();

    error_reporting(E_ALL);
    ini_set('display_errors', 1);

    include ("../lib/connectDB.php");

    function getAvailableTexts($conn, $username) {

        $sql = "
            SELECT Texts.title, version, uploader, isPublic, targetAgeMin, targetAgeMax, targetGender
            FROM Texts
            INNER JOIN Versions ON Versions.title = Texts.title
            WHERE uploader='$username' OR isPublic=" . true . "
            ORDER BY Texts.title
        ";

        if (!$textRows = mysqli_query($conn, $sql)) respond(false, "Query failed: $conn->error");
        $texts = array();

        while ($textRow = $textRows->fetch_assoc()) {
            if (!$textRow) respond(false, "Fetch failed: $conn->error");
            $title = $textRow["title"];
            if (!array_key_exists($title, $texts)) {
                $texts[$title] = array();
                $texts[$title]["uploader"] = $textRow["uploader"];
                $texts[$title]["isOwned"] = ($username == $textRow["uploader"]);
            }
            $texts[$title][$textRow["version"]] = array(
                "isPublic" => $textRow["isPublic"],
                "targetAgeMin" => $textRow["targetAgeMin"],
                "targetAgeMax" => $textRow["targetAgeMax"],
                "targetGender" => $textRow["targetGender"]
            );
        }

        return $texts;

    }

    $conn = connectDB();

    $username = $_SESSION["username"];
    $texts = getAvailableTexts($conn, $username);

    respond(true, json_encode($texts));

?>
