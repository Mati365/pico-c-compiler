import { NodeLocation } from '@ts-c/grammar';
import { ASTCPointer } from 'frontend/parser/ast';
import { CGrammar } from '../shared';

import { typeQualifiers } from '../specifiers/typeQualifiers';

/**
 * pointer
 *  : '*' type_qualifier_list pointer
 *  | '*' type_qualifier_list
 *  | '*' pointer
 *  | '*'
 *  ;
 */
export function pointer(grammar: CGrammar): ASTCPointer {
  const { g } = grammar;
  const loc = NodeLocation.fromTokenLoc(g.terminal('*').loc);

  return new ASTCPointer(
    loc,
    g.try(() => typeQualifiers(grammar)),
    g.try(() => pointer(grammar)),
  );
}
