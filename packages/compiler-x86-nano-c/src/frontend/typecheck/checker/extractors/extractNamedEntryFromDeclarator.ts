import {ASTCDeclarator} from '@compiler/x86-nano-c/frontend/parser/ast';
import {CTypeCheckError, CTypeCheckErrorCode} from '../../errors/CTypeCheckError';
import {CType} from '../../types';
import {TypeCheckerContext} from '../TypeCheckerContext';
import {TreeTypeBuilderVisitor} from '../visitors/CTreeTypeBuilderVisitor';

type DeclaratorExtractorAttrs = {
  context: TypeCheckerContext,
  type: CType,
  declarator: ASTCDeclarator,
  bitset?: number,
};

/**
 * Extract name => type pair from declarator nodes
 *
 * @export
 * @param {DeclaratorExtractorAttrs} object
 */
export function extractNamedEntryFromDeclarator(
  {
    context,
    type,
    declarator,
  }: DeclaratorExtractorAttrs,
) {
  const buildEntry = (
    new TreeTypeBuilderVisitor(type)
      .setContext(context)
      .visit(declarator)
      .getBuiltEntry()
  );

  if (buildEntry.isAnonymous() || !buildEntry.unwrap()?.type)
    throw new CTypeCheckError(CTypeCheckErrorCode.UNKNOWN_DECLARATOR_ENTRY_IDENTIFIER);

  return buildEntry;
}
