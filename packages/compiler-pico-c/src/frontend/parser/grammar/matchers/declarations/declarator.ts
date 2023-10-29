import { ASTCDeclarator } from 'frontend/parser/ast';
import { CGrammar } from '../shared';
import { pointer } from './pointer';
import { directDeclarator } from './directDeclarator';

/**
 * declarator
 * : pointer direct_declarator
 * | direct_declarator
 * ;
 */
export function declarator(grammar: CGrammar): ASTCDeclarator {
  const { g } = grammar;

  const pointerNode = g.try(() => pointer(grammar));
  const directDeclaratorNode = directDeclarator(grammar);

  return new ASTCDeclarator(
    (pointerNode || directDeclaratorNode).loc,
    pointerNode,
    directDeclaratorNode,
  );
}
