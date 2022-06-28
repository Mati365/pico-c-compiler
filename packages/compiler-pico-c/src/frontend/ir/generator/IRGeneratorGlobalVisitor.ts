import {isFuncDeclLikeType} from '../../analyze';

import {CScopeVisitor, CScopeTree} from '../../analyze/scope';
import {ASTCFunctionDefinition} from '../../parser';
import {
  IREmitterContext,
  IRGeneratorSegments,
  emitUnaryLoadPtrValueIR,
  emitFunctionIR,
  emitExpressionIR,
  emitIdentifierGetterIR,
  emitAssignmentIR,
  emitPointerAddressExpression,
  IRScopeGeneratorResult,
} from './emitters';

import {IRGeneratorConfig} from '../constants';
import {IRVariableAllocator} from './IRVariableAllocator';
import {
  IRCodeSegmentBuilder,
  IRDataSegmentBuilder,
} from './segments';

/**
 * Root IR generator visitor
 *
 * @export
 * @class IRGeneratorGlobalVisitor
 * @extends {CScopeVisitor}
 */
export class IRGeneratorGlobalVisitor extends CScopeVisitor {
  readonly segments: IRGeneratorSegments = {
    code: new IRCodeSegmentBuilder,
    data: new IRDataSegmentBuilder,
  };

  readonly allocator: IRVariableAllocator;
  readonly context: IREmitterContext;

  constructor(
    readonly config: IRGeneratorConfig,
  ) {
    super();

    this.allocator = new IRVariableAllocator(config);
    this.context = {
      config,
      segments: this.segments,
      allocator: this.allocator,
      emit: {
        expression: emitExpressionIR,
        identifierGetter: emitIdentifierGetterIR,
        pointerAddressExpression: emitPointerAddressExpression,
        assignment: emitAssignmentIR,
        unaryLoadPtrValueIR: emitUnaryLoadPtrValueIR,
      },
    };
  }

  /**
   * Returns output of IR generator
   *
   * @return {IRScopeGeneratorResult}
   * @memberof IRGeneratorGlobalVisitor
   */
  flush(): IRScopeGeneratorResult {
    const {
      segments: {
        code,
        data,
      },
    } = this;

    return {
      segments: {
        code: code.flush(),
        data: data.flush(),
      },
    };
  }

  /**
   * Iterates over scope and emits IR
   *
   * @param {CScopeTree} scope
   * @memberof IRGeneratorGlobalVisitor
   */
  enter(scope: CScopeTree): void | boolean {
    const {segments, context} = this;
    const {parentAST} = scope;

    if (isFuncDeclLikeType(parentAST?.type)) {
      const {instructions, data} = emitFunctionIR(
        {
          node: <ASTCFunctionDefinition> parentAST,
          context,
          scope,
        },
      );

      segments.code.emitBulk(instructions);
      if (data)
        segments.data.emitBulk(data);

      return false;
    }
  }
}
