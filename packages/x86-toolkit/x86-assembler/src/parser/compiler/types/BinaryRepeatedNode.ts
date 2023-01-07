import * as R from 'ramda';

import {
  ParserError,
  ParserErrorCode,
} from '@x86-toolkit/assembler/shared/ParserError';
import { ASTTimes } from '../../ast/critical/ASTTimes';
import { ASTAsmTree } from '../../ast/ASTAsmParser';
import { ASTAsmNode } from '../../ast/ASTAsmNode';
import { ASTLabelAddrResolver } from '../../ast/instruction/ASTResolvableArg';

import { BinaryBlob } from '../BinaryBlob';
import { X86Compiler } from '../X86Compiler';
import { FirstPassResult } from '../BinaryPassResults';

import { rpnTokens } from '../utils';

/**
 * Define binary set of data
 */
export class BinaryRepeatedNode extends BinaryBlob<ASTTimes> {
  /**
   * Emits repeated instructions
   */
  pass(
    compiler: X86Compiler,
    offset: number,
    labelResolver: ASTLabelAddrResolver,
  ): FirstPassResult {
    const {
      ast: { loc, timesExpression, repatedNodesTree },
    } = this;

    const times = rpnTokens(timesExpression, {
      keywordResolver: labelResolver,
    });

    if (times < 0) {
      throw new ParserError(ParserErrorCode.INCORRECT_TIMES_VALUE, loc.start, {
        times,
      });
    }

    const topAstNode: ASTAsmNode = repatedNodesTree.astNodes[0];
    const compiledPass = compiler.firstPass(
      new ASTAsmTree(R.times(() => topAstNode.clone(), times)),
      true,
      offset,
    );

    return compiledPass;
  }
}
