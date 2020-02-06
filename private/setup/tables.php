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
        dropTable($conn, "WindowRead");
        dropTable($conn, "VersionRead");
        dropTable($conn, "VersionCharacter");
        dropTable($conn, "Version");
        dropTable($conn, "Text");
        dropTable($conn, "Review");
        dropTable($conn, "Applicant");
        dropTable($conn, "Reviewer");
        dropTable($conn, "Researcher");
        dropTable($conn, "Reader");
    }

    function dropTable($conn, $name) {
        makeQuery($conn, "DROP TABLE $name", "$name", "dropped");
    }

    function createReaderTable($conn) {

        $tableName = "Reader";
        $sql = "
            CREATE TABLE $tableName (
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

        $tableName = "Researcher";
        $sql = "
            CREATE TABLE $tableName (
                username VARCHAR(10) NOT NULL,
                password VARCHAR(10) NOT NULL,
                PRIMARY KEY (username)
            ) ENGINE=InnoDB
        ";

        makeQuery($conn, $sql, $tableName, "created");

    }

    function createReviewerTable($conn) {

        $tableName = "Reviewer";
        $sql = "
            CREATE TABLE $tableName (
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

        $tableName = "Applicant";
        $sql = "
            CREATE TABLE $tableName (
                username VARCHAR(10) NOT NULL,
                email VARCHAR(30) NOT NULL,
                name VARCHAR(30) NOT NULL,
                applicationDate DATETIME NOT NULL,
                PRIMARY KEY (username),
                FOREIGN KEY (username) references Researcher(username) ON UPDATE cascade ON DELETE cascade
            ) ENGINE=InnoDB
        ";

        makeQuery($conn, $sql, $tableName, "created");

    }

    function createReviewTable($conn) {

        $tableName = "Review";
        $sql = "
            CREATE TABLE $tableName (
                applicant VARCHAR(10) NOT NULL,
                reviewer VARCHAR(10) NOT NULL,
                startDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (applicant),
                FOREIGN KEY (applicant) references Researcher(username) ON UPDATE cascade ON DELETE cascade,
                FOREIGN KEY (reviewer) references Reviewer(username) ON UPDATE cascade ON DELETE restrict
            ) ENGINE=InnoDB
        ";
        # Reviewers shouldn't be able to delete their account unless they have not active reviews.

        makeQuery($conn, $sql, $tableName, "created");

    }

    function createTextTable($conn) {

        $tableName = "Text";
        $sql = "
            CREATE TABLE $tableName (
                title VARCHAR(30) NOT NULL,
                uploader VARCHAR(10) NOT NULL,
                PRIMARY KEY (title),
                FOREIGN KEY (uploader) references Researcher(username) ON UPDATE cascade ON DELETE cascade
            ) ENGINE=InnoDB
        ";

        makeQuery($conn, $sql, $tableName, "created");

    }

    function createVersionTable($conn) {

        $tableName = "Version";
        $sql = "
            CREATE TABLE $tableName (
                title VARCHAR(30) NOT NULL,
                version TINYINT NOT NULL DEFAULT 1,
                uploadDate DATE NOT NULL,
                isPublic BINARY NOT NULL,
                targetAgeMin TINYINT,
                targetAgeMax TINYINT,
                targetGender CHAR,
                PRIMARY KEY (title, version),
                FOREIGN KEY (title) references Text(title) ON UPDATE cascade ON DELETE cascade
            ) ENGINE=InnoDB
        ";

        makeQuery($conn, $sql, $tableName, "created");

    }

    function createVersionCharacterTable($conn) {

        $tableName = "VersionCharacter";
        $sql = "
            CREATE TABLE $tableName (
                title VARCHAR(30) NOT NULL,
                version TINYINT NOT NULL DEFAULT 1,
                index SMALLINT NOT NULL,
                chara CHAR,
                PRIMARY KEY (title, version, index),
                FOREIGN KEY (title) references Version(title) ON UPDATE cascade ON DELETE cascade,
                FOREIGN KEY (version) references Version(version) ON UPDATE cascade ON DELETE cascade
            ) ENGINE=InnoDB
            ";

        makeQuery($conn, $sql, $tableName, "created");

    }

    function createTextReadTable($conn) {

        $tableName = "VersionRead";
        $sql = "
            CREATE TABLE $tableName (
                reader VARCHAR(10) NOT NULL,
                title VARCHAR(30) NOT NULL,
                version TINYINT NOT NULL DEFAULT 1,
                readDate DATE NOT NULL,
                PRIMARY KEY (reader, textTitle, textVersion),
                FOREIGN KEY (reader) references Reader(username) ON UPDATE cascade ON DELETE restrict,
                FOREIGN KEY (title) references Version(title) ON UPDATE cascade ON DELETE cascade,
                FOREIGN KEY (version) references Version(version) ON UPDATE cascade ON DELETE cascade
            ) ENGINE=InnoDB
        ";

        makeQuery($conn, $sql, $tableName, "created");

    }

    function createWindowReadTable($conn) {

        $tableName = "WindowRead";
        $sql = "
            CREATE TABLE $tableName (
                reader VARCHAR(10) NOT NULL,
                title VARCHAR(30) NOT NULL,
                version TINYINT NOT NULL DEFAULT 1,
                readIndex SMALLINT NOT NULL,
                windowStartIndex SMALLINT NOT NULL,
                windowEndIndex SMALLINT NOT NULL,
                duration TIME NOT NULL,
                char CHAR,
                PRIMARY KEY (reader, textTitle, textVersion, readIndex),
                FOREIGN KEY (reader) references VersionRead(username) ON UPDATE cascade ON DELETE restrict,
                FOREIGN KEY (title) references VersionRead(title) ON UPDATE cascade ON DELETE cascade,
                FOREIGN KEY (version) references VersionRead(version) ON UPDATE cascade ON DELETE cascade,
                FOREIGN KEY (windowStartIndex) references VersionCharacter(index) ON UPDATE cascade ON DELETE cascade,
                FOREIGN KEY (windowEndIndex) references VersionCharacter(index) ON UPDATE cascade ON DELETE cascade
            ) ENGINE=InnoDB
        ";

        makeQuery($conn, $sql, $tableName, "created");

    }

    # SMALLINT is -32,768 to 32,767
    # TINYINT is 0 to 255

    $conn = connectDB();

    $dropTables($conn);

    createReaderTable($conn);
    createReasearcherTable($conn);
    createReviewerTable($conn);
    createApplicantTable($conn);
    createReviewTable($conn);
    createTextTable($conn);
    createVersionTable($conn);
    createVersionCharacterTable($conn);
    createVersionReadTable($conn);
    createWindowReadTable($conn);

    echo "FINISHED";

?>
