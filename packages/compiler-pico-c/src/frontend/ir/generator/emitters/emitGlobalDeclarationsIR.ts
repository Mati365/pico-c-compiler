import {
  CPrimitiveType,
  CScopeTree,
  CVariableInitializerTree,
} from '@compiler/pico-c/frontend/analyze';

import { IRDefDataInstruction, type IRInstruction } from '../../instructions';
import { checkIfVirtualGlobalArrayPtr } from '../../utils';

import type { IREmitterContextAttrs } from './types';

type GlobalDeclarationIREmitAttrs = Omit<IREmitterContextAttrs, 'scope'> & {
  globalScope: CScopeTree;
};

export function emitGlobalDeclarationsIR({
  context,
  globalScope,
}: GlobalDeclarationIREmitAttrs): IRInstruction[] {
  const { config, allocator, globalVariables } = context;
  const { arch } = config;

  const instructions: IRInstruction[] = [];
  const scopeGlobals = globalScope.getGlobalVariables();

  for (const [originalVarName, variable] of Object.entries(scopeGlobals)) {
    let tmpOutputVar = allocator.allocDataVariable(variable.type);
    const initializer =
      variable.initializer ??
      CVariableInitializerTree.ofByteArray({
        baseType: CPrimitiveType.char(arch),
        length: variable.type.getByteSize(),
      });

    if (
      checkIfVirtualGlobalArrayPtr({
        type: variable.type,
        arch,
        initializer,
      })
    ) {
      tmpOutputVar = tmpOutputVar.ofVirtualArrayPtr();
    }

    instructions.push(new IRDefDataInstruction(initializer, tmpOutputVar));
    globalVariables.putVariable(originalVarName, tmpOutputVar);
  }

  return instructions;
}
