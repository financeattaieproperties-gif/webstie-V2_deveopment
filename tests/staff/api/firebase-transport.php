<?php
declare(strict_types=1);
namespace Staff;
// Loaded ONLY by the local test router, never by the production entrypoint/package.
if (getenv('STAFF_LOCAL_TEST')!=='1' || ($_SERVER['REMOTE_ADDR']??'')!=='127.0.0.1') throw new \RuntimeException('Local fixture transport only.');
function curl_init(string $url): object { return (object)['url'=>$url,'options'=>[]]; }
function curl_setopt_array(object $curl,array $options): bool { $curl->options=$options;return true; }
function curl_exec(object $curl): string {
 $dir=sys_get_temp_dir().'/attaie-staff-v2-test';
 if($curl->url==='https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com')return json_encode(['fixture-key'=>file_get_contents($dir.'/public.pem')]);
 if($curl->url!=='https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=fixture-key')throw new \RuntimeException('Unexpected fixture URL.');
 $token=json_decode($curl->options[CURLOPT_POSTFIELDS],true)['idToken'];
 $claims=json_decode(base64_decode(strtr(explode('.',$token)[1],'-_','+/')),true);
 return json_encode(['users'=>[['localId'=>$claims['sub'],'email'=>'fixture@example.test','emailVerified'=>true,'validSince'=>'0']]]);
}
function curl_getinfo(object $curl,int $option): int { return 200; }
function curl_close(object $curl): void {}
