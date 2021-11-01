import {TokenType} from '@compiler/lexer/shared';
import {SyntaxError} from '@compiler/grammar/Grammar';
import {CGrammar} from '../shared';
import {
  ASTCConditionalExpression,
  ASTCCompilerNode,
} from '../../../ast';

import {logicalOrExpression} from './logicalExpression';
import {expression} from './expression';

/**
 * conditional_expression
 * : logical_or_expression
 * | logical_or_expression '?' expression ':' conditional_expression
 * ;
 *
 * @export
 * @param {CGrammar} grammar
 * @return {ASTCConditionalExpression}
 */
export function conditionalExpression(grammar: CGrammar): ASTCCompilerNode {
  const {g} = grammar;
  const orExpression = logicalOrExpression(grammar);

  if (!orExpression)
    throw SyntaxError;

  const questionMark = g.match(
    {
      type: TokenType.QUESTION_MARK,
      optional: true,
    },
  );

  // return only logical_or_expression
  if (!questionMark)
    return orExpression;

  // return logical_or_expression '?' expression ':' conditional_expression
  const trueExpression = expression(grammar);
  g.match(
    {
      type: TokenType.COLON,
    },
  );
  const falseExpression = conditionalExpression(grammar);

  return new ASTCConditionalExpression(
    orExpression.loc,
    orExpression,
    trueExpression,
    falseExpression,
  );
}
