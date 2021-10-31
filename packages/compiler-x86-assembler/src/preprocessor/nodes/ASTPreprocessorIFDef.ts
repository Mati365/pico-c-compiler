import * as R from 'ramda';

import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {TreeVisitor} from '@compiler/grammar/tree/TreeVisitor';

import {
  ASTPreprocessorKind,
  ASTPreprocessorNode,
} from '../constants';

import {
  PreprocessorInterpreter,
  InterpreterResult,
} from '../interpreter/PreprocessorInterpreter';

import {ASTPreprocessorCondition} from './ASTPreprocessorIF';

/**
 * @example
 * %ifdef TEST
 *   mov ax, bx
 * %elif
 *   xor bx, bx
 * %endif
 *
 * @export
 * @class ASTPreprocessorIFDef
 * @extends {ASTPreprocessorNode}
 */
export class ASTPreprocessorIFDef extends ASTPreprocessorCondition {
  constructor(
    loc: NodeLocation,
    negated: boolean,
    public readonly itemName: string,
    consequent: ASTPreprocessorNode,
    alternate: ASTPreprocessorNode = null,
  ) {
    super(ASTPreprocessorKind.IfDefStmt, loc, negated, consequent, alternate);
  }

  /**
   * Exec interpreter on node
   *
   * @param {PreprocessorInterpreter} interpreter
   * @returns {InterpreterResult}
   * @memberof ASTPreprocessorMacro
   */
  exec(interpreter: PreprocessorInterpreter): InterpreterResult {
    const {consequent, alternate, itemName, negated} = this;
    let result = !R.isNil(interpreter.getVariable(itemName)) || interpreter.getCallables(itemName)?.length > 0;
    if (negated)
      result = !result;

    this._result = result;
    if (result)
      return consequent.exec(interpreter);

    return alternate?.exec(interpreter);
  }

  /**
   * Iterates throught tree
   *
   * @param {TreeVisitor<ASTPreprocessorNode>} visitor
   * @memberof ASTPreprocessorIFDef
   */
  walk(visitor: TreeVisitor<ASTPreprocessorNode>): void {
    const {consequent, alternate} = this;

    super.walk(visitor);

    if (consequent)
      visitor.visit(consequent);

    if (alternate)
      visitor.visit(alternate);
  }
}
