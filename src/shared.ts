// todo1: Add ASM reg globbing
// todo2: Add ternary
// todo3: Add switch
// todo4: Add global variables
// todo5: Fix calling fn with copy of struct
export const MOCK_C_FILE = /* c */ `
  void main() {
    int a = 2;
    a *= 3;
    asm(
        "xor ax, ax"
        :::"ax"
    );

    // todo: Why is a not reused?
    int b = a;
  }
`;
