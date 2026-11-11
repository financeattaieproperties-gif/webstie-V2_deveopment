<?php
declare(strict_types=1);
if (str_starts_with(parse_url($_SERVER['REQUEST_URI'],PHP_URL_PATH),'/staff-api/')) {
    require __DIR__.'/firebase-transport.php';
    require __DIR__.'/../../../public/staff-api/index.php';
    return true;
}
http_response_code(404);
echo 'Local staff fixture API only';
