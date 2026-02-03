import pino, { Logger as PinoLogger, Level } from 'pino';
import { config } from '../config';

const pinoInstance = pino({
  name: config.SERVICE_NAME as string,
  level: (config.LOG_LEVEL as string) || 'info',
  formatters: {
    bindings: (bindings) => ({ name: bindings.name }),
    level: (label) => ({ level: label }),
  },
  transport:
    true
      ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
          errorProps: '*',
          errorLikeObjectKeys: ['err', 'error'],
        },
      }
      : undefined,
});

type LogFn = {
  (msg: string, ...args: unknown[]): void;
  (obj: object, msg?: string, ...args: unknown[]): void;
};

const createLogMethod = (level: Level): LogFn => {
  return (...args: unknown[]) => {
    const [first, ...rest] = args;
    const log = pinoInstance[level].bind(pinoInstance) as (...a: unknown[]) => void;

    if (typeof first === 'object' && first !== null && !(first instanceof Error)) {
      log(first, ...rest);
      return;
    }

    if (rest.length > 0) {
      const last = rest[rest.length - 1];
      if (last instanceof Error) {
        log({ err: last }, first, ...rest.slice(0, -1));
        return;
      }
    }

    if (first instanceof Error) {
      log({ err: first }, first.message);
      return;
    }

    log(first, ...rest);
  };
};

interface Logger {
  trace: LogFn;
  debug: LogFn;
  info: LogFn;
  warn: LogFn;
  error: LogFn;
  fatal: LogFn;
  level: Level;
  child: PinoLogger['child'];
}

export const logger: Logger = {
  trace: createLogMethod('trace'),
  debug: createLogMethod('debug'),
  info: createLogMethod('info'),
  warn: createLogMethod('warn'),
  error: createLogMethod('error'),
  fatal: createLogMethod('fatal'),
  get level() {
    return pinoInstance.level as Level;
  },
  set level(lvl: Level) {
    pinoInstance.level = lvl;
  },
  child: pinoInstance.child.bind(pinoInstance),
};
