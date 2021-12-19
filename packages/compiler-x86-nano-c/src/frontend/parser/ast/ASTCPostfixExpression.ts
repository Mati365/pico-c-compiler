import {dumpAttributesToString} from '@compiler/core/utils';
import {walkOverFields} from '@compiler/grammar/decorators/walkOverFields';

import {Token} from '@compiler/lexer/tokens';
import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {ASTCCompilerNode, ASTCCompilerKind} from './ASTCCompilerNode';
import {ASTCPrimaryExpression} from './ASTCPrimaryExpression';
import {ASTCExpression} from './ASTCExpression';
import {ASTCArgumentsExpressionList} from './ASTCArgumentsExpressionList';

@walkOverFields(
  {
    fields: ['expression'],
  },
)
export class ASTCPostfixArrayExpression extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    public readonly expression: ASTCExpression,
  ) {
    super(ASTCCompilerKind.PostfixArrayExpression, loc);
  }
}

@walkOverFields(
  {
    fields: ['args'],
  },
)
export class ASTCPostfixFnExpression extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    public readonly args: ASTCArgumentsExpressionList,
  ) {
    super(ASTCCompilerKind.PostfixFnExpression, loc);
  }
}

export class ASTCPostfixDotExpression extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    public readonly name: Token<string>,
  ) {
    super(ASTCCompilerKind.PostfixDotExpression, loc);
  }

  toString() {
    const {kind, name} = this;

    return dumpAttributesToString(
      kind,
      {
        name: name.text,
      },
    );
  }
}

export class ASTCPostfixPtrExpression extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    public readonly name: Token<string>,
  ) {
    super(ASTCCompilerKind.PostfixPtrExpression, loc);
  }

  toString() {
    const {kind, name} = this;

    return dumpAttributesToString(
      kind,
      {
        name: name.text,
      },
    );
  }
}

@walkOverFields(
  {
    fields: [
      'postfixExpression',
      'primaryExpression',
      'arrayExpression',
      'fnExpression',
      'dotExpression',
      'ptrExpression',
    ],
  },
)
export class ASTCPostfixExpression extends ASTCCompilerNode {
  public readonly primaryExpression: ASTCPrimaryExpression;
  public readonly arrayExpression: ASTCPostfixArrayExpression;
  public readonly fnExpression: ASTCPostfixFnExpression;
  public readonly dotExpression: ASTCPostfixDotExpression;
  public readonly ptrExpression: ASTCPostfixPtrExpression;
  public readonly incExpression: boolean;
  public readonly decExpression: boolean;
  public readonly postfixExpression: ASTCPostfixExpression;

  constructor(loc: NodeLocation, attrs: Partial<ASTCPostfixExpression>) {
    super(ASTCCompilerKind.PostfixExpression, loc);
    Object.assign(this, attrs);
  }

  toString() {
    const {kind, incExpression, decExpression} = this;

    return dumpAttributesToString(
      kind,
      {
        incExpression,
        decExpression,
      },
    );
  }
}
