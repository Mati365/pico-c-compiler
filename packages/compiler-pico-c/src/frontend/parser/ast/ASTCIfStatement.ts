import { walkOverFields } from '@ts-c-compiler/grammar';

import { NodeLocation } from '@ts-c-compiler/grammar';
import { ASTCCompilerKind, ASTCCompilerNode } from './ASTCCompilerNode';

@walkOverFields({
  fields: ['logicalExpression', 'trueExpression', 'falseExpression'],
})
export class ASTCIfStatement extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    readonly logicalExpression: ASTCCompilerNode,
    readonly trueExpression: ASTCCompilerNode,
    readonly falseExpression?: ASTCCompilerNode,
  ) {
    super(ASTCCompilerKind.IfStmt, loc);
  }
}
