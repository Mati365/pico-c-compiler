import { CScopeTree } from './CScopeTree';
import { CVariable } from './variables/CVariable';
import { ASTCFunctionDefinition } from '../../parser/ast/ASTCFunctionDefinition';
import { CFunctionDeclType } from '../types/function';
import { CTypeCheckConfig } from '../constants';

/**
 * Special type of C-Scope that also lookups over function args
 */
export class CFunctionScope extends CScopeTree<ASTCFunctionDefinition> {
  constructor(
    readonly fnType: CFunctionDeclType,
    checkerConfig: CTypeCheckConfig,
    parentAST: ASTCFunctionDefinition,
    parentScope: CScopeTree = null,
  ) {
    super(checkerConfig, parentAST, parentScope);
  }

  override findVariable(name: string): CVariable {
    const fnArg = this.fnType.getArgByName(name);
    if (fnArg) {
      return fnArg;
    }

    return super.findVariable(name);
  }
}
