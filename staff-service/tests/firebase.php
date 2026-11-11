<?php
declare(strict_types=1);
require_once __DIR__.'/../src/FirebaseAuth.php';
use Staff\FirebaseAuth;
$key=openssl_pkey_new(['private_key_bits'=>2048,'private_key_type'=>OPENSSL_KEYTYPE_RSA,'config'=>__DIR__.'/openssl.cnf']);
$public=openssl_pkey_get_details($key)['key'];
$now=time(); $checks=0;
$claims=['aud'=>'fixture-project','iss'=>'https://securetoken.google.com/fixture-project','sub'=>'fixture-agent','exp'=>$now+3600,'iat'=>$now-5,'auth_time'=>$now-10];
$encode=fn($v)=>rtrim(strtr(base64_encode(json_encode($v)),'+/','-_'),'=');
$token=function(array $body, string $algorithm='RS256') use($encode,$key) { $raw=$encode(['alg'=>$algorithm,'kid'=>'fixture-key']).'.'.$encode($body); openssl_sign($raw,$signature,$key,OPENSSL_ALGO_SHA256); return $raw.'.'.rtrim(strtr(base64_encode($signature),'+/','-_'),'='); };
$verifier=new FirebaseAuth('fixture-project','fixture-api-key', fn()=>['fixture-key'=>$public], fn($jwt)=>['users'=>[['localId'=>'fixture-agent','email'=>'agent@example.test','emailVerified'=>true,'validSince'=>(string)($now-100)]]]);
$expect=function(bool $condition)use(&$checks){$checks++;if(!$condition)throw new RuntimeException('Assertion '.$checks.' failed');};
$deny=function(callable $operation)use($expect){try{$operation();}catch(\Staff\FirebaseAuthException $e){$expect(true);return;}$expect(false);};
$expect($verifier->verify($token($claims))['uid']==='fixture-agent');
foreach(['aud'=>'wrong-project','iss'=>'wrong-issuer','sub'=>'','exp'=>$now-1,'iat'=>$now+500,'auth_time'=>$now+500] as $field=>$value) $deny(fn()=>$verifier->verify($token(array_replace($claims,[$field=>$value]))));
$deny(fn()=>$verifier->verify($token($claims,'none')));
$valid=$token($claims); $deny(fn()=>$verifier->verify(substr($valid,0,-8).'tampered'));
$deny(fn()=>$verifier->verify('malformed'));
foreach([['localId'=>'different-user'],['localId'=>'fixture-agent','disabled'=>true],['localId'=>'fixture-agent','validSince'=>(string)($now+1)]] as $account) {
 $blocked=new FirebaseAuth('fixture-project','fixture-api-key',fn()=>['fixture-key'=>$public],fn()=>['users'=>[$account]]);
 $deny(fn()=>$blocked->verify($valid));
}
$unavailable=new FirebaseAuth('fixture-project','fixture-api-key',fn()=>['fixture-key'=>$public],fn()=>throw new RuntimeException('offline'));
$deny(fn()=>$unavailable->verify($valid));
echo "$checks Firebase verification assertions passed\n";
