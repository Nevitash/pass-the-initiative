const LEVELS = ["trace", "debug", "info", "warn", "error"] as const;
type LogLevel = (typeof LEVELS)[number];

const levelRank: Record<LogLevel, number> = {
    trace: 0,
    debug: 1,
    info: 2,
    warn: 3,
    error: 4
};

let minimumLevel: LogLevel = "trace";

function write(level: LogLevel, message: string, details?: unknown): void {
    if (levelRank[level] < levelRank[minimumLevel]) return;

    const output = details === undefined
        ? [`Pass the Initiative | ${message}`]
        : [`Pass the Initiative | ${message}`, details];

    if (level === "trace") console.trace(...output);
    else if (level === "debug") console.debug(...output);
    else if (level === "info") console.info(...output);
    else if (level === "warn") console.warn(...output);
    else console.error(...output);
}

export const logger = {
    setLevel(level: LogLevel): void {
        minimumLevel = level;
        write("info", `Minimum log level set to ${level}.`);
    },
    getLevel(): LogLevel {
        return minimumLevel;
    },
    trace(message: string, details?: unknown): void {
        write("trace", message, details);
    },
    debug(message: string, details?: unknown): void {
        write("debug", message, details);
    },
    info(message: string, details?: unknown): void {
        write("info", message, details);
    },
    warn(message: string, details?: unknown): void {
        write("warn", message, details);
    },
    error(message: string, details?: unknown): void {
        write("error", message, details);
    }
};