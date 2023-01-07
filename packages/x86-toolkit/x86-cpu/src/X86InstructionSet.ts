import * as R from 'ramda';

import { X86_REGISTERS } from './constants/x86';

import { X86Unit } from './X86Unit';
import { X86CPU, X86RegRMCallback, X86MemRMCallback } from './X86CPU';
import { X86ALUOperator } from './X86ALU';
import { VGARenderLoopDriver } from './devices/Video/HTML/VGARenderLoopDriver';
import {
  X86BitsMode,
  X86Flags,
  RMByte,
  X86AbstractCPU,
  X86Interrupt,
  X86InterruptType,
} from './types';

type X86FlagCondition = (flags: X86Flags) => boolean | number;

type SwitchOpcodeOperator = (
  num: number,
  mode: X86BitsMode,
  byte: RMByte,
  register: boolean,
) => any;
type SwitchOpcodeOperators = { [offset: number]: SwitchOpcodeOperator } & {
  default?: SwitchOpcodeOperator;
  nonRMMatch?(byte: number): number;
};

/**
 * Basic CPU instruction set without ALU/IO instructions
 */
export class X86InstructionSet extends X86Unit {
  /* eslint-disable class-methods-use-this */
  /**
   * Initialize CPU IO ports handlers opcodes
   */
  protected init(cpu: X86CPU): void {
    X86InstructionSet.initBaseOpcodes(cpu);
    X86InstructionSet.initBranchOpcodes(cpu);
  }
  /* eslint-enable class-methods-use-this */

  /**
   * Switches instruction by RM reg byte
   *
   * @see
   *   If provided mode is null it will:
   *   - provide address in memCallback
   *   - provide register as null in regCallback
   */
  static switchRMOpcodeInstruction(
    cpu: X86CPU,
    defaultMode: X86BitsMode,
    operators: SwitchOpcodeOperators,
  ) {
    const { memIO, registers } = cpu;

    const operatorExecutor: SwitchOpcodeOperator = (
      val,
      mode,
      byte,
      register,
    ) => {
      const operator = operators[byte.reg] || operators.default;
      if (operator) {
        return operator(val, mode, byte, register);
      }

      throw new Error(`Unsupported operator! ${byte.reg}`);
    };

    const regCallback: X86RegRMCallback = (reg: string, _, byte, mode) => {
      const result = operatorExecutor(
        reg === null ? null : registers[reg],
        mode,
        byte,
        true,
      );

      if (result !== undefined) {
        registers[reg] = result;
      }
    };

    const memCallback: X86MemRMCallback = (address, _, byte, mode) => {
      // read only address
      if (mode === null) {
        operatorExecutor(address, null, byte, false);
        return;
      }

      const result = operatorExecutor(
        memIO.read[mode](address),
        mode,
        byte,
        false,
      );

      if (result !== undefined) {
        memIO.write[mode](result, address);
      }
    };

    const { nonRMMatch } = operators;
    return (mode?: X86BitsMode) => {
      if (nonRMMatch) {
        const byte = cpu.fetchOpcode(0x1, false, true);
        const matchBytes = nonRMMatch(byte);

        if (matchBytes !== 0) {
          cpu.incrementIP(matchBytes);
          return true;
        }
      }

      return cpu.parseRmByte(regCallback, memCallback, mode || defaultMode);
    };
  }

