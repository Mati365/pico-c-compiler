import {ASTCCastExpression, ASTCTreeNode} from '@compiler/x86-nano-c/frontend/parser/ast';
import {CGrammar} from '../shared';
import {typename} from '../types';

/**
 * cast_expression
 *  : unary_expression
 *  | '(' type_name ')' cast_expression
 *  ;
 *
 * @export
 * @param {CGrammar} grammar
 * @return {ASTCAssignmentExpression}
 */
export function castExpression(grammar: CGrammar): ASTCTreeNode {
  const {g, unaryExpression} = grammar;

  return <ASTCTreeNode> g.or(
    {
      unary: unaryExpression,
      cast() {
        g.terminal('(');
        const type = typename(grammar);
        g.terminal(')');

        return new ASTCCastExpression(
          type.loc,
          type,
          unaryExpression(),
        );
      },
    },
  );
}
