<?php
/**
 * VisualConfigStore — Isolated Atomic File-based Storage
 * STRICT COMPLIANCE: ZERO MySQL database interactions.
 */

class VisualConfigStore {
    private static function getStorageDir() {
        $dir = __DIR__ . '/../data';
        if (!is_dir($dir)) {
            @mkdir($dir, 0755, true);
        }
        return $dir;
    }

    public static function getPublishedPath() {
        return self::getStorageDir() . '/published.json';
    }

    public static function getDraftPath() {
        return self::getStorageDir() . '/draft.json';
    }

    public static function readPublished() {
        $path = self::getPublishedPath();
        if (file_exists($path)) {
            $content = file_get_contents($path);
            if ($content) {
                return json_decode($content, true);
            }
        }
        return null;
    }

    public static function readDraft() {
        $path = self::getDraftPath();
        if (file_exists($path)) {
            $content = file_get_contents($path);
            if ($content) {
                return json_decode($content, true);
            }
        }
        return self::readPublished();
    }

    public static function writeDraft($data) {
        $path = self::getDraftPath();
        $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        return self::atomicWrite($path, $json);
    }

    public static function publishDraft($data) {
        $publishedPath = self::getPublishedPath();
        $draftPath = self::getDraftPath();
        
        $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        
        // Backup previous published version
        if (file_exists($publishedPath)) {
            $backupDir = self::getStorageDir() . '/revisions';
            if (!is_dir($backupDir)) {
                @mkdir($backupDir, 0755, true);
            }
            $revFile = $backupDir . '/rev_' . date('Ymd_His') . '.json';
            @copy($publishedPath, $revFile);
        }

        self::atomicWrite($draftPath, $json);
        return self::atomicWrite($publishedPath, $json);
    }

    private static function atomicWrite($filePath, $content) {
        $tempPath = $filePath . '.tmp.' . uniqid('', true);
        $fp = fopen($tempPath, 'w');
        if (!$fp) return false;

        flock($fp, LOCK_EX);
        fwrite($fp, $content);
        fflush($fp);
        flock($fp, LOCK_UN);
        fclose($fp);

        return rename($tempPath, $filePath);
    }
}
