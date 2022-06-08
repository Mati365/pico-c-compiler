import {CScopeTree} from '@compiler/pico-c/frontend/analyze';

import {IRGeneratorConfig} from '../../constants';
import {IRInstruction} from '../../instructions';
import {IRConstant, IRVariable} from '../../variables';
import {IRVariableAllocator} from '../IRVariableAllocator';

import type {IRCodeSegmentBuilder, IRCodeSegmentBuilderResult} from '../segments/IRCodeSegmentBuilder';
import type {IRDataSegmentBuilder, IRDataSegmentBuilderResult} from '../segments';

import type {emitAssignmentIR} from './emitAssignmentIR';
import type {emitExpressionIR} from './emitExpressionIR';
import type {emitIdentifierGetterIR} from './emitIdentifierGetterIR';
import type {emitPointerExpression} from './emitPointerExpression';
import type {emitPointerAddressExpression} from './emitPointerAddressExpression';

export type IRGeneratorSegments = {
  code: IRCodeSegmentBuilder;
  data: IRDataSegmentBuilder;
};

export type IREmitterContext = {
  segments: IRGeneratorSegments;
  config: IRGeneratorConfig;
  allocator: IRVariableAllocator;
  emit: {
    assignment: typeof emitAssignmentIR,
    expression: typeof emitExpressionIR;
    pointerExpression: typeof emitPointerExpression;
    pointerAddressExpression: typeof emitPointerAddressExpression;
    emitIdentifierGetter: typeof emitIdentifierGetterIR;
  };
};

export type IREmitterContextAttrs = {
  scope: CScopeTree;
  context: IREmitterContext;
};

export type IREmitterStmtResult = {
  instructions: IRInstruction[];
  data?: IRInstruction[];
};

export type IREmitterExpressionVarResult = IREmitterStmtResult & {
  output: IRVariable;
};

export type IREmitterExpressionResult = IREmitterStmtResult & {
  output: IRVariable | IRConstant;
};

export type IRScopeGeneratorResult = {
  segments: {
    code: IRCodeSegmentBuilderResult;
    data: IRDataSegmentBuilderResult;
  },
};

export function createBlankStmtResult(instructions?: IRInstruction[]): IREmitterStmtResult {
  return {
    instructions: instructions || [],
    data: [],
  };
}

export function appendStmtResults(src: IREmitterStmtResult, target: IREmitterStmtResult) {
  target.instructions.push(...(src.instructions || []));
  (target.data ||= []).push(...(src.data || []));

  return target;
}
