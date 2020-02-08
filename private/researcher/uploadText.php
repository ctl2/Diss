<?php

    session_start();

    error_reporting(E_ALL);
    ini_set('display_errors', 1);

    include ("../lib/connectDB.php");
    include ("../lib/respond.php");

    function createTextEntry($conn, $title, $uploader) {

        $sql = $conn->prepare("INSERT INTO Texts (title, uploader) VALUES (?, ?)");
        if (!$sql->bind_param("ss", $title, $uploader)) respond(false, "Execution failed: " + $conn->error);

        if (!$sql->execute()) respond(false, "Execution failed: " + $conn->error);

    }

    function createVersionEntry($conn, $title, $version, $isPublic, $targetAgeMin, $targetAgeMax, $targetGender) {

        $sql = $conn->prepare("
            INSERT INTO Versions (title, version, isPublic, targetAgeMin, targetAgeMax, targetGender)
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        if (!$sql->bind_param("siiiis", $title, $version, $isPublic, $targetAgeMin, $targetAgeMax, $targetGender))
            respond(false, "Execution failed: " + $conn->error);

        if (!$sql->execute()) respond(false, "Execution failed: " + $conn->error);

    }

    function createCharactersEntry($conn, $title, $version, $text) {

        $sql = $conn->prepare("INSERT INTO Characters (title, version, index, chara) VALUES (?, ?, ?, ?)");
        if (!$sql->bind_param("siis", $title, $version, $index, $chara)) respond(false, "Execution failed: " + $conn->error);

        for ($i = 0; $i < count($text); $i++) {
            $index = $i;
            $chara = $text[$i];
            if (!$sql->execute()) respond(false, "Execution failed: " + $conn->error);
        }

    }

    $conn = connectDB();

    $title = getPostVar('title');
    $version = getPostVar('version');
    $isPublic = getPostVar('isPublic');
    $targetAgeMin = getPostVar('targetAgeMin');
    $targetAgeMax = getPostVar('targetAgeMax');
    $targetGender = getPostVar('targetGender');
    $text = getPostVar('text');

    $conn->autocommit(FALSE);

    if ($version === 1) createTextEntry($conn, $title, $_SESSION['username']);
    createVersionEntry($conn, $title, $version, $isPublic, $targetAgeMin, $targetAgeMax, $targetGender);
    createCharactersEntry($conn, $title, $version, $text);

    if (!$mysqli -> commit()) respond(false, "Commit failed: " + $conn->error);

    respond(true, "");

?>