  /**
   * Adds non-branch base cpu instructions
   */
  static initBaseOpcodes(cpu: X86CPU): void {
    const { alu, stack, memIO, registers, opcodes } = cpu;

    Object.assign(opcodes, {
      /** MOV r/m8, reg8 */ 0x88: (bits: X86BitsMode = 0x1) => {
        cpu.parseRmByte(
          (reg: string, modeReg) => {
            registers[reg] = registers[X86_REGISTERS[bits][modeReg]];
          },
          (address, src: string) => {
            memIO.write[bits](registers[src], address);
          },
          bits,
        );
      },
      /** MOV r/m16, sreg */ 0x8c: () => {
        cpu.parseRmByte(
          (reg: string, modeReg) => {
            registers[reg] = registers[X86_REGISTERS.sreg[modeReg]];
          },
          (address, _, byte) => {
            memIO.write[0x2](
              registers[<string>X86_REGISTERS.sreg[byte.reg]],
              address,
            );
          },
          0x2,
        );
      },
      /** MOV sreg, r/m16 */ 0x8e: () => {
        cpu.parseRmByte(
          (reg, modeReg) => {
            registers[<string>X86_REGISTERS.sreg[modeReg]] = registers[reg];
          },
          (address, _, byte) => {
            registers[<string>X86_REGISTERS.sreg[byte.reg]] =
              memIO.read[0x2](address);
          },
          0x2,
        );
      },
      /** MOV r8, r/m8    */ 0x8a: (bits: X86BitsMode = 0x1) => {
        cpu.parseRmByte(
          (reg, modeReg) => {
            registers[<string>X86_REGISTERS[bits][modeReg]] = registers[reg];
          },
          (address, reg: string) => {
            registers[reg] = memIO.read[bits](address);
          },
          bits,
        );
      },

      /** MOV al, m16  */ 0xa0: (bits = 0x1) => {
        registers[X86_REGISTERS[bits][0]] = memIO.read[bits](
          cpu.getMemAddress(cpu.segmentReg, cpu.fetchOpcode(0x2)),
        );
      },
      /** MOV ax, m16 */ 0xa1: () => cpu.opcodes[0xa0](0x2),

      /** MOV m8, al  */ 0xa2: (bits = 0x1) => {
        memIO.write[bits](
          registers[X86_REGISTERS[bits][0x0]],
          cpu.getMemAddress(cpu.segmentReg, cpu.fetchOpcode(0x2)),
        );
      },
      /** MOV m16, ax */ 0xa3: () => opcodes[0xa2](0x2),

      /** MOV r/m8, imm8  */ 0xc6: (bits: X86BitsMode = 0x1) => {
        cpu.parseRmByte(
          () => {
            /** todo */ throw new Error('0xC6: Fix me!');
          },
          address => {
            memIO.write[bits](cpu.fetchOpcode(bits), address);
          },
          bits,
        );
      },
      /** MOV r/m16, reg16  */ 0x89: () => opcodes[0x88](0x2),
      /** MOV r16, r/m16    */ 0x8b: () => opcodes[0x8a](0x2),
      /** MOV r/m16, imm16  */ 0xc7: () => opcodes[0xc6](0x2),

      /** PUSH/INC/DEC reg8 */ 0xfe: (bits: X86BitsMode = 0x1) => {
        cpu.parseRmByte(
          (_, modeReg, mode) => {
            const reg: string = X86_REGISTERS[bits][mode.rm];
            if (mode.reg === 0x6) {
              stack.push(registers[reg]);
            } else {
              registers[reg] = alu.exec(
                alu.operators.extra[
                  mode.reg === 0x1 ? 'decrement' : 'increment'
                ],
                registers[reg],
                null,
                bits,
              );
            }
          },
          (address, reg, mode) => {
            const memVal = memIO.read[bits](address);
            if (mode.reg === 0x6) {
              stack.push(memVal);
            } else {
              memIO.write[bits](
                alu.exec(
                  alu.operators.extra[
                    mode.reg === 0x1 ? 'decrement' : 'increment'
                  ],
                  memVal,
                  null,
                  bits,
                ),
                address,
              );
            }
          },
          bits,
        );
      },

      /** INC/DEC/CALL/CALLF/JMP/JMPF/PUSH   */ 0xff: () => {
        cpu.parseRmByte(
          (reg, modeReg) => {
            const regValue = <number>registers[reg];

            switch (modeReg) {
              /** INC r16 */ case 0x0:
                registers[<string>reg] = alu.exec(
                  alu.operators.extra.increment,
                  regValue,
                  null,
                  0x2,
                );
                break;

              /** DEC r16 */ case 0x1:
                registers[<string>reg] = alu.exec(
                  alu.operators.extra.decrement,
                  regValue,
                  null,
                  0x2,
                );
                break;

              /** CALL r16 */ case 0x2:
                stack.push(registers.ip);
                registers.ip = regValue;
                break;

              /** JMP r16 */ case 0x4:
                registers.ip = regValue;
                break;

              /** PUSH r16 */ case 0x6:
                stack.push(regValue);
                break;

              default:
                throw new Error('Unimplemented 0xFF reg rm instruction!');
            }
          },
          (address, reg, byte) => {
            const memVal = cpu.memIO.read[0x2](address);

            // call 0x3
            switch (byte.reg) {
              /** INC m16 */ case 0x0:
                memIO.write[0x2](
                  alu.exec(alu.operators.extra.increment, memVal, null, 0x2),
                  address,
                );
                break;

              /** DEC m16 */ case 0x1:
                memIO.write[0x2](
                  alu.exec(alu.operators.extra.decrement, memVal, null, 0x2),
                  address,
                );
                break;

              /** CALL m16 */ case 0x2:
                stack.push(registers.ip);
                registers.ip = memVal;
                break;

              /** CALL FAR  */ case 0x3:
                stack.push(registers.cs).push(registers.ip);

                cpu.absoluteJump(memVal, cpu.memIO.read[0x2](address + 0x2));
                break;

              /** JMP m16 */ case 0x4:
                registers.ip = memVal;
                break;

              /** JMP FAR  */ case 0x5:
                cpu.absoluteJump(memVal, cpu.memIO.read[0x2](address + 0x2));
                break;

              /** PUSH m16 */ case 0x6:
                stack.push(memVal);
                break;

              default:
                throw new Error('Unimplemented 0xFF mem rm instruction!');
            }
          },
          0x2,
        );
      },

      /** PUSHA */ 0x60: () => {
        const temp = registers.sp;
        for (let i = 0; i <= 0x7; ++i) {
          stack.push(
            i === 0x4 ? temp : registers[<string>X86_REGISTERS[0x2][i]],
          );
        }
      },
      /** POPA  */ 0x61: () => {
        /** Skip SP */
        for (let i = 0x7; i >= 0; --i) {
          const val = stack.pop();
          if (i !== 0x4) {
            registers[<string>X86_REGISTERS[0x2][i]] = val;
          }
        }
      },

      /** PUSH imm8     */ 0x6a: () => stack.push(cpu.fetchOpcode(), 0x2),
      /** PUSH imm16    */ 0x68: () => stack.push(cpu.fetchOpcode(0x2), 0x2),

      /** PUSHF         */ 0x9c: () => stack.push(registers.flags),
      /** POPF          */ 0x9d: () => {
        registers.flags = stack.pop();
      },

      /** LOOPNE        */ 0xe0: () => {
        const relativeAddress = cpu.fetchOpcode();
        if (--registers.cx && !registers.status.zf) {
          cpu.relativeJump(0x1, relativeAddress);
        }
      },
      /** LOOP 8bit rel */ 0xe2: () => {
        const relativeAddress = cpu.fetchOpcode();
        if (--registers.cx) {
          cpu.relativeJump(0x1, relativeAddress);
        }
      },

      /** IRET 48b  */ 0xcf: () => {
        Object.assign(registers, {
          ip: stack.pop(),
          cs: stack.pop(),
          flags: stack.pop(),
        });
      },

      /** RET far   */ 0xcb: () => {
        registers.ip = stack.pop();
        registers.cs = stack.pop();
      },
      /** RET near  */ 0xc3: (bits: X86BitsMode = 0x2) => {
        registers.ip = stack.pop(bits);
      },
      /** RET 16b   */ 0xc2: (bits: X86BitsMode = 0x2) => {
        const items = cpu.fetchOpcode(bits, false);
        registers.ip = stack.pop();

        stack.pop(items, false);
      },

      /** CALL 16bit/32bit dis  */ 0xe8: () => {
        stack.push(X86AbstractCPU.toUnsignedNumber(registers.ip + 0x2, 0x2));

        cpu.relativeJump(0x2);
      },

      /** JMP rel 8bit  */ 0xeb: () => cpu.relativeJump(0x1),
      /** JMP rel 16bit */ 0xe9: () => cpu.relativeJump(0x2), // todo: check me
      /** FAR JMP 32bit */ 0xea: () => {
        cpu.absoluteJump(cpu.fetchOpcode(0x2), cpu.fetchOpcode(0x2));
      },

      /** STOSB */ 0xaa: (bits: X86BitsMode = 0x1) => {
        memIO.write[bits](
          registers[<string>X86_REGISTERS[bits][0]],
          cpu.getMemAddress('es', 'di'),
        );
        cpu.dfIncrement(bits, 'di');
      },
      /** STOSW */ 0xab: () => opcodes[0xaa](0x2),

      /* SCAS 8bit */ 0xae: (bits: X86BitsMode = 0x1) => {
        alu.exec(
          alu.operators[X86ALUOperator.SUB],
          registers[<string>X86_REGISTERS[bits][0x0]],
          memIO.read[bits](cpu.getMemAddress('es', 'di')),
          bits,
        );

        cpu.dfIncrement(bits, 'di');
      },

      /* SCAS 16bit */ 0xaf: () => opcodes[0xae](0x2),

      /** CLI   */ 0xfa: () => {
        registers.status.if = 0x0;
      },
      /** STI   */ 0xfb: () => {
        registers.status.if = 0x1;
      },

      /** CLC   */ 0xf8: () => {
        registers.status.cf = 0x0;
      },
      /** STC   */ 0xf9: () => {
        registers.status.cf = 0x1;
      },

      /** CLD   */ 0xfc: () => {
        registers.status.df = 0x0;
      },
      /** STD   */ 0xfd: () => {
        registers.status.df = 0x1;
      },

      /** MOVSB */ 0xa4: (bits: X86BitsMode = 0x1) => {
        memIO.write[bits](
          memIO.read[bits](cpu.getMemAddress(cpu.segmentReg, 'si')),
          cpu.getMemAddress('es', 'di'),
        );

        /** Increment indexes */
        cpu.dfIncrement(bits, 'si', 'di');
      },
      /** MOVSW */ 0xa5: () => opcodes[0xa4](0x2),

      /** LODSB */ 0xac: (bits: X86BitsMode = 0x1) => {
        registers[<string>X86_REGISTERS[bits][0x0]] = memIO.read[bits](
          cpu.getMemAddress(cpu.segmentReg, 'si'),
        );
        cpu.dfIncrement(bits, 'si');
      },
      /** LODSW */ 0xad: () => opcodes[0xac](0x2),

      /** LDS r16, m16:16 */ 0xc5: (segment = 'ds') => {
        const { reg } = X86AbstractCPU.decodeRmByte(cpu.fetchOpcode());
        const addr = X86AbstractCPU.getSegmentedAddress(
          cpu.fetchOpcode(0x2, false),
        );

        registers[<string>X86_REGISTERS[0x2][reg]] = addr.offset;
        registers[segment] = addr.segment;
      },
      /** LES r16, m16:16 */ 0xc4: () => opcodes[0xc5]('es'),
      /** LEA r16, mem    */ 0x8d: () => {
        cpu.parseRmByte(
          null,
          (address, reg: string) => {
            registers[reg] = address;
          },
          0x2,
          null,
        );
      },

      /** INT3 debug trap */ 0xcc: () => {
        cpu.interrupt(X86Interrupt.raise.debug(X86InterruptType.TRAP));
      },

      /** INT imm8    */ 0xcd: () => {
        const code = cpu.fetchOpcode();

        cpu.interrupt(X86Interrupt.raise.software(code));
      },

      /** ROL/SHR/SHL   */ 0xd0: X86InstructionSet.switchRMOpcodeInstruction(
        cpu,
        0x1,
        {
          /** ROL */ 0x0: (val, bits) => cpu.rol(val, 0x1, bits),
          /** ROR */ 0x1: (val, bits) => cpu.rol(val, -0x1, bits),
          /** RCL */ 0x2: (val, bits) => cpu.rcl(val, 0x1, bits),
          /** RCR */ 0x3: (val, bits) => cpu.rcl(val, -0x1, bits),
          /** SHL */ 0x4: (val, bits) => cpu.shl(val, 0x1, bits),
          /** SHR */ 0x5: (val, bits) => cpu.shr(val, 0x1, bits),
          // /** SAL */ 0x6: (val, bits) => cpu.sal(val, 0x1, bits),
          // /** SAR */ 0x7: (val, bits) => cpu.sar(val, 0x1, bits),
        },
      ),

      /** ROL/SHR/SHL r/m8, 1 */ 0xd1: X86InstructionSet.switchRMOpcodeInstruction(
        cpu,
        0x2,
        {
          /** ROL */ 0x0: (val, bits) => cpu.rol(val, 0x1, bits),
          /** ROR */ 0x1: (val, bits) => cpu.rol(val, -0x1, bits),
          /** RCL */ 0x2: (val, bits) => cpu.rcl(val, 0x1, bits),
          /** RCR */ 0x3: (val, bits) => cpu.rcl(val, -0x1, bits),
          /** SHL */ 0x4: (val, bits) => cpu.shl(val, 0x1, bits),
          /** SHR */ 0x5: (val, bits) => cpu.shr(val, 0x1, bits),
          // /** SAL */ 0x6: (val, bits) => cpu.sal(val, 0x1, bits),
          // /** SAR */ 0x7: (val, bits) => cpu.sar(val, 0x1, bits),
        },
      ),

      /** ROL/SHR/SHL r/m8, cl */ 0xd2: X86InstructionSet.switchRMOpcodeInstruction(
        cpu,
        0x1,
        {
          /** ROL */ 0x0: (val, bits) => cpu.rol(val, registers.cl, bits),
          /** ROR */ 0x1: (val, bits) => cpu.rol(val, -registers.cl, bits),
          /** RCL */ 0x2: (val, bits) => cpu.rcl(val, registers.cl, bits),
          /** RCR */ 0x3: (val, bits) => cpu.rcl(val, -registers.cl, bits),
          /** SHL */ 0x4: (val, bits) => cpu.shl(val, registers.cl, bits),
          /** SHR */ 0x5: (val, bits) => cpu.shr(val, registers.cl, bits),
          // /** SAL */ 0x6: (val, bits) => cpu.sal(val, registers.cl, bits),
          // /** SAR */ 0x7: (val, bits) => cpu.sar(val, registers.cl, bits),
        },
      ),

      /** ROL/SHR/SHL r/m8, cl */ 0xd3: X86InstructionSet.switchRMOpcodeInstruction(
        cpu,
        0x2,
        {
          /** ROL */ 0x0: (val, bits) => cpu.rol(val, registers.cl, bits),
          /** ROR */ 0x1: (val, bits) => cpu.rol(val, -registers.cl, bits),
          /** RCL */ 0x2: (val, bits) => cpu.rcl(val, registers.cl, bits),
          /** RCR */ 0x3: (val, bits) => cpu.rcl(val, -registers.cl, bits),
          /** SHL */ 0x4: (val, bits) => cpu.shl(val, registers.cl, bits),
          /** SHR */ 0x5: (val, bits) => cpu.shr(val, registers.cl, bits),
          // /** SAL */ 0x6: (val, bits) => cpu.sal(val, registers.cl, bits),
          // /** SAR */ 0x7: (val, bits) => cpu.sar(val, registers.cl, bits),
        },
      ),

      /** ROL/SHR/SHL r/m8  */ 0xc0: X86InstructionSet.switchRMOpcodeInstruction(
        cpu,
        0x1,
        {
          /** ROL */ 0x0: (val, bits) => cpu.rol(val, cpu.fetchOpcode(), bits),
          /** ROR */ 0x1: (val, bits) => cpu.rol(val, -cpu.fetchOpcode(), bits),
          /** RCL */ 0x2: (val, bits) => cpu.rcl(val, cpu.fetchOpcode(), bits),
          /** RCR */ 0x3: (val, bits) => cpu.rcl(val, -cpu.fetchOpcode(), bits),
          /** SHL IMM8 */ 0x4: (val, bits) =>
            cpu.shl(val, cpu.fetchOpcode(), bits),
          /** SHR IMM8 */ 0x5: (val, bits) =>
            cpu.shr(val, cpu.fetchOpcode(), bits),
          // /** SAL */ 0x6: (val, bits) => cpu.sal(val, cpu.fetchOpcode(), bits),
          // /** SAR */ 0x7: (val, bits) => cpu.sar(val, cpu.fetchOpcode(), bits),
        },
      ),

      /** ROL/SHR/SHL r/m16 */ 0xc1: X86InstructionSet.switchRMOpcodeInstruction(
        cpu,
        0x2,
        {
          /** ROL */ 0x0: (val, bits) => cpu.rol(val, cpu.fetchOpcode(), bits),
          /** ROR */ 0x1: (val, bits) => cpu.rol(val, -cpu.fetchOpcode(), bits),
          /** RCL */ 0x2: (val, bits) => cpu.rcl(val, cpu.fetchOpcode(), bits),
          /** RCR */ 0x3: (val, bits) => cpu.rcl(val, -cpu.fetchOpcode(), bits),
          /** SHL IMM8 */ 0x4: (val, bits) =>
            cpu.shl(val, cpu.fetchOpcode(), bits),
          /** SHR IMM8 */ 0x5: (val, bits) =>
            cpu.shr(val, cpu.fetchOpcode(), bits),
          // /** SAL */ 0x6: (val, bits) => cpu.sal(val, cpu.fetchOpcode(), 0x2),
          // /** SAR */ 0x7: (val, bits) => cpu.sar(val, cpu.fetchOpcode(), 0x2),
        },
      ),

      /** CBW */ 0x98: () => {
        registers.ah = (registers.al & 0x80) === 0x80 ? 0xff : 0x0;
      },
      /** CWD */ 0x99: () => {
        registers.dx = (registers.ax & 0x8000) === 0x8000 ? 0xffff : 0x0;
      },

      /** SALC */ 0xd6: () => {
        registers.al = registers.status.cf ? 0xff : 0x0;
      },

      /** XLAT */ 0xd7: () => {
        registers.al = memIO.read[0x1](
          (registers[<string>cpu.segmentReg] << 4) +
            X86AbstractCPU.toUnsignedNumber(registers.bx + registers.al, 0x2),
        );
      },

      /** XCHG bx, bx */ 0x87: () => {
        const arg = cpu.fetchOpcode(0x1, false, true);

        switch (arg) {
          case 0xdb: // xchg bx, bx
          case 0xd2: // xchg dx, dx
            cpu.incrementIP(0x1);
            cpu.debugDumpRegisters();

            if (arg === 0xdb) {
              // xchg bx, bx
              const loop = <VGARenderLoopDriver>cpu.devices.vgaRenderLoop;
              if (loop) {
                loop.redraw();
              }

              debugger; // eslint-disable-line no-debugger
            }
            break;

          default:
            cpu.parseRmByte(
              (reg, reg2) => {
                [
                  registers[<string>X86_REGISTERS[0x2][reg2]],
                  registers[<string>reg],
                ] = [registers[reg], registers[X86_REGISTERS[0x2][reg2]]];
              },
              () => {
                throw new Error('todo: xchg in mem address');
              },
              0x2,
            );
        }
      },

      /** HLT */ 0xf4: cpu.halt.bind(cpu),

      /** ICE BreakPoint */ 0xf1: () => {},
      /** NOP */ 0x90: () => {},
    });

    /** General usage registers opcodes */
    for (
      let opcode = 0;
      opcode < Object.keys(X86_REGISTERS[0x1]).length;
      ++opcode
    ) {
      /** MOV register opcodes */
      (_opcode => {
        const r8: string = X86_REGISTERS[0x1][_opcode];
        const r16: string = X86_REGISTERS[0x2][_opcode];

        /** XCHG AX, r16 */ opcodes[0x90 + _opcode] = () => {
          const dest = X86_REGISTERS[0x2][_opcode],
            temp = <number>cpu.registers[dest];

          registers[<string>dest] = registers.ax;
          registers.ax = temp;
        };

        /** MOV reg8, imm8 $B0 + reg8 code */
        opcodes[0xb0 + _opcode] = () => {
          registers[r8] = cpu.fetchOpcode();
        };

        /** MOV reg16, imm16 $B8 + reg16 code */
        opcodes[0xb8 + _opcode] = () => {
          registers[r16] = cpu.fetchOpcode(0x2);
        };

        /** INC reg16 */
        opcodes[0x40 + _opcode] = () => {
          registers[r16] = alu.exec(
            alu.operators.extra.increment,
            registers[r16],
            null,
            0x2,
          );
        };

        /** DEC reg16 */
        opcodes[0x48 + _opcode] = () => {
          registers[r16] = alu.exec(
            alu.operators.extra.decrement,
            registers[r16],
            null,
            0x2,
          );
        };

        /** PUSH reg16 */
        opcodes[0x50 + _opcode] = () => stack.push(registers[r16]);

        /** POP reg16 */
        opcodes[0x58 + _opcode] = () => {
          registers[r16] = stack.pop();
        };
      })(opcode);
    }
  }

