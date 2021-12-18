import * as R from 'ramda';

import {UnmountCallback} from '@compiler/core/types';
import {MemoryRegionRange} from '../memory/MemoryRegion';

import {X86_MAPPED_VM_MEM} from '../constants/x86';

import {X86InterruptsSet, X86InterruptHandlerCallback} from './X86Interrupt';
import {X86PortsSet, X86Port} from './X86Port';
import {X86RegName} from './X86Regs';
import {X86AbstractCPU} from './X86AbstractCPU';

/**
 * Device that is attached to CPU, it:
 * - can work on mem range
 * - mount ports
 * - mount interrupts
 *
 * @export
 * @abstract
 * @class AbstractDevice
 * @template TCPU
 * @template TInitConfig
 */
export abstract class X86AbstractDevice<
  TCPU extends X86AbstractCPU,
  TInitConfig = {},
> {
  protected cpu: TCPU = null;
  protected memRegion: MemoryRegionRange = null;
  protected interrupts: X86InterruptsSet = {};
  protected ports: X86PortsSet = {};
  protected irq: number = null;

  /** destructors */
  protected _portsUnmounter: UnmountCallback = null;
  protected _interruptsUnmounter: UnmountCallback = null;

  /**
   * Creates an instance of AbstractDevice.
   *
   * @param {MemoryRegionRange} [memRegion]
   * @memberof AbstractDevice
   */
  constructor(memRegion?: MemoryRegionRange) {
    this.memRegion = memRegion;
  }

  abstract init(initConfig?: TInitConfig): void;

  raiseIRQ() {}

  /** Return CPU registers */
  get regs() {
    return this.cpu.registers;
  }

  /**
   * Allow to connect multiple ports to the same handler
   *
   * @protected
   * @param {(number|number[])} ports
   * @param {X86Port} handler
   * @memberof X86AbstractDevice
   */
  protected mountPortsHandler(ports: number | number[], handler: X86Port): void {
    if (ports instanceof Array) {
      R.forEach(
        (port) => {
          this.ports[port] = handler;
        },
        ports,
      );
    } else
      this.ports[ports] = handler;
  }

  /**
   * Attaches and initializes device in provided cpu
   *
   * @param {TCPU} cpu
   * @param {TInitConfig} initConfig
   * @memberof AbstractDevice
   */
  attach(cpu: TCPU, initConfig?: TInitConfig): X86AbstractDevice<TCPU, TInitConfig> {
    this.release();

    this.cpu = cpu;
    this.init.call(this, initConfig);

    this._interruptsUnmounter = cpu.mountInterrupts(this.interrupts);
    this._portsUnmounter = cpu.mountPorts(this.ports);

    return this;
  }

  /**
   * Assings interrupts to device, it should occur in init phrase
   *
   * @param {(string|number)} interruptCode
   * @param {X86RegName} reg
   * @param {{[address: number]: X86InterruptHandlerCallback}} list
   * @param {number} [physicalAddress=(this.mem?.low || X86_MAPPED_VM_BIOS_MEM.low) + +interruptCode]
   * @memberof X86AbstractDevice
   */
  attachInterrupts(
    interruptCode: string | number,
    reg: X86RegName,
    list: {[address: number]: X86InterruptHandlerCallback},
    physicalAddress: number = ((this.memRegion && this.memRegion.low) || X86_MAPPED_VM_MEM.low) + +interruptCode,
  ) {
    this.interrupts[interruptCode] = {
      physicalAddress,
      fn: () => {
        const func = <number> this.regs[reg];
        const callback = list[func];

        if (callback)
          callback(this.regs);
        else
          this.cpu.halt(`Unknown interrupt 0x${interruptCode.toString(16)} function 0x${func.toString(16)}!`);
      },
    };
  }

  /**
   * Called when CPU is booting
   *
   * @memberof X86AbstractDevice
   */
  boot(): void {}

  /**
   * Called when CPU is halting
   *
   * @memberof X86AbstractDevice
   */
  halt(): void {}

  /**
   * Removes listeners from CPU
   *
   * @memberof AbstractDevice
   */
  release() {
    /* eslint-disable no-unused-expressions */
    this._interruptsUnmounter?.();
    this._portsUnmounter?.();
    /* eslint-enable no-unused-expressions */

    this._interruptsUnmounter = null;
    this._portsUnmounter = null;
  }
}

/**
 * Creates device with uuid which is used in CPU to communication between devices
 *
 * @export
 * @template TCPU
 * @template TInitConfig
 * @param {string} uuid
 * @returns
 */
export function uuidX86Device<
  TCPU extends X86AbstractCPU,
  TInitConfig = {},
>(uuid: string) {
  abstract class X86UuidAbstractDevice extends X86AbstractDevice<TCPU, TInitConfig> {
    static uuid: string = uuid;
  }

  return X86UuidAbstractDevice;
}
