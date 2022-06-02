import * as R from 'ramda';

import {CMathOperator} from '@compiler/pico-c/constants';
import {CType} from '@compiler/pico-c/frontend/analyze';
import {
  ASTCBinaryOpNode, ASTCCompilerKind,
  ASTCCompilerNode, ASTCPostfixExpression, ASTCPrimaryExpression,
} from '@compiler/pico-c/frontend/parser';

import {GroupTreeVisitor} from '@compiler/grammar/tree/TreeGroupedVisitor';
import {IREmitterContextAttrs, IREmitterExpressionResult} from './types';

import {CIRInstruction, CIRLoadInstruction, CIRMathInstruction} from '../../instructions';
import {CIRError, CIRErrorCode} from '../../errors/CIRError';
import {CIRConstant, CIRInstructionVarArg} from '../../variables';

import {emitExpressionIdentifierAccessorIR} from './emitExpressionIdentifierAccessorIR';
import {
  IRInstructionsOptimizationAttrs,
  optimizeInstructionsList,
  tryEvalBinaryInstruction,
} from '../optimization';

export type ExpressionIREmitAttrs = IREmitterContextAttrs & {
  optimization?: IRInstructionsOptimizationAttrs;
  type: CType;
  node: ASTCCompilerNode;
};

export function emitExpressionIR(
  {
    optimization = {},
    type,
    context,
    node,
    scope,
  }: ExpressionIREmitAttrs,
): IREmitterExpressionResult {
  const {allocator} = context;

  const instructions: CIRInstruction[] = [];
  let argsVarsStack: CIRInstructionVarArg[] = [];

  const allocNextVariable = () => {
    const irVariable = allocator.allocTmpVariable(type);
    argsVarsStack.push(irVariable);
    return irVariable;
  };

  GroupTreeVisitor.ofIterator<ASTCCompilerNode>(
    {
      [ASTCCompilerKind.PostfixExpression]: {
        enter(expression: ASTCPostfixExpression) {
          if (expression.isPrimaryExpression())
            return;

          const exprResult = emitExpressionIdentifierAccessorIR(
            {
              node: expression,
              context,
              scope,
              emitExpressionIR,
              optimization: {
                enabled: false,
              },
            },
          );

          if (!exprResult.output)
            throw new CIRError(CIRErrorCode.UNRESOLVED_IDENTIFIER);

          instructions.push(...exprResult.instructions);
          argsVarsStack.push(exprResult.output);

          return false;
        },
      },

      [ASTCCompilerKind.PrimaryExpression]: {
        enter(expression: ASTCPrimaryExpression) {
          if (expression.isConstant()) {
            argsVarsStack.push(
              CIRConstant.ofConstant(type, expression.constant.value.number),
            );
          } else if (expression.isIdentifier()) {
            const tmpVar = allocNextVariable();
            const srcVar = allocator.getVariable(expression.identifier.text);

            instructions.push(new CIRLoadInstruction(srcVar, tmpVar.name));
          } else if (expression.isExpression()) {
            const exprResult = emitExpressionIR(
              {
                node: expression.expression,
                type,
                context,
                scope,
              },
            );

            if (!exprResult.output)
              throw new CIRError(CIRErrorCode.UNRESOLVED_IDENTIFIER);

            instructions.push(...exprResult.instructions);
            argsVarsStack.push(exprResult.output);
          }

          return false;
        },
      },

      [ASTCCompilerKind.BinaryOperator]: {
        leave: (binary: ASTCBinaryOpNode) => {
          const [a, b] = [argsVarsStack.pop(), argsVarsStack.pop()];
          const op = <CMathOperator> binary.op;
          const evalResult = tryEvalBinaryInstruction(
            {
              op,
              a,
              b,
            },
          );

          evalResult.match({
            none() {
              instructions.push(
                new CIRMathInstruction(
                  op,
                  b, a,
                  allocNextVariable().name,
                ),
              );
            },
            some(val) {
              argsVarsStack.push(
                CIRConstant.ofConstant(type, val),
              );
            },
          });
        },
      },
    },
  )(node);

  // handle case: int a = b;
  if (argsVarsStack?.length !== 1)
    throw new CIRError(CIRErrorCode.UNABLE_TO_COMPILE_EXPRESSION);

  const lastArgVarStack = R.last(argsVarsStack);
  return {
    output: lastArgVarStack,
    instructions: optimizeInstructionsList(optimization, instructions),
  };
}
