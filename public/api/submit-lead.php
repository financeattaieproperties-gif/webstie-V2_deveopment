<?php
require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/inquiry-service.php';
cors();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_out(['error'=>'Method not allowed'], 405);

try {
    json_out(save_website_inquiry(db(), body()));
} catch (WebsiteInquiryException $error) {
    json_out(['error'=>$error->getMessage()], $error->getCode());
} catch (Throwable $error) {
    json_out(['error'=>'Unable to save inquiry. Please retry.'], 500);
}
