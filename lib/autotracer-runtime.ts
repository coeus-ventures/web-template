// lib/autotracer-runtime.ts

/**
 * AutoTracer Runtime - Simplified
 * Logs function calls with minimal overhead
 */

const isServer = typeof window === 'undefined';

interface LogEntry {
  timestamp: number;
  file: string;
  functionName: string;
  caller?: string;
}

let writePromise: Promise<void> = Promise.resolve();

export function __autotracer_write(data: any) {
  // Cliente: log no console com styling
  if (!isServer) {
    console.debug(
      `%c[AutoTracer] ${data.caller || '?'} → ${data.functionName}`,
      'background: #1a1a2e; color: #16c784; padding: 2px 6px; border-radius: 3px',
      { file: data.file, line: data.line }
    );
    return;
  }

  // Montar log com schema limpo
  const logEntry: LogEntry = {
    timestamp: Date.now(),
    file: data.file,
    functionName: data.functionName
  };

  // Adicionar caller se disponível
  if (data.caller) logEntry.caller = data.caller;

  // Escrever no arquivo
  const logProcess = async () => {
    try {
      const fs = (await import('node:fs')).default;
      const path = (await import('node:path')).default;

      const LOG_FILE_PATH = process.env.AUTOTRACER_LOG_FILE || 'logs/debug.log';
      const rootDir = process.cwd();

      const fullPath = path.isAbsolute(LOG_FILE_PATH)
        ? LOG_FILE_PATH
        : path.join(rootDir, LOG_FILE_PATH);

      const dir = path.dirname(fullPath);
      await fs.promises.mkdir(dir, { recursive: true });

      const logLine = JSON.stringify(logEntry) + '\n';
      await fs.promises.appendFile(fullPath, logLine, 'utf8');
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[AutoTracer Write Error]', err);
      }
    }
  };

  // Queue para preservar ordem
  writePromise = writePromise.then(logProcess).catch((err) => {
    if (process.env.NODE_ENV === 'development') {
      console.error('[AutoTracer Queue Error]', err);
    }
  });
}