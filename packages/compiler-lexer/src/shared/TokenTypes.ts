/**
 * It can be shared with preprocessor pseudolanguage
 *
 * @export
 * @enum {number}
 */
export enum TokenType {
  // Text
  QUOTE = 'QUOTE',
  BRACKET = 'BRACKET',
  COMMA = 'COMMA',
  SEMICOLON = 'SEMICOLON',
  COLON = 'COLON',
  NUMBER = 'NUMBER',
  FLOAT_NUMBER = 'FLOAT_NUMBER',
  KEYWORD = 'KEYWORD',
  CHARACTER = 'CHARACTER',
  STRING = 'STRING',
  EOL = 'EOL',
  EOF = 'EOF',

  // Assign
  ASSIGN = 'ASSIGN',
  MUL_ASSIGN = 'MUL_ASSIGN',
  DIV_ASSIGN = 'DIV_ASSIGN',
  MOD_ASSIGN = 'MOD_ASSIGN',
  ADD_ASSIGN = 'ADD_ASSIGN',
  SUB_ASSIGN = 'SUB_ASSIGN',
  SHIFT_LEFT_ASSIGN = 'SHIFT_LEFT_ASSIGN',
  SHIFT_RIGHT_ASSIGN = 'SHIFT_RIGHT_ASSIGN',
  AND_ASSIGN = 'AND_ASSIGN',
  XOR_ASSIGN = 'XOR_ASSIGN',
  OR_ASSIGN = 'OR_ASSIGN',

  // Logic
  EQUAL = 'EQUAL',
  DIFFERS = 'DIFFERS',
  GREATER_THAN = 'GREATER_THAN',
  LESS_THAN = 'LESS_THAN',
  GREATER_EQ_THAN = 'GREATER_EQ_THAN',
  LESS_EQ_THAN = 'LESS_EQ_THAN',
  AND = 'AND',
  OR = 'OR',
  NOT = 'NOT',

  // Math
  PLUS = 'PLUS',
  MINUS = 'MINUS',
  MUL = 'MUL',
  DIV = 'DIV',
  POW = 'POW',
  MOD = 'MOD',
  BIT_AND = 'BIT_AND',
  BIT_OR = 'BIT_OR',
  BIT_SHIFT_RIGHT = 'BIT_SHIFT_RIGHT',
  BIT_SHIFT_LEFT = 'BIT_SHIFT_LEFT',

  INCREMENT = 'INCREMENT',
  DECREMENT = 'DECREMENT',
}

/**
 * Token type related meta kind
 *
 * @todo
 *  Remove compiler related types, for now it should be still OK
 *
 * @export
 * @enum {number}
 */
export enum TokenKind {
  // TEST(...)
  BRACKET_PREFIX = 'BRACKET_PREFIX',

  // QUOTE
  SINGLE_QUOTE = 'SINGLE_QUOTE', // '
  DOUBLE_QUOTE = 'DOUBLE_QUOTE', // "

  // BRACKETS
  PARENTHES_BRACKET = 'PARENTHES_BRACKET', // ()
  CURLY_BRACKET = 'CURLY_BRACKET', // {}
  SQUARE_BRACKET = 'SQUARE_BRACKET', // []

  // REGS
  REGISTER = 'REGISTER',

  // SIZE PREFIXES
  BYTE_SIZE_OVERRIDE = 'BYTE_SIZE_OVERRIDE',
  BRANCH_ADDRESSING_TYPE = 'BRANCH_ADDRESSING_TYPE',

  // OTHER
  // todo: register etc. move here
  IDENTIFIER = 'IDENTIFIER',
}
