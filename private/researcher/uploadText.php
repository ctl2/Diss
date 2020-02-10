<?php

    session_start();

    require_once("../lib/connectDB.php");
    require_once("../lib/getPostVar.php");
    require_once("../lib/boundQuery.php");
    require_once("../lib/respond.php");

    function createTextEntry($conn, $title, $uploader) {
        $sql = "INSERT INTO Texts (title, uploader) VALUES (?, ?)";
        $typeString = "ss";
        $valueArray = array(&$title, &$uploader);
        makeBoundQuery($conn, $sql, $typeString, $valueArray);
    }

    function createVersionEntry($conn, $title, $version, $isPublic, $targetAgeMin, $targetAgeMax, $targetGender) {
        // Get an array of all possible query parameters and associated data
        $params = array(
            "title" => array("s", &$title),
            "version" => array("i", &$version),
            "isPublic" => array("i", &$isPublic),
            "targetAgeMin" => array("i", &$targetAgeMin),
            "targetAgeMax" => array("i", &$targetAgeMax),
            "targetGender" => array("s", &$targetGender)
        );
        // Remove parameters that hold NULL values
        foreach($params as $paramName => $paramVals) {
            if (!isset($paramVals[1])) unset($params[$paramName]);
        }
        // Dynamically build the insert statement
        $sql = "
            INSERT INTO Versions (" . implode(", ", array_keys($params)) . ")
            VALUES (" . substr(str_repeat("?, ", count($params)), 0, -2) . ")
        ";
        // Access neccessary values from the parameters array
        $typeString = implode("", array_column(array_values($params), 0));
        $valueArray = array_column(array_values($params), 1);
        // Make the query
        makeBoundQuery($conn, $sql, $typeString, $valueArray);
    }

    function createCharactersEntry($conn, $title, $version, $text) {
        // Make a bound query for a single insert into the Characters table
        $sql = "INSERT INTO Characters (title, version, sequenceNumber, chara) VALUES (?, ?, ?, ?)";
        $typeString = "siis";
        $valueArray = array(&$title, &$version, &$sequenceNumber, &$chara);
        $binding = getBoundQuery($conn, $sql, $typeString, $valueArray);
        // Execute the bound query once for each character in the $text string
        for ($sequenceNumber = 0; $sequenceNumber < strlen($text); $sequenceNumber++) {
            $chara = substr($text, $sequenceNumber, 1);
            executeBoundQuery($conn, $binding);
        }
    }

    // Connect to the database
    $conn = connectDB();
    // Retrieve mandatory arguments
    $text = getPostVar('text');
    $title = getPostVar('title');
    $version = getPostVar('version');
    $isPublic = getPostVar('isPublic');
    // Retrieve optional arguments
    if (isset($_POST['targetAgeMin'])) $targetAgeMin = $_POST['targetAgeMin'];
    if (isset($_POST['targetAgeMax'])) $targetAgeMax = $_POST['targetAgeMax'];
    if (isset($_POST['targetGender'])) $targetGender = $_POST['targetGender'];
    // Group all queries into a single transaction
    if (!$conn->autocommit(false)) respond(false, "Failed to start transaction: $conn->error");
    // Make queries
    if ($version == "1") createTextEntry($conn, $title, $_SESSION['username']);
    createVersionEntry($conn, $title, $version, $isPublic, $targetAgeMin, $targetAgeMax, $targetGender);
    createCharactersEntry($conn, $title, $version, $text);
    // Commit queries
    if (!$conn->commit()) respond(false, "Commit failed: $conn->error");
    // Report success
    respond(true, "");

?>
