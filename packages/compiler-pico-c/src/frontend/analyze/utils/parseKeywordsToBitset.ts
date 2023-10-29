import * as R from 'ramda';

import { Result, err, ok, tryReduce } from '@ts-c-compiler/core';
import {
  CTypeCheckError,
  CTypeCheckErrorCode,
} from '../errors/CTypeCheckError';

type KeywordsParserAttrs = {
  bitmap: Record<string, number>;
  keywords: string[];
  errorCode: CTypeCheckErrorCode;
};

/**
 * Transforms array of keywords into bitset
 *
 * @example
 *  ['long', 'short'] => 0b0110
 */
export function parseKeywordsToBitset({
  bitmap,
  keywords,
  errorCode,
}: KeywordsParserAttrs): Result<number, CTypeCheckError> {
  return tryReduce(
    (acc, keyword) => {
      const bitFlag: number = bitmap[keyword] as any;

      // do not allow to redefine specifier! it is syntax error!
      if (R.isNil(bitFlag) || (acc & bitFlag) !== 0) {
        return err(new CTypeCheckError(errorCode));
      }

      return ok(acc | bitFlag);
    },
    0,
    keywords || [],
  );
}
