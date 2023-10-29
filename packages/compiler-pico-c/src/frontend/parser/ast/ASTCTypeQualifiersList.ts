import * as R from 'ramda';

import { dumpAttributesToString } from '@ts-c/core';

import { IsEmpty } from '@ts-c/core';
import { NodeLocation } from '@ts-c/grammar';

import { CTypeQualifier } from '#constants';
import { ASTCCompilerKind, ASTCCompilerNode } from './ASTCCompilerNode';

export class ASTCTypeQualifiersList
  extends ASTCCompilerNode
  implements IsEmpty
{
  constructor(loc: NodeLocation, readonly items: CTypeQualifier[]) {
    super(ASTCCompilerKind.TypeQualifiersList, loc);
  }

  isEmpty() {
    return R.isEmpty(this.items);
  }

  toString() {
    const { kind, items } = this;

    return dumpAttributesToString(kind, {
      items: items?.join(' '),
    });
  }
}
