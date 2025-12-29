// Node.js 모듈 스텁 - 브라우저 환경에서 사용
const noop = () => {}
const emptyObj = {}

// 기본 Node.js 모듈들을 빈 객체나 noop 함수로 대체
const nodeStub = {
  // assert 모듈
  assert: {
    ok: noop,
    equal: noop,
    notEqual: noop,
    deepEqual: noop,
    notDeepEqual: noop,
    strictEqual: noop,
    notStrictEqual: noop,
    throws: noop,
    doesNotThrow: noop,
    ifError: noop,
    fail: noop
  },

  // path 모듈
  path: {
    join: (...args) => args.join('/'),
    resolve: (...args) => args.join('/'),
    dirname: noop,
    basename: noop,
    extname: noop,
    parse: noop,
    format: noop,
    normalize: noop,
    isAbsolute: noop,
    relative: noop,
    sep: '/',
    delimiter: ':',
    // path 서브모듈들
    posix: {
      join: (...args) => args.join('/'),
      resolve: (...args) => args.join('/'),
      dirname: noop,
      basename: noop,
      extname: noop,
      parse: noop,
      format: noop,
      normalize: noop,
      isAbsolute: noop,
      relative: noop,
      sep: '/',
      delimiter: ':'
    },
    win32: {
      join: (...args) => args.join('\\'),
      resolve: (...args) => args.join('\\'),
      dirname: noop,
      basename: noop,
      extname: noop,
      parse: noop,
      format: noop,
      normalize: noop,
      isAbsolute: noop,
      relative: noop,
      sep: '\\',
      delimiter: ';'
    }
  },

  // fs 모듈
  fs: {
    readFile: noop,
    writeFile: noop,
    readFileSync: noop,
    writeFileSync: noop,
    existsSync: () => false,
    mkdirSync: noop,
    statSync: noop,
    readdirSync: () => [],
    unlinkSync: noop,
    rmdirSync: noop,
    copyFileSync: noop,
    renameSync: noop,
    accessSync: noop,
    constants: {},
    // fs 서브모듈들
    promises: {
      readFile: noop,
      writeFile: noop,
      exists: () => false,
      mkdir: noop,
      stat: noop,
      readdir: () => [],
      unlink: noop,
      rmdir: noop,
      copyFile: noop,
      rename: noop,
      access: noop
    }
  },

  // util 모듈
  util: {
    format: (...args) => args.join(' '),
    inspect: (obj) => JSON.stringify(obj),
    inherits: noop,
    deprecate: (fn) => fn,
    promisify: (fn) => fn,
    callbackify: (fn) => fn,
    types: {},
    TextEncoder: global.TextEncoder,
    TextDecoder: global.TextDecoder
  },

  // os 모듈
  os: {
    platform: () => 'browser',
    arch: () => 'x64',
    type: () => 'Browser',
    release: () => '',
    uptime: () => 0,
    totalmem: () => 0,
    freemem: () => 0,
    cpus: () => [],
    networkInterfaces: () => ({}),
    homedir: () => '/',
    tmpdir: () => '/tmp',
    hostname: () => 'browser',
    loadavg: () => [0, 0, 0],
    userInfo: () => ({ username: 'browser', uid: 0, gid: 0, shell: '', homedir: '/' }),
    constants: {},
    EOL: '\n'
  },

  // crypto 모듈
  crypto: {
    randomBytes: (size) => new Uint8Array(size),
    createHash: () => ({ update: noop, digest: () => '' }),
    createHmac: () => ({ update: noop, digest: () => '' }),
    createCipher: noop,
    createDecipher: noop,
    createSign: () => ({ update: noop, sign: () => '' }),
    createVerify: () => ({ update: noop, verify: () => false }),
    createDiffieHellman: noop,
    createDiffieHellmanGroup: noop,
    pbkdf2: noop,
    randomFill: noop,
    scrypt: noop,
    timingSafeEqual: () => false,
    getCiphers: () => [],
    getHashes: () => [],
    getCurves: () => [],
    publicEncrypt: noop,
    privateDecrypt: noop,
    privateEncrypt: noop,
    publicDecrypt: noop,
    getDiffieHellman: noop,
    createECDH: noop,
    sign: noop,
    verify: noop,
    constants: {}
  },

  // stream 모듈
  stream: {
    Readable: class Readable {},
    Writable: class Writable {},
    Duplex: class Duplex {},
    Transform: class Transform {},
    PassThrough: class PassThrough {},
    finished: noop,
    pipeline: noop
  },

  // events 모듈
  events: {
    EventEmitter: class EventEmitter {
      constructor() {
        this._events = {}
      }
      on(event, listener) {
        if (!this._events[event]) this._events[event] = []
        this._events[event].push(listener)
        return this
      }
      emit(event, ...args) {
        if (this._events[event]) {
          this._events[event].forEach((listener) => listener(...args))
        }
        return this
      }
      removeListener(event, listener) {
        if (this._events[event]) {
          this._events[event] = this._events[event].filter((l) => l !== listener)
        }
        return this
      }
      removeAllListeners(event) {
        if (event) {
          delete this._events[event]
        } else {
          this._events = {}
        }
        return this
      }
    },
    once: noop,
    on: noop,
    off: noop,
    addListener: noop,
    removeListener: noop,
    removeAllListeners: noop,
    setMaxListeners: noop,
    getMaxListeners: noop,
    listeners: noop,
    rawListeners: noop,
    emit: noop,
    listenerCount: noop,
    prependListener: noop,
    prependOnceListener: noop,
    eventNames: noop
  },

  // buffer 모듈
  buffer: {
    Buffer: class Buffer extends Uint8Array {
      constructor(input, encoding) {
        if (typeof input === 'string') {
          super(new TextEncoder().encode(input))
        } else if (input instanceof ArrayBuffer || ArrayBuffer.isView(input)) {
          super(input)
        } else {
          super(input || 0)
        }
      }
      toString(encoding = 'utf8') {
        return new TextDecoder().decode(this)
      }
      static from(input, encoding) {
        return new Buffer(input, encoding)
      }
      static alloc(size, fill, encoding) {
        return new Buffer(size)
      }
      static allocUnsafe(size) {
        return new Buffer(size)
      }
      static allocUnsafeSlow(size) {
        return new Buffer(size)
      }
      static isBuffer(obj) {
        return obj instanceof Buffer
      }
      static byteLength(string, encoding) {
        return new TextEncoder().encode(string).length
      }
      static concat(list, totalLength) {
        return new Buffer(0)
      }
      static compare(buf1, buf2) {
        return 0
      }
    },
    SlowBuffer: class SlowBuffer extends Uint8Array {},
    INSPECT_MAX_BYTES: 50,
    kMaxLength: 2147483647,
    kStringMaxLength: 536870888,
    constants: {
      MAX_LENGTH: 2147483647,
      MAX_STRING_LENGTH: 536870888
    }
  },

  // url 모듈
  url: {
    parse: noop,
    format: noop,
    resolve: noop,
    resolveObject: noop,
    URL: class URL {
      constructor(input, base) {
        this.href = input
        this.protocol = ''
        this.slashes = false
        this.auth = ''
        this.username = ''
        this.password = ''
        this.host = ''
        this.hostname = ''
        this.port = ''
        this.pathname = ''
        this.search = ''
        this.searchParams = new URLSearchParams()
        this.hash = ''
      }
    },
    URLSearchParams: class URLSearchParams {
      constructor(init) {
        this._params = new Map()
      }
      append(name, value) {
        this._params.set(name, value)
      }
      delete(name) {
        this._params.delete(name)
      }
      get(name) {
        return this._params.get(name) || null
      }
      getAll(name) {
        return Array.from(this._params.entries())
          .filter(([key]) => key === name)
          .map(([, value]) => value)
      }
      has(name) {
        return this._params.has(name)
      }
      set(name, value) {
        this._params.set(name, value)
      }
      toString() {
        return Array.from(this._params.entries())
          .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
          .join('&')
      }
    }
  },

  // process 모듈
  process: {
    env: {
      NODE_ENV: 'production',
      FORCE_COLOR: '0'
    },
    platform: 'browser',
    version: '',
    versions: {},
    arch: 'x64',
    argv: [],
    execArgv: [],
    execPath: '',
    pid: 0,
    title: 'browser',
    browser: true,
    stdout: null,
    stderr: null,
    stdin: null,
    nextTick: (fn) => Promise.resolve().then(fn),
    hrtime: () => [0, 0],
    hrtimeBigInt: () => BigInt(0),
    cpuUsage: () => ({ user: 0, system: 0 }),
    memoryUsage: () => ({
      rss: 0,
      heapTotal: 0,
      heapUsed: 0,
      external: 0,
      arrayBuffers: 0
    }),
    cwd: () => '/',
    chdir: () => {},
    umask: () => 0,
    getuid: () => 0,
    geteuid: () => 0,
    getgid: () => 0,
    getegid: () => 0,
    getgroups: () => [],
    setuid: () => {},
    seteuid: () => {},
    setgid: () => {},
    setegid: () => {},
    setgroups: () => {},
    initgroups: () => {},
    kill: () => {},
    exit: () => {},
    abort: () => {},
    allowedNodeEnvironmentFlags: new Set(),
    report: {
      writeReport: () => {},
      getReport: () => ({
        header: {},
        javascriptStack: {},
        nativeStack: {},
        resourceUsage: {},
        libuv: {},
        environmentVariables: {},
        userLimits: {}
      })
    },
    binding: () => {},
    dlopen: () => {},
    uptime: () => 0,
    features: {},
    config: {},
    mainModule: null,
    addListener: () => {},
    on: () => {},
    once: () => {},
    removeListener: () => {},
    off: () => {},
    removeAllListeners: () => {},
    setMaxListeners: () => {},
    getMaxListeners: () => 0,
    listeners: () => [],
    rawListeners: () => [],
    emit: () => false,
    listenerCount: () => 0,
    prependListener: () => {},
    prependOnceListener: () => {},
    eventNames: () => []
  },

  // 기타 모듈들은 빈 객체로 대체
  querystring: emptyObj,
  http: emptyObj,
  https: emptyObj,
  zlib: emptyObj,
  tty: emptyObj,
  child_process: emptyObj,
  cluster: emptyObj,
  dgram: emptyObj,
  dns: emptyObj,
  domain: emptyObj,
  module: emptyObj,
  net: emptyObj,
  punycode: emptyObj,
  readline: emptyObj,
  repl: emptyObj,
  string_decoder: emptyObj,
  sys: emptyObj,
  timers: emptyObj,
  tls: emptyObj,
  v8: emptyObj,
  vm: emptyObj,
  worker_threads: emptyObj
}

