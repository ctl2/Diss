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

    function dropTables($conn) {
        dropTable($conn, "Windows");
        dropTable($conn, "Readings");
        dropTable($conn, "Characters");
        dropTable($conn, "Versions");
        dropTable($conn, "Texts");
        dropTable($conn, "Reviews");
        dropTable($conn, "Applicants");
        dropTable($conn, "Reviewers");
        dropTable($conn, "Researchers");
        dropTable($conn, "Readers");
    }

    function dropTable($conn, $name) {
        makeQuery($conn, "DROP TABLE $name", "$name", "dropped");
    }

    function createReaderTable($conn) {

        $tableName = "Readers";
        $sql = "
            CREATE TABLE `$tableName` (
                username VARCHAR(10) NOT NULL,
                password VARCHAR(10) NOT NULL,
                dob DATE NOT NULL,
                gender CHAR NOT NULL,
                dis BINARY NOT NULL,
                PRIMARY KEY (username)
            ) ENGINE=InnoDB
        ";

        makeQuery($conn, $sql, $tableName, "created");

    }

    function createResearcherTable($conn) {

        $tableName = "Researchers";
        $sql = "
            CREATE TABLE `$tableName` (
                username VARCHAR(10) NOT NULL,
                password VARCHAR(10) NOT NULL,
                PRIMARY KEY (username)
            ) ENGINE=InnoDB
        ";

        makeQuery($conn, $sql, $tableName, "created");

    }

    function createReviewerTable($conn) {

        $tableName = "Reviewers";
        $sql = "
            CREATE TABLE `$tableName` (
                username VARCHAR(10) NOT NULL,
                password VARCHAR(10) NOT NULL,
                email VARCHAR(30) NOT NULL,
                name VARCHAR(30) NOT NULL,
                PRIMARY KEY (username)
            ) ENGINE=InnoDB
        ";

        makeQuery($conn, $sql, $tableName, "created");

    }

    function createApplicantTable($conn) {

        $tableName = "Applicants";
        $sql = "
            CREATE TABLE `$tableName` (
                username VARCHAR(10) NOT NULL,
                email VARCHAR(30) NOT NULL,
                name VARCHAR(30) NOT NULL,
                applicationDate DATETIME NOT NULL,
                PRIMARY KEY (username),
                FOREIGN KEY (username) references Researchers (username) ON UPDATE cascade ON DELETE cascade
            ) ENGINE=InnoDB
        ";

        makeQuery($conn, $sql, $tableName, "created");

    }

    function createReviewTable($conn) {

        $tableName = "Reviews";
        $sql = "
            CREATE TABLE `$tableName` (
                applicant VARCHAR(10) NOT NULL,
                reviewer VARCHAR(10) NOT NULL,
                startDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (applicant),
                FOREIGN KEY (applicant) references Researchers (username) ON UPDATE cascade ON DELETE cascade,
                FOREIGN KEY (reviewer) references Reviewers (username) ON UPDATE cascade ON DELETE restrict
            ) ENGINE=InnoDB
        ";
        # Reviewers shouldn't be able to delete their account unless they have not active reviews.

        makeQuery($conn, $sql, $tableName, "created");

    }

    function createTextTable($conn) {

        $tableName = "Texts";
        $sql = "
            CREATE TABLE `$tableName` (
                title VARCHAR(30) NOT NULL,
                uploader VARCHAR(10) NOT NULL,
                PRIMARY KEY (title),
                FOREIGN KEY (uploader) references Researchers (username) ON UPDATE cascade ON DELETE cascade
            ) ENGINE=InnoDB
        ";

        makeQuery($conn, $sql, $tableName, "created");

    }

    function createVersionTable($conn) {

        $tableName = "Versions";
        $sql = "
            CREATE TABLE `$tableName` (
                title VARCHAR(30) NOT NULL,
                version TINYINT NOT NULL,
                uploadDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                isPublic BINARY NOT NULL,
                targetAgeMin TINYINT,
                targetAgeMax TINYINT,
                targetGender CHAR,
                PRIMARY KEY (title, version),
                FOREIGN KEY (title) references Texts (title) ON UPDATE cascade ON DELETE cascade
            ) ENGINE=InnoDB
        ";

        makeQuery($conn, $sql, $tableName, "created");

    }

    function createCharacterTable($conn) {

        $tableName = "Characters";
        $sql = "
            CREATE TABLE `$tableName` (
                title VARCHAR(30) NOT NULL,
                version TINYINT NOT NULL,
                index SMALLINT NOT NULL,
                chara CHAR,
                PRIMARY KEY (title, version, index),
                FOREIGN KEY (title, version) references Versions (title, version) ON UPDATE cascade ON DELETE cascade
            ) ENGINE=InnoDB
        ";

        makeQuery($conn, $sql, $tableName, "created");

    }

    function createReadingTable($conn) {

        $tableName = "Readings";
        $sql = "
            CREATE TABLE `$tableName` (
                title VARCHAR(30) NOT NULL,
                version TINYINT NOT NULL,
                reader VARCHAR(10) NOT NULL,
                availWidth SMALLINT,
                availHeight SMALLINT,
                PRIMARY KEY (textTitle, textVersion, reader),
                FOREIGN KEY (title, version) references Characters (title, version) ON UPDATE cascade ON DELETE cascade,
                FOREIGN KEY (reader) references Readers (username) ON UPDATE cascade ON DELETE restrict
            ) ENGINE=InnoDB
        ";

        makeQuery($conn, $sql, $tableName, "created");

    }

    function createWindowTable($conn) {

        $tableName = "Windows";
        $sql = "
            CREATE TABLE `$tableName` (
                reader VARCHAR(10) NOT NULL,
                title VARCHAR(30) NOT NULL,
                version TINYINT NOT NULL,
                index SMALLINT NOT NULL,
                leftmostCharIndex SMALLINT NOT NULL,
                rightmostCharIndex SMALLINT NOT NULL,
                -- Maximum offset time is 10 seconds
                openOffset DECIMAL(7,2) NOT NULL,  -- The number of milliseconds between closing the previous window and opening this one
                closeOffset DECIMAL(7,2) NOT NULL, -- The number of milliseconds between opening and closing this window
                PRIMARY KEY (reader, textTitle, textVersion, readIndex),
                FOREIGN KEY (reader, title, version) references Readings (reader, title, version) ON UPDATE cascade ON DELETE cascade,
                FOREIGN KEY (leftmostCharIndex, rightmostCharIndex) references Characters (index, index) ON UPDATE cascade ON DELETE cascade
            ) ENGINE=InnoDB
        ";

        makeQuery($conn, $sql, $tableName, "created");

    }

    # SMALLINT is -32,768 to 32,767
    # TINYINT is 0 to 255

    $conn = connectDB();

    dropTables($conn);

    createReaderTable($conn);
    createReasearcherTable($conn);
    createReviewerTable($conn);
    createApplicantTable($conn);
    createReviewTable($conn);
    createTextTable($conn);
    createVersionTable($conn);
    createCharacterTable($conn);
    createReadingTable($conn);
    createWindowTable($conn);

    echo "FINISHED";

?>
