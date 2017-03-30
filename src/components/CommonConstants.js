module.exports = {
  UNDEFINED: 'undefined',
  FUNCTION: 'function',
  DISCRETE_SEARCH_VALUE: 'discreteSearchValue',
  // keys
  ESCAPE_KEY: 27,
  CTRL_KEY: 17,
  CTRL_KEY_MAC_CHROME: 91,
  CTRL_KEY_MAC_FF: 224,
  SHIFT_KEY: 16,
  ENTER_KEY: 13,
  BACKSPACE_KEY: 8,
  DELETE_KEY: 46,
  ARROW_UP: 38,
  ARROW_DOWN: 40,
  ARROW_LEFT: 37,
  ARROW_RIGHT: 39,
  SYMBOLLESS_KEYS: [
    16, // SHIFT
    13, // ENTER
    20, // CAPSLOCK
    9, // TAB
    18, // ALT
    27, // ESC
    37, // ARROW LEFT
    38, // ARROW UP
    39, // ARROW RIGHT
    40, // ARROW DOWN,
    35, // END
    36  // HOME
  ],
  // symbol keys
  A_KEY: 65,
  // table
  GT_ROW_ID:'GT_RowId',
  SORTABLE:'sortable',
  SEARCHABLE: 'searchable',
  CASE_INSENSITIVE_SEARCH: 'cISearch',
  DISCRETE_CASE_INSENSITIVE_SEARCH: 'discreteCISearch',
  VISIBLE: 'visible',
  DATA: 'data',
  PERIOD_SEARCH: 200,
  TIMEOUT_SEARCH: 300,
  MORE_PAGES: 5,
  DISPLAY_TOP: 'top',
  DISPLAY_BOTTOM: 'bottom',
  SORT_PERIOD: 200,
  TARGET: 'target',
  RENDER: 'render',
  MIN_AUTOLOAD_PERIOD: 5, // 5 sec
  MAX_AUTOLOAD_PERIOD: 300 // 5 min
}
