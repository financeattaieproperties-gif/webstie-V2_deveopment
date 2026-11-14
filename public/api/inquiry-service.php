<?php
declare(strict_types=1);

final class WebsiteInquiryException extends RuntimeException {}

/** Validate before opening a transaction; hash exactly the values stored in MySQL. */
function website_inquiry_payload(array $input): array {
    $payload = [];
    foreach (['name'=>255, 'email'=>255, 'phone'=>50, 'message'=>16000, 'propertyId'=>50, 'propertyName'=>255] as $key=>$limit) {
        $value = $input[$key] ?? ($key === 'propertyName' ? 'General Inquiry' : '');
        if (!is_string($value)) throw new WebsiteInquiryException('Invalid inquiry fields', 422);
        $value = trim($value);
        $length = preg_match_all('/./us', $value);
        if ($length === false || $length > $limit) throw new WebsiteInquiryException('Invalid inquiry fields', 422);
        $payload[$key] = $value;
    }
    if ($payload['name'] === '' || $payload['phone'] === '' || !filter_var($payload['email'], FILTER_VALIDATE_EMAIL)) {
        throw new WebsiteInquiryException('Name, valid email, and phone are required', 422);
    }
    return $payload;
}

function website_inquiry_result(array $row): array {
    return ['success'=>true, 'id'=>(int)$row['id'], 'receipt'=>[
        'reference'=>$row['receipt_reference'],
        'submittedAt'=>str_replace(' ', 'T', $row['receipt_submitted_at']) . 'Z',
        'customerName'=>$row['name'], 'propertyName'=>$row['property_name'],
    ]];
}

/** Unique-key recovery also covers two connections racing before either can see the row. */
function save_website_inquiry(mysqli $db, array $input): array {
    $payload = website_inquiry_payload($input);
    $requestId = $input['clientRequestId'] ?? null;
    if ($requestId !== null && (!is_string($requestId) || !preg_match('/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/iD', $requestId))) {
        throw new WebsiteInquiryException('Invalid request identifier', 422);
    }
    $requestId = $requestId === null ? null : strtolower($requestId);
    $hash = hash('sha256', json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR));
    mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
    $db->begin_transaction();
    try {
        if ($requestId !== null) {
            $find = $db->prepare('SELECT * FROM leads WHERE client_request_id = ?');
            $find->bind_param('s', $requestId); $find->execute();
            $existing = $find->get_result()->fetch_assoc();
            if ($existing) {
                if (!hash_equals($existing['payload_hash'], $hash)) throw new WebsiteInquiryException('Request identifier already used for a different inquiry', 409);
                $db->commit();
                return website_inquiry_result($existing);
            }
        }
        $reference = 'INQ-' . strtoupper(bin2hex(random_bytes(16)));
        $submittedAt = gmdate('Y-m-d H:i:s');
        $stmt = $db->prepare("INSERT INTO leads
            (name,email,phone,message,property_id,property_name,stage,source,status,client_request_id,payload_hash,receipt_reference,receipt_submitted_at)
            VALUES (?,?,?,?,?,?,'New','Website','Pending',?,?,?,?)");
        $stmt->bind_param('ssssssssss', $payload['name'], $payload['email'], $payload['phone'], $payload['message'], $payload['propertyId'], $payload['propertyName'], $requestId, $hash, $reference, $submittedAt);
        $stmt->execute();
        $id = $db->insert_id;
        $db->commit();
        return website_inquiry_result(['id'=>$id, 'name'=>$payload['name'], 'property_name'=>$payload['propertyName'], 'receipt_reference'=>$reference, 'receipt_submitted_at'=>$submittedAt]);
    } catch (Throwable $error) {
        $db->rollback();
        if ($error instanceof mysqli_sql_exception && $error->getCode() === 1062 && $requestId !== null) {
            $find = $db->prepare('SELECT * FROM leads WHERE client_request_id = ?');
            $find->bind_param('s', $requestId); $find->execute();
            $existing = $find->get_result()->fetch_assoc();
            if ($existing) {
                if (!hash_equals($existing['payload_hash'], $hash)) throw new WebsiteInquiryException('Request identifier already used for a different inquiry', 409);
                return website_inquiry_result($existing);
            }
        }
        throw $error;
    }
}
