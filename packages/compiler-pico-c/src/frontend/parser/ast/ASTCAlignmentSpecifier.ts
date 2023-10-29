import { walkOverFields } from '@ts-c-compiler/grammar';

import { NodeLocation } from '@ts-c-compiler/grammar';
import { ASTCCompilerKind, ASTCCompilerNode } from './ASTCCompilerNode';
import { ASTCConstantExpression } from './ASTCConstantExpression';
import { ASTCTypeName } from './ASTCTypeName';

@walkOverFields({
  fields: ['specifiers', 'expression'],
})
export class ASTCAlignmentSpecifier extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    readonly typename: ASTCTypeName,
    readonly expression?: ASTCConstantExpression,
  ) {
    super(ASTCCompilerKind.AlignmentSpecifier, loc);
  }
}
