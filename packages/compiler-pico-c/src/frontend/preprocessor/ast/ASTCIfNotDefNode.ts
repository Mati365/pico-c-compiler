import { NodeLocation } from '@ts-c-compiler/grammar';

import type { CInterpreterContext } from '../interpreter';
import type { ASTCStmtNode } from './ASTCStmtNode';
import {
  ASTCPreprocessorKind,
  ASTCPreprocessorTreeNode,
} from './ASTCPreprocessorTreeNode';

export class ASTCIfNotDefNode extends ASTCPreprocessorTreeNode {
  constructor(
    loc: NodeLocation,
    readonly macro: string,
    readonly trueStmt: ASTCStmtNode,
    readonly falseStmt?: ASTCStmtNode | null,
  ) {
    super(ASTCPreprocessorKind.IfNotDef, loc);
  }

  override exec(ctx: CInterpreterContext): void {
    if (ctx.isDefined(this.macro)) {
      this.falseStmt?.exec(ctx);
    } else {
      this.trueStmt.exec(ctx);
    }
  }
}
