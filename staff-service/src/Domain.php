<?php
declare(strict_types=1);
namespace Staff;
use DateTimeImmutable;
use DateTimeZone;
use InvalidArgumentException;

final class Domain {
    public static function text(mixed $value, int $max = 4000): string {
        if (!is_string($value) || trim($value) === '') throw new InvalidArgumentException('Required text is missing or too long.');
        $length = preg_match_all('/./us', $value);
        if ($length === false || $length > $max) throw new InvalidArgumentException('Required text is missing or too long.');
        return trim($value);
    }
    public static function phone(string $value): string {
        $digits = preg_replace('/\D/', '', $value);
        if (str_starts_with($digits, '00')) $digits = substr($digits, 2);
        if (preg_match('/^07\d{8}$/', $digits)) $digits = '93' . substr($digits, 1);
        if (!preg_match('/^937\d{8}$/', $digits)) throw new InvalidArgumentException('Enter a valid Afghan mobile number.');
        return '+' . $digits;
    }
    public static function future(mixed $value): string {
        if (!is_string($value) || !preg_match('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,6})?)?(Z|[+-]\d{2}:\d{2})$/', $value)) throw new InvalidArgumentException('Choose a valid scheduled time with timezone.');
        try { $date = new DateTimeImmutable($value); } catch (\Exception $e) { throw new InvalidArgumentException('Invalid scheduled time.'); }
        $errors = DateTimeImmutable::getLastErrors();
        if (($errors && ($errors['warning_count'] || $errors['error_count'])) || $date <= new DateTimeImmutable('now', new DateTimeZone('UTC'))) throw new InvalidArgumentException('Next scheduled time must be valid and in the future.');
        return $date->setTimezone(new DateTimeZone('UTC'))->format('Y-m-d H:i:s');
    }
    public static function iso(?string $value): ?string { return $value === null ? null : (new DateTimeImmutable($value, new DateTimeZone('UTC')))->format('Y-m-d\TH:i:s\Z'); }
    public static function state(string $scheduled, ?string $completed, ?string $now = null): string {
        $start = (new DateTimeImmutable($scheduled, new DateTimeZone('UTC')))->getTimestamp();
        $deadline = $start + 86400;
        if ($completed !== null) return (new DateTimeImmutable($completed, new DateTimeZone('UTC')))->getTimestamp() > $deadline ? 'completed_late' : 'completed';
        $time = (new DateTimeImmutable($now ?? 'now', new DateTimeZone('UTC')))->getTimestamp();
        return $time < $start ? 'upcoming' : ($time > $deadline ? 'overtime' : 'due');
    }
    public static function feedback(array $body, string $role): array {
        $outcome = $body['outcome'] ?? '';
        if (!in_array($outcome, ['followup','visit','closed','lost'], true)) throw new InvalidArgumentException('Choose an outcome.');
        if ($outcome === 'closed') {
            if ($role !== 'sales') throw new InvalidArgumentException('Only an assigned sales agent may close a deal.');
            $amount = (string) ($body['amount'] ?? '');
            if (!preg_match('/^\d{1,12}(\.\d{1,2})?$/', $amount) || (float) $amount <= 0) throw new InvalidArgumentException('Enter a positive amount with at most two decimals.');
            if (!in_array($body['currency'] ?? '', ['AFN','USD'], true)) throw new InvalidArgumentException('Choose a deal currency.');
        } elseif ($outcome === 'lost') {
            self::text($body['reason'] ?? null);
        } else {
            self::text($body['notes'] ?? null);
            self::future($body['nextScheduledAt'] ?? null);
            if (!is_int($body['nextAssigneeId'] ?? null) || $body['nextAssigneeId'] < 1) throw new InvalidArgumentException('Select the next agent.');
        }
        return $body;
    }
}
