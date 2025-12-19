/**
 * AutoTracer - Logger Mínimo com Stack Parsing
 */

interface StackFrame {
  func: string;
  file: string;
  line: number;
}

function parseStack(stack: string): StackFrame[] {
  const frames: StackFrame[] = [];
  
  stack.split('\n').forEach((line) => {
    if (line.includes('node_modules')) return;
    if (line.includes('node:internal')) return;
    
    const match = line.match(/at\s+(\S+)\s+\((.+):(\d+):\d+\)/);
    if (!match) return;
    
    frames.push({
      func: match[1],
      file: match[2].split(/[/\\]/).pop() || match[2],
      line: parseInt(match[3], 10)
    });
  });
  
  return frames;
}

export function __trace(name: string, args: Record<string, unknown>, stack: string) {
  const frames = parseStack(stack);
  const caller = frames[1]?.func || null;
  
  const entry = {
    timestamp: Date.now(),
    function: name,
    caller,
    args: sanitizeArgs(args),
    stack: frames
  };
  
  console.log(`[TRACE] ${JSON.stringify(entry)}`);
}

function sanitizeArgs(args: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  
  Object.entries(args).forEach(([key, value]) => {
    try {
      switch (true) {
        case value === undefined:
          result[key] = '<undefined>';
          break;
        case typeof value === 'function':
          result[key] = '<function>';
          break;
        case value instanceof FormData:
          const formObj: Record<string, string> = {};
          value.forEach((v, k) => { formObj[k] = String(v); });
          result[key] = formObj;
          break;
        case typeof value === 'object' && value !== null:
          const str = JSON.stringify(value);
          result[key] = str.length > 500 ? '<large object>' : value;
          break;
        default:
          result[key] = value;
      }
    } catch {
      result[key] = '<unserializable>';
    }
  });
  
  return result;
}
