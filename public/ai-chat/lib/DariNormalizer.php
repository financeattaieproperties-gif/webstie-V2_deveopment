<?php
declare(strict_types=1);

namespace Attaie\AiChat;

/**
 * Afghan Dari (دری افغانستان), Pashto, and English normalization & intent parser.
 *
 * Normalizes search inputs without altering stored database records.
 */
final class DariNormalizer
{
    /**
     * Converts Persian (۰-۹) and Eastern Arabic (٠-٩) digits to Western ASCII digits (0-9).
     */
    public static function normalizeDigits(string $input): string
    {
        $persian = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
        $arabic  = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
        $western = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
        $out = str_replace($persian, $western, $input);
        return str_replace($arabic, $western, $out);
    }

    /**
     * Normalizes Arabic/Persian character variations (ي/ی, ك/ک, ة/ه, آ/أ/إ/ا, ZWNJ).
     */
    public static function normalizeText(string $input): string
    {
        $text = self::normalizeDigits($input);
        $replacements = [
            'ي' => 'ی',
            'ئ' => 'ی',
            'ى' => 'ی',
            'ك' => 'ک',
            'ة' => 'ه',
            'ۀ' => 'ه',
            'أ' => 'ا',
            'إ' => 'ا',
            'آ' => 'ا',
            'ؤ' => 'و',
            "\u{200C}" => ' ', // ZWNJ to space
            "\u{0640}" => '',  // Tatweel
        ];
        $text = strtr($text, $replacements);
        $text = mb_strtolower($text, 'UTF-8');
        $text = (string) preg_replace('/\s+/u', ' ', $text);
        return trim($text);
    }

    /**
     * Detects target reply language: 'fa' (Afghan Dari default), 'ps' (Pashto), or 'en' (English).
     */
    public static function detectLanguage(string $input): string
    {
        $norm = self::normalizeText($input);
        if (preg_match('/\b(speak english|in english|english please)\b/i', $norm)) {
            return 'en';
        }
        // Pashto specific letters: ټ ډ ړ ږ ښ ګ ڼ ې څ ځ or common Pashto particles
        if (preg_match('/[ټډړږښګڼېڅځ]|(^|\s)په\s|پښتو/u', $input)) {
            return 'ps';
        }
        // If predominantly ASCII Latin characters
        if (!preg_match('/[\x{0600}-\x{06FF}]/u', $input) && preg_match('/[a-zA-Z]{3,}/', $input)) {
            return 'en';
        }
        return 'fa';
    }

    /**
     * Extracts structured search filters from natural Afghan Dari, Pashto, or English messages.
     */
    public static function extractSearchFilters(string $message): array
    {
        $norm = self::normalizeText($message);
        $filters = [
            'type'         => null,
            'listing_type' => null,
            'min_beds'     => null,
            'max_beds'     => null,
            'min_price'    => null,
            'max_price'    => null,
            'location'     => null,
            'keyword'      => null,
            'is_gerawi'    => false,
            'asks_afn'     => false,
        ];

        // Property type detection
        if (preg_match('/(اپارتمان|فلت|apartment|flat)/u', $norm)) {
            $filters['type'] = 'Apartment';
        } elseif (preg_match('/(ویلا|villa)/u', $norm)) {
            $filters['type'] = 'Villa';
        } elseif (preg_match('/(نمره زمین|زمین|land|plot|بسوه|جریده)/u', $norm)) {
            $filters['type'] = 'Land';
        } elseif (preg_match('/(تجارتی|تجاعتی|دوکان|دکان|مارکیت|دفتر|commercial|shop|office)/u', $norm)) {
            $filters['type'] = 'Commercial';
        } elseif (preg_match('/(حویلی|خانه|کور|house|home)/u', $norm)) {
            $filters['type'] = 'House';
        }

        // Listing type detection (sale / rent / gerawi)
        if (preg_match('/(گروی|گرو|gerawi|mortgage)/u', $norm)) {
            $filters['is_gerawi'] = true;
            $filters['keyword']   = 'گروی';
        }
        if (preg_match('/(کرایه|کرایی|اجاره|rent|rental|for rent)/u', $norm)) {
            $filters['listing_type'] = 'rent';
        } elseif (preg_match('/(فروشی|فروش|خرید|sale|for sale|buy)/u', $norm)) {
            $filters['listing_type'] = 'sale';
        }

        // Currency mention
        if (preg_match('/(افغانی|افغاني|afn|afghani)/u', $norm)) {
            $filters['asks_afn'] = true;
        }

        // Room / Bedroom count (اتاق / اتاقه / خواب / bed)
        $wordToNum = [
            'یک'   => 1,
            'دو'   => 2,
            'سه'   => 3,
            'چهار' => 4,
            'پنج'  => 5,
            'شش'   => 6,
            'هفت'  => 7,
            'هشت'  => 8,
            'one'  => 1,
            'two'  => 2,
            'three'=> 3,
            'four' => 4,
            'five' => 5,
        ];

        if (preg_match('/\b([1-9])\s*(اتاقه|اتاق|خواب|اطاق|اطاقه|bed|bedroom|bedrooms|rooms)\b/u', $norm, $m)) {
            $beds = (int) $m[1];
            $filters['min_beds'] = $beds;
            $filters['max_beds'] = $beds;
        } else {
            foreach ($wordToNum as $word => $num) {
                if (preg_match('/\b' . preg_quote($word, '/') . '\s*(اتاقه|اتاق|خواب|اطاق|اطاقه|bed|bedroom|bedrooms|rooms)\b/u', $norm)) {
                    $filters['min_beds'] = $num;
                    $filters['max_beds'] = $num;
                    break;
                }
            }
        }

        // Known Kabul locations (explicit bilateral aliases for search matching)
        $locations = [
            'وزیر اکبر خان' => ['وزیر اکبر خان', 'Wazir Akbar Khan'],
            'wazir akbar'   => ['وزیر اکبر خان', 'Wazir Akbar Khan'],
            'شهر نو'        => ['شهر نو', 'Shahr-e-Naw', 'Shahr-e Naw'],
            'shahr-e-naw'   => ['شهر نو', 'Shahr-e-Naw', 'Shahr-e Naw'],
            'shahr e naw'   => ['شهر نو', 'Shahr-e-Naw', 'Shahr-e Naw'],
            'کارته چهار'    => ['کارته چهار', 'کارته 4', 'Karta-e-Char', 'Karte 4'],
            'کارته 4'       => ['کارته چهار', 'کارته 4', 'Karta-e-Char', 'Karte 4'],
            'karte 4'       => ['کارته چهار', 'کارته 4', 'Karta-e-Char', 'Karte 4'],
            'کارته سه'      => ['کارته سه', 'کارته 3', 'Karta-e-Seh', 'Karte 3'],
            'کارته 3'       => ['کارته سه', 'کارته 3', 'Karta-e-Seh', 'Karte 3'],
            'karte 3'       => ['کارته سه', 'کارته 3', 'Karta-e-Seh', 'Karte 3'],
            'مکروریان'      => ['مکروریان', 'Macrorayan'],
            'macrorayan'    => ['مکروریان', 'Macrorayan'],
            'دارالامان'     => ['دارالامان', 'Darulaman'],
            'darulaman'     => ['دارالامان', 'Darulaman'],
            'خیرخانه'       => ['خیرخانه', 'Khair Khana'],
            'khair khana'   => ['خیرخانه', 'Khair Khana'],
            'تیمنی'         => ['تیمنی', 'Taimani'],
            'taimani'       => ['تیمنی', 'Taimani'],
            'شیرپور'        => ['شیرپور', 'Sherpur'],
            'sherpur'       => ['شیرپور', 'Sherpur'],
            'کابل'          => ['کابل', 'Kabul'],
            'kabul'         => ['کابل', 'Kabul'],
        ];

        foreach ($locations as $needle => $aliases) {
            if (mb_strpos($norm, $needle, 0, 'UTF-8') !== false) {
                $filters['location'] = $aliases[0];
                $filters['location_aliases'] = $aliases;
                break;
            }
        }

        // Serial number detection (e.g., ATP-001 or #12)
        if (preg_match('/\b(atp-[0-9a-z]+)\b/i', $norm, $m)) {
            $filters['serial_number'] = strtoupper($m[1]);
        }

        return $filters;
    }

