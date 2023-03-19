import { checkLeftTypeOverlapping } from '@compiler/pico-c/frontend/analyze/checker';

import {
  CArrayType,
  CPointerType,
  CVariable,
  isArrayLikeType,
  isPointerLikeType,
} from '@compiler/pico-c/frontend/analyze';

import { IRVariable } from '../../../variables';
import {
  IRAllocInstruction,
  IRDefDataInstruction,
  IRLeaInstruction,
  IRStoreInstruction,
} from '../../../instructions';

import {
  IREmitterContextAttrs,
  IREmitterExpressionResult,
  appendStmtResults,
  createBlankExprResult,
} from '../types';

import { emitVariableLoadInitializerIR } from './emitVariableLoadInitializerIR';

type InitializerIREmitAttrs = IREmitterContextAttrs & {
  variable: CVariable;
};

/**
 * Emits array initializer and when array size is bigger
 * than specified in constant emits pointer to data segment
 *
 * @example
 *  array = &(label)
 *  label:
 *    db 1, 2, 3, 4
 */
export function emitVariableInitializerIR({
  scope,
  context,
  variable,
}: InitializerIREmitAttrs): IREmitterExpressionResult {
  const { allocator, config } = context;
  const result = createBlankExprResult();

  const { instructions, data } = result;
  const { type, initializer } = variable;

  if (variable.isInitialized()) {
    const isArrayType = isArrayLikeType(type);
    const isStringPtr =
      isPointerLikeType(type) &&
      checkLeftTypeOverlapping(type, CArrayType.ofStringLiteral(config.arch), {
        implicitCast: false,
        ignoreConstChecks: true,
      });

    // string pointer is an special case
    // in that kind of array we allocate only one item on stack
    // so any string literal that is longer than one character must be allocated in data segment
    // it is not possible to alloc any other type in similar way
    if (
      (isStringPtr || isArrayType) &&
      (!isArrayType || type.getSourceType().isConst()) &&
      initializer.hasOnlyConstantExpressions() &&
      initializer.getInitializedFieldsCount() > (isStringPtr ? 1 : 3)
    ) {
      // initializer with const expressions
      const arrayPtrType = CPointerType.ofArray(<CArrayType>type);
      const dataType = CArrayType.ofFlattenDescriptor({
        type: type.getSourceType(),
        dimensions: [initializer.fields.length],
      });

      const rootIRVar = allocator.allocAsPointer(
        IRVariable.ofScopeVariable(
          variable.ofType(arrayPtrType),
        ).ofVirtualArrayPtr(),
      );

      const constArrayVar = allocator.allocConstDataVariable(dataType);
      const tmpLeaAddressVar = allocator.allocTmpVariable(arrayPtrType);

      data.push(new IRDefDataInstruction(initializer, constArrayVar));

      instructions.push(
        IRAllocInstruction.ofDestPtrVariable(rootIRVar),
        new IRLeaInstruction(constArrayVar, tmpLeaAddressVar),
        new IRStoreInstruction(tmpLeaAddressVar, rootIRVar),
      );

      result.output = rootIRVar;
    } else {
      result.output = allocator.allocAsPointer(variable, allocatedVar => {
        instructions.push(IRAllocInstruction.ofDestPtrVariable(allocatedVar));

        appendStmtResults(
          emitVariableLoadInitializerIR({
            scope,
            context,
            initializerTree: initializer,
            destVar: allocatedVar,
          }),
          result,
        );
      });
    }
  } else {
    // uninitialized variable
    result.output = allocator.allocAsPointer(variable);
    instructions.push(IRAllocInstruction.ofDestPtrVariable(result.output));
  }

  return result;
}
