import {BinaryOpNode} from '@compiler/grammar/tree/TreeNode';
import {TokenType} from '@compiler/lexer/tokens';
import {CType} from '../../analyze/types/CType';
import {ASTCCompilerKind, ASTCCompilerNode} from './ASTCCompilerNode';

export {createBinOpIfBothSidesPresent} from '@compiler/grammar/utils';

/**
 * Stores tree node containing left or right tree node
 *
 * @export
 * @class ASTCBinaryOpNode
 * @extends {BinaryNode}
 */
export class ASTCBinaryOpNode extends BinaryOpNode<ASTCCompilerKind, ASTCCompilerNode> {
  type?: CType;

  constructor(
    op: TokenType,
    left: ASTCCompilerNode,
    right: ASTCCompilerNode,
  ) {
    super(ASTCCompilerKind.BinaryOperator, op, left, right);
  }
}
