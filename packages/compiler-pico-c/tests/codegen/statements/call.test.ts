import '../utils';

describe('Function call', () => {
  describe('Primitive types', () => {
    test('call void function', () => {
      expect(/* cpp */ `
        void test() {
          int k = 2;
        }
        void main() {
          int a = 4;
          int ks = a + 7;
          test();
          int k = a + 10;
        }
      `).toCompiledAsmBeEqual(`
        cpu 386
        ; def test():
        @@_fn_test:
        push bp
        mov bp, sp
        sub sp, 2
        mov word [bp - 2], 2      ; *(k{0}: int*2B) = store %2: int2B
        mov sp, bp
        pop bp
        ret
        ; def main():
        @@_fn_main:
        push bp
        mov bp, sp
        sub sp, 6
        mov word [bp - 2], 4      ; *(a{0}: int*2B) = store %4: int2B
        mov ax, [bp - 2]
        mov bx, ax                ; swap
        add ax, 7                 ; %t{1}: int2B = %t{0}: int2B plus %7: char1B
        mov word [bp - 4], ax     ; *(ks{0}: int*2B) = store %t{1}: int2B
        push bx                   ; preserve: %t{0}
        call @@_fn_test
        pop bx                    ; restore: %t{0}
        add bx, 10                ; %t{4}: int2B = %t{0}: int2B plus %10: char1B
        mov word [bp - 6], bx     ; *(k{1}: int*2B) = store %t{4}: int2B
        mov sp, bp
        pop bp
        ret
      `);
    });

    test('cleanup extra arguments passed to function', () => {
      expect(/* cpp */ `
        void test() {}
        void main() {
          test(3, 4, 5);
        }
      `).toCompiledAsmBeEqual(`
        cpu 386
        ; def test():
        @@_fn_test:
        push bp
        mov bp, sp
        mov sp, bp
        pop bp
        ret
        ; def main():
        @@_fn_main:
        push bp
        mov bp, sp
        push 5
        push 4
        push 3
        call @@_fn_test
        add sp, 6
        mov sp, bp
        pop bp
        ret
      `);
    });

    test('returned value from void type is not present', () => {
      expect(/* cpp */ `
        void test() {
          return 2;
        }
        void main() {
          int k = 2;
          return k;
        }
      `).toCompiledAsmBeEqual(`
        cpu 386
        ; def test():
        @@_fn_test:
        push bp
        mov bp, sp
        mov sp, bp
        pop bp
        ret
        ; def main():
        @@_fn_main:
        push bp
        mov bp, sp
        sub sp, 2
        mov word [bp - 2], 2      ; *(k{0}: int*2B) = store %2: int2B
        mov sp, bp
        pop bp
        ret
      `);
    });

    test('return value is stored in reg', () => {
      expect(/* cpp */ `
        int sum(int a, int b) { return a + b; }
        int main() { int acc = sum(1, 2) + 4; }
      `).toCompiledAsmBeEqual(`
        cpu 386
        ; def sum(a{0}: int*2B, b{0}: int*2B): [ret: int2B]
        @@_fn_sum:
        push bp
        mov bp, sp
        mov ax, [bp + 4]
        add ax, word [bp + 6]     ; %t{2}: int2B = %t{0}: int2B plus %t{1}: int2B
        mov sp, bp
        pop bp
        ret 4
        ; def main(): [ret: int2B]
        @@_fn_main:
        push bp
        mov bp, sp
        sub sp, 2
        push 2
        push 1
        call @@_fn_sum
        add ax, 4                 ; %t{5}: int2B = %t{4}: int2B plus %4: char1B
        mov word [bp - 2], ax     ; *(acc{0}: int*2B) = store %t{5}: int2B
        mov sp, bp
        pop bp
        ret
      `);
    });

    test('call with mixed args type Int and Char', () => {
      expect(/* cpp */ `
        int sum(int a, char b) { return a + b; }
        void main() { int k = sum(3, 'a'); }
      `).toCompiledAsmBeEqual(`
        cpu 386
        ; def sum(a{0}: int*2B, b{0}: char*2B): [ret: int2B]
        @@_fn_sum:
        push bp
        mov bp, sp
        movzx ax, byte [bp + 6]
        mov bx, [bp + 4]
        add bx, ax                ; %t{3}: int2B = %t{0}: int2B plus %t{2}: int2B
        mov ax, bx
        mov sp, bp
        pop bp
        ret 4
        ; def main():
        @@_fn_main:
        push bp
        mov bp, sp
        sub sp, 2
        push 97
        push 3
        call @@_fn_sum
        mov word [bp - 2], ax     ; *(k{0}: int*2B) = store %t{5}: int2B
        mov sp, bp
        pop bp
        ret
      `);
    });
  });

  describe('Array types', () => {
    test('call with string literal', () => {
      expect(/* cpp */ `
        void printf(const char* str) {}
        int main() {
          printf("Hello");
        }
      `).toCompiledAsmBeEqual(`
        cpu 386
        ; def printf(str{0}: const char**2B):
        @@_fn_printf:
        push bp
        mov bp, sp
        mov sp, bp
        pop bp
        ret 2
        ; def main(): [ret: int2B]
        @@_fn_main:
        push bp
        mov bp, sp
        mov ax, [@@_c_0_]         ; %t{2}: const char*2B = load %t{1}: const char**2B
        push ax
        call @@_fn_printf
        mov sp, bp
        pop bp
        ret
        @@_c_0_:
        dw @@_c_0_@str$0_0
        @@_c_0_@str$0_0: db "Hello", 0x0
      `);
    });

    test('call with two string literals, one implicit', () => {
      expect(/* cpp */ `
        void printf(const char* str, const char* str2) {}
        int main() {
          const char* str = "Hello world!";
          printf("Hello", str);
        }
      `).toCompiledAsmBeEqual(`
        cpu 386
        ; def printf(str{0}: const char**2B, str2{0}: const char**2B):
        @@_fn_printf:
        push bp
        mov bp, sp
        mov sp, bp
        pop bp
        ret 4
        ; def main(): [ret: int2B]
        @@_fn_main:
        push bp
        mov bp, sp
        sub sp, 2
        mov bx, @@_c_0_           ; %t{0}: const char*2B = lea c{0}: const char[13]*2B
        mov word [bp - 2], bx     ; *(str{1}: const char**2B) = store %t{0}: const char*2B
        mov ax, [@@_c_1_]         ; %t{3}: const char*2B = load %t{2}: const char**2B
        mov di, [bp - 2]          ; %t{4}: const char*2B = load str{1}: const char**2B
        push di
        push ax
        call @@_fn_printf
        mov sp, bp
        pop bp
        ret
        @@_c_0_:
        db "Hello world!", 0x0
        @@_c_1_:
        dw @@_c_1_@str$0_0
        @@_c_1_@str$0_0: db "Hello", 0x0
      `);
    });
  });

  describe('Struct types', () => {
    test('can return whole structure in register if fits', () => {
      expect(/* cpp */ `
        struct Vec2 { int x; };
        struct Vec2 sum() {
          struct Vec2 out = { .x = 6 };
          return out;
        }
        void main() { sum(); }
      `).toCompiledAsmBeEqual(`
        cpu 386
        ; def sum(): [ret: struct Vec22B]
        @@_fn_sum:
        push bp
        mov bp, sp
        sub sp, 2
        mov word [bp - 2], 6      ; *(out{0}: struct Vec2*2B) = store %6: int2B
        mov ax, [bp - 2]
        mov sp, bp
        pop bp
        ret
        ; def main():
        @@_fn_main:
        push bp
        mov bp, sp
        call @@_fn_sum
        mov sp, bp
        pop bp
        ret
      `);
    });

    test('RVO call with struct as return type', () => {
      expect(/* cpp */ `
        struct Vec2 {
          int x, y;
        };

        struct Vec2 of_vec(int x, int y) {
          struct Vec2 v = { .x = x, .y = y };
          return v;
        }

        int main() {
          struct Vec2 out = of_vec(2, 3);
          out.x = 1;
          out.y = 7;
        }
      `).toCompiledAsmBeEqual(`
        cpu 386
        ; def of_vec(x{0}: int*2B, y{0}: int*2B, rvo: %out{0}: struct Vec2*2B):
        @@_fn_of_vec:
        push bp
        mov bp, sp
        sub sp, 4
        mov ax, [bp + 4]
        mov word [bp - 4], ax     ; *(v{0}: struct Vec2*2B) = store %t{0}: int2B
        mov bx, [bp + 6]
        mov word [bp - 2], bx     ; *(v{0}: struct Vec2*2B + %2) = store %t{1}: int2B
        ; memcpy v{0}: struct Vec2*2B -> %out{0}: struct Vec2*2B
        lea di, [bp - 4]
        mov si, [bp + 8]
        ; offset = 0B
        mov cx, word [di]
        mov word [si], cx
        ; offset = 2B
        mov cx, word [di + 2]
        mov word [si + 2], cx
        mov sp, bp
        pop bp
        ret 6
        ; def main(): [ret: int2B]
        @@_fn_main:
        push bp
        mov bp, sp
        sub sp, 4
        lea bx, [bp - 4]          ; %t{3}: struct Vec2**2B = lea out{0}: struct Vec2*2B
        push bx
        push 3
        push 2
        call @@_fn_of_vec
        mov word [bp - 4], 1      ; *(out{0}: struct Vec2*2B) = store %1: char1B
        mov word [bp - 2], 7      ; *(out{0}: struct Vec2*2B + %2) = store %7: char1B
        mov sp, bp
        pop bp
        ret
      `);
    });

    test('call with struct as argument', () => {
      expect(/* cpp */ `
        struct Vec2 { int x, y; };

        int sum_vec(int k, struct Vec2 vec, int x) {
          return k + vec.x * vec.y - x;
        }

        int main() {
          struct Vec2 vec = { .x = 4, .y = 3 };
          int k = sum_vec(2, vec, 5);
          asm("xchg dx, dx");
        }
      `).toCompiledAsmBeEqual(`
        cpu 386
        ; def sum_vec(k{0}: int*2B, vec{0}: struct Vec2*2B, x{0}: int*2B): [ret: int2B]
        @@_fn_sum_vec:
        push bp
        mov bp, sp
        lea bx, [bp + 6]          ; %t{1}: struct Vec2**2B = lea vec{0}: struct Vec2*2B
        mov ax, [bx]              ; %t{2}: int2B = load %t{1}: struct Vec2**2B
        add bx, 2                 ; %t{4}: struct Vec2**2B = %t{1}: struct Vec2**2B plus %2: int2B
        mov cx, [bx]              ; %t{5}: int2B = load %t{4}: struct Vec2**2B
        imul ax, cx               ; %t{6}: int2B = %t{2}: int2B mul %t{5}: int2B
        mov dx, [bp + 4]
        add dx, ax                ; %t{7}: int2B = %t{0}: int2B plus %t{6}: int2B
        sub dx, word [bp + 10]    ; %t{9}: int2B = %t{7}: int2B minus %t{8}: int2B
        mov ax, dx
        mov sp, bp
        pop bp
        ret 6

        ; def main(): [ret: int2B]
        @@_fn_main:
        push bp
        mov bp, sp
        sub sp, 6
        mov word [bp - 4], 4      ; *(vec{1}: struct Vec2*2B) = store %4: int2B
        mov word [bp - 2], 3      ; *(vec{1}: struct Vec2*2B + %2) = store %3: int2B
        push 5
        ; Copy of struct - vec{1}: struct Vec2*2B
        push word [bp - 2]
        push word [bp - 4]
        push 2
        call @@_fn_sum_vec
        mov word [bp - 6], ax     ; *(k{1}: int*2B) = store %t{11}: int2B
        xchg dx, dx
        mov sp, bp
        pop bp
        ret
      `);
    });
  });

  test('call with struct as argument and RVO', () => {
    expect(/* cpp */ `
      struct Vec2 { int x, y; };

      struct Vec2 sum_vec(int k, struct Vec2 vec, int x) {
        struct Vec2 result = {
          .x = k + vec.x * vec.y - x,
          .y = vec.y * 3
        };

        return result;
      }

      int main() {
        struct Vec2 vec = { .x = 4, .y = 3 };
        struct Vec2 k = sum_vec(2, vec, 5);

        int d = k.x + k.y;
        asm("xchg dx, dx");
      }
    `).toCompiledAsmBeEqual(`
      cpu 386
      ; def sum_vec(k{0}: int*2B, vec{0}: struct Vec2*2B, x{0}: int*2B, rvo: %out{0}: struct Vec2*2B):
      @@_fn_sum_vec:
      push bp
      mov bp, sp
      sub sp, 4
      lea bx, [bp + 6]          ; %t{1}: struct Vec2**2B = lea vec{0}: struct Vec2*2B
      mov ax, [bx]              ; %t{2}: int2B = load %t{1}: struct Vec2**2B
      mov cx, bx                ; swap
      add bx, 2                 ; %t{4}: struct Vec2**2B = %t{1}: struct Vec2**2B plus %2: int2B
      mov dx, [bx]              ; %t{5}: int2B = load %t{4}: struct Vec2**2B
      imul ax, dx               ; %t{6}: int2B = %t{2}: int2B mul %t{5}: int2B
      mov di, [bp + 4]
      add di, ax                ; %t{7}: int2B = %t{0}: int2B plus %t{6}: int2B
      sub di, word [bp + 10]    ; %t{9}: int2B = %t{7}: int2B minus %t{8}: int2B
      mov word [bp - 4], di     ; *(result{0}: struct Vec2*2B) = store %t{9}: int2B
      add cx, 2                 ; %t{11}: struct Vec2**2B = %t{1}: struct Vec2**2B plus %2: int2B
      mov bx, cx
      mov ax, [bx]              ; %t{12}: int2B = load %t{11}: struct Vec2**2B
      imul ax, 3                ; %t{13}: int2B = %t{12}: int2B mul %3: char1B
      mov word [bp - 2], ax     ; *(result{0}: struct Vec2*2B + %2) = store %t{13}: int2B
      ; memcpy result{0}: struct Vec2*2B -> %out{0}: struct Vec2*2B
      lea di, [bp - 4]
      mov si, [bp + 12]
      ; offset = 0B
      mov cx, word [di]
      mov word [si], cx
      ; offset = 2B
      mov cx, word [di + 2]
      mov word [si + 2], cx
      mov sp, bp
      pop bp
      ret 8

      ; def main(): [ret: int2B]
      @@_fn_main:
      push bp
      mov bp, sp
      sub sp, 10
      mov word [bp - 4], 4      ; *(vec{1}: struct Vec2*2B) = store %4: int2B
      mov word [bp - 2], 3      ; *(vec{1}: struct Vec2*2B + %2) = store %3: int2B
      lea bx, [bp - 8]          ; %t{15}: struct Vec2**2B = lea k{1}: struct Vec2*2B
      push bx
      push 5
      ; Copy of struct - vec{1}: struct Vec2*2B
      push word [bp - 2]
      push word [bp - 4]
      push 2
      call @@_fn_sum_vec
      lea bx, [bp - 8]          ; %t{16}: struct Vec2**2B = lea k{1}: struct Vec2*2B
      mov ax, [bx]              ; %t{17}: int2B = load %t{16}: struct Vec2**2B
      add bx, 2                 ; %t{19}: struct Vec2**2B = %t{16}: struct Vec2**2B plus %2: int2B
      mov cx, [bx]              ; %t{20}: int2B = load %t{19}: struct Vec2**2B
      add ax, cx                ; %t{21}: int2B = %t{17}: int2B plus %t{20}: int2B
      mov word [bp - 10], ax    ; *(d{0}: int*2B) = store %t{21}: int2B
      xchg dx, dx
      mov sp, bp
      pop bp
      ret
    `);
  });

  test('call with autocased char -> int return type in function', () => {
    expect(/* cpp */ `
      int sum_char (char a, char b) {
        return a + b;
      }

      int main() {
        int sum = sum_char(1, 2);
      }
    `).toCompiledAsmBeEqual(`
      cpu 386
      ; def sum_char(a{0}: char*2B, b{0}: char*2B): [ret: int2B]
      @@_fn_sum_char:
      push bp
      mov bp, sp
      mov al, [bp + 4]
      add al, byte [bp + 6]     ; %t{2}: char1B = %t{0}: char1B plus %t{1}: char1B
      movzx ax, al
      mov sp, bp
      pop bp
      ret 4
      ; def main(): [ret: int2B]
      @@_fn_main:
      push bp
      mov bp, sp
      sub sp, 2
      push 2
      push 1
      call @@_fn_sum_char
      mov word [bp - 2], ax     ; *(sum{0}: int*2B) = store %t{5}: int2B
      mov sp, bp
      pop bp
      ret
    `);
  });

  test('proper preserve registers in recursive calls', () => {
    expect(/* cpp */ `
      int fibbonacci(int n) {
        if (n == 1)
          return 0;

        if (n <= 3)
          return 1;

        return fibbonacci(n-1) + fibbonacci(n-2);
      }

      void main() {
        int fib = fibbonacci(10) * 2 + fibbonacci(10);
        asm("xchg dx, dx");
      }
    `).toCompiledAsmBeEqual(`
      cpu 386
      ; def fibbonacci(n{0}: int*2B): [ret: int2B]
      @@_fn_fibbonacci:
      push bp
      mov bp, sp
      cmp word [bp + 4], 1      ; %t{1}: i1:zf = icmp %t{0}: int2B equal %1: char1B
      jnz @@_L1                 ; br %t{1}: i1:zf, false: L1
      @@_L2:
      mov ax, word 0
      mov sp, bp
      pop bp
      ret 2
      @@_L1:
      cmp word [bp + 4], 3      ; %t{3}: i1:zf = icmp %t{2}: int2B less_eq_than %3: char1B
      jg @@_L3                  ; br %t{3}: i1:zf, false: L3
      @@_L4:
      mov ax, word 1
      mov sp, bp
      pop bp
      ret 2
      @@_L3:
      mov ax, [bp + 4]
      mov bx, ax                ; swap
      sub ax, 1                 ; %t{6}: int2B = %t{5}: int2B minus %1: char1B
      push bx                   ; preserve: %t{5}
      push ax
      call @@_fn_fibbonacci
      pop bx                    ; restore: %t{5}
      sub bx, 2                 ; %t{10}: int2B = %t{5}: int2B minus %2: char1B
      xchg ax, cx
      push cx                   ; preserve: %t{7}
      push bx
      call @@_fn_fibbonacci
      pop cx                    ; restore: %t{7}
      add cx, ax                ; %t{12}: int2B = %t{7}: int2B plus %t{11}: int2B
      mov ax, cx
      mov sp, bp
      pop bp
      ret 2

      ; def main():
      @@_fn_main:
      push bp
      mov bp, sp
      sub sp, 2
      push 10
      call @@_fn_fibbonacci
      shl ax, 1                 ; %t{15}: int2B = %t{14}: int2B mul %2: char1B
      xchg ax, bx
      push bx                   ; preserve: %t{15}
      push 10
      call @@_fn_fibbonacci
      pop bx                    ; restore: %t{15}
      add bx, ax                ; %t{18}: int2B = %t{15}: int2B plus %t{17}: int2B
      mov word [bp - 2], bx     ; *(fib{0}: int*2B) = store %t{18}: int2B
      xchg dx, dx
      mov sp, bp
      pop bp
      ret
    `);
  });

  test('call with global struct as parameter', () => {
    expect(/* cpp */ `
      struct Vec2 { int x, y; };

      int sum_vec(struct Vec2 vec) {
        return vec.x + vec.y;
      }

      struct Vec2 vec = { .x = 4, .y = 3 };

      int main() {
        int d = sum_vec(vec);
      }
    `).toCompiledAsmBeEqual(`
      cpu 386
      ; def sum_vec(vec{0}: struct Vec2*2B): [ret: int2B]
      @@_fn_sum_vec:
      push bp
      mov bp, sp
      mov ax, [@@_c_0_]         ; %t{1}: int2B = load %t{0}: int*2B
      mov bx, @@_c_0_
      add bx, 2                 ; %t{3}: int*2B = %t{0}: struct Vec2*2B plus %2: int2B
      mov cx, [bx]              ; %t{4}: int2B = load %t{3}: int*2B
      add ax, cx                ; %t{5}: int2B = %t{1}: int2B plus %t{4}: int2B
      mov sp, bp
      pop bp
      ret 2

      ; def main(): [ret: int2B]
      @@_fn_main:
      push bp
      mov bp, sp
      sub sp, 2
      ; Copy of struct - %t{7}: struct Vec2*2B
      push word [@@_c_0_ + 2]
      push word [@@_c_0_]
      call @@_fn_sum_vec
      mov word [bp - 2], ax     ; *(d{0}: int*2B) = store %t{8}: int2B
      mov sp, bp
      pop bp
      ret

      @@_c_0_:
      dw 4, 3
    `);
  });

  test('operations on reg size struct', () => {
    expect(/* cpp */ `
      struct Vec2 { int x; };

      struct Vec2 inc(struct Vec2 sum) {
        sum.x++;
        return sum;
      }

      void main(){
        struct Vec2 vec = { .x = 5 };
        struct Vec2 vec2 = inc(vec);
        asm("xchg dx, dx");
      }
    `).toCompiledAsmBeEqual(`
      cpu 386
      ; def inc(sum{0}: struct Vec2*2B): [ret: struct Vec22B]
      @@_fn_inc:
      push bp
      mov bp, sp
      lea bx, [bp + 4]          ; %t{0}: struct Vec2**2B = lea sum{0}: struct Vec2*2B
      mov ax, [bx]              ; %t{1}: int2B = load %t{0}: struct Vec2**2B
      add ax, 1                 ; %t{2}: int2B = %t{1}: int2B plus %1: int2B
      mov word [bp + 4], ax     ; *(sum{0}: struct Vec2*2B) = store %t{2}: int2B
      mov ax, [bp + 4]
      mov sp, bp
      pop bp
      ret 2

      ; def main():
      @@_fn_main:
      push bp
      mov bp, sp
      sub sp, 4
      mov word [bp - 2], 5      ; *(vec{0}: struct Vec2*2B) = store %5: int2B
      ; Copy of struct - %t{5}: struct Vec22B
      push word [bp - 2]
      call @@_fn_inc
      mov word [bp - 4], ax     ; *(vec2{0}: struct Vec2*2B) = store %t{6}: struct Vec22B
      xchg dx, dx
      mov sp, bp
      pop bp
      ret
    `);
  });
});
