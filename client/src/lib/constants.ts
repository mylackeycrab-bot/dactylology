/**
 * Class names produced by sklearn `LabelEncoder` in the training notebook.
 * `LabelEncoder` sorts labels lexicographically: ASCII uppercase (A–Z)
 * sorts before lowercase, so the 29 ASL-Alphabet classes come out as:
 *   0–25  A B C ... Z
 *   26    del
 *   27    nothing
 *   28    space
 * Keep this in sync with the model's softmax output order.
 */
export const ASL_LABELS = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J',
  'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T',
  'U', 'V', 'W', 'X', 'Y', 'Z',
  'del', 'nothing', 'space',
]

/** Special (non-letter) class names returned by the classifier. */
export type SpecialClass = 'nothing' | 'del' | 'space'
export const SPECIAL_CLASSES: ReadonlySet<string> = new Set(['nothing', 'del', 'space'])

export const STABILITY_HOLD_FRAMES = 28
export const STABILITY_MIN_CONFIDENCE = 0.85
/**
 * Mandatory gap (in frames) between two commits. After a letter is committed,
 * the stability buffer is inhibited for this many frames before it can start
 * accumulating again — giving the user time to switch hand shapes so the same
 * letter isn't accidentally written twice.
 */
export const STABILITY_COOLDOWN_FRAMES = 20

export const HAND_CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [0, 9], [9, 10], [10, 11], [11, 12],
  [0, 13], [13, 14], [14, 15], [15, 16],
  [0, 17], [17, 18], [18, 19], [19, 20],
  [5, 9], [9, 13], [13, 17],
]

export const LANDMARK_NAMES = [
  'wrist',
  'thumb-cmc', 'thumb-mcp', 'thumb-ip', 'thumb-tip',
  'index-mcp', 'index-pip', 'index-dip', 'index-tip',
  'middle-mcp', 'middle-pip', 'middle-dip', 'middle-tip',
  'ring-mcp', 'ring-pip', 'ring-dip', 'ring-tip',
  'pinky-mcp', 'pinky-pip', 'pinky-dip', 'pinky-tip',
]
