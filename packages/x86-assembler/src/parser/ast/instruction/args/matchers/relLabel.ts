import * as R from 'ramda';

import { roundedSignedNumberByteSize } from '@ts-c-compiler/core';

import { X86BitsMode } from '../../../../../constants';
import { InstructionArgType, BranchAddressingType } from '../../../../../types';

import { ASTInstruction } from '../../ASTInstruction';
import { ASTInstructionArg } from '../ASTInstructionArg';
import { ASTInstructionNumberArg } from '../ASTInstructionNumberArg';

/** Pointers */
export function relLabel(
  instruction: ASTInstruction,
  arg: ASTInstructionArg,
  signedByteSize: X86BitsMode,
  absoluteAddress: number,
): boolean {
  if (arg.type === InstructionArgType.LABEL) {
    return true;
  }

  if (arg.type === InstructionArgType.NUMBER) {
    // default addressing in jmp instruction is short
    if (instruction.branchAddressingType) {
      return instruction.branchAddressingType === BranchAddressingType.SHORT;
    }

    const numArg = <ASTInstructionNumberArg>arg;

    // if label is not assigned to digit, accept it
    // and do not check size of jmp, example jmp -0xFFFF
    // it is rounded in NASM
    if (instruction.branchAddressingType && R.isNil(numArg.assignedLabel)) {
      return true;
    }

    // if autogenerated
    const relativeToInstruction = numArg.val - absoluteAddress - signedByteSize;
    return roundedSignedNumberByteSize(relativeToInstruction) === signedByteSize;
  }

  return false;
}
