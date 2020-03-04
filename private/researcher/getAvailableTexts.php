<?php

    session_start();

    error_reporting(E_ALL);
    ini_set('display_errors', 1);

    require_once("../lib/setHeaders.php");
    require_once("../lib/connectDB.php");
    require_once("../lib/getVariable.php");
    require_once("../lib/unboundQuery.php");
    require_once("../lib/respond.php");

    function getAvailableTexts($conn, $username) {
        // Get all texts that are either public or owned by the logged-in account
        $sql = "
            SELECT Texts.title, version, uploader, isPublic, targetAgeMin, targetAgeMax, targetGender
            FROM Texts
            INNER JOIN Versions ON Versions.title = Texts.title
            WHERE uploader='$username' OR isPublic=" . true . "
            ORDER BY Texts.title
        ";
        $textRows = getQueryResult($conn, $sql);
        // Build an array of returned text metadata
        $texts = array();
        while ($textRow = $textRows->fetch_assoc()) {
            $title = $textRow["title"];
            if (!array_key_exists($title, $texts)) {
                $texts[$title] = array();
                $texts[$title]["uploader"] = $textRow["uploader"];
                $texts[$title]["isOwned"] = ($username == $textRow["uploader"]);
                $texts[$title]["versions"] = array();
            }
            $texts[$title]["versions"][$textRow["version"]] = array(
                "isPublic" => $textRow["isPublic"],
                "targetAgeMin" => $textRow["targetAgeMin"],
                "targetAgeMax" => $textRow["targetAgeMax"],
                "targetGender" => $textRow["targetGender"]
            );
        }
        // Return the filled array
        return $texts;
    }

    $conn = connectDB();

    $username = getSessionVar("username");
    $texts = getAvailableTexts($conn, $username);

    respond(true, json_encode($texts));

?>
