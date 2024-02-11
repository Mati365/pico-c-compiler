import { CCompilerArch, CCompilerConfig } from '#constants';
import { isPointerLikeType } from 'frontend/analyze';
import { assertUnreachable } from '@ts-c-compiler/core';

import { IRInstructionTypedArg, IRVariable, isIRVariable } from 'frontend/ir/variables';

import { CBackendError, CBackendErrorCode } from 'backend/errors/CBackendError';

import { genMemAddress } from '../asm-utils';

export type X86StackVariable = {
  name: string;
  offset: number;
  size: number;
};

export class X86StackFrame {
  private allocated: number = 0;
  private spilled: number = 0;
  private stackVars: {
    [id: string]: X86StackVariable;
  } = {};

  constructor(readonly config: CCompilerConfig) {}

  getStackVar(id: string): X86StackVariable {
    return this.stackVars[id];
  }

  isStackVar(id: string): boolean {
    return !!this.getStackVar(id);
  }

  getStackVarOffset(id: string): number {
    return this.getStackVar(id).offset;
  }

  getTotalAllocatedBytes(): number {
    return this.allocated;
  }

  private allocBytes(bytes: number) {
    this.allocated += bytes;
    return -this.allocated;
  }

  allocRawStackVariable(stackVar: X86StackVariable): X86StackVariable {
    this.stackVars[stackVar.name] = stackVar;
    return stackVar;
  }

  allocLocalVariable(variable: IRVariable): X86StackVariable {
    const size = X86StackFrame.getStackAllocVariableSize(variable);
    const offset = this.allocBytes(size);
    const stackVar: X86StackVariable = {
      name: variable.name,
      offset,
      size,
    };

    this.stackVars[variable.name] = stackVar;
    return stackVar;
  }

  allocSpillVariable(size: number) {
    const offset = this.allocBytes(size);
    const stackVar: X86StackVariable = {
      name: `spill-${this.spilled++}`,
      offset,
      size,
    };

    this.stackVars[stackVar.name] = stackVar;
    return stackVar;
  }

  getLocalVarStackRelAddress(
    name: string,
    {
      offset = 0,
      withSize,
    }: {
      offset?: number;
      withSize?: boolean;
    } = {},
  ) {
    const { arch } = this.config;
    const { offset: stackOffset, size } = this.getStackVar(name);

    if (offset < 0 && stackOffset + offset >= 0) {
      throw new CBackendError(CBackendErrorCode.OFFSET_OVERFLOW, { name });
    }

    switch (arch) {
      case CCompilerArch.X86_16:
        return genMemAddress({
          ...(withSize && {
            size,
          }),
          expression: 'bp',
          offset: stackOffset + offset,
        });

      default:
        assertUnreachable(arch);
    }
  }

  static getStackVarRelAddress(stackVar: X86StackVariable) {
    return genMemAddress({
      expression: 'bp',
      size: stackVar.size,
      offset: stackVar.offset,
    });
  }

  static getStackAllocVariableSize(variable: IRInstructionTypedArg) {
    const { type } = variable;

    // IR variables are always pointers
    // IR variable that points to stack variable is also pointer
    // so alloc stack byte size should be ca
    if (!isIRVariable(variable) && isPointerLikeType(type)) {
      return type.baseType.getByteSize();
    }

    return type.getByteSize();
  }
}
