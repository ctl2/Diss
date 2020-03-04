<?php

    if (session_id() == "") session_start();

    require_once("../lib/respond.php");

    session_unset();
    session_destroy();

    respond(true, "");

?>
