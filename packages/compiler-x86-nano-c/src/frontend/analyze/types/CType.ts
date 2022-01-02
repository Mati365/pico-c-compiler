import {hasFlag} from '@compiler/core/utils';

import {IsPrintable} from '@compiler/core/interfaces';
import {Identity, Result} from '@compiler/core/monads';
import {CCompilerArch, CTypeQualifier} from '@compiler/x86-nano-c/constants';
import {CTypeCheckError, CTypeCheckErrorCode} from '../errors/CTypeCheckError';
import {CQualBitmap} from '../constants';

import {bitsetToKeywords, parseKeywordsToBitset} from '../utils';

type CTypeDescriptor<T extends {}> = T & {
  arch: CCompilerArch,
  qualifiers?: number,
  registered?: boolean, // checks if type is newly created or not
};

/**
 * Abstract C type
 *
 * @export
 * @abstract
 * @class CType
 * @extends {Identity<CTypeDescriptor<T>>}
 * @implements {IsPrintable}
 * @template T
 */
export abstract class CType<T extends {} = any>
  extends Identity<CTypeDescriptor<T>>
  implements IsPrintable {

  get arch() { return this.value.arch; }
  get qualifiers() { return this.value.qualifiers; }

  /**
   * Creates instance that has registered=true flag.
   * Registered flag indicates that type is present in registry
   *
   * @param {boolean} [registered=true]
   * @return {this}
   * @memberof CType
   */
  ofRegistered(registered: boolean = true): this {
    return this.map((value) => ({
      ...value,
      registered,
    }));
  }

  /**
   * Appends qualifiers to type
   *
   * @param {number} qualifiers
   * @return {this}
   * @memberof CType
   */
  ofQualifiers(qualifiers: number): this {
    return this.map((value) => ({
      ...value,
      qualifiers,
    }));
  }

  isRegistered() { return this.value.registered; }
  isIndexable() { return false; }
  isEnum() { return false; }
  isPrimitive() { return false; }
  isStruct() { return false; }

  isConst() {
    return this.hasQualifierType(CQualBitmap.const);
  }

  isVolatile() {
    return !this.hasQualifierType(CQualBitmap.volatile);
  }

  toString() {
    return this.getDisplayName();
  }

  getQualifiersDisplayName(): string {
    return bitsetToKeywords(CQualBitmap, this.qualifiers).join(' ');
  }

  hasQualifierType(types: number): boolean {
    return hasFlag(types, this.qualifiers);
  }

  /**
   * Converts whole type to string
   *
   * @abstract
   * @return {string}
   * @memberof CType
   */
  abstract getDisplayName(): string;

  /**
   * Gets size of type in bytes
   *
   * @return {number}
   * @memberof CType
   */
  getByteSize(): number {
    return null;
  }

  /**
   * Converts array of string type qualifiers into internal bitset format
   *
   * @static
   * @param {CTypeQualifier[]} qualifiers
   * @return {Result<number, CTypeCheckError>}
   * @memberof CType
   */
  static qualifiersToBitset(qualifiers: CTypeQualifier[]): Result<number, CTypeCheckError> {
    return parseKeywordsToBitset(
      {
        errorCode: CTypeCheckErrorCode.UNKNOWN_QUALIFIERS_KEYWORD,
        bitmap: CQualBitmap,
        keywords: qualifiers,
      },
    );
  }
}
