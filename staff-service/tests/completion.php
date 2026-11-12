<?php
declare(strict_types=1);
require __DIR__.'/../src/CompletionRules.php';
use Staff\CompletionRules as R;
$n=0;
function check(bool $v): void { global $n; $n++; if (!$v) throw new RuntimeException('Assertion '.$n); }
function reject(callable $f): void { try {$f();} catch (InvalidArgumentException $e) { check(true); return; } check(false); }
check(R::money('12.34')===1234);
reject(fn()=>R::money('1e4'));
reject(fn()=>R::money(-1));
check(R::schedule(10001,[['percentage'=>33.33],['percentage'=>33.33],['percentage'=>33.34]])===[3333,3333,3335]);
check(R::schedule(100,[['percentage'=>33.5],['percentage'=>33.5],['percentage'=>33]])===[34,34,32]);
reject(fn()=>R::schedule(100,[['percentage'=>90]]));
reject(fn()=>R::schedule(100,[['percentage'=>-10],['percentage'=>110]]));
check(R::verification(['contract_serial'=>'TEST','status'=>'issued','amendment_version'=>2,'buyers'=>'PRIVATE'])===['contractSerial'=>'TEST','status'=>'issued','amendmentVersion'=>2]);
reject(fn()=>R::privateFile('https://public.test/buyer.jpg'));
check(R::privateFile('/staff-api/v1/files/'.str_repeat('a',32))===str_repeat('a',32));
echo "$n completion assertions passed\n";
