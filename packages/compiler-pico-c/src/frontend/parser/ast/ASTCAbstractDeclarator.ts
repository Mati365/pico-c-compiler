import { walkOverFields } from '@ts-c/grammar';

import { NodeLocation } from '@ts-c/grammar';
import { ASTCCompilerKind, ASTCCompilerNode } from './ASTCCompilerNode';
import { ASTCDirectDeclaratorArrayExpression } from './ASTCDirectDeclarator';
import { ASTCPointer } from './ASTCPointer';

@walkOverFields({
  fields: ['pointer', 'directAbstractDeclarator'],
})
export class ASTCAbstractDeclarator extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    readonly pointer: ASTCPointer,
    readonly directAbstractDeclarator?: ASTCDirectDeclaratorArrayExpression,
  ) {
    super(ASTCCompilerKind.AbstractDeclarator, loc);
  }

  isPointer() {
    return !!this.pointer;
  }
}
