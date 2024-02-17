import { replaceEscapeSequences } from '@ts-cc/core';

import { NodeLocation } from '@ts-cc/grammar';
import { TokenKind, TokenType } from '@ts-cc/lexer';
import { ASTCPrimaryExpression } from 'frontend/parser/ast';
import { expression } from './expression';
import { CGrammar } from '../shared';
import { CGrammarError, CGrammarErrorCode } from '../../errors/CGrammarError';
import { stringLiteral } from '../types';

/**
 * primary_expression
 *  : IDENTIFIER
 *  | constant
 *  | string
 *  | '(' expression ')'
 *  | generic_selection
 *  ;
 */
export function primaryExpression(grammar: CGrammar): ASTCPrimaryExpression {
  const { g, compoundExpressionStatement } = grammar;

  return <ASTCPrimaryExpression>g.or({
    identifier() {
      const identifier = g.nonIdentifierKeyword();

      return new ASTCPrimaryExpression(
        NodeLocation.fromTokenLoc(identifier.loc),
        identifier,
      );
    },

    constant() {
      const constant = g.match({
        types: [TokenType.NUMBER, TokenType.FLOAT_NUMBER],
      });

      return new ASTCPrimaryExpression(
        NodeLocation.fromTokenLoc(constant.loc),
        null,
        constant,
      );
    },

    charLiteral() {
      const literal = g.match({
        type: TokenType.QUOTE,
        kind: TokenKind.SINGLE_QUOTE,
      });

      const escapedContent = replaceEscapeSequences(literal.text);

      // handle 'a'
      if (escapedContent.length !== 1) {
        throw new CGrammarError(
          CGrammarErrorCode.INCORRECT_CHAR_LITERAL_LENGTH,
          literal.loc,
          {
            text: literal.text,
          },
        );
      }

      return new ASTCPrimaryExpression(
        NodeLocation.fromTokenLoc(literal.loc),
        null,
        null,
        null,
        escapedContent,
      );
    },

    stringLiteral() {
      return stringLiteral(grammar);
    },

    compound() {
      const stmt = compoundExpressionStatement();

      return new ASTCPrimaryExpression(stmt.loc, null, null, null, null, stmt);
    },

    expr() {
      g.terminal('(');
      const expressionNode = expression(grammar);
      g.terminal(')');

      return new ASTCPrimaryExpression(
        expressionNode.loc,
        null,
        null,
        null,
        null,
        expressionNode,
      );
    },
  });
}
