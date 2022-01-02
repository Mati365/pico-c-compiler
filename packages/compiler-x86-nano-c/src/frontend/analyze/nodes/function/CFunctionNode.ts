import * as R from 'ramda';
import {findByName, dumpCompilerAttrs} from '@compiler/core/utils';

import {CFunctionCallConvention} from '@compiler/x86-nano-c/constants';
import {CType} from '../../types/CType';
import {CFunctionSpecifierMonad} from './CFunctionSpecifierMonad';
import {CStorageClassMonad} from './CFunctionStorageClassMonad';
import {CScopedBlockNode} from '../CScopedBlockNode';
import {CScopedBlockNodeDescriptor} from '../CScopedBlockNode';
import {CNamedTypedEntry} from '../../variables/CNamedTypedEntry';

export type CFunctionDescriptor = CScopedBlockNodeDescriptor & {
  name?: string,
  returnType: CType,
  args: CNamedTypedEntry[],
  specifier: CFunctionSpecifierMonad,
  callConvention: CFunctionCallConvention,
  storage: CStorageClassMonad,
};

export function isCFunctionNode(obj: any): obj is CFunctionNode {
  return R.is(Object, obj) && obj.value?.returnType;
}

/**
 * Function typed node
 *
 * @export
 * @class CFunctionNode
 * @extends {CScopedBlockNode<CFunctionDescriptor>}
 */
export class CFunctionNode
  extends CScopedBlockNode<CFunctionDescriptor> {

  get returnType() { return this.value.returnType; }
  get specifier() { return this.value.specifier; }
  get storage() { return this.value.storage; }
  get name() { return this.value.name; }
  get args() { return this.value.args; }
  get callConvention() { return this.value.callConvention; }

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
      },
    );

    return [
      attrs,
      specifier.getDisplayName(),
      storage.getDisplayName(),
      returnType.getDisplayName(),
      name || '<anonymous>',
      `(${serializedArgs}) { ... }`,
    ].filter(Boolean).join(' ');
  }

  /**
   * Lookups in array and returns arg by name
   *
   * @see
   *  It is list search not hash! It is kinda slow!
   *
   * @param {string} name
   * @return {CNamedTypedEntry}
   * @memberof CFunction
   */
  getArgByName(name: string): CNamedTypedEntry {
    const {args} = this;

    return findByName(name)(args);
  }

  /**
   * Returns total byte size of arguments
   *
   * @return {number}
   * @memberof CFunction
   */
  getArgsByteSize(): number {
    return this.args.reduce((acc, arg) => acc + arg.type.getByteSize(), 0);
  }
}
