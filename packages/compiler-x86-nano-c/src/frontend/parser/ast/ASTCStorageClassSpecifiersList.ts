import * as R from 'ramda';

import {dumpAttributesToString} from '@compiler/core/utils';

import {IsEmpty} from '@compiler/core/interfaces/IsEmpty';
import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';

import {CStorageClassSpecifier} from '@compiler/x86-nano-c/constants';
import {ASTCCompilerKind, ASTCCompilerNode} from './ASTCCompilerNode';

export class ASTCStorageClassSpecifiersList extends ASTCCompilerNode implements IsEmpty {
  constructor(
    loc: NodeLocation,
    public readonly items: CStorageClassSpecifier[],
  ) {
    super(ASTCCompilerKind.StorageClassSpecifiersList, loc);
  }

  isEmpty() {
    return R.isEmpty(this.items);
  }

  toString() {
    const {kind, items} = this;

    return dumpAttributesToString(
      kind,
      {
        items: items?.join(' '),
      },
    );
  }
}
