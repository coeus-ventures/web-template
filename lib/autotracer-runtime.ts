// lib/autotracer-runtime.ts

/**
 * AutoTracer Runtime - Universal (Client & Server)
 * Handles logging safely in both environments without breaking the build.
 */

export interface AutoTracerEntry {
  timestamp: string;
  file: string;
  line: number;
  function: string;
  caller: string;
  behavior: string | null;
  layer: string;
  params: Record<string, unknown>;
  code: string;
}

const isServer = typeof window === 'undefined';

let writePromise: Promise<void> = Promise.resolve();

export function __autotracer_write(entry: AutoTracerEntry) {
  if (!isServer) {
    const { function: fn, behavior, layer, params } = entry;
    const style = "background: #222; color: #bada55; padding: 2px 4px; border-radius: 2px";
    console.debug(`%c[Trace] ${behavior || 'global'}:${layer} -> ${fn}`, style, params);
    return;
  }

  const logProcess = async () => {
    try {
      // Importação dinâmica: O bundler entende que isso só é necessário se essa linha for atingida
      const fs = (await import('node:fs')).default;
      const path = (await import('node:path')).default;

      const LOG_FILE_PATH = process.env.AUTOTRACER_LOG_FILE || 'logs/debug.log';
      const rootDir = process.cwd();
      
      const fullPath = path.isAbsolute(LOG_FILE_PATH) 
        ? LOG_FILE_PATH 
        : path.join(rootDir, LOG_FILE_PATH);

      const dir = path.dirname(fullPath);
      
      await fs.promises.mkdir(dir, { recursive: true });

      const logLine = JSON.stringify(entry) + '\n';

      await fs.promises.appendFile(fullPath, logLine, 'utf8');
      
    } catch (err) {
      // Falha silenciosa no servidor para não travar a request
      if (process.env.NODE_ENV === 'development') {
        console.error('[AutoTracer Error]', err);
      }
    }
  };

  // Encadeamento de Promises para garantir a ordem dos logs (Queue simples)
  // "Fire and forget": não esperamos o log terminar para continuar a execução do código original
  writePromise = writePromise.then(logProcess).catch((err) => {
    if (process.env.NODE_ENV === 'development') {
      console.error('[AutoTracer Queue Error]', err);
    }
  });
}