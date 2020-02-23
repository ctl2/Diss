<!DOCTYPE html>
<html>

    <head>
        <title>database</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>

    <body>

        <?php

            error_reporting(E_ALL);
            ini_set('display_errors', 1);

            require_once("../lib/connectDB.php");

            function displayTable($conn, $table) {

                $sql = "SELECT * FROM $table LIMIT 100";
                $result = mysqli_query($conn, $sql);
                $fields = mysqli_fetch_fields($result);

                echo "<table>";

                echo "<tr>";
                foreach ($fields as $field) {
                    echo "<th>" . $field->name . "</th>";
                }
                echo "<td></td>";
                echo "</tr>";

                while($row = $result->fetch_assoc()) {
                    echo "<tr>";
                    echo '<form action="showTables.php" method="get">';

                    $i = 0;
                    foreach ($fields as $field) {
                        echo '<td><input type="text" readonly="readonly" value="' . $row[$field->name] . '" name="f' . $i . '"></td>';
                        $i = $i + 1;
                    }

                    echo '<td><input type="text" readonly="readonly" value="' . $field->table . '" name="table" hidden><input type="submit" value="Delete Entry"></td></form>';
                    echo "</tr>";
                }

                echo "<tr>";
                foreach ($fields as $field) {
                    echo '<td></td>';
                }
                echo '<td><form action="showTables.php" method="get">'
                        . '<input type="text" readonly="readonly" value="' . $field->table . '" name="table" hidden>'
                        . '<input type="submit" value="';
                if (mysqli_num_rows($result) > 0) {
                    echo 'Delete All Entries';
                } else {
                    echo 'Drop Table';
                }
                echo '" name="del">'. '</form></td>';
                echo "</tr></table>";


            }

            function deleteEntry($conn, $table) {

                $sql = "SELECT * FROM $table";
                $result = mysqli_query($conn, $sql);
                $fields = mysqli_fetch_fields($result);

                $sql = "DELETE FROM $table WHERE ";
                $first = true;
                $i = 0;

                foreach ($fields as $field) {

                    $val = $_GET["f$i"];
                    if ($val !== '') {
                        if (!$first) {
                            $sql .= " AND ";
                        }
                        $sql .= $field->name . '="' . $val . '"';
                    }

                    $first = false;
                    $i = $i + 1;

                }

                if ($conn->query($sql)) {
                    echo "Record deleted successfully";
                } else {
                    echo "Error deleting record: " . $conn->error;
                }

                echo "<br><br>";

            }

            # A TRUE return value indicates that a table was dropped.
            function delete($conn, $table) {

                $sql = "SELECT * FROM $table";
                $result = mysqli_query($conn, $sql);

                if (mysqli_num_rows($result) > 0) {

                    $sql = "DELETE FROM $table";

                    if ($conn->query($sql) === true) {
                        echo "All entries deleted successfully";
                    } else {
                        echo "Error deleting entries: " . $conn->error;
                    }

                } else {

                    $sql = "DROP TABLE $table";

                    if ($conn->query($sql) === true) {
                        echo "Table dropped successfully";
                        return TRUE;
                    } else {
                        echo "Error dropping table: " . $conn->error;
                    }

                }

                return FALSE;

            }

            function printOptions($conn, $focusedTable) {
                $sql = 'SHOW TABLES';
                $result = mysqli_query($conn, $sql);
                while($table = $result->fetch_assoc()) {
                    foreach($table as $t) {
                        echo '<option value="' . $t . '"';
                        if ($t === $focusedTable) {
                            echo ' selected';
                        }
                        echo '>' . $t . '</option><br>';
                    }
                }
            }

            function printForm($conn, $focusedTable) {

                echo '<form action="showTables.php" method="get">';

                echo '<p>';
                echo 'Table:<br>';
                echo '<select name="table" required autofocus>';
                printOptions($conn, $focusedTable);
                echo '</select>';
                echo '</p>';

                echo '<p>';
                echo '<input type="submit" value="Search">';
                echo '</p>';

                echo '</form>';

            }

            $conn = connectDB();

            if(isset($_GET["table"])) {

                $table = $_GET["table"];
                $droppedTable = FALSE;

                if (isset($_GET["del"])) {
                    $droppedTable = delete($conn, $table);
                } else if (isset($_GET["f0"])) {
                    deleteEntry($conn, $table);
                }

                if (!$droppedTable) {
                    printForm($conn, $table);
                    displayTable($conn, $table);
                } else {
                    printForm($conn, "");
                }

            } else {
                printForm($conn, "");
            }

            echo '<br><br>';

        ?>

    </body>

</html>
