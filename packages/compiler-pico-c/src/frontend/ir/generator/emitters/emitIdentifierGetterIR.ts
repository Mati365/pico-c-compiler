import * as R from 'ramda';

import { getBaseType, getBaseTypeIfPtr } from 'frontend/analyze/types/utils';

import { TokenType } from '@ts-c-compiler/lexer';
import {
  CPointerType,
  CPrimitiveType,
  isArrayLikeType,
  isPointerLikeType,
  isStructLikeType,
  isUnionLikeType,
} from 'frontend/analyze';

import { CUnaryCastOperator } from '#constants';
import { GroupTreeVisitor } from '@ts-c-compiler/grammar';
import {
  ASTCCastUnaryExpression,
  ASTCCompilerKind,
  ASTCCompilerNode,
  ASTCConditionalExpression,
  ASTCPostfixArrayExpression,
  ASTCPostfixDotExpression,
  ASTCPostfixExpression,
  ASTCPostfixPtrExpression,
  ASTCPrimaryExpression,
} from 'frontend/parser';

import {
  IRAssignInstruction,
  IRLabelOffsetInstruction,
  IRLeaInstruction,
  IRLoadInstruction,
  IRMathInstruction,
} from '../../instructions';

import {
  IRConstant,
  IRInstructionTypedArg,
  IRLabel,
  IRVariable,
  isIRVariable,
} from '../../variables';

import {
  appendStmtResults,
  createBlankExprResult,
  IREmitterContextAttrs,
  IREmitterExpressionResult,
  IREmitterExpressionVarResult,
} from './types';

import { IRError, IRErrorCode } from '../../errors/IRError';
import { getTypeAtOffset } from '../../utils';
import { emitConditionalExpressionIR } from './emit-expr/emitConditionalExpressionIR';

type LvalueExpressionIREmitAttrs = IREmitterContextAttrs & {
  node: ASTCCompilerNode;
  emitValueAtAddress?: boolean;
};

export type LvalueExpressionIREmitResult = IREmitterExpressionVarResult & {
  rootIRVar: IRVariable;
};