  /**
   * Inits opcodes that are related to jumps
   */
  static initBranchOpcodes(cpu: X86CPU): void {
    const { registers, opcodes } = cpu;

    const jmpOpcodes: { [offset: number]: X86FlagCondition } = {
      /** JO  */ 0x70: f => f.of,
      /** JNO */ 0x71: f => !f.of,
      /** JB  */ 0x72: f => f.cf,
      /** JAE */ 0x73: f => !f.cf,
      /** JZ  */ 0x74: f => f.zf,
      /** JNE */ 0x75: f => !f.zf,
      /** JBE */ 0x76: f => f.cf || f.zf,
      /** JA  */ 0x77: f => !f.cf && !f.zf,
      /** JS  */ 0x78: f => f.sf,
      /** JNS */ 0x79: f => !f.sf,
      /** JP  */ 0x7a: f => f.pf,
      /** JNP */ 0x7b: f => !f.pf,
      /** JG  */ 0x7f: f => !f.zf && f.sf === f.of,
      /** JGE */ 0x7d: f => f.sf === f.of,
      /** JL  */ 0x7c: f => f.sf !== f.of,
      /** JLE */ 0x7e: f => f.zf || f.sf !== f.of,
    };

    const jumpIf = (
      flagCondition: X86FlagCondition,
      bits: X86BitsMode = 0x1,
    ) => {
      const relative = cpu.fetchOpcode(bits);

      if (flagCondition(registers.status)) {
        cpu.relativeJump(bits, relative);
      }
    };

    R.forEachObjIndexed((jmpFn, opcode) => {
      opcodes[opcode] = () => jumpIf(jmpFn);
      opcodes[(0x0f << 0x8) | (+opcode + 0x10)] = () => jumpIf(jmpFn, 0x2);
    }, jmpOpcodes);
  }
}
