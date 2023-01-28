import 'source-map-support/register';
import { ccompiler, CCompilerOutput } from '@compiler/pico-c';

ccompiler(/* cpp */ `
  // todo: check why not optimized: abc[3] = 4;
  void main() {
    int c = 3;
    int abc[] = { 1, 2 };
    abc[c] = abc[2] + c;

    c++;

    if (c == 5) {
      c *= 2;
      c += 7 + c;
      int d = c + 4;
    }

    abc[3] = 4;

    int k = c + 2;

    for (int i = k; i < 10; ++i) {
      abc[3] = 666;
    }
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
