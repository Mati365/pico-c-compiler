import {
  CBackendError,
  CBackendErrorCode,
} from '@compiler/pico-c/backend/errors/CBackendError';

import { IRStoreInstruction } from '@compiler/pico-c/frontend/ir/instructions';
import { getByteSizeArgPrefixName } from '@x86-toolkit/assembler/parser/utils';

import { CompilerFnAttrs } from '../../constants/types';
import { genInstruction, withInlineComment } from '../../asm-utils';
import {
  isIRConstant,
  isIRVariable,
} from '@compiler/pico-c/frontend/ir/variables';

type StoreInstructionCompilerAttrs = CompilerFnAttrs & {
  instruction: IRStoreInstruction;
};

export function compileStoreInstruction({
  instruction,
  context,
}: StoreInstructionCompilerAttrs): string[] {
  const { allocator } = context;
  const { outputVar, value } = instruction;
  const { stackFrame, regs } = allocator;

  const prefix = getByteSizeArgPrefixName(value.type.getByteSize());
  const destAttr = [
    prefix.toLocaleLowerCase(),
    stackFrame.getLocalVarStackRelAddress(outputVar.name),
  ].join(' ');

  if (isIRVariable(value)) {
    let inputReg = regs.tryResolveIRArgAsReg({
      arg: value,
    });

    if (inputReg) {
      regs.transferRegOwnership(outputVar.name, inputReg.value);
    } else {
      console.warn('FIXME: missing implementation of function return!');
      inputReg = {
        value: 'ax',
        asm: [],
      };
    }

    return [
      ...inputReg.asm,
      withInlineComment(
        genInstruction('mov', destAttr, inputReg.value),
        instruction.getDisplayName(),
      ),
    ];
  }

  if (isIRConstant(value)) {
    return [
      withInlineComment(
        genInstruction('mov', destAttr, value.constant),
        instruction.getDisplayName(),
      ),
    ];
  }

  throw new CBackendError(CBackendErrorCode.STORE_VAR_ERROR);
}
