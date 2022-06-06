import * as R from 'ramda';

import {Identity} from '@compiler/core/monads';
import {IRInstruction} from './IRInstruction';
import {IRBranchRelations} from './IRIfInstruction';

export type IRBlockJmps = Partial<IRBranchRelations<IRInstructionsBlock>> & {
  always?: IRInstructionsBlock;
};

type IRInstructionsBlockDescriptor = {
  name?: string;
  instructions: IRInstruction[],
  jmps?: IRBlockJmps,
};

/**
 * See it as a block of instructions that are not separated
 * by any jmp or label. Something like IDA "instructions block"
 *
 * @export
 * @class IRInstructionsBlock
 * @extends {Identity<IRInstructionsBlockDescriptor>}
 */
export class IRInstructionsBlock extends Identity<IRInstructionsBlockDescriptor> {
  /**
   * Creates branchless block monad
   *
   * @static
   * @param {IRInstruction[]} instructions
   * @return {IRInstructionsBlock}
   * @memberof IRInstructionsBlock
   */
  static ofInstructions(instructions: IRInstruction[]): IRInstructionsBlock {
    return new IRInstructionsBlock(
      {
        instructions,
      },
    );
  }

  get name() { return this.value.name; }
  get jmps() { return this.value.jmps; }
  get instructions() { return this.value.instructions; }
  get lastInstruction() { return R.last(this.instructions); }

  isEmpty() {
    return R.isEmpty(this.instructions);
  }

  hasSatisfiedRelations(relations: IRBranchRelations<unknown>) {
    const {jmps} = this;

    return (
      !jmps.ifFalse === !relations.ifFalse
        && !!jmps.ifTrue === !relations.ifTrue
    );
  }

  /**
   * Appends jmps map to instructions block
   *
   * @param {IRBlockJmps} jmps
   * @return {this}
   * @memberof IRInstructionsBlock
   */
  ofJmps(jmps: IRBlockJmps): this {
    return this.map((value) => ({
      ...value,
      jmps,
    }));
  }

  /**
   * Construct specific instructions block of specific name
   *
   * @param {string} name
   * @return {this}
   * @memberof IRInstructionsBlock
   */
  ofName(name: string): this {
    return this.map((value) => ({
      ...value,
      name,
    }));
  }
}