// 요청된 모듈에 따라 적절한 스텁 반환
export default function getNodeStub(moduleName) {
  return nodeStub[moduleName] || emptyObj
}

// 모든 Node.js 모듈들을 export
export const assert = nodeStub.assert
export const path = nodeStub.path
export const fs = nodeStub.fs
export const util = nodeStub.util
export const os = nodeStub.os
export const crypto = nodeStub.crypto
export const stream = nodeStub.stream
export const events = nodeStub.events
export const buffer = nodeStub.buffer
export const url = nodeStub.url
export const process = nodeStub.process
export const querystring = nodeStub.querystring
export const http = nodeStub.http
export const https = nodeStub.https
export const zlib = nodeStub.zlib
export const tty = nodeStub.tty
export const child_process = nodeStub.child_process
export const cluster = nodeStub.cluster
export const dgram = nodeStub.dgram
export const dns = nodeStub.dns
export const domain = nodeStub.domain
export const module = nodeStub.module
export const net = nodeStub.net
export const punycode = nodeStub.punycode
export const readline = nodeStub.readline
export const repl = nodeStub.repl
export const string_decoder = nodeStub.string_decoder
export const sys = nodeStub.sys
export const timers = nodeStub.timers
export const tls = nodeStub.tls
export const v8 = nodeStub.v8
export const vm = nodeStub.vm
export const worker_threads = nodeStub.worker_threads
