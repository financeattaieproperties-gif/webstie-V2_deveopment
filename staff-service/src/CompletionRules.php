<?php
declare(strict_types=1);
namespace Staff;
use InvalidArgumentException;
final class CompletionRules {
    public static function money(mixed $value): int {
        $s=(string)$value;
        if (!preg_match('/^\d{1,11}(?:\.\d{1,2})?$/D',$s)) throw new InvalidArgumentException('Enter a nonnegative amount with two decimals at most.');
        [$whole,$decimal]=array_pad(explode('.',$s),2,'');
        return (int)$whole*100+(int)str_pad($decimal,2,'0');
    }
    public static function schedule(int $total,array $rows): array {
        if (!$rows || count($rows)>100) throw new InvalidArgumentException('Enter installment schedule.');
        $percent=array_map(fn($r)=>self::money($r['percentage']??''),$rows);
        if (array_sum($percent)!==10000 || min($percent)<=0) throw new InvalidArgumentException('Positive installment percentages must total 100%.');
        $amounts=[]; $left=$total;
        foreach ($percent as $i=>$p) { $amount=$i===count($percent)-1 ? $left : intdiv($total*$p+5000,10000); if ($amount<0||$amount>$left) throw new InvalidArgumentException('Schedule rounding exceeds total.'); $amounts[]=$amount; $left-=$amount; }
        return $amounts;
    }
    public static function verification(array $r): array { return ['contractSerial'=>$r['contract_serial'],'status'=>$r['status'],'amendmentVersion'=>(int)$r['amendment_version']]; }
    public static function privateFile(mixed $url): string {
        if (!is_string($url)||!preg_match('#^/staff-api/v1/files/([a-f0-9]{32})$#D',$url,$m)) throw new InvalidArgumentException('Use a protected staff upload.');
        return $m[1];
    }
}
