import * as R from 'ramda';

import {tryCastToPointer} from '@compiler/pico-c/frontend/analyze/casts';
import {isImplicitPtrType} from '@compiler/pico-c/frontend/analyze/types/utils';

import {TokenType} from '@compiler/lexer/shared';
import {CMathOperator, CUnaryCastOperator} from '@compiler/pico-c/constants';
import {
  CPointerType,
  CPrimitiveType,
  CType,
  isPointerArithmeticType,
  isPointerLikeType,
} from '@compiler/pico-c/frontend/analyze';

import {
  ASTCAssignmentExpression,
  ASTCBinaryOpNode, ASTCCastUnaryExpression,
  ASTCCompilerKind, ASTCCompilerNode,
  ASTCPostfixExpression, ASTCPrimaryExpression,
} from '@compiler/pico-c/frontend/parser';

import {GroupTreeVisitor} from '@compiler/grammar/tree/TreeGroupedVisitor';
import {IREmitterContextAttrs, IREmitterExpressionResult} from './types';

import {
  IRInstruction, IRLabelOffsetInstruction, IRLeaInstruction,
  IRLoadInstruction, IRMathInstruction,
} from '../../instructions';

import {IRError, IRErrorCode} from '../../errors/IRError';
import {IRConstant, IRInstructionVarArg, IRVariable} from '../../variables';

import {emitIdentifierGetterIR} from './emitIdentifierGetterIR';
import {emitIncExpressionIR} from './emitIncExpressionIR';
import {emitFnCallExpressionIR} from './emit-fn-call-expression';

export type ExpressionIREmitAttrs = IREmitterContextAttrs & {
  node: ASTCCompilerNode;
};

