// lib/autotracer-runtime.ts

/**
 * AutoTracer Runtime - Automatic Execution Tracing for Grafo
 * 
 * Manages:
 * 1. AsyncLocalStorage for context propagation (Server/Node.js)
 * 2. Context initialization with traceId from HTTP headers or new UUID
 * 3. spanId generation and parentId tracking via parentStack
 * 4. Structured JSON logging with 7-field schema
 */

const isServer = typeof window === 'undefined';

interface TraceContext {
  traceId: string;
  parentStack: string[]; // Stack of spanIds
}

let asyncLocalStorage: any = null;
let isInitialized = false;

// Inicializar AsyncLocalStorage de forma síncrona (não quebra bundler)
if (isServer) {
  try {
    const { AsyncLocalStorage } = require('node:async_hooks') as typeof import('node:async_hooks');
    asyncLocalStorage = new AsyncLocalStorage<TraceContext>();
    isInitialized = true;
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[AutoTracer] AsyncLocalStorage not available:', err);
    }
  }
}

// Gerar UUID simples (sem dependências externas)
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// Extrair traceId de header/cookie ou gerar novo
export function initializeTraceContext(headerTraceId?: string): void {
  if (!isServer || !asyncLocalStorage) return;

  const traceId = headerTraceId || generateId();
  const context: TraceContext = {
    traceId,
    parentStack: []
  };

  asyncLocalStorage.enterWith(context);
}

// Extrair traceId do cookie (fallback se header não vier)
function getTraceIdFromCookies(): string | null {
  if (!isServer) return null;
  try {
    // No servidor, cookies vem via headers.cookie
    // Mas isso só funciona em request context, não aqui
    return null;
  } catch {
    return null;
  }
}

// Interface do log que será escrito
interface LogEntry {
  traceId: string;
  spanId: string;
  parentId: string | null;
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

  // Servidor: USAR CONTEXTO EXISTENTE OU CRIAR NOVO
  const getContext = () => {
    if (!asyncLocalStorage) return null;
    try {
      return asyncLocalStorage.getStore();
    } catch {
      return null;
    }
  };

  let context = getContext();
  
  // Se não há contexto E é entrada de função, criar um novo
  if (!context && data.isEntry) {
    context = {
      traceId: generateId(),
      parentStack: []
    };
    // Tentar inicializar o contexto
    if (asyncLocalStorage) {
      try {
        asyncLocalStorage.enterWith(context);
      } catch (err) {
        // Falha silenciosa - contexto não será propagado mas logs ainda serão gerados
      }
    }
  }

  // Se ainda não há contexto, criar um temporário para este log
  if (!context) {
    context = {
      traceId: generateId(),
      parentStack: []
    };
  }

  const traceId = context.traceId;
  const spanId = generateId();
  const parentStack = context.parentStack || [];
  const parentId = parentStack.length > 0 ? parentStack[parentStack.length - 1] : null;

  // Se é entrada de função (isEntry: true), adiciona à stack
  if (data.isEntry && context.parentStack) {
    context.parentStack.push(spanId);
    
    // Após a função terminar, remover da stack (simular exit)
    // Isso não funciona perfeitamente mas ajuda
  }

  // Montar log final com schema limpo
  const logEntry: LogEntry = {
    traceId,
    spanId,
    parentId,
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