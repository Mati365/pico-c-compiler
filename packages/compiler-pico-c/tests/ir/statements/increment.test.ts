import '../utils/irMatcher';

describe('Increment stmt IR', () => {
  describe('post increment', () => {
    test('should genenerate i++ IR', () => {
      expect(/* cpp */ `void main() { int a; a++; }`).toCompiledIRBeEqual(/* ruby */`
        # --- Block main ---
        def main(): [ret 0B]
          a{0}: int*2B = alloca int2B
          t{0}: int2B = load a{0}: int*2B
          t{1}: int2B = t{0}: int2B PLUS %1: int2B
          *(a{0}: int*2B) = store t{1}: int2B
          ret
      `);
    });

    test('should genenerate *ptr++ IR', () => {
      expect(/* cpp */ `void main() { int* a; *a++; }`).toCompiledIRBeEqual(/* ruby */`
        # --- Block main ---
        def main(): [ret 0B]
          a{0}: int**2B = alloca int*2B
          t{0}: int*2B = load a{0}: int**2B
          t{1}: int*2B = t{0}: int*2B PLUS %2: int2B
          *(a{0}: int**2B) = store t{1}: int*2B
          t{2}: int2B = load t{0}: int*2B
          ret
      `);
    });

    test('should genenerate *(ptr++) IR', () => {
      expect(/* cpp */ `void main() { int* a; *(a++); }`).toCompiledIRBeEqual(/* ruby */`
        # --- Block main ---
        def main(): [ret 0B]
          a{0}: int**2B = alloca int*2B
          t{0}: int*2B = load a{0}: int**2B
          t{1}: int*2B = t{0}: int*2B PLUS %2: int2B
          *(a{0}: int**2B) = store t{1}: int*2B
          t{2}: int2B = load t{0}: int*2B
          ret
      `);
    });

    test('should genenerate (*ptr)++ IR', () => {
      expect(/* cpp */ `void main() { int* a; (*a)++; }`).toCompiledIRBeEqual(/* ruby */`
        # --- Block main ---
        def main(): [ret 0B]
          a{0}: int**2B = alloca int*2B
          t{0}: int*2B = load a{0}: int**2B
          t{1}: int2B = load t{0}: int*2B
          t{2}: int2B = t{1}: int2B PLUS %1: int2B
          *(t{0}: int*2B) = store t{2}: int2B
          ret
      `);
    });
  });

  describe('pre increment', () => {
    test('should genenerate ++i IR', () => {
      expect(/* cpp */ `void main() { int a; ++a; }`).toCompiledIRBeEqual(/* ruby */`
        # --- Block main ---
        def main(): [ret 0B]
          a{0}: int*2B = alloca int2B
          t{0}: int2B = load a{0}: int*2B
          t{1}: int2B = t{0}: int2B PLUS %1: int2B
          *(a{0}: int*2B) = store t{1}: int2B
          ret
      `);
    });

    test('should genenerate ++(*ptr) IR', () => {
      expect(/* cpp */ `void main() { int* ptr; ++(*ptr); }`).toCompiledIRBeEqual(/* ruby */`
        # --- Block main ---
        def main(): [ret 0B]
          ptr{0}: int**2B = alloca int*2B
          t{0}: int*2B = load ptr{0}: int**2B
          t{1}: int2B = load t{0}: int*2B
          t{2}: int2B = t{1}: int2B PLUS %1: int2B
          *(t{0}: int*2B) = store t{2}: int2B
          ret
      `);
    });

    test('should genenerate *(++ptr) IR', () => {
      expect(/* cpp */ `void main() { int* ptr; *(++ptr); }`).toCompiledIRBeEqual(/* ruby */`
        # --- Block main ---
        def main(): [ret 0B]
          ptr{0}: int**2B = alloca int*2B
          t{0}: int*2B = load ptr{0}: int**2B
          t{1}: int*2B = t{0}: int*2B PLUS %2: int2B
          *(ptr{0}: int**2B) = store t{1}: int*2B
          t{2}: int2B = load t{1}: int*2B
          ret
      `);
    });
  });

  describe('advanced types increment', () => {
    test('increment struct field', () => {
      expect(/* cpp */`
        struct Point {
          int x, y;
          int dupa[10];
        };

        void main() {
          struct Point point[] = { { .y = 6 }, { .x = 2 } };
          point[1].dupa[2]++;
        }
      `).toCompiledIRBeEqual(/* ruby */`
        # --- Block main ---
        def main(): [ret 0B]
          point{0}: struct Point[2]*2B = alloca struct Point[2]48B
          *(point{0}: struct Point[2]*2B + %2) = store %6: int2B
          *(point{0}: struct Point[2]*2B + %24) = store %2: int2B
          t{0}: int*2B = lea point{0}: struct Point[2]*2B
          t{3}: int*2B = t{0}: int*2B PLUS %32: int2B
          t{4}: int2B = load t{3}: int*2B
          t{5}: int2B = t{4}: int2B PLUS %1: int2B
          *(t{3}: int*2B) = store t{5}: int2B
          ret
      `);
    });
  });
});
