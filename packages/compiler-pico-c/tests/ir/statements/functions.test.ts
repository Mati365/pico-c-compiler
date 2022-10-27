import '../utils/irMatcher';

describe('Functions IR', () => {
  test('should emit return by register from expression primitive types', () => {
    expect(/* cpp */ `
      int sum(int x, int y) { return x + y; }
      void main() { sum(1, 2); }
    `).toCompiledIRBeEqual(/* ruby */`
      # --- Block sum ---
      def sum(x{0}: int*2B, y{0}: int*2B): [ret: int2B]
        %t{0}: int2B = load x{0}: int*2B
        %t{1}: int2B = load y{0}: int*2B
        %t{2}: int2B = %t{0}: int2B plus %t{1}: int2B
        ret %t{2}: int2B
        end-def

      # --- Block main ---
      def main():
        %t{3}: int sum(int, int)*2B = label-offset sum
        %t{4}: int2B = call %t{3}: int sum(int, int)*2B :: (%1: int2B, %2: int2B)
        ret
        end-def
    `);
  });

  test('should emit local primitive variable', () => {
    expect(/* cpp */ `
      int sum(int x, int y) {
        int d = x + y;
        return d;
      }
      void main() { sum(1, 2); }
    `).toCompiledIRBeEqual(/* ruby */`
      # --- Block sum ---
      def sum(x{0}: int*2B, y{0}: int*2B): [ret: int2B]
        d{0}: int*2B = alloca int2B
        %t{0}: int2B = load x{0}: int*2B
        %t{1}: int2B = load y{0}: int*2B
        %t{2}: int2B = %t{0}: int2B plus %t{1}: int2B
        *(d{0}: int*2B) = store %t{2}: int2B
        %t{3}: int2B = load d{0}: int*2B
        ret %t{3}: int2B
        end-def

      # --- Block main ---
      def main():
        %t{4}: int sum(int, int)*2B = label-offset sum
        %t{5}: int2B = call %t{4}: int sum(int, int)*2B :: (%1: int2B, %2: int2B)
        ret
        end-def
    `);
  });

  test('should emit small structures using registers', () => {
    expect(/* cpp */ `
      struct Vec2 { int x; };
      struct Vec2 sum() {
        struct Vec2 out = { .x = 6 };
        return out;
      }
      void main() { sum(); }
    `).toCompiledIRBeEqual(/* ruby */`
      # --- Block sum ---
      def sum(): [ret: struct Vec22B]
        out{0}: struct Vec2*2B = alloca struct Vec22B
        *(out{0}: struct Vec2*2B) = store %6: int2B
        %t{0}: struct Vec22B = load out{0}: struct Vec2*2B
        ret %t{0}: struct Vec22B
        end-def

      # --- Block main ---
      def main():
        %t{1}: struct Vec2 sum()*2B = label-offset sum
        %t{2}: struct Vec22B = call %t{1}: struct Vec2 sum()*2B :: ()
        ret
        end-def
    `);
  });

  test('should return larger structures with RVO', () => {
    expect(/* cpp */ `
      struct Vec2 { int x, y; };
      struct Vec2 sum() {
        struct Vec2 out = { .x = 6 };
        return out;
      }
      void main() {
        sum();
      }
    `).toCompiledIRBeEqual(/* ruby */`
      # --- Block sum ---
      def sum(%out{0}: struct Vec2**2B):
        out{0}: struct Vec2*2B = load %out{0}: struct Vec2**2B
        *(out{0}: struct Vec2*2B) = store %6: int2B
        ret
        end-def
      # --- Block main ---
      def main():
        %t{1}: struct Vec2 sum()*2B = label-offset sum
        %t{2}: struct Vec24B = alloca struct Vec24B
        %t{3}: struct Vec2*2B = lea %t{2}: struct Vec24B
        call %t{1}: struct Vec2 sum()*2B :: (%t{3}: struct Vec2*2B)
        ret
        end-def
    `);
  });

  test('should be possible to call function in expressions', () => {
    expect(/* cpp */ `
      int sum(int x, int y) { return x + y; }
      void main() {
        int out = sum(1, 2) + 3;
      }
    `).toCompiledIRBeEqual(/* ruby */`
      # --- Block sum ---
      def sum(x{0}: int*2B, y{0}: int*2B): [ret: int2B]
        %t{0}: int2B = load x{0}: int*2B
        %t{1}: int2B = load y{0}: int*2B
        %t{2}: int2B = %t{0}: int2B plus %t{1}: int2B
        ret %t{2}: int2B
        end-def

      # --- Block main ---
      def main():
        out{0}: int*2B = alloca int2B
        %t{3}: int sum(int, int)*2B = label-offset sum
        %t{4}: int2B = call %t{3}: int sum(int, int)*2B :: (%1: int2B, %2: int2B)
        %t{5}: int2B = %t{4}: int2B plus %3: int2B
        *(out{0}: int*2B) = store %t{5}: int2B
        ret
        end-def
    `);
  });

  test('should be possible to call function expressions by ptr', () => {
    expect(/* cpp*/ `
      int sum(int x, int y) { return x + y; }
      int main() {
        int (*ptr)(int, int) = sum;
        (*ptr + 1)(1, 2);
        ptr(1, 2);
        (*ptr)(4, 5);
      }
    `).toCompiledIRBeEqual(/* ruby */`
      # --- Block sum ---
      def sum(x{0}: int*2B, y{0}: int*2B): [ret: int2B]
        %t{0}: int2B = load x{0}: int*2B
        %t{1}: int2B = load y{0}: int*2B
        %t{2}: int2B = %t{0}: int2B plus %t{1}: int2B
        ret %t{2}: int2B
        end-def

      # --- Block main ---
      def main(): [ret: int2B]
        ptr{0}: int(int, int)**2B = alloca int(int, int)*2B
        %t{3}: int sum(int, int)*2B = label-offset sum
        *(ptr{0}: int(int, int)**2B) = store %t{3}: int sum(int, int)*2B
        %t{4}: int(int, int)*2B = load ptr{0}: int(int, int)**2B
        %t{5}: int(int, int)*2B = %t{4}: int(int, int)*2B plus %1: int2B
        %t{6}: int2B = call %t{5}: int(int, int)*2B :: (%1: int2B, %2: int2B)
        %t{7}: int(int, int)*2B = load ptr{0}: int(int, int)**2B
        %t{8}: int2B = call %t{7}: int(int, int)*2B :: (%1: int2B, %2: int2B)
        %t{9}: int(int, int)*2B = load ptr{0}: int(int, int)**2B
        %t{10}: int2B = call %t{9}: int(int, int)*2B :: (%4: int2B, %5: int2B)
        ret
        end-def
    `);
  });

  test('should be possible to call function with RVO expressions by ptr', () => {
    expect(/* cpp*/ `
      struct Vec2 {
        int x, y;
      };

      struct Vec2 of_vec(int x, int y) {
        struct Vec2 v = { .x = x, .y = y };
        return v;
      }

      int main() {
        struct Vec2 (*ptr)(int, int) = of_vec;
        struct Vec2 vec = (*ptr + 1)(1, 2);
      }
    `).toCompiledIRBeEqual(/* ruby */`
      # --- Block of_vec ---
      def of_vec(x{0}: int*2B, y{0}: int*2B, %out{0}: struct Vec2**2B):
        v{0}: struct Vec2*2B = load %out{0}: struct Vec2**2B
        %t{0}: int2B = load x{0}: int*2B
        *(v{0}: struct Vec2*2B) = store %t{0}: int2B
        %t{1}: int2B = load y{0}: int*2B
        *(v{0}: struct Vec2*2B + %2) = store %t{1}: int2B
        ret
        end-def

      # --- Block main ---
      def main(): [ret: int2B]
        ptr{0}: struct Vec2(int, int)**2B = alloca struct Vec2(int, int)*2B
        %t{3}: struct Vec2 of_vec(int, int)*2B = label-offset of_vec
        *(ptr{0}: struct Vec2(int, int)**2B) = store %t{3}: struct Vec2 of_vec(int, int)*2B
        vec{0}: struct Vec2*2B = alloca struct Vec24B
        %t{4}: struct Vec2(int, int)*2B = load ptr{0}: struct Vec2(int, int)**2B
        %t{5}: struct Vec2(int, int)*2B = %t{4}: struct Vec2(int, int)*2B plus %1: int2B
        %t{6}: struct Vec2**2B = lea vec{0}: struct Vec2*2B
        call %t{5}: struct Vec2(int, int)*2B :: (%1: int2B, %2: int2B, %t{6}: struct Vec2**2B)
        ret
        end-def
    `);
  });

  test('RVO should be applied to literal string arguments', () => {
    expect(/* cpp*/ `
      void print(const char* str) {}
      void main() {
        print("hello world!");
      }
    `).toCompiledIRBeEqual(/* ruby */`
      # --- Block print ---
      def print(str{0}: const char**2B):
        ret
        end-def
      # --- Block main ---
      def main():
        %t{0}: void print(const char*)*2B = label-offset print
        %t{1}: const char**2B = alloca const char*2B
        %t{2}: const char*2B = lea c{0}: const char[12]12B
        *(%t{1}: const char**2B) = store %t{2}: const char*2B
        call %t{0}: void print(const char*)*2B :: (%t{1}: const char**2B)
        ret
        end-def
      # --- Block Data ---
        c{0}: const char[12]12B = const { 104, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100, 33 }
    `);
  });

  test('should be possible to return value even with void function', () => {
    expect(/* cpp*/ `
      void main() {
        return 2 + 3;
      }
    `).toCompiledIRBeEqual(/* ruby */`
      # --- Block main ---
      def main():
        ret
        end-def
    `);
  });
});
