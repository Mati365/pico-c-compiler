import * as R from 'ramda';

import {
  getBaseTypeIfArray,
  getBaseTypeIfPtr,
} from '@compiler/pico-c/frontend/analyze/types/utils';

import { isCompilerTreeNode } from '@compiler/pico-c/frontend/parser';
import {
  CVariableInitializerTree,
  isInitializerTreeValue,
} from '@compiler/pico-c/frontend/analyze';

import {
  appendStmtResults,
  createBlankStmtResult,
  IREmitterContextAttrs,
  IREmitterStmtResult,
} from '../types';

import { IRError, IRErrorCode } from '../../../errors/IRError';
import { IRStoreInstruction } from '../../../instructions';
import { IRConstant, IRVariable, isIRVariable } from '../../../variables';

import { emitExpressionIR } from '../emit-expr';
import {
  emitStringLiteralBlobLocalInitializerIR,
  emitStringLiteralPtrLocalInitializerIR,
  StringPtrInitializerLocalIREmitAttrs,
} from './literal';

type LoadInitializerIREmitAttrs = IREmitterContextAttrs & {
  initializerTree: CVariableInitializerTree;
  destVar: IRVariable;
};

/**
 * Emits initializer
 */
export function emitVariableLoadInitializerIR({
  destVar,
  initializerTree,
  scope,
  context,
}: LoadInitializerIREmitAttrs): IREmitterStmtResult {
  const result = createBlankStmtResult();
  let offset: number = 0;

  initializerTree.fields.forEach((initializer, index) => {
    if (isInitializerTreeValue(initializer)) {
      throw new IRError(IRErrorCode.INCORRECT_INITIALIZER_BLOCK);
    }

    const itemOffsetType = initializerTree.getIndexExpectedType(index);

    if (R.is(String, initializer)) {
      const isStringPtr = getBaseTypeIfArray(
        getBaseTypeIfPtr(destVar.type),
      ).isPointer();

      const attrs: StringPtrInitializerLocalIREmitAttrs = {
        context,
        literal: initializer,
        initializerMeta: {
          offset,
          destVar,
        },
      };

      if (isStringPtr) {
        // const char* str2[] = { "Hello world2!", "Hello world2!", 0x5 };
        // const char* HELLO_WORLD2 = "Hello world2!";
        appendStmtResults(
          emitStringLiteralPtrLocalInitializerIR(attrs),
          result,
        );

        offset += itemOffsetType.getByteSize();
      } else {
        appendStmtResults(
          emitStringLiteralBlobLocalInitializerIR(attrs),
          result,
        );

        offset += initializer.length;
      }
    } else {
      if (isCompilerTreeNode(initializer)) {
        const exprResult = emitExpressionIR({
          scope,
          context,
          node: initializer,
          initializerMeta: {
            offset,
            destVar,
            index,
          },
        });

        appendStmtResults(exprResult, result);

        // do not emit store if RVO optimized fn call result is present
        if (
          !isIRVariable(exprResult.output) ||
          !destVar.isShallowEqual(exprResult.output)
        ) {
          result.instructions.push(
            new IRStoreInstruction(exprResult.output, destVar, offset),
          );
        }
      } else if (!R.isNil(initializer)) {
        // int abc[3] = { 1, 2, 3}
        // constant literals are of type 1
        result.instructions.push(
          new IRStoreInstruction(
            IRConstant.ofConstant(itemOffsetType, initializer),
            destVar,
            offset,
          ),
        );
      }

      offset += itemOffsetType.getByteSize();
    }
  });

  return result;
}
