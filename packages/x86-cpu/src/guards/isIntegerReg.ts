import { X86RegName } from '@ts-c-compiler/x86-assembler';
import { X86_REGISTER_NAMES } from '../constants/x86';

export const isIntegerX86Reg = (reg: X86RegName) =>
  X86_REGISTER_NAMES.includes(reg);
