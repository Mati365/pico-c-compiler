import * as E from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';

import type { Token } from '@ts-c-compiler/lexer';

import { CPreprocessorError, CPreprocessorErrorCode } from './grammar';
import { preprocessTokens } from './interpreter';

export const safePreprocess = (
  tokens: Token[],
): E.Either<CPreprocessorError[], Token[]> => {
  try {
    return pipe(tokens, preprocessTokens, E.right);
  } catch (e) {
    e.code = e.code ?? CPreprocessorErrorCode.SYNTAX_ERROR;

    return E.left([e]);
  }
};