export function emitIdentifierGetterIR({
  emitValueAtAddress = true,
  scope,
  context,
  node,
}: LvalueExpressionIREmitAttrs): LvalueExpressionIREmitResult {
  const { allocator, config, emit, globalVariables } = context;
  const result = createBlankExprResult();
  const { instructions, data } = result;

  let rootIRVar: IRVariable;
  let lastIRVar: IRVariable = null;
  let parentNodes: ASTCPostfixExpression[] = [];

  const getParentType = () => R.last(parentNodes).postfixExpression?.type;
  const emitExprResultToStack = (exprResult: IREmitterExpressionResult) => {
    appendStmtResults(exprResult, result);

    if (exprResult.output) {
      if (!isIRVariable(exprResult.output)) {
        const tmpVar = allocator.allocTmpVariable(exprResult.output.type);
        instructions.push(new IRAssignInstruction(exprResult.output, tmpVar));
        exprResult.output = tmpVar;
      }

      lastIRVar = exprResult.output;
    }
  };

  GroupTreeVisitor.ofIterator<ASTCCompilerNode>({
    [ASTCCompilerKind.ConditionalExpression]: {
      enter: (conditionalExpr: ASTCConditionalExpression) => {
        const exprResult = emitConditionalExpressionIR({
          asIdentifierGetter: true,
          node: conditionalExpr,
          scope,
          context,
        });

        emitExprResultToStack(exprResult);
        return false;
      },
    },

    [ASTCCompilerKind.PostfixExpression]: {
      enter(expr: ASTCPostfixExpression) {
        parentNodes.push(expr);
      },
      leave() {
        parentNodes.pop();
      },
    },

    [ASTCCompilerKind.BinaryOperator]: {
      enter() {
        throw new IRError(IRErrorCode.INCORRECT_UNARY_EXPR);
      },
    },

    [ASTCCompilerKind.CastUnaryExpression]: {
      enter(expr: ASTCCastUnaryExpression) {
        if (expr.operator !== CUnaryCastOperator.MUL) {
          throw new IRError(IRErrorCode.INCORRECT_UNARY_EXPR);
        }

        const pointerExprResult = emit.expression({
          node: expr.castExpression,
          context,
          scope,
        });

        if (!isIRVariable(pointerExprResult.output)) {
          throw new IRError(IRErrorCode.INCORRECT_UNARY_EXPR);
        }

        instructions.push(...pointerExprResult.instructions);
        lastIRVar = pointerExprResult.output;
        return false;
      },
    },

    [ASTCCompilerKind.PrimaryExpression]: {
      enter(expr: ASTCPrimaryExpression) {
        if (expr.isIdentifier()) {
          const name = expr.identifier.text;
          const irFunction = allocator.getFunction(name);

          /**
           * Detect case:
           * int* ptr = fn_name;
           */
          if (irFunction) {
            lastIRVar = allocator.allocTmpVariable(irFunction.type);

            instructions.push(
              new IRLabelOffsetInstruction(
                IRLabel.ofName(irFunction.name),
                lastIRVar,
              ),
            );
          } else if (globalVariables.hasVariable(name)) {
            const srcGlobalVar = globalVariables.getVariable(name);
            const tmpAddressVar = allocator.allocTmpVariable(srcGlobalVar.type);

            // emits for global label
            lastIRVar = tmpAddressVar;
            instructions.push(
              new IRLabelOffsetInstruction(
                IRLabel.ofName(srcGlobalVar.name),
                tmpAddressVar,
              ),
            );
          } else {
            const irVariable = allocator.getVariable(name);
            rootIRVar ??= irVariable;

            /**
             * detect this case:
             *  char array[10] = { 1, 2, 3, 4, 5, 6 };
             *  array[1] = 2;
             *
             * which is transformed into pointer that is pointing
             * not into te stack but somewhere else
             */
            if (irVariable.virtualArrayPtr) {
              lastIRVar = allocator.allocPlainAddressVariable(irVariable.type);
              instructions.push(new IRLoadInstruction(irVariable, lastIRVar));
            } else if (
              isPointerLikeType(irVariable.type) &&
              isArrayLikeType(irVariable.type.baseType)
            ) {
              // emits LEA before array[1][2], struct. like expressions
              lastIRVar = allocator.allocTmpVariable(irVariable.type);
              instructions.push(new IRLeaInstruction(irVariable, lastIRVar));
            } else {
              lastIRVar = irVariable;
            }
          }
        }
      },
    },

    [ASTCCompilerKind.PostfixPtrExpression]: {
      enter(expr: ASTCPostfixPtrExpression) {
        if (!lastIRVar) {
          return true;
        }

        const parentType = getParentType();
        if (
          !isPointerLikeType(parentType) ||
          (!isStructLikeType(parentType.baseType) &&
            !isUnionLikeType(parentType.baseType))
        ) {
          throw new IRError(IRErrorCode.ACCESS_STRUCT_ATTR_IN_NON_STRUCT);
        }

        instructions.push(
          new IRLoadInstruction(
            lastIRVar,
            (lastIRVar = allocator.allocTmpVariable(
              getBaseTypeIfPtr(lastIRVar.type),
            )),
          ),
        );

        if (isUnionLikeType(parentType.baseType)) {
          lastIRVar = lastIRVar.ofType(
            CPointerType.ofType(
              parentType.baseType.getField(expr.name.text).type,
            ),
          );

          return false;
        }

        const offset = parentType.baseType.getField(expr.name.text).offset;

        if (offset) {
          const offsetConstant = IRConstant.ofConstant(
            CPrimitiveType.int(config.arch),
            offset,
          );

          instructions.push(
            new IRMathInstruction(
              TokenType.PLUS,
              lastIRVar,
              offsetConstant,
              (lastIRVar = allocator.allocTmpPointer(
                getTypeAtOffset(lastIRVar.type, offsetConstant.constant),
              )),
            ),
          );
        } else {
          lastIRVar = lastIRVar.ofType(
            CPointerType.ofType(getTypeAtOffset(lastIRVar.type, 0)),
          );
        }

        return false;
      },
    },

    [ASTCCompilerKind.PostfixDotExpression]: {
      enter(expr: ASTCPostfixDotExpression) {
        if (!lastIRVar) {
          return true;
        }

        const parentType = getParentType();
        if (!isStructLikeType(parentType) && !isUnionLikeType(parentType)) {
          throw new IRError(IRErrorCode.ACCESS_STRUCT_ATTR_IN_NON_STRUCT);
        }

        if (
          isPointerLikeType(lastIRVar.type) &&
          (isStructLikeType(lastIRVar.type.baseType) ||
            isUnionLikeType(lastIRVar.type.baseType)) &&
          !lastIRVar.isTemporary()
        ) {
          instructions.push(
            new IRLeaInstruction(
              lastIRVar,
              (lastIRVar = allocator.allocTmpPointer(lastIRVar.type)),
            ),
          );
        }

        if (isUnionLikeType(parentType)) {
          lastIRVar = lastIRVar.ofType(
            CPointerType.ofType(parentType.getField(expr.name.text).type),
          );

          return false;
        }

        const offset = parentType.getField(expr.name.text).offset;

        if (offset) {
          const offsetConstant = IRConstant.ofConstant(
            CPrimitiveType.int(config.arch),
            offset,
          );

          instructions.push(
            new IRMathInstruction(
              TokenType.PLUS,
              lastIRVar,
              offsetConstant,
              (lastIRVar = allocator.allocTmpPointer(
                getTypeAtOffset(lastIRVar.type, offsetConstant.constant),
              )),
            ),
          );
        } else {
          lastIRVar = lastIRVar.ofType(
            CPointerType.ofType(getTypeAtOffset(lastIRVar.type, 0)),
          );
        }

        return false;
      },
    },

    [ASTCCompilerKind.PostfixArrayExpression]: {
      enter(expr: ASTCPostfixArrayExpression) {
        if (!lastIRVar) {
          return true;
        }

        const parentType = getParentType();

        // handle case for:
        //  const char* str2[]
        //  str2[0][0], str2[0] is pointer
        if (isPointerLikeType(lastIRVar.type) && !isArrayLikeType(parentType)) {
          const newLastIRVar = allocator.allocTmpVariable(
            lastIRVar.type.baseType,
          );

          instructions.push(new IRLoadInstruction(lastIRVar, newLastIRVar));
          lastIRVar = newLastIRVar;
        }

        //  [<index>]
        //     ^ compile index
        const { instructions: exprInstructions, output: exprOutput } =
          context.emit.expression({
            node: expr,
            context,
            scope,
          });

        let offsetAddressVar: IRInstructionTypedArg = null;
        let entryByteSize: number = null;

        if (isArrayLikeType(parentType)) {
          entryByteSize = parentType.ofTailDimensions().getByteSize();
        } else if (isPointerLikeType(parentType)) {
          entryByteSize = parentType.baseType.getByteSize();
        } else {
          throw new IRError(IRErrorCode.ACCESS_ARRAY_INDEX_TO_NON_ARRAY);
        }

        instructions.push(...exprInstructions);

        if (isIRVariable(exprOutput)) {
          if (isPointerLikeType(exprOutput.type)) {
            offsetAddressVar = exprOutput;
          } else {
            const constant = IRConstant.ofConstant(
              CPrimitiveType.int(config.arch),
              entryByteSize,
            );

            offsetAddressVar = allocator.allocTmpPointer(
              getBaseType(lastIRVar.type),
            );

            instructions.push(
              new IRMathInstruction(
                TokenType.MUL,
                exprOutput,
                constant,
                offsetAddressVar,
              ),
            );
          }
        } else {
          offsetAddressVar = IRConstant.ofConstant(
            CPrimitiveType.int(config.arch),
            exprOutput.constant * entryByteSize,
          );
        }

        if (offsetAddressVar) {
          instructions.push(
            new IRMathInstruction(
              TokenType.PLUS,
              lastIRVar,
              offsetAddressVar,
              (lastIRVar = allocator.allocTmpPointer(
                getBaseType(lastIRVar.type),
              )),
            ),
          );
        }

        return false;
      },
    },
  })(node);

  if (emitValueAtAddress && lastIRVar && isPointerLikeType(lastIRVar.type)) {
    // handle loading data into identifier IR
    // example: int k = vec.x;
    // last variable is `x` from `vec` but `IR` returned `Vec2*`
    // it has to be auto-casted to `int`
    const outputVar = allocator.allocTmpVariable(
      isArrayLikeType(node.type) ? node.type.getSourceType() : node.type,
    );

    instructions.push(new IRLoadInstruction(lastIRVar, outputVar));

    return {
      output: outputVar,
      rootIRVar,
      instructions,
    };
  }

  return {
    output: lastIRVar,
    data,
    rootIRVar,
    instructions,
  };
}
