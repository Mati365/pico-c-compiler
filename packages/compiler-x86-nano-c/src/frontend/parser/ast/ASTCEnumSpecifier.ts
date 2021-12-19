import {walkOverFields} from '@compiler/grammar/decorators/walkOverFields';
import {dumpAttributesToString} from '@compiler/core/utils';

import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {Token} from '@compiler/lexer/tokens';
import {ASTCCompilerKind, ASTCCompilerNode} from './ASTCCompilerNode';
import {ASTCEnumEnumeration} from './ASTCEnumEnumerator';

/**
 * Node that holds C enums
 *
 * @export
 * @class ASTCEnumSpecifier
 * @extends {ASTCCompilerNode}
 */
@walkOverFields(
  {
    fields: [
      'enumerations',
    ],
  },
)
export class ASTCEnumSpecifier extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    public readonly name: Token<string>,
    public readonly enumerations: ASTCEnumEnumeration[],
  ) {
    super(ASTCCompilerKind.EnumSpecifier, loc);
  }

  toString() {
    const {kind, name} = this;

    return dumpAttributesToString(
      kind,
      {
        name,
      },
    );
  }
}
