import { IROpcode } from '@compiler/pico-c/frontend/ir/constants';
import {
  IRCommentInstruction,
  IRFnDeclInstruction,
  isIRLabelInstruction,
} from '@compiler/pico-c/frontend/ir/instructions';

import { CompiledBlockOutput, CompilerFnAttrs } from '../../constants/types';

import { genComment, genLabel } from '../../asm-utils';

import { compileAllocInstruction } from './compileAllocInstruction';
import { compileStoreInstruction } from './compileStoreInstruction';
import { compileLoadInstruction } from './compileLoadInstruction';
import { compileMathInstruction } from './compileMathInstruction';
import { compileICmpInstruction } from './compileICmpInstruction';
import { compileLabelInstruction } from './compileLabelInstruction';
import { compileJmpInstruction } from './compileJmpInstruction';
import { compileLeaInstruction } from './compileLeaInstruction';
import { compileAssignInstruction } from './compileAssignInstruction';
import { compilePhiInstruction } from './compilePhiInstruction';
import { compileRetInstruction } from './compileRetInstruction';
import { compileLabelOffsetInstruction } from './compileLabelOffsetInstruction';
import { compileCallInstruction } from './compileCallInstruction';

type FnDeclCompilerBlockFnAttrs = CompilerFnAttrs & {
  instruction: IRFnDeclInstruction;
};

export function compileFnDeclInstructionsBlock({
  instruction: fnInstruction,
  context,
}: FnDeclCompilerBlockFnAttrs): CompiledBlockOutput {
  const { allocator, iterator } = context;
  const compileFnContent = (): string[] => {
    const asm: string[] = [];

    iterator.walk(instruction => {
      const arg = {
        instruction: <any>instruction,
        context,
        iterator,
      };

      if (isIRLabelInstruction(instruction)) {
        allocator.regs.ownership.releaseNotUsedLaterRegs();
      }

      switch (instruction.opcode) {
        case IROpcode.ALLOC:
          compileAllocInstruction(arg);
          break;

        case IROpcode.ASSIGN:
          asm.push(...compileAssignInstruction(arg));
          break;

        case IROpcode.PHI:
          compilePhiInstruction(arg);
          break;

        case IROpcode.LOAD:
          asm.push(...compileLoadInstruction(arg));
          break;

        case IROpcode.LEA:
          asm.push(...compileLeaInstruction(arg));
          break;

        case IROpcode.MATH:
          asm.push(...compileMathInstruction(arg));
          break;

        case IROpcode.STORE:
          asm.push(...compileStoreInstruction(arg));
          break;

        case IROpcode.JMP:
          asm.push(...compileJmpInstruction(arg));
          break;

        case IROpcode.CALL:
          asm.push(...compileCallInstruction(arg));
          break;

        case IROpcode.LABEL:
          asm.push(...compileLabelInstruction(arg));
          break;

        case IROpcode.LABEL_OFFSET:
          compileLabelOffsetInstruction(arg);
          break;

        case IROpcode.ICMP:
          asm.push(...compileICmpInstruction(arg));
          break;

        case IROpcode.COMMENT:
          asm.push(genComment((<IRCommentInstruction>instruction).comment));
          break;
      }
    });

    return asm;
  };

  const asm = [
    genComment(fnInstruction.getDisplayName()),
    genLabel(allocator.allocLabel('fn', fnInstruction.name), false),
    ...allocator.allocStackFrameInstructions(compileFnContent),
    ...compileRetInstruction(),
  ];

  return {
    asm,
  };
}
