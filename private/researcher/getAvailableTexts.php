<?php

    session_start();

    error_reporting(E_ALL);
    ini_set('display_errors', 1);

    include ("../lib/connectDB.php");

    function getAvailableTexts($conn, $username) {

        $sql = "SELECT title, version, uploader, isPublic, targetAgeMin, targetAgeMax, targetGender"
            . " FROM Text, Version"
            . " WHERE uploader='$username' OR isPublic=" . true
            . " ORDER BY title ASCENDING";

        $textRows = mysqli_query($conn, $sql);
        $texts = array();

        while ($textRow = $textRows->fetch_assoc()) {
            $title = $textRow["title"];
            if (!array_key_exists($title, $texts)) {
                $texts[$title] = array();
                $texts[$title]["uploader"] = $textRow["uploader"];
                $texts[$title]["isOwned"] = ($username == $textRow["uploader"]),
            }
            $texts[$title]["versions"][$textRow["version"]]; = array(
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

    echo json_encode($texts);

?>
