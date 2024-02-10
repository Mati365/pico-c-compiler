import { walkOverFields } from '@ts-c-compiler/grammar';

import { NodeLocation } from '@ts-c-compiler/grammar';
import { ASTCCompilerKind, ASTCCompilerNode } from './ASTCCompilerNode';

/**
 * Expressions that can be evaluated during compile time
 */
@walkOverFields({
  fields: ['expression'],
})
export class ASTCConstantExpression extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    readonly expression: ASTCCompilerNode,
  ) {
    super(ASTCCompilerKind.ConstantExpression, loc);
  }
}
