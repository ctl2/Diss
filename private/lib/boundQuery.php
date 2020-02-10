<?php

    require_once("respond.php");

    function getBoundQuery($conn, $sql, $typeString, $valueArray) {
        // Store references to each parameter needed to call the bind_param function
        $paramQuant = count($valueArray);
        $params = array();
        $params[0] = &$typeString;
        for($i = 0; $i < $paramQuant; $i++) {
            $params[$i+1] = &$valueArray[$i];
        }
        // Prepare
        $stmt = $conn->prepare($sql);
        if(!$stmt) respond(false, "Preparation failed: \n$conn->errno \n$conn->error");
        // Bind parameters
        if (!call_user_func_array(array($stmt, 'bind_param'), $params)) repond(false, "Binding failed: \n$conn->errno \n$conn->error");
        // Return binding
        return $stmt;
    }

    function executeBoundQuery($conn, $stmt) {
        // Execute
        if (!$stmt->execute()) respond(false, "Execution failed: \n$conn->errno \n$conn->error");
    }

    function makeBoundQuery($conn, $sql, $typeString, $valueArray) {
         $stmt = getBoundQuery($conn, $sql, $typeString, $valueArray);
         executeBoundQuery($conn, $stmt);
         return $stmt;
    }

?>
