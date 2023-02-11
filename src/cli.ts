import 'source-map-support/register';
import { ccompiler, CCompilerOutput } from '@compiler/pico-c';

ccompiler(/* cpp */ `
  // todo: letters[0] should be truncated
  // huge issue, truncating type in IR!
  // void main() {
  //   char letters[] = "Hello world";

  //   char b = letters[0];
  //   int a = letters[0] * 2;
  // }

  // todo: Optimize
  // add bx, 32                ; %t{3}: int*2B = %t{0}: int*2B plus %32: int2B
  // mov ax, [bx]              ; %t{4}: int2B = load %t{3}: int*2B
  // struct Point {
  //   int x, y;
  //   int dupa[10];
  //   char c;
  // };

  // void main() {
  //   struct Point point[] = { { .y = 6 }, { .x = 2 } };
  //   point[1].dupa[2]++;
  // }

  void strlen() {
    // fix: sucky code
    char[] letters = "Hello world";
    // check why not working:
    int d = 5;
    int s = 5;
    int k = letters[0] + letters[0] * d + s * 5;
    int sk = 2;
    sk *= 4 + d;
    sk += d;
  }
`).match({
  ok: result => {
    result.dump();
  },
  err: (error: any) => {
    if (error?.[0]?.tree) {
      console.info(CCompilerOutput.serializeTypedTree(error[0].tree));
    }

    console.error(error);
  },
});

/**
 * Optimize to AL:
 *
 * and ax, 0xff
 * mov word [bp - 12], ax    ; *(b{0}: char*2B) = store %t{1}: int2B
 */
