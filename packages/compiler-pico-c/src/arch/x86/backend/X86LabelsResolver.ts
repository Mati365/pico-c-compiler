import { CType } from '@compiler/pico-c/frontend/analyze';
import { IRInstruction } from '@compiler/pico-c/frontend/ir/instructions';
import { genLabelName } from '../asm-utils';

type X86LabelValue = {
  type: CType;
  asmLabel: string;
  instruction: IRInstruction;
};

type X86Labels = {
  [globalVarName: string]: X86LabelValue;
};

type X86LabelCreator = Omit<X86LabelValue, 'asmLabel'> & {
  name: string;
};

export class X86LabelsResolver {
  private readonly labels: X86Labels = {};

  createAndPutLabel({ name, type, ...attrs }: X86LabelCreator) {
    const asmLabel = genLabelName(
      X86LabelsResolver.prefixLabelForSpecificType(type, name),
    );

    this.putLabel(name, { asmLabel, type, ...attrs });

    return {
      asmLabel,
    };
  }

  private putLabel(name: string, value: X86LabelValue) {
    this.labels[name] = value;
    return this;
  }

  getLabel(name: string) {
    return this.labels[name];
  }

  static prefixLabelForSpecificType(type: CType, name: string) {
    if (type.isFunction()) {
      return `fn_${name}`;
    }

    return name;
  }
}
