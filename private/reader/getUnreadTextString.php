<?php

    session_start();

    error_reporting(E_ALL);
    ini_set('display_errors', 1);

    require_once("../lib/connectDB.php");
    require_once("../lib/unboundQuery.php");
    require_once("../lib/respond.php");
    require_once("../lib/getTextString.php");

    function getUnreadTextString($conn, $reader) {
        // Form an SQL query for the most recently uploaded text that the given reader hasn't yet read
        $sql = "
            SELECT title, version
            FROM Versions
            WHERE NOT EXISTS (
                SELECT NULL
                FROM Readings
                WHERE Versions.title = Readings.title
                AND Versions.version = Readings.version
                AND reader='$reader'
            )
            ORDER BY uploadDate DESC
            LIMIT 1
        ";
        // Make the query
        $textRows = getQueryResult($conn, $sql);
        // Check that there is some text that this account hasn't read
        if (mysqli_num_rows($textRows) === 0) {
            respond(false, "No unread texts were found.");
        } else {
            $textRow = $textRows->fetch_assoc();
            // Record the title and version so that the client doesn't have to upload this information alongside new reading data
            $_SESSION['title'] = $textRow['title'];
            $_SESSION['version'] = $textRow['version'];
            // Return the text
            return getTextString($conn, $_SESSION['title'], $_SESSION['version']);
        }
    }

    $conn = connectDB();

    $reader = $_SESSION['username'];

    $textString = getUnreadTextString($conn, $reader);

    respond(true, $textString);

?>
