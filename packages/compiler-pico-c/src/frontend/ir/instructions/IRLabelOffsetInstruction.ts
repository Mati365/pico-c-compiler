import chalk from 'chalk';

import { IsLabeledInstruction, IsOutputInstruction } from '../interfaces';
import { IROpcode } from '../constants';
import { IRInstruction, IRInstructionArgs } from './IRInstruction';
import { IRVariable } from '../variables';

export function isIRLabelOffsetInstruction(
  instruction: IRInstruction,
): instruction is IRLabelOffsetInstruction {
  return instruction?.opcode === IROpcode.LABEL_OFFSET;
}

/**
 * Instruction that instead of lea loads only offset
 * of label instruction that is loaded into RAM and
 * is not stored in stack
 */
export class IRLabelOffsetInstruction
  extends IRInstruction
  implements IsOutputInstruction
{
  constructor(
    readonly labelInstruction: IsLabeledInstruction,
    readonly outputVar: IRVariable,
  ) {
    super(IROpcode.LABEL_OFFSET);
  }

  override ofArgs({ output = this.outputVar }: IRInstructionArgs) {
    return new IRLabelOffsetInstruction(this.labelInstruction, output);
  }

  override getArgs(): IRInstructionArgs {
    const { outputVar } = this;

    return {
      input: [],
      output: outputVar,
    };
  }

  override getDisplayName(): string {
    const { labelInstruction, outputVar } = this;

    return `${outputVar.getDisplayName()} = ${chalk.yellowBright(
      'label-offset',
    )} ${labelInstruction.name}`;
  }
}
