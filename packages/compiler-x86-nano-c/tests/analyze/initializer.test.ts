/* eslint-disable quotes, @typescript-eslint/quotes */
import {CTypeCheckErrorCode} from './utils/analyzeMatcher';

describe('Initializer typecheck', () => {
  describe('Array', () => {
    test('initializer list to auto flatten array size', () => {
      expect(/* cpp */ `int array[] = { 2, 3 };`).not.toHaveCompilerError();
    });

    test('initializer list to auto multidimensional array size', () => {
      expect(
        /* cpp */ `int array[][] = { 2, 3, { 3, 4 } };`,
      ).toHaveCompilerError(CTypeCheckErrorCode.INCOMPLETE_ARRAY_SIZE);
    });

    test('trailing commas are allowed in initializer', () => {
      expect(/* cpp */ `int array[3] = { 2, 3, };`).not.toHaveCompilerError();
      expect(/* cpp */ `int array[3][4] = { 2, 3, { 2 }, };`).not.toHaveCompilerError();
    });

    test('allow to pass blank list of initializer list to array', () => {
      expect(/* cpp */ `int array[3] = {};`).not.toHaveCompilerError();
    });

    test('allow to pass flatten list to multidimensional array', () => {
      expect(/* cpp */ `int array[2][3] = { 2, 3, 4 };`).not.toHaveCompilerError();
    });

    test('detects overflow in passed initializer list', () => {
      expect(
        /* cpp */ `int array[2][2] = { 2, 3, 4, 5, 6 };`,
      ).toHaveCompilerError(CTypeCheckErrorCode.INITIALIZER_ARRAY_OVERFLOW);
    });

    test('allow to pass nested list for flatten array', () => {
      expect(
        /* cpp */ `int array[4] = { { 2 }, { 3 }, { 4 }, { 5 } };`,
      ).not.toHaveCompilerError();
    });

    test('detects overflow in passed nested list in flatten array', () => {
      expect(
        /* cpp */ `int array[4] = { { 2, 5 }, { 3 }, { 4 }, { 5 } };`,
      ).toHaveCompilerError(CTypeCheckErrorCode.INITIALIZER_ARRAY_OVERFLOW);
    });

    test('incomplete definition of three dimensional array with nested initializer', () => {
      expect(
        /* cpp */ `
        short q[4][3][2] = {
          { 1 },
          { 2, 3 },
          { 4, 5, 6 }
        };
        `,
      ).not.toHaveCompilerError();
    });

    test('flatten incomplete definition of three dimensional array', () => {
      expect(
        /* cpp */ `
          short q[4][3][2] = {
            1, 0, 0, 0, 0, 0,
            2, 3, 0, 0, 0, 0,
            4, 5, 6
          };
        `,
      ).not.toHaveCompilerError();
    });

    test('anonymous struct non-designated array initializer', () => {
      expect(/* cpp */ `struct { int a[3], b; } w[] = { { 1 }, 2 };`).not.toHaveCompilerError();
    });

    test('string const char* initialization', () => {
      expect(
        /* cpp */ `
          const char* abc = "Hello world!";
          char* abc2 = "Hello!";
        `,
      ).not.toHaveCompilerError();
    });

    test('letters char array initialization', () => {
      expect(/* cpp */ `char s[] = { 'a', 'b', 'c', '\0' };`).not.toHaveCompilerError();
    });

    test('flatten array with designation', () => {
      expect(
        /* cpp */ `
          int a[] = {
            1, 3, 5, 7, 9, [8] = 8, 6, 4, 2, 0
          };
        `,
      ).not.toHaveCompilerError();
    });

    test('single struct designation initialization', () => {
      expect(
        /* cpp */ `
          struct Vec2 {
            int x, y;
          } screen = {
            .x = 5,
            .y = 5,
          };
        `,
      ).not.toHaveCompilerError();
    });

    test('single struct with wrong designation initialization', () => {
      expect(
        /* cpp */ `
          struct Vec2 {
            int x, y;
          } screen = {
            .x = 5,
            .y = 5.0,
          };
        `,
      ).toHaveCompilerError();
    });

    test('designation with anonymous enum', () => {
      expect(
        /* cpp */ `
          enum { member_one, member_two };
          const char *nm[] = {
            [member_two] = "member two",
            [member_one] = "member one",
          };
        `,
      ).not.toHaveCompilerError();
    });

    test('struct with designation nested items', () => {
      expect(
        /* cpp */ `
          struct { int a[3], b; } w[] = {
            [0].a = {1},
            [1].a[0] = 2
          };
        `,
      ).not.toHaveCompilerError();
    });

    test('unable to assign string initializer to scalar', () => {
      expect(/* cpp */ `int number = "ABC";`)
        .toHaveCompilerError(CTypeCheckErrorCode.INCORRECT_STRING_INITIALIZED_VARIABLE_TYPE);
    });
  });
});
