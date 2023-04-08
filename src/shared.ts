// todo: elliminate `@allocated` literals for non globals

// todo: Compile const char* array of strings INSIDE function (global works)
// todo: Add stack based reg spilling!
// todo: Add resolve as label (see "read array ptr to variable", there should not be `mov`)
// todo: Peephole optimization in global variables
// todo: Add ternary
// todo: Fix calling fn with copy of struct
export const MOCK_C_FILE = /* c */ `
  int strlen(const char* str) {
    for (int i = 0;;++i) {
      if (*(str + i) == 0) {
        return i;
      }
    }

    return -1;
  }
  void main() {
    const char* HELLO_WORLD = "Hello world!";
    const char HELLO_WORLD2[] = "Hello world2!";
    const char* HELLO_WORLD3[] = { "Hello world3!", "Hello world45623!" }; // incorrect result

    int length = strlen(HELLO_WORLD);
    asm("xchg dx, dx");

    int length2 = strlen(HELLO_WORLD2);
    asm("xchg dx, dx");

    int length3 = strlen(HELLO_WORLD3[1]);
    asm("xchg dx, dx");
  }
`;

// TEST 1:
// const char* str2[] = { "Hello world2!", "Hello world2!", 0x5 };
// char b = str2[0][1];

// const char* VRAM_ADDR = 0xB800;
// const char* KERNEL_INIT_MESSAGES[] = {
//   "Hello world!",
//   "Peppa pig!",
//   "Another cool title!"
// };

// struct Vec2 {
//   int x, y;
// };

// struct Vec2 kernel_screen_cursor = {
//   .x = 0,
//   .y = 0,
// };

// int strlen(const char* str) {
//   for (int i = 0;;++i) {
//     if (*(str + i) == 0) {
//       return i;
//     }
//   }

//   return -1;
// }

// void kernel_screen_clear() {
//   asm(
//     "mov cx, 0x7d0\n"
//     "mov ax, 0xF00\n"
//     "mov dx, 0xB800\n"
//     "mov es, dx\n"
//     "xor di, di\n"
//     "rep stosw\n"
//   );
// }

// void kernel_screen_print_at(int x, int y, char color, const char* str) {
//   int len = strlen(str);
//   int origin = (y * 80 + x) * 2;

//   asm(
//     "mov gs, %[vram]\n"
//     :: [vram] "r" (VRAM_ADDR)
//   );

//   for (int i = 0; i < len; ++i) {
//     const char c = str[i];
//     const int offset = origin + i * 2;

//     asm(
//       "mov dl, %[color]\n"
//       "mov bx, %[offset]\n"
//       "mov byte [gs:bx + 1], dl\n"
//       "mov byte [gs:bx], %[c]\n"
//       :: [c] "r" (c), [offset] "r" (offset), [color] "m" (color)
//       : "dl"
//     );
//   }
// }

// void kernel_screen_println(char color, const char* str) {
//   kernel_screen_print_at(
//     kernel_screen_cursor.x,
//     kernel_screen_cursor.y,
//     color,
//     str,
//   );

//   kernel_screen_cursor.x = 0;
//   kernel_screen_cursor.y++;
// }

// void main() {
//   kernel_screen_clear();

//   for (int i = 1; i < 0xf; ++i) {
//     // todo: kernel_screen_println(i + 1, KERNEL_INIT_MESSAGES[i % 3]);
//     kernel_screen_println(i + 1, KERNEL_INIT_MESSAGES[i % 3]);
//   }
// }
