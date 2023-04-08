import { IRLabelOffsetInstruction } from '@compiler/pico-c/frontend/ir/instructions';
import { X86CompilerInstructionFnAttrs } from '../../constants/types';

type LabelOffsetInstructionCompilerAttrs =
  X86CompilerInstructionFnAttrs<IRLabelOffsetInstruction>;

export function compileLabelOffsetInstruction({
  instruction,
  context,
}: LabelOffsetInstructionCompilerAttrs) {
  const { labelsResolver, allocator } = context;
  const { label, outputVar } = instruction;

  const resolvedLabel = labelsResolver.getLabel(label.name);

  allocator.regs.ownership.setOwnership(outputVar.name, {
    asmLabel: resolvedLabel.asmLabel,
  });
}