    /**
     * Classifies user intent to enforce server-side database grounding for factual listing questions.
     *
     * Returns:
     * - 'greeting': Ordinary greeting/thanks (no DB lookup needed)
     * - 'handoff': Customer explicitly wants a human agent
     * - 'followup_property': Asking about price/rent/availability of the currently discussed property
     * - 'project_lookup': Asking about development projects
     * - 'property_search': Factual question about available properties/listings
     * - 'general': General question or clarification
     */
    public static function classifyIntent(string $message, ?int $contextPropertyId = null): string
    {
        $norm = self::normalizeText($message);

        // Explicit human handoff request
        if (preg_match('/(مشاور انسانی|ادمین|انسان|نماینده|کمک مستقیم|تماس با مشاور|human agent|real person|talk to agent|talk to admin|speak to a human)/u', $norm)) {
            return 'handoff';
        }

        // Pure greeting / polite conversational opener without property terms
        if (preg_match('/^(سلام|سلام علیکم|درود|صبح بخیر|عصر بخیر|روز بخیر|تشکر|ممنون|خدا حافظ|hi|hello|hey|thanks|thank you|salam|salaam)[!؟?.\s]*$/u', $norm)) {
            return 'greeting';
        }

        // Follow-up about a specific property already in context (e.g. "کرایه‌اش چند است؟", "این اپارتمان هنوز موجود است؟")
        $isFollowupPhrase = (bool) preg_match(
            '/(کرایه اش|کرایه‌اش|قیمتش|قیمت اش|این اپارتمان|این خانه|این ویلا|این ملک|همین اپارتمان|هنوز موجود است|موجود است|موجوده|چند اتاق دارد|در کدام منزل|مساحتش|how much is it|is it still available|is this available)/u',
            $norm
        );
        if ($isFollowupPhrase && $contextPropertyId !== null && $contextPropertyId > 0) {
            return 'followup_property';
        }

        // Project lookup
        if (preg_match('/(پروژه|پروژه‌ها|شهرک|project|projects|development)/u', $norm)) {
            return 'project_lookup';
        }

        // Factual property search or availability question
        if (preg_match(
            '/(اپارتمان|حویلی|ویلا|خانه|نمره زمین|زمین|تجارتی|دوکان|دکان|کرایه|فروشی|فروش|گروی|اتاق|اطاق|منزل|تشناب|قیمت|چند است|موجود|دارین|دارید|کابل|وزیر اکبر|شهر نو|کارته|مکروریان|دارالامان|تیمنی|شیرپور|خیرخانه|apartment|villa|house|land|rent|sale|price|available|bedroom|property|properties)/u',
            $norm
        )) {
            return 'property_search';
        }

        return 'general';
    }
}
