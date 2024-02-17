import * as E from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';

import { CompilerError } from '@ts-cc/core';
import { formatDate, formatTime } from '@ts-cc/core';

import { createAssemblerTimings } from './utils/createAssemblerTimings';
import { safeResultPreprocessor, PreprocessorResult } from './preprocessor';
import { PreprocessorInterpreterConfig } from './preprocessor/interpreter/PreprocessorInterpreter';
import { compile, ast, safeResultAsmLexer, X86AsmCompilerConfig } from './parser';

export type AssemblerConfig = {
  preprocessor?: boolean;
  compilerConfig?: X86AsmCompilerConfig;
};

/**
 * Generates predefined functions thar are appended
 * to all assembler builds (if preprocessor enabled)
 */
export function genPreExecPreprocessorCode() {
  const today = new Date();

  return `
    %define __DATE__ '${formatDate(today, true)}'
    %define __TIME__ '${formatTime(today, true)}'
    %define __DATE_NUM__ ${formatDate(today, true, '')}
    %define __TIME_NUM__ ${formatTime(today, true, '')}
    %define __POSIX_TIME__ ${(+today / 1000) | 0}

    %idefine use16 [bits 16]
    %idefine use32 [bits 32]

    %idefine cpu(cpu_id) [target cpu_id]
    %idefine section(section_name) [section section_name]
  `;
}

/**
 * Compile ASM file
 */
export const asm =
  ({ compilerConfig, preprocessor = true }: AssemblerConfig = {}) =>
  (code: string) => {
    const timings = createAssemblerTimings();

    let preprocessorResult: E.Either<CompilerError[], PreprocessorResult> | null = null;

    if (preprocessor) {
      const preprocessorConfig: PreprocessorInterpreterConfig = {
        preExec: genPreExecPreprocessorCode(),
        grammarConfig: {
          prefixChar: '%',
        },
      };

      preprocessorResult = pipe(
        code,
        timings.chainIO('preprocessor', safeResultPreprocessor(preprocessorConfig)),
      );
    } else {
      preprocessorResult = E.right(new PreprocessorResult(null, code));
    }

    return pipe(
      preprocessorResult,
      E.chainW(timings.chainIO('lexer', ({ result }) => safeResultAsmLexer({})(result))),
      E.chainW(timings.chainIO('ast', ast)),
      E.chainW(timings.chainIO('compiler', tree => compile(tree, compilerConfig))),
      E.map(result => ({
        ...result,
        timings: timings.unwrap(),
      })),
    );
  };

export const unsafeAsm =
  (config: AssemblerConfig = {}) =>
  (code: string) => {
    const maybeResult = pipe(code, asm(config));

    if (E.isLeft(maybeResult)) {
      throw maybeResult.left;
    }

    return maybeResult.right;
  };

export const unsafeAsmBinary =
  (config: AssemblerConfig = {}) =>
  (code: string): number[] => {
    const raw = unsafeAsm(config)(code);

    return raw.output.getBinary();
  };
