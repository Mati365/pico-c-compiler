import {walkOverFields} from '@compiler/grammar/decorators/walkOverFields';

import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {ASTCCompilerKind, ASTCCompilerNode} from './ASTCCompilerNode';

@walkOverFields(
  {
    fields: [
      'expression',
    ],
  },
)
export class ASTCReturnStatement extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    public readonly expression?: ASTCCompilerNode,
  ) {
    super(ASTCCompilerKind.ReturnStmt, loc);
  }
}
