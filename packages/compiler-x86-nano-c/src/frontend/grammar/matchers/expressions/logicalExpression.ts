/* eslint-disable @typescript-eslint/no-use-before-define, no-use-before-define */
import {empty} from '@compiler/grammar/matchers';

import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {TokenType} from '@compiler/lexer/shared';
import {CGrammar} from '../shared';
import {CReducePostfixOperatorsVisitor} from '../utils/CReducePostfixOperatorVisitor';
import {
  ASTCCompilerKind,
  ASTCBinaryOpNode,
  ASTCTreeNode,
  ASTCValueNode,
  createBinOpIfBothSidesPresent,
} from '../../../ast';

function term({g}: CGrammar) {
  const token = g.match(
    {
      type: TokenType.NUMBER,
    },
  );

  return new ASTCValueNode(
    ASTCCompilerKind.Value,
    NodeLocation.fromTokenLoc(token.loc),
    [token],
  );
}

/**
 * @see
 * and = term and'
 * and = ε
 * and' = "&&" term and'
 */
function andOp(grammar: CGrammar): ASTCTreeNode {
  const {g} = grammar;

  return <ASTCTreeNode> g.or(
    {
      and() {
        return createBinOpIfBothSidesPresent(
          ASTCBinaryOpNode,
          null,
          term(grammar),
          andOpPrim(grammar),
        );
      },
      empty,
    },
  );
}

function andOpPrim(grammar: CGrammar): ASTCTreeNode {
  const {g} = grammar;

  return <ASTCTreeNode> g.or(
    {
      and() {
        g.match(
          {
            type: TokenType.AND,
          },
        );

        return new ASTCBinaryOpNode(
          TokenType.AND,
          term(grammar),
          andOpPrim(grammar),
        );
      },
      empty,
    },
  );
}

/**
 * @see
 * or = and or'
 * or = ε
 * or' = "||" and or'
 */
function orOp(grammar: CGrammar): ASTCTreeNode {
  const {g} = grammar;

  return <ASTCTreeNode> g.or(
    {
      value() {
        return createBinOpIfBothSidesPresent(
          ASTCBinaryOpNode,
          null,
          andOp(grammar),
          orOpPrim(grammar),
        );
      },
      empty,
    },
  );
}

function orOpPrim(grammar: CGrammar): ASTCTreeNode {
  const {g} = grammar;

  return <ASTCTreeNode> g.or(
    {
      or() {
        g.match(
          {
            type: TokenType.OR,
          },
        );

        return new ASTCBinaryOpNode(
          TokenType.OR,
          andOp(grammar),
          orOpPrim(grammar),
        );
      },
      empty,
    },
  );
}

export function logicalOrExpression(grammar: CGrammar, reducePostFixOps: boolean = true): ASTCTreeNode {
  const expression = orOp(grammar);

  if (reducePostFixOps)
    (new CReducePostfixOperatorsVisitor).visit(expression);

  return expression;
}
