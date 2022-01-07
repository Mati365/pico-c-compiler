import {ASTCCompilerNode} from '@compiler/x86-nano-c/frontend/parser/ast';
import {CNamedTypedEntry, CNamedTypedEntryDescriptor} from './CNamedTypedEntry';

export type CVariableDescriptor = CNamedTypedEntryDescriptor & {
  global?: boolean,
  fnArg?: boolean,
  initializer?: ASTCCompilerNode,
};

/**
 * Pair name and type with additional global flag
 *
 * @export
 * @class CVariable
 * @extends {CNamedTypedEntry<CVariableDescriptor>}
 */
export class CVariable extends CNamedTypedEntry<CVariableDescriptor> {
  static ofFunctionArg(entry: CNamedTypedEntry) {
    return new CVariable(
      {
        ...entry.unwrap(),
        fnArg: true,
      },
    );
  }

  static ofInitializedEntry(entry: CNamedTypedEntry, initializer?: ASTCCompilerNode) {
    return new CVariable(
      {
        ...entry.unwrap(),
        initializer,
      },
    );
  }

  get initializer() { return this.value.initializer; }

  isGlobal() { return this.value.global; }
  isInitialized() { return !!this.initializer; }

  /**
   * Sets global flag and return new instance
   *
   * @param {boolean} [global=true]
   * @return {CVariable}
   * @memberof CVariable
   */
  ofGlobalScope(global: boolean = true): CVariable {
    return this.map((value) => ({
      ...value,
      global,
    }));
  }

  override getDisplayName() {
    let str = super.getDisplayName();
    if (this.isInitialized())
      str += ' = [[ initializer ]]';

    return str;
  }
}
