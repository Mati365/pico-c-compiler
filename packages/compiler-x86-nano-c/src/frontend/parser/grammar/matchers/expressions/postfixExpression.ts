/* eslint-disable no-loop-func */
import {isNonIdentifierKeywordToken} from '@compiler/lexer/utils';

import {
  ASTCPostfixArrayExpression,
  ASTCPostfixExpression,
  ASTCPostfixFnExpression,
  ASTCArgumentsExpressionList,
  ASTCPostfixPtrExpression,
  ASTCPostfixDotExpression,
} from '@compiler/x86-nano-c/frontend/parser/ast';

import {TokenType} from '@compiler/lexer/shared';
import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {SyntaxError} from '@compiler/grammar/Grammar';

import {CGrammar} from '../shared';
import {primaryExpression} from './primaryExpression';
import {expression} from './expression';

/**
 * postfix_expression
 *  : primary_expression
 *  | postfix_expression '[' expression ']'
 *  | postfix_expression '(' ')'
 *  | postfix_expression '(' argument_expression_list ')'
 *  | postfix_expression '.' IDENTIFIER
 *  | postfix_expression PTR_OP IDENTIFIER
 *  | postfix_expression INC_OP
 *  | postfix_expression DEC_OP
 *  ;

 * @export
 * @param {CGrammar} grammar
 * @return {ASTCUnaryExpression}
 */
export function postfixExpression(grammar: CGrammar): ASTCPostfixExpression {
  const {g} = grammar;
  let postfixExpressionNode: ASTCPostfixExpression = null;

  do {
    const startLoc = NodeLocation.fromTokenLoc(g.currentToken.loc);

    // eslint-disable-next-line no-loop-func, @typescript-eslint/no-loop-func
    const newPostfixExpressionNode = g.try(() => <ASTCPostfixExpression> g.or(
      {
        primary: () => {
          if (isNonIdentifierKeywordToken(g.prevToken()))
            throw new SyntaxError;

          return new ASTCPostfixExpression(
            startLoc,
            {
              primaryExpression: primaryExpression(grammar),
              postfixExpression: postfixExpressionNode,
            },
          );
        },

        array() {
          g.terminal('[');

          const postfix = new ASTCPostfixExpression(
            startLoc,
            {
              arrayExpression: new ASTCPostfixArrayExpression(startLoc, expression(grammar)),
              postfixExpression: postfixExpressionNode,
            },
          );

          g.terminal(']');
          return postfix;
        },

        function() {
          g.terminal('(');

          let fnExpression = g.try(() => new ASTCPostfixFnExpression(
            startLoc,
            new ASTCArgumentsExpressionList(startLoc, expression(grammar).assignments),
          ));

          if (!fnExpression) {
            fnExpression = new ASTCPostfixFnExpression(
              startLoc,
              new ASTCArgumentsExpressionList(startLoc, []),
            );
          }

          const postfix = new ASTCPostfixExpression(
            startLoc,
            {
              fnExpression,
              postfixExpression: postfixExpressionNode,
            },
          );

          g.terminal(')');
          return postfix;
        },

        dot() {
          g.terminal('.');
          const identifier = g.nonIdentifierKeyword();

          return new ASTCPostfixExpression(
            startLoc,
            {
              postfixExpression: postfixExpressionNode,
              dotExpression: new ASTCPostfixDotExpression(startLoc, identifier),
            },
          );
        },

        ptr() {
          g.terminals('->');
          const identifier = g.nonIdentifierKeyword();

          return new ASTCPostfixExpression(
            startLoc,
            {
              postfixExpression: postfixExpressionNode,
              ptrExpression: new ASTCPostfixPtrExpression(startLoc, identifier),
            },
          );
        },

        incDec() {
          const token = g.match(
            {
              types: [
                TokenType.INCREMENT,
                TokenType.DECREMENT,
              ],
            },
          );

          return new ASTCPostfixExpression(
            startLoc,
            {
              postfixExpression: postfixExpressionNode,
              incExpression: token.type === TokenType.INCREMENT,
              decExpression: token.type === TokenType.DECREMENT,
            },
          );
        },
      },
    ));

    if (!newPostfixExpressionNode)
      break;

    postfixExpressionNode = newPostfixExpressionNode;
  } while (true);

  if (!postfixExpressionNode)
    throw new SyntaxError;

  return postfixExpressionNode;
}
