import * as R from 'ramda';

import {TokenType, TokenKind} from '../shared';
import {TokenLocation} from '../shared/TokenLocation';
import {
  toStringQuoteToken,
  toStringBracketToken,
  flipBracket,
  matchBracket,
} from '../utils/matchCharacter';

export {
  TokenType,
  TokenKind,
};

/**
 * Result of tokenizing phrase
 *
 * @export
 * @class Token
 * @template V value
 */
export class Token<V = any, O = any> {
  public readonly upperText: string;
  public readonly lowerText: string;

  /**
   * sometimes token should be replaced in parse phase
   * see assignLabelsToTokens, labels are replaced by numbers
   * but some instructions like relative jmps can be specified
   * by user using digit or label (label is localized relative to origin)
   */
  public originalToken: Token<O> = null;

  /**
   * Creates an instance of Token.
   *
   * @param {TokenType} type
   * @param {string} text
   * @param {TokenLocation} loc
   * @param {ValueType} [value=null]
   * @memberof Token
   */
  constructor(
    public readonly type: TokenType,
    public readonly kind: TokenKind,
    public readonly text: string,
    public readonly loc: TokenLocation,
    public readonly value: V = null,
  ) {
    this.upperText = text && R.toUpper(text);
    this.lowerText = text && R.toLower(text);
  }

  isReplaced(): boolean {
    return !!this.originalToken;
  }

  fork(newText: string = this.text): Token<V> {
    const {type, kind, loc, value} = this;

    return new Token(
      type,
      kind,
      newText,
      loc,
      value,
    );
  }

  toString() {
    const {text, type, kind} = this;

    switch (type) {
      case TokenType.QUOTE: {
        const quote = toStringQuoteToken(kind);

        return `${quote}${text}${quote}`;
      }

      case TokenType.BRACKET: {
        // lexer consumeBracketContent in lexer config
        if (text.length === 1 && matchBracket(text) !== null)
          return text;

        const bracket = toStringBracketToken(kind);
        return `${bracket}${text}${flipBracket(bracket)}`;
      }

      default:
    }

    return text;
  }
}
