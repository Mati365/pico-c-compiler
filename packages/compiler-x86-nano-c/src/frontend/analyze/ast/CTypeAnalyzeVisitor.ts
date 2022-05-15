import * as R from 'ramda';

import {GroupTreeVisitor} from '@compiler/grammar/tree/TreeGroupedVisitor';
import {TreeVisitorsMap} from '@compiler/grammar/tree/TreeGroupedVisitor';
import {CTypeCheckConfig} from '../constants';
import {ASTCCompilerNode} from '../../parser/ast/ASTCCompilerNode';
import {CTypeAnalyzeContext} from './CTypeAnalyzeContext';
import {CScopeTree} from '../scope/CScopeTree';
import {ASTC_TYPE_CREATORS} from './ast-kinds-visitors';

type CTypeAnalyzeVisitorAttrs = CTypeCheckConfig & {
  scope?: CScopeTree,
  currentAnalyzed?: CTypeAnalyzeContext['currentAnalyzed'],
};

/**
 * Root typechecker visitor
 *
 * @export
 * @class CTypeAnalyzeVisitor
 * @extends {GroupTreeVisitor<ASTCCompilerNode, any, CTypeAnalyzeContext>}
 */
export class CTypeAnalyzeVisitor extends GroupTreeVisitor<ASTCCompilerNode, any, CTypeAnalyzeContext> {
  constructor(
    {
      scope,
      currentAnalyzed,
      ...config
    }: CTypeAnalyzeVisitorAttrs,
  ) {
    super();

    this.setVisitorsMap(
      R.reduce(
        (acc, ItemClass) => {
          const obj = new ItemClass(this);
          acc[obj.kind] = obj;

          return acc;
        },
        {} as TreeVisitorsMap<ASTCCompilerNode>,
        ASTC_TYPE_CREATORS,
      ),
    );

    this.setContext(
      {
        config,
        scope: scope ?? new CScopeTree(config),
        currentAnalyzed: currentAnalyzed ?? {
          fnType: null,
        },
      },
    );
  }

  get scope() { return this.context.scope; }
  get arch() { return this.context.config.arch; }
  get currentAnalyzed() { return this.context.currentAnalyzed; }

  ofScope(scope: CScopeTree) {
    const {context, currentAnalyzed} = this;

    return new CTypeAnalyzeVisitor(
      {
        ...context.config,
        currentAnalyzed,
        scope,
      },
    );
  }

  enterScope(
    node: ASTCCompilerNode,
    fn: (newScope: CTypeAnalyzeVisitor) => void,
  ) {
    const {scope, context} = this;
    const visitor = this.ofScope(
      scope.appendScope(new CScopeTree(context.config, node)),
    );

    return fn(visitor);
  }

  visitBlockScope(node?: ASTCCompilerNode) {
    return this.enterScope(node, (visitor) => visitor.visit(node));
  }
}