export function emitExpressionIR(
  {
    initializerMeta,
    context,
    node,
    scope,
  }: ExpressionIREmitAttrs,
): IREmitterExpressionResult {
  const {allocator, emit, config} = context;
  const instructions: IRInstruction[] = [];
  let argsVarsStack: IRInstructionVarArg[] = [];

  const allocNextVariable = (nextType: CType = node.type) => {
    const irVariable = allocator.allocTmpVariable(nextType);
    argsVarsStack.push(irVariable);
    return irVariable;
  };

  const emitExprResultToStack = (result: IREmitterExpressionResult) => {
    instructions.push(...result.instructions);
    argsVarsStack.push(result.output);
  };

  GroupTreeVisitor.ofIterator<ASTCCompilerNode>(
    {
      [ASTCCompilerKind.CastUnaryExpression]: {
        enter(expr: ASTCCastUnaryExpression) {
          switch (expr.operator) {
            // *a
            case CUnaryCastOperator.MUL: {
              const unaryExprResult = emit.unaryLoadPtrValueIR(
                {
                  castExpression: expr.castExpression,
                  context,
                  scope,
                },
              );

              emitExprResultToStack(unaryExprResult);
              return false;
            }

            // &a
            case CUnaryCastOperator.AND: {
              const pointerAddresExprResult = emit.pointerAddressExpression(
                {
                  context,
                  scope,
                  node: expr,
                },
              );

              emitExprResultToStack(pointerAddresExprResult);
              return false;
            }
          }
        },
      },

      [ASTCCompilerKind.AssignmentExpression]: {
        enter(expression: ASTCAssignmentExpression) {
          if (!expression.isOperatorExpression())
            return;

          // a = xyz
          const assignResult = emit.assignment(
            {
              node: expression,
              context,
              scope,
            },
          );

          if (!assignResult.output)
            throw new IRError(IRErrorCode.UNRESOLVED_ASSIGN_EXPRESSION);

          emitExprResultToStack(assignResult);
          return false;
        },
      },

      [ASTCCompilerKind.PostfixExpression]: {
        enter(expression: ASTCPostfixExpression) {
          if (expression.isPostIncExpression() || expression.isPreIncExpression()) {
            const isPreInc = expression.isPreIncExpression();

            // handle i++ / ++i
            const sign = expression.getIncSign();
            const irSrcVarExprResult = emitIdentifierGetterIR(
              {
                emitValueAtAddress: false,
                node: (
                  isPreInc
                    ? expression.primaryExpression
                    : expression.postfixExpression
                ),
                context,
                scope,
              },
            );

            const exprResult = emitIncExpressionIR(
              {
                pre: isPreInc,
                rootIRVar: irSrcVarExprResult.output,
                context,
                sign,
              },
            );

            instructions.push(...irSrcVarExprResult.instructions);
            emitExprResultToStack(exprResult);
            return false;
          } else if (expression.isFnExpression()) {
            // handle a(1, 2)
            const exprResult = emitFnCallExpressionIR(
              {
                node: expression,
                initializerMeta,
                context,
                scope,
              },
            );

            emitExprResultToStack(exprResult);
            return false;
          } else if (!expression.isPrimaryExpression()) {
            // handle (a + 2)
            const exprResult = emitIdentifierGetterIR(
              {
                node: expression,
                context,
                scope,
              },
            );

            if (!exprResult.output)
              throw new IRError(IRErrorCode.UNRESOLVED_IDENTIFIER);

            emitExprResultToStack(exprResult);
            return false;
          }
        },
      },

      [ASTCCompilerKind.PrimaryExpression]: {
        enter(expression: ASTCPrimaryExpression) {
          if (expression.isConstant()) {
            // handle "a"
            argsVarsStack.push(
              IRConstant.ofConstant(
                expression.type,
                expression.constant.value.number,
              ),
            );
          } else if (expression.isIdentifier()) {
            const {text: name} = expression.identifier;

            const srcFn = allocator.getFunction(name);
            const srcVar = allocator.getVariable(name);

            if (srcFn) {
              const tmpVar = allocNextVariable(
                CPointerType.ofType(srcFn.type),
              );

              instructions.push(
                new IRLabelOffsetInstruction(srcFn, tmpVar),
              );
            } else if (srcVar) {
              // handle a[2] / *a
              if (!isPointerLikeType(srcVar.type))
                throw new IRError(IRErrorCode.CANNOT_LOAD_PRIMARY_EXPRESSION);

              if (isImplicitPtrType(srcVar.type.baseType)) {
                // handle "array" variable, it is not really pointer
                // so if we treat arrays like pointer ... loads its
                // first element address
                const tmpVar = allocNextVariable(srcVar.type);

                instructions.push(
                  new IRLeaInstruction(srcVar, tmpVar),
                );
              } else {
                // handle normal "ptr" variable, loads its pointing value
                const tmpVar = allocNextVariable(srcVar.type.baseType);

                instructions.push(
                  new IRLoadInstruction(srcVar, tmpVar),
                );
              }
            } else {
              // handle compile time constant like enum { A = 1, B = 2 }
              const constant = scope.findCompileTimeConstant(name);
              if (!constant)
                throw new IRError(IRErrorCode.CANNOT_LOAD_PRIMARY_EXPRESSION);

              argsVarsStack.push(
                IRConstant.ofConstant(
                  scope.findCompileTimeConstantType(name),
                  constant,
                ),
              );
            }
          } else if (expression.isExpression()) {
            // handle "2 + (a + 2)"
            const exprResult = emitExpressionIR(
              {
                node: expression.expression,
                context,
                scope,
              },
            );

            if (!exprResult.output)
              throw new IRError(IRErrorCode.UNRESOLVED_IDENTIFIER);

            emitExprResultToStack(exprResult);
          }

          return false;
        },
      },

      [ASTCCompilerKind.BinaryOperator]: {
        leave: (binary: ASTCBinaryOpNode) => {
          let [a, b] = [argsVarsStack.pop(), argsVarsStack.pop()];
          let output: IRVariable = null;

          if (!isPointerArithmeticType(b.type) && isPointerArithmeticType(a.type)) {
            const mulBy = a.type.getSourceType().getByteSize();

            if (mulBy) {
              const mulPtrInstruction = new IRMathInstruction(
                TokenType.MUL,
                b,
                IRConstant.ofConstant(
                  CPrimitiveType.int(config.arch),
                  mulBy,
                ),
                b = allocNextVariable(),
              );

              instructions.push(mulPtrInstruction);
              output = allocNextVariable(
                tryCastToPointer(a.type),
              );
            }
          }

          if (isPointerArithmeticType(b.type) && !isPointerArithmeticType(a.type)) {
            const mulBy = b.type.getSourceType().getByteSize();

            if (mulBy) {
              const mulPtrInstruction = new IRMathInstruction(
                TokenType.MUL,
                a,
                IRConstant.ofConstant(
                  CPrimitiveType.int(config.arch),
                  mulBy,
                ),
                a = allocNextVariable(),
              );

              instructions.push(mulPtrInstruction);
              output = allocNextVariable(
                tryCastToPointer(b.type),
              );
            }
          }

          output ||= allocNextVariable(a.type);
          instructions.push(
            new IRMathInstruction(
              <CMathOperator> binary.op,
              b, a,
              output,
            ),
          );
        },
      },
    },
  )(node);

  const lastArgVarStack = R.last(argsVarsStack);
  return {
    output: lastArgVarStack,
    instructions,
  };
}
