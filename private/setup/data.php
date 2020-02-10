<?php

    error_reporting(E_ALL);

    require ("../lib/connectDB.php");

    function addToReviewer($conn, $username, $password, $email, $name) {
        $sql = $conn->prepare("INSERT INTO Reviewers(username, password, email, name) VALUES (?, ?, ?, ?)");
        $sql->bind_param("ssss", $username, $password, $email, $name);
        add($conn, "Reviewers", $sql);
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

    addToReviewer($conn, "reviewer", "reviewer", "ctl2@hw.ac.uk", "Callum Latham");

    // $texts = getFileNamesContents("./texts");
    // foreach($texts as $title => $text) {
    //     addToText($conn, $title, )
    // }

    echo "FINISHED";

?>
