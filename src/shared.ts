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

  struct Vec2 { int x, y; const char* str; };

  void main() {
    struct Vec2 vec[] = { { .y = 5 }, { .x = 4} };

    vec[0].str = "Hello world!";
    vec[0].y++;
    vec[1].x += 3;

    int k = vec[1].x * vec[0].y + strlen(vec[0].str);
    asm("xchg dx, dx");
  }
`;

// todo (fix allocator exception):
// todo (fix missing load instruction, optimizer issue)
/**
 *
 *     int sum(int x, int y) { return x + y; }
    int main() {
    int (*ptr)(int, int) = sum;
    (*ptr + 1)(1, 2);
    ptr(1, 2);
    (*ptr)(4, 5);
    }
 */
/**
   typedef struct Vec2 {
    int x, y;
  } vec2_t;

  void main() {
    vec2_t a = { .x = 1, .y  = 2};
    vec2_t b = a;

    a.x += 2;
    int k = a.x;
    asm("xchg dx, dx");
  }
 */

// todo (and ternary):
/**
  typedef struct Vec2 {
    int x, y;
  } vec2_t;

  void main() {
    vec2_t v, a;

    a = (struct Vec2) { .x = 5 };
  }
  */
