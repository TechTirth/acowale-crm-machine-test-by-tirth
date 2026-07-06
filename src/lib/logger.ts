// Minimal structured logger. Emits single-line JSON so it's greppable in
// Vercel/CloudWatch and ready for a log drain. A real deployment would swap
// this for pino, but the interface would stay the same.

type Level = "info" | "warn" | "error";

function log(level: Level, message: string, meta: Record<string, unknown> = {}) {
  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...meta,
  };
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => log("info", message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => log("warn", message, meta),
  error: (message: string, meta?: Record<string, unknown>) => log("error", message, meta),
};

// Correlation id for tracing a single request across log lines.
export function requestId(): string {
  return crypto.randomUUID();
}
