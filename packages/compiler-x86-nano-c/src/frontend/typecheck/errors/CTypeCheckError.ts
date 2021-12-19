import {CompilerError} from '@compiler/core/shared/CompilerError';

export enum CTypeCheckErrorCode {
  TYPECHECK_ERROR,
  UNKNOWN_SPECIFIERS_KEYWORD,
  UNKNOWN_QUALIFIERS_KEYWORD,
  INCORRECT_VOID_SPECIFIERS,
  INCORRECT_TYPE_SPECIFIERS,
  REDEFINITION_OF_TYPE,
  UNABLE_TO_EXTRACT_STRUCT_TYPE,
  UNKNOWN_DECLARATOR_ENTRY_IDENTIFIER,
}

export const C_TYPE_CHECK_ERROR_TRANSLATIONS: Record<CTypeCheckErrorCode, string> = {
  [CTypeCheckErrorCode.TYPECHECK_ERROR]: 'Typecheck error!',
  [CTypeCheckErrorCode.UNKNOWN_SPECIFIERS_KEYWORD]: 'Unknown specifier!',
  [CTypeCheckErrorCode.UNKNOWN_QUALIFIERS_KEYWORD]: 'Unknown qualifier!',
  [CTypeCheckErrorCode.INCORRECT_TYPE_SPECIFIERS]: 'Incorrect type specifiers!',
  [CTypeCheckErrorCode.INCORRECT_VOID_SPECIFIERS]: 'Wrong specifiers used with void!',
  [CTypeCheckErrorCode.REDEFINITION_OF_TYPE]: 'Redefinition of type %{name}!',
  [CTypeCheckErrorCode.UNABLE_TO_EXTRACT_STRUCT_TYPE]: 'Unable to extract struct type!',
  [CTypeCheckErrorCode.UNKNOWN_DECLARATOR_ENTRY_IDENTIFIER]: 'Unknown declarator entry identifier!',
};

/**
 * Error thrown during AST generation phase
 *
 * @export
 * @class CTypeCheckError
 * @extends {CompilerError<CTypeCheckErrorCode, void>}
 */
export class CTypeCheckError extends CompilerError<CTypeCheckErrorCode, void> {
  constructor(code: CTypeCheckErrorCode, meta?: object) {
    super(C_TYPE_CHECK_ERROR_TRANSLATIONS, code, null, meta);
  }
}
