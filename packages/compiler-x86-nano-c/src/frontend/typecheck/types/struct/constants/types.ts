import {CStructAlign} from '@compiler/x86-nano-c/constants';
import {CType} from '../../CType';
import {
  CNamedTypedEntry,
  CNamedTypedEntryDescriptor,
} from '../../CNamedTypedEntry';

export type CStructEntryDescriptor = CNamedTypedEntryDescriptor & {
  offset: number,
  bitset?: number,
};

export class CStructEntry extends CNamedTypedEntry<CStructEntryDescriptor> {
  getOffset() { return this.value.offset; }
}

export type CStructFieldsMap = Map<string, CStructEntry>;
export type CStructTypeDescriptor = {
  name?: string,
  align: CStructAlign,
  fields: CStructFieldsMap,
};

export type StructFieldAlignFn = (struct: CType, type: CType) => number;
