import { Token, TokenType, isEOFToken } from '@ts-cc/lexer';
import type { TokensIterator } from '../tree/TokensIterator';

/**
 * Fetch tokens until breakFn is not true
 */
export function fetchTokensUntil(
  breakFn: (token: Token) => boolean,
  parser: TokensIterator,
  excludeBreakToken?: boolean,
): Token[] {
  const tokens: Token[] = [];

  do {
    const token = excludeBreakToken
      ? parser.fetchRelativeToken(0, false)
      : parser.consume();

    if (!token || breakFn(token)) {
      break;
    }

    if (excludeBreakToken) {
      parser.consume();
    }

    tokens.push(token);
  } while (true);

  return tokens;
}

/**
 * Eats tokens until token type
 */
export function fetchTokensUntilTokenType(
  type: TokenType,
  parser: TokensIterator,
  excludeBreakToken?: boolean,
) {
  return fetchTokensUntil(
    token => isEOFToken(token) || token.type === type,
    parser,
    excludeBreakToken,
  );
}
