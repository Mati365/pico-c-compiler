import * as R from 'ramda';

import { AbstractTreeVisitor, IsWalkableNode } from '@ts-c/grammar';

import {
  isArrayLikeType,
  isPointerLikeType,
  isStructLikeType,
} from '../../types';

import { ASTCCompilerNode } from '../../../parser/ast/ASTCCompilerNode';
import { CType } from '../../types/CType';

export type CVariableInitializeValue =
  | string
  | number
  | CVariableInitializerTree
  | ASTCCompilerNode;

export type CVariableInitializerFields = CVariableInitializeValue[];

export function isConstantVariableInitializer(value: CVariableInitializeValue) {
  if (!value) {
    return true;
  }

  const type = typeof value;

  return type === 'string' || type === 'number';
}

export function isInitializerTreeValue(
  value: CVariableInitializeValue,
): value is CVariableInitializerTree {
  return R.is(Object, value) && R.has('_baseType', value);
}

type CVariableByteInitializerAttrs<C> = {
  baseType: CType;
  parentAST?: C;
  length: number;
  fill?: number;
};

/**
 * Recursive map structure of type initializer
 */
export class CVariableInitializerTree<
  C extends ASTCCompilerNode = ASTCCompilerNode,
> implements IsWalkableNode
{
  constructor(
    protected readonly _baseType: CType,
    protected readonly _parentAST: C,
    protected _fields: CVariableInitializerFields = null,
  ) {
    if (!_fields) {
      this.fill(null);
    }
  }

  get parentAST() {
    return this._parentAST;
  }

  get baseType() {
    return this._baseType;
  }

  get fields() {
    return this._fields;
  }

  static ofByteArray<C extends ASTCCompilerNode>({
    baseType,
    parentAST,
    length,
    fill = 0,
  }: CVariableByteInitializerAttrs<C>) {
    const fields: CVariableInitializerFields = Array(length).fill(fill);

    return new CVariableInitializerTree(baseType, parentAST, fields);
  }

  fill(value: CVariableInitializeValue) {
    this._fields = new Array(this.scalarValuesCount).fill(value);
  }

  walk(visitor: AbstractTreeVisitor<any>): void {
    this._fields.forEach(visitor.visit.bind(visitor));
  }

  hasOnlyConstantExpressions() {
    return this._fields.every(isConstantVariableInitializer);
  }

  getSingleItemByteSize() {
    return this.getIndexExpectedType(0).getByteSize();
  }

  /**
   * Returns total count of non null (initialized) fields
   */
  getInitializedFieldsCount(): number {
    const { fields } = this;
    let i = 0;

    for (; i < fields.length; ++i) {
      if (fields[i] === null) {
        break;
      }
    }

    return i;
  }

  /**
   * Expands fields array to given size
   */
  ensureSize(size: number) {
    const { fields } = this;
    const delta = size - fields.length;

    for (let i = 0; i < delta; ++i) {
      fields.push(null);
    }
  }

  /**
   * Sets values on given offset and if offset is bigger than array fills with null
   */
  setAndExpand(offset: number, value: CVariableInitializeValue) {
    const { fields } = this;

    this.ensureSize(offset);
    fields[offset] = value;
  }

  /**
   * Used to return value for non-array type initializers
   */
  getFirstValue(): CVariableInitializeValue {
    return this._fields[0];
  }

  getFlattenNonLiteralScalarFieldsCount() {
    const { fields, baseType } = this;

    if (isArrayLikeType(baseType) && isPointerLikeType(baseType.baseType)) {
      return fields.length;
    }

    // parse to return non 1 number:
    // const char str[] = "asdasdasd";
    return fields.reduce<number>((acc, field) => {
      if (R.is(String, field)) {
        return acc + field.length;
      }

      return acc + 1;
    }, 0);
  }

  /**
   * Returns type that always has fixed size
   *
   * @example
   *  int a[] = { 1, 2, 3 } => int[3]
   *  const char* str = "Hello" => const char*
   *  const char str[] = "Hello" => const char[5]
   */
  getFixedSizeBaseType(): CType {
    const { baseType } = this;

    if (isArrayLikeType(baseType) && baseType.isUnknownSize()) {
      return baseType.ofSize(
        Math.ceil(
          this.getFlattenNonLiteralScalarFieldsCount() /
            baseType.baseType.scalarValuesCount,
        ),
      );
    }

    return baseType;
  }

  /**
   * Returns type at specified offset
   */
  getIndexExpectedType(offset: number): CType {
    const { baseType } = this;

    if (isStructLikeType(baseType)) {
      return baseType.getFieldTypeByIndex(
        offset % baseType.getFlattenFieldsCount(),
      );
    }

    if (isArrayLikeType(baseType)) {
      const baseArrayType = baseType.getSourceType();

      if (isStructLikeType(baseArrayType)) {
        return baseArrayType.getFieldTypeByIndex(
          offset % baseArrayType.getFlattenFieldsCount(),
        );
      }

      return baseArrayType;
    }

    return this.getNestedInitializerGroupType();
  }

  /**
   * Returns type of nested group
   *
   * @example
   *  int a[2][] = { { 1 } }
   *                   ^
   *              Array<int, 2>
   */
  getNestedInitializerGroupType(): CType {
    const { baseType } = this;

    return isArrayLikeType(baseType) ? baseType.ofTailDimensions() : baseType;
  }

  /**
   * Return maximum count of items for given base type
   *
   * @see
   *  Returns null if unknown size!
   *
   * @example
   *  int abc[3][4] => 12
   */
  get scalarValuesCount(): number {
    return this.baseType.scalarValuesCount;
  }
}
