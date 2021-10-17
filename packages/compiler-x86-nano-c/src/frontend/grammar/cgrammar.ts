/* eslint-disable @typescript-eslint/no-use-before-define, no-use-before-define */
import * as R from 'ramda';

import {empty} from '@compiler/grammar/matchers';

import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {
  Grammar,
  GrammarInitializer,
  GrammarProductions,
} from '@compiler/grammar/Grammar';

import {ASTCCompilerKind, ASTCCompilerNode} from '../ast/ASTCCompilerNode';
import {CCompilerIdentifier} from '../../constants';
import {ASTCStmt} from '../ast';

import {
  functionDeclaration,
  returnStmt,
  blockStmt,
  ifStmt,
  assignExpression,
  variableDeclaration,
  CGrammar,
} from './matchers';

/**
 * @see {@link https://www.lysator.liu.se/c/ANSI-C-grammar-y.html}
 * @see {@link https://cs.wmich.edu/~gupta/teaching/cs4850/sumII06/The%20syntax%20of%20C%20in%20Backus-Naur%20form.htm}
 */
const compilerMatcher: GrammarInitializer<CCompilerIdentifier, ASTCCompilerKind> = ({g}) => {
  const grammar: CGrammar = {
    g,
    stmt,
  };

  const stmts = R.mapObjIndexed<any, GrammarProductions<ASTCCompilerKind>>(
    R.partial(R.__ as any, [grammar]),
    {
      functionDeclaration,
      returnStmt,
      blockStmt,
      ifStmt,
      assignExpression,
      variableDeclaration,
    },
  );

  /**
   * Matches list of ast compiler nodes
   */
  function stmt(): ASTCStmt {
    return new ASTCStmt(
      NodeLocation.fromTokenLoc(g.currentToken.loc),
      <ASTCCompilerNode[]> g.matchList(
        {
          ...stmts,
          empty,
        },
      ),
    );
  }

  return stmt;
};

export function createCCompilerGrammar() {
  return Grammar.build(
    {
      ignoreMatchCallNesting: true,
    },
    compilerMatcher,
  );
}
