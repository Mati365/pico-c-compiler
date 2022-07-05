import {TokenType} from '@compiler/lexer/shared';
import {CPrimitiveType} from '@compiler/pico-c/frontend/analyze';
import {ASTCIfStatement} from '@compiler/pico-c/frontend/parser';

import {
  IRIfInstruction,
  IRJmpInstruction,
  IRRelInstruction,
} from '../../instructions';

import {IRConstant} from '../../variables';
import {
  appendStmtResults,
  createBlankStmtResult,
  IREmitterContextAttrs,
  IREmitterStmtResult,
} from './types';

export type IfStmtIRAttrs = IREmitterContextAttrs & {
  node: ASTCIfStatement;
};

export function emitIfStmtIR(
  {
    scope,
    context,
    node,
  }: IfStmtIRAttrs,
): IREmitterStmtResult {
  const {emit, config, factory} = context;
  const {arch} = config;

  const result = createBlankStmtResult();
  const logicResult = emit.logicExpression(
    {
      scope,
      context,
      node: node.logicalExpression,
    },
  );

  const labels = {
    else: factory.genTmpLabelInstruction(),
    finally: factory.genTmpLabelInstruction(),
  };

  const blocksResults = {
    true: emit.block(
      {
        node: node.trueExpression,
        scope,
        context,
      },
    ),
    false: emit.block(
      {
        node: node.falseExpression,
        scope,
        context,
      },
    ),
  };

  appendStmtResults(logicResult, result);
  result.instructions.push(
    new IRIfInstruction(
      new IRRelInstruction(
        TokenType.EQUAL,
        logicResult.output,
        IRConstant.ofConstant(CPrimitiveType.int(arch), 0),
      ),
      labels.else,
    ),
    ...blocksResults.true.instructions,
    new IRJmpInstruction(labels.finally),
    labels.else,
    ...blocksResults.false.instructions,
    labels.finally,
  );

  return result;
}
