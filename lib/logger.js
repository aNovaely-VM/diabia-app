// DIABIA Logger — affichage structuré dans la console VS Code

const LEVELS = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };
const COLORS = {
  DEBUG: '\x1b[36m',   // cyan
  INFO:  '\x1b[32m',   // vert
  WARN:  '\x1b[33m',   // jaune
  ERROR: '\x1b[31m',   // rouge
  RESET: '\x1b[0m',
  DIM:   '\x1b[2m',
  BOLD:  '\x1b[1m',
};

const currentLevel = process.env.NODE_ENV === 'production' ? LEVELS.WARN : LEVELS.DEBUG;

function formatMsg(level, module, message, data) {
  const ts = new Date().toISOString().replace('T', ' ').substring(0, 23);
  const c = COLORS[level];
  const dim = COLORS.DIM;
  const reset = COLORS.RESET;
  const bold = COLORS.BOLD;
  let line = `${dim}[${ts}]${reset} ${c}${bold}[${level.padEnd(5)}]${reset} ${dim}[${module}]${reset} ${message}`;
  if (data !== undefined) {
    const dataStr = typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data);
    line += `\n${dim}  → ${dataStr}${reset}`;
  }
  return line;
}

export function createLogger(module) {
  return {
    debug: (msg, data) => {
      if (LEVELS.DEBUG >= currentLevel) console.log(formatMsg('DEBUG', module, msg, data));
    },
    info: (msg, data) => {
      if (LEVELS.INFO >= currentLevel) console.log(formatMsg('INFO', module, msg, data));
    },
    warn: (msg, data) => {
      if (LEVELS.WARN >= currentLevel) console.warn(formatMsg('WARN', module, msg, data));
    },
    error: (msg, data) => {
      if (LEVELS.ERROR >= currentLevel) console.error(formatMsg('ERROR', module, msg, data));
    },
    group: (label) => {
      console.group(`${COLORS.BOLD}${COLORS.DIM}━━━ ${label} ━━━${COLORS.RESET}`);
    },
    groupEnd: () => console.groupEnd(),
    separator: () => console.log(`${COLORS.DIM}${'─'.repeat(60)}${COLORS.RESET}`),
  };
}
