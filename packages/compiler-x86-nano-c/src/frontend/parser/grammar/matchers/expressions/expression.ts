import {ASTCExpression, ASTCCompilerNode} from '../../../ast';
import {CGrammar} from '../shared';
import {fetchSplittedProductionsList} from '../utils';

/**
 * Fetch expression
 *
 * @param {CGrammar} c
 * @returns {ASTCExpression}
 */
export function expression(grammar: CGrammar): ASTCExpression {
  const {g, assignmentExpression} = grammar;
  const assignments = fetchSplittedProductionsList<ASTCCompilerNode>(g, assignmentExpression);

  return new ASTCExpression(
    assignments[0].loc,
    assignments,
  );
}
