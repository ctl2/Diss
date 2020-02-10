<?php
    function respond($success, $message) {
        die(
            json_encode(
                array(
                    "success"=>$success, 
                    "message"=>$message
                )
            )
        );
    }
?>
