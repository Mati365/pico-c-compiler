import { fixme } from '@ts-c/core';

import { Option, none, some } from '@ts-c/core';
import { TokenType } from '@ts-c/lexer';

import { IRError, IRErrorCode } from '../../../errors/IRError';
import { IRConstant, isIRConstant, isIRVariable } from '../../../variables';
import {
  IRInstruction,
  IRMathInstruction,
  isIRMathInstruction,
} from '../../../instructions';

const canConcatOperators = (a: TokenType, b: TokenType) => {
  if ([a, b].every(arg => arg === TokenType.PLUS || arg === TokenType.MINUS)) {
    return true;
  }

  if ([a, b].every(arg => arg === TokenType.MUL || arg === TokenType.DIV)) {
    return true;
  }

  return false;
};

const flipOperator = (op: TokenType) => {
  switch (op) {
    case TokenType.PLUS:
      return TokenType.MINUS;
    case TokenType.MINUS:
      return TokenType.PLUS;
    case TokenType.MUL:
      return TokenType.DIV;
    case TokenType.DIV:
      return TokenType.MUL;

    default:
      return null;
  }
};

const evalConcatedOperands = (
  aOp: TokenType,
  aValue: number,
  bOp: TokenType,
  bValue: number,
) => {
  switch (aOp) {
    case TokenType.MINUS:
      return bOp === TokenType.MINUS ? aValue + bValue : aValue - bValue;

    case TokenType.PLUS:
      return bOp === TokenType.MINUS ? aValue - bValue : aValue + bValue;

    case TokenType.DIV:
      return bOp === TokenType.DIV ? aValue * bValue : aValue / bValue;

    case TokenType.MUL:
      return bOp === TokenType.DIV ? aValue / bValue : aValue * bValue;

    default:
      throw new IRError(IRErrorCode.INCORRECT_UNARY_EXPR);
  }
};

type InstructionConcatArgs = {
  a: IRInstruction;
  b: IRInstruction;
};

export function tryConcatMathInstructions({
  a,
  b,
}: InstructionConcatArgs): Option<IRInstruction> {
  if (!a || !b) {
    return none();
  }

  if (isIRMathInstruction(a) && isIRMathInstruction(b)) {
    const flippedA = a.tryFlipConstantsToRight().unwrapOr<IRMathInstruction>(a);
    const flippedB = b.tryFlipConstantsToRight().unwrapOr<IRMathInstruction>(b);

    const aArg = isIRConstant(flippedA.rightVar) && flippedA.rightVar;
    const bArg = isIRConstant(flippedB.rightVar) && flippedB.rightVar;

    if (
      !aArg ||
      !bArg ||
      !isIRVariable(flippedB.leftVar) ||
      !flippedB.leftVar.isShallowEqual(flippedA.outputVar) ||
      !canConcatOperators(flippedA.operator, flippedB.operator)
    ) {
      return none();
    }

    if (flippedA.hasBothConstantArgs() || flippedB.hasBothConstantArgs()) {
      console.warn(
        fixme(
          'Compare args should not have both constant args! Propable const eval bug!',
        ),
      );
    }

    const evalResult = evalConcatedOperands(
      flippedA.operator,
      aArg.constant,
      flippedB.operator,
      bArg.constant,
    );

    if (
      [TokenType.MINUS, TokenType.PLUS].includes(flippedA.operator) &&
      Math.sign(evalResult) === -1
    ) {
      return some(
        new IRMathInstruction(
          flipOperator(flippedA.operator),
          flippedA.getFirstVarArg(),
          IRConstant.ofConstant(aArg.type, -evalResult),
          flippedB.outputVar,
        ),
      );
    }

    return some(
      new IRMathInstruction(
        flippedA.operator,
        flippedA.getFirstVarArg(),
        IRConstant.ofConstant(aArg.type, evalResult),
        flippedB.outputVar,
      ),
    );
  }

  return none();
}
