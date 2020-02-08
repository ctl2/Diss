<?php

    error_reporting(E_ALL);
    ini_set('display_errors', 1);

    include ("../lib/connectDB.php");
    include ("../lib/echoTextString.php");

    function echoUnreadTextString($conn, $reader) {
        // Form an SQL query for the most recently uploaded text that the given reader hasn't yet read
        $sql = "
                SELECT TOP 1 title, version
                FROM Version
                WHERE NOT EXISTS (
                    SELECT NULL
                    INNER JOIN VersionRead ON Version.title = VersionRead.title AND Version.version = VersionRead.version
                    WHERE reader='$reader'
                )
                ORDER BY uploadDate DESC
            )
        ";
        // Make the query
        $textRows = mysqli_query($conn, $sql);
        // Make sure that there is some text that this account hasn't read
        if (mysqli_num_rows($result) > 0) {
            $textRow = $readerRows->fetch_assoc();
            // Record the title and version so that the client doesn't have to upload this information alongside new reading data
            $_SESSION['title'] = $textRow['title'];
            $_SESSION['version'] = $textRow['version'];
            // Echo the text
            echoTextString($conn, $_SESSION['title'], $_SESSION['version']);
        }
    }

    $conn = connectDB();

    $reader = $_POST["reader"];

    echoUnreadText($conn, $reader);

?>
