import {TokenType} from '@compiler/lexer/shared';
import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {CCompilerKeyword} from '@compiler/x86-nano-c/constants';
import {CGrammar} from '../shared';
import {
  ASTCCompilerNode,
  ASTCBreakStatement,
  ASTCContinueStatement,
  ASTCGotoStatement,
  ASTCReturnStatement,
} from '../../../ast';

import {expression} from '../expressions/expression';

/**
 * jump_statement
 *  : GOTO IDENTIFIER ';'
 *  | CONTINUE ';'
 *  | BREAK ';'
 *  | RETURN ';'
 *  | RETURN expression ';'
 *  ;
 *
 * @export
 * @param {CGrammar} grammar
 * @return {ASTCCompilerNode}
 */
export function jumpStatement(grammar: CGrammar): ASTCCompilerNode {
  const {g} = grammar;
  const jumpNode = <ASTCCompilerNode> g.or(
    {
      goto() {
        const node = g.identifier(CCompilerKeyword.GOTO);

        return new ASTCGotoStatement(
          NodeLocation.fromTokenLoc(node.loc),
          g.nonIdentifierKeyword(),
        );
      },

      continue() {
        const node = g.identifier(CCompilerKeyword.CONTINUE);

        return new ASTCContinueStatement(
          NodeLocation.fromTokenLoc(node.loc),
        );
      },

      break() {
        const node = g.identifier(CCompilerKeyword.BREAK);

        return new ASTCBreakStatement(
          NodeLocation.fromTokenLoc(node.loc),
        );
      },

      return() {
        const node = g.identifier(CCompilerKeyword.RETURN);

        return new ASTCReturnStatement(
          NodeLocation.fromTokenLoc(node.loc),
          g.try(() => expression(grammar)),
        );
      },
    },
  );

  g.terminalType(TokenType.SEMICOLON);
  return jumpNode;
}
