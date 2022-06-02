import {CScopeTree} from '@compiler/pico-c/frontend/analyze';

import {CIRGeneratorConfig} from '../../constants';
import {CIRInstruction} from '../../instructions';
import {CIRConstant, CIRVariable} from '../../variables';
import {CIRVariableAllocator} from '../CIRVariableAllocator';

import type {emitAssignmentIR} from './emitAssignmentIR';
import type {emitExpressionIR} from './emitExpressionIR';
import type {emitExpressionIdentifierAccessorIR} from './emitExpressionIdentifierAccessorIR';

export type IREmitterContext = {
  config: CIRGeneratorConfig;
  allocator: CIRVariableAllocator;
  emit: {
    assignment: typeof emitAssignmentIR,
    expression: typeof emitExpressionIR;
    expressionIdentifier: typeof emitExpressionIdentifierAccessorIR;
  };
};

export type IREmitterContextAttrs = {
  scope: CScopeTree;
  context: IREmitterContext;
};

export type IREmitterStmtResult = {
  instructions: CIRInstruction[];
};

export type IREmitterExpressionVarResult = IREmitterStmtResult & {
  output: CIRVariable;
};

export type IREmitterExpressionResult = IREmitterStmtResult & {
  output: CIRVariable | CIRConstant;
};
