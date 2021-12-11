import {walkOverFields} from '@compiler/grammar/decorators/walkOverFields';

import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {ASTCCompilerKind, ASTCCompilerNode} from './ASTCCompilerNode';
import {ASTCSpecifiersQualifiersList} from './ASTCSpecifiersQualifiersList';
import {ASTCStaticAssertDeclaration} from './ASTCStaticAssertDeclaration';
import {ASTCStructDeclaratorList} from './ASTCStructDeclaratorList';

@walkOverFields(
  {
    fields: [
      'specifierList',
      'declaratorList',
      'assertDeclaration',
    ],
  },
)
export class ASTCStructDeclaration extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    public readonly specifierList?: ASTCSpecifiersQualifiersList,
    public readonly declaratorList?: ASTCStructDeclaratorList,
    public readonly assertDeclaration?: ASTCStaticAssertDeclaration,
  ) {
    super(ASTCCompilerKind.StructDeclaration, loc);
  }
}
