import {CCOMPILER_TYPE_SPECIFIERS, CTypeSpecifier} from '@compiler/x86-nano-c/constants';
import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {ASTCTypeSpecifier} from '@compiler/x86-nano-c/frontend/ast';
import {CGrammar} from '../shared';

import {enumDeclarator} from '../declarations/enumDeclator';
import {structOrUnionSpecifier} from './structOrUnionSpecifier';

/**
 * type_specifier
 *  : VOID
 *  | CHAR
 *  | SHORT
 *  | INT
 *  | LONG
 *  | FLOAT
 *  | DOUBLE
 *  | SIGNED
 *  | UNSIGNED
 *  | struct_or_union_specifier
 *  | enum_specifier
 *  | TYPE_NAME
 *  ;
 *
 * @export
 * @param {CGrammar} grammar
 * @return {ASTCTypeSpecifier}
 */
export function typeSpecifier(grammar: CGrammar): ASTCTypeSpecifier {
  const {g} = grammar;

  return <ASTCTypeSpecifier> g.or(
    {
      identifier() {
        const specifierToken = g.identifier(CCOMPILER_TYPE_SPECIFIERS);

        return new ASTCTypeSpecifier(
          NodeLocation.fromTokenLoc(specifierToken.loc),
          specifierToken.text as CTypeSpecifier,
        );
      },
      struct() {
        const structOrUnion = structOrUnionSpecifier(grammar);

        return new ASTCTypeSpecifier(
          structOrUnion.loc,
          null, null, null,
          structOrUnion,
        );
      },
      enum() {
        const enumSpecifier = enumDeclarator(grammar);

        return new ASTCTypeSpecifier(
          enumSpecifier.loc,
          null, null,
          enumSpecifier,
        );
      },
    },
  );
}
