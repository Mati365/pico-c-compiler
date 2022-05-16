import * as R from 'ramda';

import {
  TokenLocation,
  TokenType,
  Token,
  TokenKind,
} from '@compiler/lexer/tokens';

import {COMPILER_REGISTERS_SET, RegisterSchema} from '../../../constants';

type RegisterTokenValue = {
  byteSize: number,
  schema: RegisterSchema,
};

/**
 * Token which matches schema of register basic X86 instruction set
 *
 * @export
 * @class RegisterToken
 * @extends {Token<RegisterSchema>}
 */
export class RegisterToken extends Token<RegisterTokenValue> {
  constructor(
    text: string,
    schema: RegisterSchema,
    loc: TokenLocation,
  ) {
    super(
      TokenType.KEYWORD,
      TokenKind.REGISTER,
      text,
      loc,
      {
        schema,
        byteSize: schema.byteSize,
      },
    );
  }

  /**
   * Matches token phrase with register schema
   *
   * @static
   * @param {string} token
   * @param {TokenLocation} loc
   * @returns {RegisterToken}
   * @memberof RegisterToken
   */
  static parse(token: string, loc: TokenLocation): RegisterToken {
    const schema = COMPILER_REGISTERS_SET[R.toLower(token)];
    if (schema)
      return new RegisterToken(token, schema, loc.clone());

    return null;
  }
}
