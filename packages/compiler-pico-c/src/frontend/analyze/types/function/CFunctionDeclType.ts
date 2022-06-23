import * as R from 'ramda';

import {findByName, dumpCompilerAttrs} from '@compiler/core/utils';

import {CFunctionCallConvention} from '@compiler/pico-c/constants';
import {Identity} from '@compiler/core/monads';
import {ASTCBlockItemsList} from '@compiler/pico-c/frontend';

import {CType, CTypeDescriptor} from '../CType';
import {CPrimitiveType} from '../CPrimitiveType';
import {CFunctionSpecifierMonad} from './CFunctionSpecifierMonad';
import {CStorageClassMonad} from './CFunctionStorageClassMonad';
import {CVariable} from '../../scope/variables/CVariable';
import {CSpecBitmap} from '../../constants/bitmaps';

export function isFuncDeclLikeType(type: CType): type is CFunctionDeclType {
  return type?.isFunction();
}

export type CFunctionDescriptor = CTypeDescriptor & {
  name?: string,
  returnType: CType,
  args: CVariable[],
  specifier: CFunctionSpecifierMonad,
  callConvention: CFunctionCallConvention,
  storage: CStorageClassMonad,
  definition?: ASTCBlockItemsList,
};

/**
 * Function and argument types
 *
 * @export
 * @class CFunctionDeclType
 * @extends {CType<CFunctionDescriptor>}
 */
export class CFunctionDeclType extends CType<CFunctionDescriptor> {
  get returnType() { return this.value.returnType; }
  get specifier() { return this.value.specifier; }
  get storage() { return this.value.storage; }
  get name() { return this.value.name; }
  get args() { return this.value.args; }
  get callConvention() { return this.value.callConvention; }
  get definition() { return this.value.definition; }

  override isFunction() { return true; }
  hasDefinition() { return !!this.definition; }

  /**
   * Handle case when function looks like this:
   *  int main() { ... }
   *
   * User can pass any amount of args
   *
   * @return {boolean}
   * @memberof CFunctionDeclType
   */
  hasUknownArgsList(): boolean {
    return R.isEmpty(this.args);
  }

  /**
   * Handle case when function looks like this:
   *  int main(void) {}
   *
   * @return {boolean}
   * @memberof CFunctionDeclType
   */
  isVoidArgsList(): boolean {
    const {args} = this;
    if (args.length !== 1)
      return false;

    const [firstArg] = args;
    return (
      firstArg.type instanceof CPrimitiveType
        && firstArg.type.specifiers === CSpecBitmap.void
        && !firstArg.type.qualifiers
        && !firstArg.name
    );
  }

  /**
   * Compares two function declarations
   *
   * @memberof CFunctionDeclType
   */
  override isEqual(value: Identity<CFunctionDescriptor>): boolean {
    if (!(value instanceof CFunctionDeclType))
      return false;

    const {
      returnType, storage, specifier,
      callConvention, args,
    } = this;

    if (!value.returnType?.isEqual(returnType)
        || !value.storage?.isEqual(storage)
        || !value.specifier?.isEqual(specifier)
        || value.callConvention !== callConvention
        || value.args?.length !== args.length)
      return false;

    return !args.some((arg, index) => !value.args[index].isEqual(arg));
  }

  /**
   * Serializes function to string
   *
   * @memberof CFunctionDeclType
   */
  override getDisplayName(): string {
    const {
      returnType, args, name,
      storage, specifier,
      callConvention,
    } = this;

    const serializedArgs = (
      args
        .map((arg) => arg.getDisplayName())
        .join(', ')
    );

    const attrs = dumpCompilerAttrs(
      {
        callConvention,
        argsSizeof: this.getArgsByteSize(),
        returnSizeof: this.returnType?.getByteSize() ?? 0,
      },
    );

    return [
      attrs,
      specifier.getDisplayName(),
      storage.getDisplayName(),
      returnType.getShortestDisplayName(),
      name || '<anonymous>',
      `(${serializedArgs}) { ... }`,
    ].filter(Boolean).join(' ');
  }

  /**
   * Serializes type to shortest string
   *
   * @memberof CFunctionDeclType
   */
  override getShortestDisplayName(): string {
    const {name, args, returnType} = this;
    const argsStr = args.map((arg) => arg.type.getShortestDisplayName()).join(', ');

    return `${returnType.getShortestDisplayName()}${name ? ` ${name}` : ''}(${argsStr})`;
  }

  /**
   * Lookups in array and returns arg by name
   *
   * @param {string} name
   * @return {CVariable}
   * @memberof CFunctionDeclType
   */
  getArgByName(name: string): CVariable {
    const {args} = this;

    return findByName(name)(args);
  }

  /**
   * Returns total byte size of arguments
   *
   * @return {number}
   * @memberof CFunctionDeclType
   */
  getArgsByteSize(): number {
    return this.args.reduce((acc, arg) => acc + arg.type.getByteSize(), 0);
  }
}
