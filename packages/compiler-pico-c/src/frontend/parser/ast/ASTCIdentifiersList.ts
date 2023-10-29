import { dumpAttributesToString } from '@ts-c-compiler/core';
import { joinTokensTexts } from '@ts-c-compiler/lexer';

import { NodeLocation } from '@ts-c-compiler/grammar';
import { Token } from '@ts-c-compiler/lexer';
import { ASTCCompilerKind, ASTCCompilerNode } from './ASTCCompilerNode';

export class ASTCIdentifiersList extends ASTCCompilerNode {
  constructor(loc: NodeLocation, readonly identifiers: Token[]) {
    super(ASTCCompilerKind.IdentifiersList, loc);
  }

  toString() {
    const { kind, identifiers } = this;
    const tokens = identifiers ? joinTokensTexts(' ', identifiers) : '';

    return dumpAttributesToString(kind, {
      identifiers: tokens,
    });
  }
}
