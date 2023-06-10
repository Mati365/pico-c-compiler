import { getSourceNonPtrType } from '@compiler/pico-c/frontend/analyze/types/utils';
import { isIRBranchInstruction } from '../../../guards';
import {
  IRInstruction,
  IRLoadInstruction,
  isIRAsmInstruction,
  isIRCallInstruction,
  isIRLoadInstruction,
  isIRRetInstruction,
  isIRStoreInstruction,
} from '../../../instructions';

import { IRVariable, isIRVariable } from '../../../variables';
import { dropConstantInstructionArgs } from '../utils';

type LoadReducerState = {
  lastStore: {
    [inputVar: string]: IRVariable;
  };
  srcLoads: {
    [inputVar: string]: IRLoadInstruction;
  };
  deadLoadsVarMap: {
    [outputTmpVar: string]: IRVariable;
  };
};

const resetLoadState = (): LoadReducerState => ({
  lastStore: {},
  srcLoads: {},
  deadLoadsVarMap: {},
});

/**
 * Reduces:
 *
 *  %t{0}: int2B = load a{0}: int*2B
 *  %t{1}: int2B = %t{0}: int2B plus %5: char1B
 *  *(a{0}: int*2B) = store %t{1}: int2B
 *  %t{2}: int2B = load a{0}: int*2B
 *  %t{3}: int2B = %t{2}: int2B mul %3: char1B
 *  *(a{0}: int*2B) = store %t{3}: int2B
 *
 * To:
 *
 *  %t{0}: int2B = load a{0}: int*2B
 *  %t{1}: int2B = %t{0}: int2B plus %5: char1B
 *  *(a{0}: int*2B) = store %t{1}: int2B
 *  %t{3}: int2B = %t{1}: int2B mul %3: char1B
 *  *(a{0}: int*2B) = store %t{3}: int2B
 *
 * Stores will be dropped in another steps
 */
export function dropRedundantLoadInstructions(instructions: IRInstruction[]) {
  const newInstructions = [...instructions];
  let state = resetLoadState();

  const flush = () => {
    state = resetLoadState();
  };

  for (let i = 0; i < newInstructions.length; ++i) {
    let instruction = newInstructions[i];

    if (
      isIRLoadInstruction(instruction) &&
      getSourceNonPtrType(instruction.inputVar.type).canBeStoredInReg()
    ) {
      const { inputVar, outputVar } = instruction;

      if (state.srcLoads[inputVar.name]) {
        newInstructions.splice(newInstructions.indexOf(instruction), 1);
        state.deadLoadsVarMap[outputVar.name] =
          state.lastStore[inputVar.name] ??
          state.srcLoads[inputVar.name].outputVar;

        --i;
        continue;
      } else {
        state.srcLoads[inputVar.name] = instruction;
      }
    }

    if (
      isIRRetInstruction(instruction) ||
      isIRCallInstruction(instruction) ||
      isIRAsmInstruction(instruction) ||
      !isIRBranchInstruction(instruction)
    ) {
      const optimizedInstruction = dropConstantInstructionArgs(
        state.deadLoadsVarMap,
        instruction,
      );

      if (
        isIRStoreInstruction(instruction) &&
        isIRVariable(instruction.value)
      ) {
        state.lastStore[instruction.outputVar.name] = instruction.value;
      }

      if (optimizedInstruction) {
        newInstructions[i] = optimizedInstruction;
      }
    } else {
      flush();
    }
  }

  flush();

  return newInstructions;
}
