import * as E from 'fp-ts/Either';
import { X86ArchBackend } from '../arch/x86';

import { CCompilerArch, CCompilerConfig } from '../constants';
// import { IRResultView } from '../frontend/ir';

import { IRScopeGeneratorResult } from '../frontend/ir/generator';
import { CAbstractArchBackend } from './abstract/CAbstractArchBackend';
import { CBackendCompilerResult } from './constants/types';
import { CBackendError, CBackendErrorCode } from './errors/CBackendError';

type CAbstractBackendConstructor = {
  new (config: CCompilerConfig): CAbstractArchBackend;
};

const CCOMPILER_ARCH_BACKENDS: Record<
  CCompilerArch,
  CAbstractBackendConstructor
> = {
  [X86ArchBackend.arch]: X86ArchBackend,
};

export function genASMIRCode(
  config: CCompilerConfig,
  ir: IRScopeGeneratorResult,
): E.Either<CBackendError[], CBackendCompilerResult> {
  try {
    const CompilerBackend = CCOMPILER_ARCH_BACKENDS[config.arch];

    // console.info(IRResultView.serializeToString(ir));

    return E.right(new CompilerBackend(config).compileIR(ir));
  } catch (e) {
    e.code = e.code ?? CBackendErrorCode.UNKNOWN_BACKEND_ERROR;

    return E.left([e]);
  }
}
