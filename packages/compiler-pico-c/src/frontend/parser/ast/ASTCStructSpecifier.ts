import * as R from 'ramda';

import { dumpAttributesToString } from '@compiler/core/utils';
import { walkOverFields } from '@compiler/grammar/decorators/walkOverFields';

import { Token } from '@compiler/lexer/tokens';
import { NodeLocation } from '@compiler/grammar/tree/NodeLocation';
import { ASTCCompilerKind, ASTCCompilerNode } from './ASTCCompilerNode';
import { ASTCStructDeclarationList } from './ASTCStructDeclarationList';

@walkOverFields({
  fields: ['list'],
})
export class ASTCStructSpecifier extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    readonly list: ASTCStructDeclarationList,
    readonly name?: Token<string>,
    kind: ASTCCompilerKind = ASTCCompilerKind.StructSpecifier,
  ) {
    super(kind, loc);
  }

  hasDeclarationList() {
    return !R.isNil(this.list);
  }

  toString() {
    const { kind, name } = this;

    return dumpAttributesToString(kind, {
      name: name?.text,
    });
  }
}
