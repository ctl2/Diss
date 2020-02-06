<?php

    session_start();

    error_reporting(E_ALL);
    ini_set('display_errors', 1);

    include ("../lib/connectDB.php");
    include ("../lib/accountExists.php");

    function createReaderAccount($conn, $username, $password, $dob, $gender, $dis) {

        $sql = $conn->prepare("INSERT INTO Reader (username, password, dob, gender, dis) VALUES (?, ?, ?, ?, ?)");
        $sql->bind_param("ssssi", $username, $password, $dob, $gender, $dis);

        $sql->execute();

    }

    function createResearcherAccount($conn, $username, $password, $email, $name) {

        $sql = $conn->prepare("INSERT INTO Researcher (username, password, email, name) VALUES (?, ?, ?, ?)");
        $sql->bind_param("ssss", $username, $password, $email, $name);

        $sql->execute();

    }

    function respond($message) {
        echo $message;
    }

    if (isset($_POST["username"])) {

        $conn = connectDB();
        $username = $_POST["username"];
        $password1 = $_POST["password1"];

        if (accountExists($conn, $username)) {
            respond("Username is taken.");
        } else {

            if ($_POST["acc_type"]) == "reader") {

                $dob = $_POST["dob"];
                $gender = $_POST["gender"];
                $dis = $_POST["dis"];

                createReaderAccount($username, $password1, $dob, $gender, $dis);

            } else {

                $name = $_POST["name"];
                $email = $_POST["email"];

                createResearcherAccount($username, $password1, $name, $email);

            }

            $_SESSION["username"] = $username;
            respond($_POST["acc_type"]);

        }

    }

?>
