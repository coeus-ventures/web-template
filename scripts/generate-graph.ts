import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_FILE = path.join(__dirname, '..', 'logs', 'test-complex-debug.log');

interface LogEntry {
  timestamp: string;
  file: string;
  line: number;
  function: string;
  caller: string;
  behavior: string | null;
  layer: string;
  params: unknown;
  code: string;
}

interface CallNode {
  fn: string;
  behavior: string;
  layer: string;
  file: string;
  timestamp: string;
  params: unknown;
  code: string;
  children: CallNode[];
}

function buildGraph(logs: LogEntry[]): Record<string, CallNode[]> {
  const nodeMap = new Map<number, CallNode>();
  const roots: CallNode[] = [];

  for (let i = 0; i < logs.length; i++) {
    const log = logs[i];
    const node: CallNode = {
      fn: log.function,
      behavior: log.behavior || 'unknown',
      layer: log.layer,
      file: `${log.file.split(/[/\\]/).pop()}:${log.line}`,
      timestamp: log.timestamp,
      params: log.params,
      code: log.code,
      children: []
    };

    const isRoot = log.caller === '<module>' || log.layer === 'hook';
    
    if (isRoot) {
      roots.push(node);
    } else {
      // Backtrack to find most recent parent with matching function name
      for (let j = i - 1; j >= 0; j--) {
        if (logs[j].function === log.caller) {
          const parent = nodeMap.get(j);
          if (parent) {
            parent.children.push(node);
            break;
          }
        }
      }
    }

    nodeMap.set(i, node);
  }

  // Group by behavior
  return roots.reduce((acc, node) => {
    if (!acc[node.behavior]) acc[node.behavior] = [];
    acc[node.behavior].push(node);
    return acc;
  }, {} as Record<string, CallNode[]>);
}

function main() {
  if (!fs.existsSync(LOG_FILE)) {
    console.error('Log file not found');
    process.exit(1);
  }

  const logs: LogEntry[] = fs
    .readFileSync(LOG_FILE, 'utf-8')
    .trim()
    .split('\n')
    .map(line => {
      try { return JSON.parse(line); } catch { return null; }
    })
    .filter(Boolean);

  const graph = buildGraph(logs);
  
  console.log(JSON.stringify({ 
    generated_at: new Date().toISOString(),
    execution_graph: graph 
  }, null, 2));
}

main();