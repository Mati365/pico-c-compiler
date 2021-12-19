import {ccompiler} from './frontend';

ccompiler(
  /* cpp */ `
    struct Screen {
      const int width, height;
      const char (*memPtr)[4];
      char array[10];
    };
  `,
).match(
  {
    ok: (result) => {
      result.dump();
    },
    err: (error) => {
      console.error(error);
    },
  },
);
