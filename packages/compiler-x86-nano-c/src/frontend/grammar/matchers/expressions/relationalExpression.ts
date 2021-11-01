/* eslint-disable @typescript-eslint/no-use-before-define, no-use-before-define */
import {TokenType} from '@compiler/lexer/shared';
import {CGrammar} from '../shared';
import {ASTCTreeNode} from '../../../ast';

import {createLeftRecursiveOperatorMatcher} from '../utils';
import {shiftExpression} from './shiftExpression';

const relationOp = createLeftRecursiveOperatorMatcher(
  [
    TokenType.LESS_THAN,
    TokenType.LESS_EQ_THAN,
    TokenType.GREATER_THAN,
    TokenType.GREATER_EQ_THAN,
  ],
  shiftExpression,
).op;

export function relationalExpression(grammar: CGrammar): ASTCTreeNode {
  const {g} = grammar;

  return <ASTCTreeNode> g.or(
    {
      equalOp: () => relationOp(grammar),
      empty: () => shiftExpression(grammar),
    },
  );
}
