<?php
declare(strict_types=1);
require __DIR__ . '/../src/Domain.php';
use Staff\Domain;
$checks = 0;
function same(mixed $expected, mixed $actual): void { global $checks; $checks++; if ($expected !== $actual) throw new RuntimeException(var_export([$expected, $actual], true)); }
function rejects(callable $fn): void { global $checks; $checks++; try { $fn(); } catch (InvalidArgumentException $e) { return; } throw new RuntimeException('Expected validation rejection'); }
same('due', Domain::state('2026-11-10 05:30:00', null, '2026-11-11 05:30:00'));
same('overtime', Domain::state('2026-11-10 05:30:00', null, '2026-11-11 05:30:01'));
same('completed_late', Domain::state('2026-11-10 05:30:00', '2026-11-11 05:30:01', '2026-11-12 00:00:00'));
same('+93782222279', Domain::phone('078 222 2279'));
rejects(fn() => Domain::feedback(['outcome'=>'closed','amount'=>'100','currency'=>'AFN'], 'callcenter'));
rejects(fn() => Domain::feedback(['outcome'=>'followup','notes'=>'Called'], 'sales'));
rejects(fn() => Domain::feedback(['outcome'=>'lost','reason'=>''], 'callcenter'));
rejects(fn() => Domain::feedback(['outcome'=>'closed','amount'=>'1e5','currency'=>'AFN'], 'sales'));
same('lost', Domain::feedback(['outcome'=>'lost','reason'=>'Bought elsewhere'], 'callcenter')['outcome']);
rejects(fn() => Domain::future('2000-01-01T00:00:00Z'));
rejects(fn() => Domain::future('2099-02-30T10:00:00Z'));
same('2099-01-01 05:30:00', Domain::future('2099-01-01T10:00:00+04:30'));
same(str_repeat('نام', 40), Domain::text(str_repeat('نام', 40), 160));
echo "$checks domain assertions passed\n";
