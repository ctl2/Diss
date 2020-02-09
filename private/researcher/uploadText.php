<?php

    session_start();

    include ("../lib/connectDB.php");

    function createTextEntry($conn, $title, $uploader) {

        if (!$sql = $conn->prepare("INSERT INTO Texts (title, uploader) VALUES (?, ?)")) respond(false, "Preparation failed: $conn->error");
        if (!$sql->bind_param("ss", $title, $uploader)) respond(false, "Binding failed: $conn->error");

        if (!$sql->execute()) respond(false, "Execution failed: $conn->error");

    }

    function createVersionEntry($conn, $title, $version, $isPublic, $targetAgeMin, $targetAgeMax, $targetGender) {

        $colArray = array(
            "version",
            "isPublic"
        );
        $valArray = array(
            "$version",
            "$isPublic"
        );
        if (isset($targetAgeMin)) {
            array_push($colArray, "targetAgeMin");
            array_push($valArray, "$targetAgeMin");
        }
        if (isset($targetAgeMin)) {
            array_push($colArray, "targetAgeMax");
            array_push($valArray, "$targetAgeMax");
        }
        if (isset($targetAgeMin)) {
            array_push($colArray, "targetGender");
            array_push($valArray, "'$targetGender'");
        }

        if (!$sql = $conn->prepare("
            INSERT INTO Versions (" . array_reduce($colArray, "separateWithCommas", "title") . ")
            VALUES (" . array_reduce($valArray, "separateWithCommas", "?") . ")
        ")) respond(false, "Preparation failed: $conn->error");
        if (!$sql->bind_param("s", $title)) respond(false, "Binding failed: $conn->error");

        if (!$sql->execute()) respond(false, "Execution failed: $conn->error");

    }

    function separateWithCommas($v1, $v2) {
        return $v1 . ", " . $v2;
    }

    function createCharactersEntry($conn, $title, $version, $text) {

        if (!$sql = $conn->prepare("INSERT INTO Characters (title, version, sequenceNumber, chara) VALUES (?, ?, ?, ?)"))
            respond(false, "Preparation failed: $conn->error");
        if (!$sql->bind_param("siis", $title, $version, $sequenceNumber, $chara)) respond(false, "Binding failed: $conn->error");

        for ($i = 0; $i < strlen($text); $i++) {
            $sequenceNumber = $i;
            $chara = substr($text, $i, 1);
            if (!$sql->execute()) respond(false, "Execution failed: $conn->error");
        }

    }

    $conn = connectDB();

    $title = getPostVar('title');
    $version = getPostVar('version');
    $isPublic = getPostVar('isPublic');
    if (isset($_POST['targetAgeMin'])) {
        $targetAgeMin = $_POST['targetAgeMin'];
    }
    if (isset($_POST['targetAgeMax'])) {
        $targetAgeMax = $_POST['targetAgeMax'];
    }
    if (isset($_POST['targetGender'])) {
        $targetGender = $_POST['targetGender'];
    }
    $text = getPostVar('text');

    $conn->autocommit(FALSE);

    if ($version == "1") createTextEntry($conn, $title, $_SESSION['username']);
    createVersionEntry($conn, $title, $version, $isPublic, $targetAgeMin, $targetAgeMax, $targetGender);
    createCharactersEntry($conn, $title, $version, $text);

    if (!$conn->commit()) respond(false, "Commit failed: $conn->error");

    respond(true, "");

?>
