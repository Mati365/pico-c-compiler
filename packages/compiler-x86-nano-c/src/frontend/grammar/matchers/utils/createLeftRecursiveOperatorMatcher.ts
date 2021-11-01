/* eslint-disable @typescript-eslint/no-use-before-define, no-use-before-define */
import {empty} from '@compiler/grammar/matchers';
import {safeArray} from '@compiler/core/utils';

import {CanBeArray} from '@compiler/core/types';
import {TokenType} from '@compiler/lexer/shared';
import {CGrammar} from '../shared';
import {
  ASTCBinaryOpNode,
  ASTCTreeNode,
  createBinOpIfBothSidesPresent,
} from '../../../ast';

export function createLeftRecursiveOperatorMatcher(
  operator: CanBeArray<TokenType>,
  parentExpression: (grammar: CGrammar) => ASTCTreeNode,
) {
  /**
   * @see
   * op = term op'
   * op = ε
   * op' = "OPERATOR" term op'
   */
  function op(grammar: CGrammar): ASTCTreeNode {
    const {g} = grammar;

    return <ASTCTreeNode> g.or(
      {
        value() {
          return createBinOpIfBothSidesPresent(
            ASTCBinaryOpNode,
            null,
            parentExpression(grammar),
            opPrim(grammar),
          );
        },
        empty,
      },
    );
  }

  function opPrim(grammar: CGrammar): ASTCTreeNode {
    const {g} = grammar;

    return <ASTCTreeNode> g.or(
      {
        op() {
          const token = g.match(
            {
              types: safeArray(operator),
            },
          );

          return new ASTCBinaryOpNode(
            token.type,
            parentExpression(grammar),
            opPrim(grammar),
          );
        },
        empty,
      },
    );
  }

  return {
    op,
  };
}
