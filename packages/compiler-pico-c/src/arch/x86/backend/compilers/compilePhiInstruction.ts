import { CBackendError, CBackendErrorCode } from 'backend/errors/CBackendError';
import { IRPhiInstruction } from 'frontend/ir/instructions';

import { X86CompilerInstructionFnAttrs } from '../../constants/types';
import { IRRegOwnership } from '../reg-allocator';

type PhiInstructionCompilerAttrs = X86CompilerInstructionFnAttrs<IRPhiInstruction>;

export function compilePhiInstruction({
  instruction,
  context,
}: PhiInstructionCompilerAttrs) {
  const { vars, outputVar } = instruction;
  const {
    allocator: { regs },
  } = context;

  const inputOwnership = vars.reduce((acc, argVar) => {
    const argOwnership = regs.ownership.getVarOwnership(argVar.name);

    if (acc && acc.reg !== argOwnership.reg) {
      throw new CBackendError(CBackendErrorCode.INCORRECT_PHI_NODE);
    }

    return argOwnership;
  }, null as IRRegOwnership);

  regs.ownership.setOwnership(outputVar.name, {
    reg: inputOwnership.reg,
  });
}
