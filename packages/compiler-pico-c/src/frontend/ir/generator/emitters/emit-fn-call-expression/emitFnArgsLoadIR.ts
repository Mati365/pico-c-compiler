import { GroupTreeVisitor } from '@ts-c/grammar';

import {
  ASTCAssignmentExpression,
  ASTCCompilerKind,
  ASTCCompilerNode,
} from 'frontend/parser';

import { IRInstructionTypedArg } from '../../../variables';
import {
  appendStmtResults,
  createBlankStmtResult,
  IREmitterContextAttrs,
} from '../types';

type FnArgsLoadIREmitAttrs = IREmitterContextAttrs & {
  node: ASTCCompilerNode;
};

export function emitFnArgsLoadIR({
  node,
  context,
  scope,
}: FnArgsLoadIREmitAttrs) {
  const { emit } = context;
  const result = createBlankStmtResult();
  const args: IRInstructionTypedArg[] = [];

  GroupTreeVisitor.ofIterator<ASTCCompilerNode>({
    [ASTCCompilerKind.AssignmentExpression]: {
      enter(exprNode: ASTCAssignmentExpression) {
        const exprResult = emit.expression({
          node: exprNode,
          context,
          scope,
        });

        appendStmtResults(exprResult, result);
        args.push(exprResult.output);
        return false;
      },
    },
  })(node);

  return {
    ...result,
    args,
  };
}
