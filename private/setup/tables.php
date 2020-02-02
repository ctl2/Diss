<?php

    error_reporting(E_ALL);
    ini_set('display_errors', 1);

    include ("../lib/connectDB.php");

    function makeQuery($conn, $sql, $name, $operation) {

        if ($conn->query($sql)) {
            echo $name . " was " . $operation . " successfully.<br>";
        } else {
            echo $name . " operation failed: " . mysqli_error($conn) . "<br>";
        }

    }

    function dropTable($name) {
        makeQuery($conn, "DROP TABLE $name", "$name", "dropped");
    }

    function createReaderTable($conn) {

        $tableName = "Reader";
        $sql = "CREATE TABLE $tableName (
            username VARCHAR(10) NOT NULL,
            password VARCHAR(10) NOT NULL,
            dob DATE NOT NULL,
            gender CHAR NOT NULL,
            dis BINARY NOT NULL,
            PRIMARY KEY (username)
        ) ENGINE=InnoDB";

        makeQuery($conn, $sql, $tableName, "created");

    }

    function createResearcherTable($conn) {

        $tableName = "Researcher";
        $sql = "CREATE TABLE $tableName (
            username VARCHAR(10) NOT NULL,
            password VARCHAR(10) NOT NULL,
            PRIMARY KEY (username)
        ) ENGINE=InnoDB";

        makeQuery($conn, $sql, $tableName, "created");

    }

    function createReviewerTable($conn) {

        $tableName = "Reviewer";
        $sql = "CREATE TABLE $tableName (
            username VARCHAR(10) NOT NULL,
            password VARCHAR(10) NOT NULL,
            email VARCHAR(30) NOT NULL,
            name VARCHAR(30) NOT NULL,
            PRIMARY KEY (username)
        ) ENGINE=InnoDB";

        makeQuery($conn, $sql, $tableName, "created");

    }

    function createApplicantTable($conn) {

        $tableName = "Applicant";
        $sql = "CREATE TABLE $tableName (
            username VARCHAR(10) NOT NULL,
            email VARCHAR(30) NOT NULL,
            name VARCHAR(30) NOT NULL,
            applicationDate DATETIME NOT NULL,
            PRIMARY KEY (username),
            FOREIGN KEY (username) references Researcher(username) ON UPDATE cascade ON DELETE cascade
        ) ENGINE=InnoDB";

        makeQuery($conn, $sql, $tableName, "created");

    }

    function createReviewTable($conn) {

        $tableName = "Review";
        $sql = "CREATE TABLE $tableName (
            applicant VARCHAR(10) NOT NULL,
            reviewer VARCHAR(10) NOT NULL,
            startDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (applicant),
            FOREIGN KEY (applicant) references Researcher(username) ON UPDATE cascade ON DELETE cascade,
            FOREIGN KEY (reviewer) references Reviewer(username) ON UPDATE cascade ON DELETE restrict
            # Reviewers shouldn't be able to delete their account unless they have not active reviews.
        ) ENGINE=InnoDB";

        makeQuery($conn, $sql, $tableName, "created");

    }

    function createTextTable($conn) {

        $tableName = "Text";
        $sql = "CREATE TABLE $tableName (
            title VARCHAR(30) NOT NULL,
            version TINYINT NOT NULL DEFAULT 1, # 0 to 255
            uploader VARCHAR(10) NOT NULL,
            isPublic BINARY NOT NULL,
            targetAgeMin TINYINT,
            targetAgeMax TINYINT,
            targetGender CHAR,
            PRIMARY KEY (title, version),
            FOREIGN KEY (uploader) references Researcher(username) ON UPDATE cascade ON DELETE cascade
        ) ENGINE=InnoDB";

        makeQuery($conn, $sql, $tableName, "created");

    }

    function createTextCharTable($conn) {

        $tableName = "TextChar";
        $sql = "CREATE TABLE $tableName (
            title VARCHAR(30) NOT NULL,
            version TINYINT NOT NULL DEFAULT 1, # 0 to 255
            index SMALLINT NOT NULL, # -32,768 to 32,767
            char CHAR,
            PRIMARY KEY (title, version, index),
            FOREIGN KEY (title) references Text(title) ON UPDATE cascade ON DELETE cascade,
            FOREIGN KEY (version) references Text(version) ON UPDATE cascade ON DELETE cascade
        ) ENGINE=InnoDB";

        makeQuery($conn, $sql, $tableName, "created");

    }

    function createCharReadTable($conn) {

        $tableName = "CharRead";
        $sql = "CREATE TABLE $tableName (
            reader VARCHAR(10) NOT NULL,
            textTitle VARCHAR(30) NOT NULL,
            textVersion TINYINT NOT NULL DEFAULT 1, # 0 to 255
            readIndex SMALLINT NOT NULL,
            charIndex SMALLINT NOT NULL,
            duration TIME NOT NULL,
            char CHAR,
            PRIMARY KEY (reader, textTitle, textVersion, readIndex),
            FOREIGN KEY (reader) references Reader(username) ON UPDATE cascade ON DELETE restrict,
            # ON DELETE set null would be preferable but setting values in the 'reader' column to null would cause non-unique table entries.
            FOREIGN KEY (textTitle) references Text(title) ON UPDATE cascade ON DELETE cascade,
            FOREIGN KEY (textVersion) references Text(version) ON UPDATE cascade ON DELETE cascade,
            FOREIGN KEY (charIndex) references Text(index) ON UPDATE cascade ON DELETE cascade
        ) ENGINE=InnoDB";

        makeQuery($conn, $sql, $tableName, "created");

    }

    $conn = connectDB();

    dropCharReadTable($conn);
    dropTextCharTable($conn);
    dropTextTable($conn);
    dropReviewTable($conn);
    dropApplicantTable($conn);
    dropReviewerTable($conn);
    dropResearcherTable($conn);
    dropReaderTable($conn);

    createReaderTable($conn);
    createReasearcherTable($conn);
    createReviewerTable($conn);
    createApplicantTable($conn);
    createReviewTable($conn);
    createTextTable($conn);
    createTextCharTable($conn);
    createCharReadTable($conn);

?>
