export const ENTRANCE_DURATION_MS = 1620;
export const ENTRANCE_TIMEOUT_MS = 5000;
type TimerToken = number | ReturnType<typeof setTimeout>;

export function runLogoEntrance(options: {
    sources: string[];
    reducedMotion: boolean;
    decode: (source: string) => Promise<unknown>;
    onPlaying: () => void;
    onSettled: () => void;
    onComplete: () => void;
    schedule?: (callback: () => void, delay: number) => TimerToken;
    cancelTimer?: (timer: TimerToken) => void;
}) {
    const schedule = options.schedule || setTimeout;
    const cancelTimer = options.cancelTimer || ((timer: TimerToken) => clearTimeout(timer as ReturnType<typeof setTimeout>));
    let active = true;
    const timers: TimerToken[] = [];
    const finish = () => {
        if (!active) return;
        active = false;
        timers.forEach(cancelTimer);
        options.onSettled();
        options.onComplete();
    };
    if (options.reducedMotion) finish();
    else {
        timers.push(schedule(finish, ENTRANCE_TIMEOUT_MS));
        Promise.resolve().then(() => Promise.all(options.sources.map(source => options.decode(source)))).then(() => {
            if (!active) return;
            options.onPlaying();
            timers.push(schedule(finish, ENTRANCE_DURATION_MS));
        }, finish);
    }
    return () => { active = false; timers.forEach(cancelTimer); };
}

export function decodeLogoAsset(source: string): Promise<unknown> {
    const image = new Image();
    if (typeof image.decode === 'function') {
        image.src = source;
        return image.decode();
    }
    return new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
        image.src = source;
    });
}
