/**
 * Lazy resoleable instruction arg, used for
 * label resolving in more advanced arguments
 * such as mem address calculation, in simpler
 * instructions it is not needed
 *
 * @export
 * @class ASTResolvableArg
 * @template T
 */
export class ASTResolvableArg<T> {
  constructor(
    protected value: T,
    protected resolved = true,
  ) {}

  get val() {
    return this.value;
  }

  toString(): string {
    const {value} = this;

    if (typeof value === 'number')
      return `${value < 0 ? '-' : ''}0x${Math.abs(value).toString(16)}`;

    return value.toString();
  }

  /**
   * Called when compiler tries to resolve label
   *
   * @returns {boolean}
   * @memberof ASTResolvableArg
   */
  tryResolve(): boolean {
    this.resolved = true;
    return true;
  }

  /**
   * Returns resolved flag
   *
   * @returns
   * @memberof ASTResolvableArg
   */
  isResolved() {
    return this.resolved;
  }
}
