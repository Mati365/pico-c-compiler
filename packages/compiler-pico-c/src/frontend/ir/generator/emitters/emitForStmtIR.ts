import {TokenType} from '@compiler/lexer/shared';
import {CPrimitiveType} from '@compiler/pico-c/frontend/analyze';
import {ASTCForStatement} from '@compiler/pico-c/frontend/parser';

import {
  IRFnDeclInstruction, IRIfInstruction,
  IRJmpInstruction, IRRelInstruction,
} from '../../instructions';

import {IRConstant} from '../../variables';
import {
  createBlankStmtResult,
  IREmitterContextAttrs,
  IREmitterStmtResult,
} from './types';

import {emitDeclarationIR} from './emitDeclarationIR';

export type ForStmtIRAttrs = IREmitterContextAttrs & {
  node: ASTCForStatement;
  fnDecl: IRFnDeclInstruction;
};

export function emitForStmtIR(
  {
    scope,
    context,
    node,
    fnDecl,
  }: ForStmtIRAttrs,
): IREmitterStmtResult {
  const {emit, config, factory} = context;
  const {arch} = config;

  const result = createBlankStmtResult();
  const declResult = emitDeclarationIR(
    {
      node: node.declaration,
      scope,
      context,
    },
  );

  const logicResult = emit.logicExpression(
    {
      scope,
      context,
      node: node.condition,
    },
  );

  const exprResult = emit.expression(
    {
      scope,
      context,
      node: node.expression,
    },
  );

  const labels = {
    start: factory.genTmpLabelInstruction(),
    end: factory.genTmpLabelInstruction(),
  };

  const contentResult = emit.block(
    {
      node: node.statement,
      fnDecl,
      scope,
      context,
    },
  );

  result.instructions.push(
    ...declResult.instructions,
    labels.start,
    ...result.instructions,
    ...logicResult.instructions,
    new IRIfInstruction(
      new IRRelInstruction(
        TokenType.EQUAL,
        logicResult.output,
        IRConstant.ofConstant(CPrimitiveType.int(arch), 0),
      ),
      labels.end,
    ),
    ...contentResult.instructions,
    ...exprResult.instructions,
    new IRJmpInstruction(labels.start),
    labels.end,
  );

  return result;
}
