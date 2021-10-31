import {BinaryNode} from '@compiler/grammar/tree/TreeNode';
import {TokenType} from '@compiler/lexer/tokens';
import {
  ASTPreprocessorNode,
  ASTPreprocessorKind,
} from '../constants';

import {
  PreprocessorInterpretable,
  PreprocessorInterpreter,
  InterpreterResult,
} from '../interpreter/PreprocessorInterpreter';

export {createBinOpIfBothSidesPresent} from '@compiler/grammar/utils';

/**
 * Transforms tree into for that second argument contains operator,
 * it is due to left recursion issue
 *
 * @export
 * @class ASTPreprocessorBinaryOpNode
 * @extends {BinaryNode<ASTPreprocessorKind>}
 * @implements {PreprocessorInterpretable}
 */
export class ASTPreprocessorBinaryOpNode
  extends BinaryNode<ASTPreprocessorKind, ASTPreprocessorNode>
  implements PreprocessorInterpretable {
  constructor(
    public op: TokenType,
    left: ASTPreprocessorNode,
    right: ASTPreprocessorNode,
    kind: ASTPreprocessorKind = ASTPreprocessorKind.BinaryOperator,
  ) {
    super(kind, left, right);
  }

  clone(): ASTPreprocessorBinaryOpNode {
    const {op, left, right, kind} = this;

    return new ASTPreprocessorBinaryOpNode(op, left, right, kind);
  }

  /* eslint-disable @typescript-eslint/no-unused-vars */
  exec(interpreter: PreprocessorInterpreter): InterpreterResult {
    return null;
  }
  /* eslint-enable @typescript-eslint/no-unused-vars */

  toEmitterLine(): string {
    return '';
  }

  toString(): string {
    const {op} = this;

    return `${super.toString()} op=${op}`;
  }
}
