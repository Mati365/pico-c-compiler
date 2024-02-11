import type { either as E } from 'fp-ts';
import type { SecondPassResult } from '@ts-c-compiler/x86-assembler';
import type { TokenLocation } from '@ts-c-compiler/lexer';

export type EditorCompileLang = 'nasm' | 'c';

export type EditorStateValue = {
  lang: EditorCompileLang;
  code: string;
};

type AbstractEmulationState<S extends string, P = {}> = P & {
  state: S;
};

export type EditorCompileResultError = {
  loc: TokenLocation | null;
  message: string;
};

export type EditorCompileResultValue = {
  blob: Buffer;
  asmPassOutput: SecondPassResult;
};

type EditorCompileResult = E.Either<EditorCompileResultError[], EditorCompileResultValue>;

export type EditorEmulationValue =
  | AbstractEmulationState<'stop'>
  | AbstractEmulationState<'compiling'>
  | AbstractEmulationState<'pause', { result: EditorCompileResult }>
  | AbstractEmulationState<'running', { result: EditorCompileResult }>;

type EditorEmulationValueState = EditorEmulationValue['state'];

type ExtractEmulationValueByState<S extends EditorEmulationValueState> = Extract<
  EditorEmulationValue,
  { state: S }
>;

export const hasEditorEmulationResult = (
  value: EditorEmulationValue,
): value is ExtractEmulationValueByState<'pause' | 'running'> =>
  value.state === 'pause' || value.state === 'running';
