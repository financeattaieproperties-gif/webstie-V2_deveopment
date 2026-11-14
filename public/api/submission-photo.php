<?php
// V2: website/Admin can read copied marketing assets from the isolated Submission DB only.
require_once __DIR__.'/bootstrap.php';
$host=getenv('SUBMISSION_DB_HOST') ?: (defined('SUBMISSION_DB_HOST')?SUBMISSION_DB_HOST:'');
$user=getenv('SUBMISSION_DB_USER') ?: (defined('SUBMISSION_DB_USER')?SUBMISSION_DB_USER:'');
$pass=getenv('SUBMISSION_DB_PASS') ?: (defined('SUBMISSION_DB_PASS')?SUBMISSION_DB_PASS:'');
$name=getenv('SUBMISSION_DB_NAME') ?: (defined('SUBMISSION_DB_NAME')?SUBMISSION_DB_NAME:'');
if (!$host||!$user||!$name||$name===DB_NAME) {http_response_code(503);exit;}
$db=new mysqli($host,$user,$pass,$name);
$post=(int)($_GET['post']??0);$order=(int)($_GET['photo']??-1);$revision=(int)($_GET['revision']??1);
$q=$db->prepare('SELECT a.mime,a.content,p.publish_status,p.published_revision FROM sub_post_assets a JOIN sub_posts p ON p.id=a.sub_post_id WHERE a.sub_post_id=? AND a.revision=? AND a.sort_order=?');
if (!$q) {http_response_code(503);exit;}
$q->bind_param('iii',$post,$revision,$order);$q->execute();$r=$q->get_result()->fetch_assoc();
if (!$r) {http_response_code(404);exit;}
if ((int)$r['published_revision']!==$revision) require_admin();
header('Content-Type: '.$r['mime']);header('X-Content-Type-Options: nosniff');header('Cache-Control: private, no-store');echo $r['content'];
