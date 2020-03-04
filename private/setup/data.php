<?php

    error_reporting(E_ALL);
    ini_set('display_errors', 1);

    require ("../lib/connectDB.php");

    function addReader($conn, $username, $password, $dob, $gender, $isImpaired) {
        $sql = $conn->prepare("INSERT INTO Readers(username, password, dob, gender, isImpaired) VALUES (?, ?, ?, ?, ?)");
        $sql->bind_param("ssssi", $username, $password, $dob, $gender, $isImpaired);
        add($conn, "Readers", $sql);
    }

    function addResearcher($conn, $username, $password) {
        $sql = $conn->prepare("INSERT INTO Researchers(username, password) VALUES (?, ?)");
        $sql->bind_param("ss", $username, $password);
        add($conn, "Researchers", $sql);
    }

    function add($conn, $table, $sql) {
        if (!$sql->execute()) {
            echo "Error for $table table: " . $conn->error . "<br><br>";
        }
    }

    // function getFileNamesContents($dir) {
    //
    //     $fileNames = array_diff(scandir($directory), array('..', '.'));
    //     $filePaths = array_map($fileNames, getTextPath);
    //     $fileContents = array_map($filePaths,  file_get_contents);
    //
    //     foreach($i = 0; $i < count($fileNames); $i++) {
    //         $fileNamesContents[$fileNames[$i]] = $fileContents[$i];
    //     }
    //
    //     return $fileNamesContents;
    //
    // }
    //
    // function getTextPath($textFileName) {
    //     return './texts/' . $textFileName;
    // }

    $conn = connectDB();

    for ($i = 0; $i < 100; $i++) {
        addResearcher($conn, "researcher$i", password_hash("researcher$i", PASSWORD_DEFAULT));
    }

    for ($i = 0; $i < 100; $i++) {
        $dob = rand(1900, 2019) . "-01-01";
        if (rand(0,1) === 0) {
            $gender = "m";
        } else {
            $gender = "f";
        }
        $isImpaired = rand(0,1);
        addReader($conn, "reader$i", password_hash("reader$i", PASSWORD_DEFAULT), $dob, $gender, $isImpaired);
    }


    // $texts = getFileNamesContents("./texts");
    // foreach($texts as $title => $text) {
    //     addToText($conn, $title, )
    // }

    echo "FINISHED";

?>
