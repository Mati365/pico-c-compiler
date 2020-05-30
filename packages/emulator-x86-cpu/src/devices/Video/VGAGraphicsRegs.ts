import {UnionStruct, bits} from '@compiler/core/shared/UnionStruct';
import {GRAPHICS_MEMORY_MAPS, GraphicsWriteMode} from './VGAConstants';

/**
 * @see {@link http://www.osdever.net/FreeVGA/vga/graphreg.htm#06}
 *
 * Index 00h -- Set/Reset Register
 * Index 01h -- Enable Set/Reset Register
 * Index 02h -- Color Compare Register
 * Index 03h -- Data Rotate Register
 * Index 04h -- Read Map Select Register
 * Index 05h -- Graphics Mode Register
 * Index 06h -- Misc Graphics Register
 * Index 07h -- Color Don't Care Register
 * Index 08h -- Bit Mask Register
 */

/**
 * Set/Reset Register (Index 00h)
 *
 * @export
 * @class SetResetReg
 * @extends {UnionStruct}
 */
export class SetResetReg extends UnionStruct {
  @bits(0, 3) setResetReg: number;
}

/**
 * Enable Set/Reset Register (Index 01h)
 *
 * @export
 * @class EnableSetResetReg
 * @extends {UnionStruct}
 */
export class EnableSetResetReg extends UnionStruct {
  @bits(0, 3) enableSetReset: number;
}

/**
 * Color Compare Register (Index 02h)
 *
 * @export
 * @class ColorCompareReg
 * @extends {UnionStruct}
 */
export class ColorCompareReg extends UnionStruct {
  @bits(0, 3) colorCompare: number;
}

/**
 * Data Rotate Register (Index 03h)
 *
 * @export
 * @class DataRotateReg
 * @extends {UnionStruct}
 */
export class DataRotateReg extends UnionStruct {
  @bits(0, 2) rotateCount: number;
  @bits(3, 4) logicalOperation: GraphicsWriteMode;
}

/**
 * Read Map Select Register (Index 04h)
 *
 * @export
 * @class ReadMapSelectReg
 * @extends {UnionStruct}
 */
export class ReadMapSelectReg extends UnionStruct {
  @bits(0, 1) readMapSelect: number;
}

/**
 * Graphics Mode Register (Index 05h)
 *
 * @export
 * @class GraphicsModeReg
 * @extends {UnionStruct}
 */
export class GraphicsModeReg extends UnionStruct {
  @bits(0, 1) writeMode: GraphicsWriteMode;
  @bits(3) readMode: number;
  @bits(4) hostOddEvenMemoryReadAddrEnable: number;
  @bits(5) shiftRegInterleaveMode: number;
  @bits(6) shift256ColorMode: number;
}

/**
 * Misc Graphics Register (Index 06h)
 *
 * @export
 * @class MiscGraphicsReg
 * @extends {UnionStruct}
 */
export type MemoryMapSelectType = keyof typeof GRAPHICS_MEMORY_MAPS;

export class MiscGraphicsReg extends UnionStruct {
  @bits(0) alphanumericModeDisable: number;
  @bits(1) chainOddEvenEnable: number;
  @bits(2, 3) memoryMapSelect: MemoryMapSelectType;
}

/**
 * Color Don't Care Register (Index 07h)
 *
 * @export
 * @class ColorDontCareReg
 * @extends {UnionStruct}
 */
export class ColorDontCareReg extends UnionStruct {
  @bits(0, 3) colorDontCare: number;
}

/**
 * Bit Mask Register (Index 08h)
 *
 * @export
 * @class ColorBitmaskReg
 * @extends {UnionStruct}
 */
export class ColorBitmaskReg extends UnionStruct {
  @bits(0, 7) bitmask: number;
}

/**
 * Group of VGA Graphics Regs
 *
 * @export
 * @class VGAGraphicsRegs
 */
export class VGAGraphicsRegs {
  setResetReg = new SetResetReg;
  enableSetResetReg = new EnableSetResetReg;
  colorCompareReg = new ColorCompareReg;
  dataRotateReg = new DataRotateReg;
  readMapSelectReg = new ReadMapSelectReg;
  graphicsModeReg = new GraphicsModeReg;
  miscGraphicsReg = new MiscGraphicsReg;
  colorDontCareReg = new ColorDontCareReg;
  colorBitmaskReg = new ColorBitmaskReg;
}
