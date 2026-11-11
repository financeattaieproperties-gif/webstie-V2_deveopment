<?php
// Keep real config outside ALL document roots. Use a NEW staff database only.
return [
    'dsn' => 'mysql:host=localhost;dbname=NEW_STAFF_DATABASE;charset=utf8mb4',
    'database_user' => 'NEW_STAFF_RUNTIME_USER',
    'database_password' => '',
    'origin' => 'https://website.attaieproperties.com',
    'session_directory' => '/home/CPANEL_USER/private-staff/sessions',
    'allow_local_http' => false,
    'firebase_project_id' => 'YOUR_V2_FIREBASE_PROJECT_ID',
    'firebase_api_key' => 'YOUR_V2_FIREBASE_WEB_API_KEY',
];
