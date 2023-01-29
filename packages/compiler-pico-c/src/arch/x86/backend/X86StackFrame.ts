import { CCompilerArch, CCompilerConfig } from '@compiler/pico-c/constants';
import { isPointerLikeType } from '@compiler/pico-c/frontend/analyze';
import { assertUnreachable } from '@compiler/core/utils';

import { genMemAddress } from '../asm-utils';
import { IRVariable } from '@compiler/pico-c/frontend/ir/variables';

export type X86StackVariable = {
  name: string;
  offset: number;
  size: number;
};

export class X86StackFrame {
  private allocated: number = 0;
  private stackVars: { [id: string]: X86StackVariable } = {};

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

  private allocBytes(bytes: number) {
    this.allocated += bytes;
    return -this.allocated;
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

  getLocalVarStackRelAddress(name: string, offset: number = 0) {
    const { arch } = this.config;
    const stackOffset = this.getStackVarOffset(name);

    switch (arch) {
      case CCompilerArch.X86_16:
        return genMemAddress({
          expression: 'bp',
          offset: stackOffset + offset,
        });

      default:
        assertUnreachable(arch);
    }
  }

  static getStackAllocVariableSize(variable: IRVariable) {
    const { type, virtualArrayPtr } = variable;

    // IR variables are always pointers
    // IR variable that points to stack variable is also pointer
    // so alloc stack byte size should be ca
    if (!virtualArrayPtr && isPointerLikeType(type)) {
      return type.baseType.getByteSize();
    }

    return type.getByteSize();
  }
}
