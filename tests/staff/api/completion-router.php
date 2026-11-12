<?php
declare(strict_types=1);
require __DIR__.'/../../../staff-service/src/App.php';
Staff\App::run(__DIR__,getenv('STAFF_CONFIG_FILE'));
