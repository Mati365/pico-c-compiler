import { NodeLocation } from '@compiler/grammar/tree/NodeLocation';
import { TokenKind, TokenType } from '@compiler/lexer/shared';

import { ASTCPrimaryExpression } from '../../../ast';
import { CGrammar } from '../shared';

type StringLiteralAttrs = {
  nullTerminator?: boolean;
};

export function stringLiteral(
  grammar: CGrammar,
  { nullTerminator = true }: StringLiteralAttrs = {},
): ASTCPrimaryExpression {
  const { g } = grammar;
  const literal = g.match({
    type: TokenType.QUOTE,
    kind: TokenKind.DOUBLE_QUOTE,
  });

  let text = literal.text;

  do {
    const { currentToken } = g;

    if (
      currentToken.type !== TokenType.QUOTE &&
      currentToken.kind !== TokenKind.DOUBLE_QUOTE
    ) {
      break;
    }

    text += g.currentToken.text;
    g.consume();
  } while (true);

  if (nullTerminator) {
    text = `${text}\0`;
  }

  return new ASTCPrimaryExpression(
    NodeLocation.fromTokenLoc(literal.loc),
    null,
    null,
    text,
  );
}
