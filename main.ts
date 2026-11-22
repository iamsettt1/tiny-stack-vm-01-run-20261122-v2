// Tiny stack VM for make.fun's tiny-stack-vm-01-run-20261122 bounty.
// Implements the ISA in generator/subject/ISA.md: 32-bit wrapping ints,
// 256-value data stack, 64-deep call stack, 256 words of memory,
// 1,000,000 step limit, 65,536 byte output limit, traps 2-11.
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const I = process.env.MAKEFUN_INPUT_DIR ?? '/input';
const O = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
function run(prog: Buffer, input: Buffer): { out: Buffer; code: number } {
  const st = new Int32Array(256), cs = new Int32Array(64), mem = new Int32Array(256);
  const out = Buffer.alloc(65536), n = prog.length;
  let sp = 0, csp = 0, pc = 0, steps = 0, olen = 0, ipos = 0;
  const done = (code: number) => ({ out: out.subarray(0, olen), code });
  while (true) {
    if (steps >= 1000000) return done(10); // step limit
    if (pc < 0 || pc >= n) return done(9); // pc outside program
    const op = prog[pc];
    let a: number, b: number, v: number, s: string;
    switch (op) {
      case 0: return done(0); // HALT
      case 1: // PUSH8, sign-extended
        if (pc + 2 > n) return done(9);
        if (sp >= 256) return done(3);
        b = prog[pc + 1]; st[sp++] = b < 128 ? b : b - 256; pc += 2; break;
      case 2: // PUSH32
        if (pc + 5 > n) return done(9);
        if (sp >= 256) return done(3);
        st[sp++] = prog.readInt32LE(pc + 1); pc += 5; break;
      case 3: // POP
        if (sp < 1) return done(2);
        sp--; pc++; break;
      case 4: // DUP
        if (sp < 1) return done(2);
        if (sp >= 256) return done(3);
        st[sp] = st[sp - 1]; sp++; pc++; break;
      case 5: // SWAP
        if (sp < 2) return done(2);
        v = st[sp - 1]; st[sp - 1] = st[sp - 2]; st[sp - 2] = v; pc++; break;
      case 6: // OVER
        if (sp < 2) return done(2);
        if (sp >= 256) return done(3);
        st[sp] = st[sp - 2]; sp++; pc++; break;
      case 7: // ROT (a b c -- b c a)
        if (sp < 3) return done(2);
        v = st[sp - 3]; st[sp - 3] = st[sp - 2]; st[sp - 2] = st[sp - 1]; st[sp - 1] = v; pc++; break;
      case 16: // ADD
        if (sp < 2) return done(2);
        st[sp - 2] = (st[sp - 2] + st[sp - 1]) | 0; sp--; pc++; break;
      case 17: // SUB
        if (sp < 2) return done(2);
        st[sp - 2] = (st[sp - 2] - st[sp - 1]) | 0; sp--; pc++; break;
      case 18: // MUL (low 32 bits)
        if (sp < 2) return done(2);
        st[sp - 2] = Math.imul(st[sp - 2], st[sp - 1]); sp--; pc++; break;
      case 19: // DIV, signed trunc-toward-zero
        if (sp < 2) return done(2);
        a = st[sp - 2]; b = st[sp - 1];
        if (b === 0) return done(4);
        st[sp - 2] = (a / b) | 0; sp--; pc++; break;
      case 20: // MOD, sign of a
        if (sp < 2) return done(2);
        a = st[sp - 2]; b = st[sp - 1];
        if (b === 0) return done(4);
        st[sp - 2] = a % b; sp--; pc++; break;
      case 21: // DIVU
        if (sp < 2) return done(2);
        a = st[sp - 2]; b = st[sp - 1];
        if (b === 0) return done(4);
        st[sp - 2] = ((a >>> 0) / (b >>> 0)) | 0; sp--; pc++; break;
      case 22: // MODU
        if (sp < 2) return done(2);
        a = st[sp - 2]; b = st[sp - 1];
        if (b === 0) return done(4);
        st[sp - 2] = ((a >>> 0) % (b >>> 0)) | 0; sp--; pc++; break;
      case 23: // NEG
        if (sp < 1) return done(2);
        st[sp - 1] = (-st[sp - 1]) | 0; pc++; break;
      case 24: // AND
        if (sp < 2) return done(2);
        st[sp - 2] &= st[sp - 1]; sp--; pc++; break;
      case 25: // OR
        if (sp < 2) return done(2);
        st[sp - 2] |= st[sp - 1]; sp--; pc++; break;
      case 26: // XOR
        if (sp < 2) return done(2);
        st[sp - 2] ^= st[sp - 1]; sp--; pc++; break;
      case 27: // NOT
        if (sp < 1) return done(2);
        st[sp - 1] = ~st[sp - 1]; pc++; break;
      case 28: // SHL
        if (sp < 2) return done(2);
        st[sp - 2] <<= (st[sp - 1] & 31); sp--; pc++; break;
      case 29: // SHR, arithmetic
        if (sp < 2) return done(2);
        st[sp - 2] >>= (st[sp - 1] & 31); sp--; pc++; break;
      case 30: // SHRU, logical
        if (sp < 2) return done(2);
        st[sp - 2] = (st[sp - 2] >>> (st[sp - 1] & 31)) | 0; sp--; pc++; break;
      case 32: // EQ
        if (sp < 2) return done(2);
        st[sp - 2] = st[sp - 2] === st[sp - 1] ? 1 : 0; sp--; pc++; break;
      case 33: // LT, signed
        if (sp < 2) return done(2);
        st[sp - 2] = st[sp - 2] < st[sp - 1] ? 1 : 0; sp--; pc++; break;
      case 34: // LTU, unsigned
        if (sp < 2) return done(2);
        st[sp - 2] = (st[sp - 2] >>> 0) < (st[sp - 1] >>> 0) ? 1 : 0; sp--; pc++; break;
      case 48: // JMP, 2-byte signed offset from next instruction
        if (pc + 3 > n) return done(9);
        pc = pc + 3 + prog.readInt16LE(pc + 1); break;
      case 49: // JZ
        if (pc + 3 > n) return done(9);
        if (sp < 1) return done(2);
        v = st[--sp];
        pc = v === 0 ? pc + 3 + prog.readInt16LE(pc + 1) : pc + 3; break;
      case 50: // JNZ
        if (pc + 3 > n) return done(9);
        if (sp < 1) return done(2);
        v = st[--sp];
        pc = v !== 0 ? pc + 3 + prog.readInt16LE(pc + 1) : pc + 3; break;
      case 51: // CALL, 2-byte unsigned target
        if (pc + 3 > n) return done(9);
        if (csp >= 64) return done(7);
        cs[csp++] = pc + 3; pc = prog.readUInt16LE(pc + 1); break;
      case 52: // RET
        if (csp < 1) return done(8);
        pc = cs[--csp]; break;
      case 64: // LOAD
        if (sp < 1) return done(2);
        a = st[sp - 1];
        if (a < 0 || a > 255) return done(6);
        st[sp - 1] = mem[a]; pc++; break;
      case 65: // STORE (v addr --)
        if (sp < 2) return done(2);
        a = st[sp - 1]; v = st[sp - 2];
        if (a < 0 || a > 255) return done(6);
        mem[a] = v; sp -= 2; pc++; break;
      case 80: // PRINT, decimal ASCII, no newline
        if (sp < 1) return done(2);
        s = String(st[--sp]);
        if (olen + s.length > 65536) return done(11);
        olen += out.write(s, olen, 'ascii'); pc++; break;
      case 81: // PUTC
        if (sp < 1) return done(2);
        if (olen + 1 > 65536) return done(11);
        out[olen++] = st[--sp] & 255; pc++; break;
      case 82: // IN (-1 once input is used up)
        if (sp >= 256) return done(3);
        st[sp++] = ipos < input.length ? input[ipos++] : -1; pc++; break;
      case 83: // EXIT (code v & 255)
        if (sp < 1) return done(2);
        return done(st[--sp] & 255);
      default: return done(5); // unknown opcode
    }
    steps++;
  }
}
for (const id of readdirSync(I).sort()) {
  const prog = readFileSync(join(I, id, 'program.bin'));
  let input: Buffer;
  try { input = readFileSync(join(I, id, 'input.bin')); } catch { input = Buffer.alloc(0); }
  const r = run(prog, input);
  mkdirSync(join(O, id), { recursive: true });
  writeFileSync(join(O, id, 'stdout.bin'), r.out);
  writeFileSync(join(O, id, 'exit.txt'), String(r.code) + '\n');
}
