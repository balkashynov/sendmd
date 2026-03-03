type ActionResult = {
  newValue: string;
  selectionStart: number;
  selectionEnd: number;
};

function execReplace(
  ta: HTMLTextAreaElement,
  start: number,
  end: number,
  replacement: string
): void {
  ta.focus();
  ta.setSelectionRange(start, end);
  document.execCommand("insertText", false, replacement);
}

export function wrapSelection(
  ta: HTMLTextAreaElement,
  prefix: string,
  suffix: string
): ActionResult {
  const start = ta.selectionStart;
  const end = ta.selectionEnd;
  const value = ta.value;
  const selected = value.slice(start, end);

  // Check if selection is already wrapped
  const beforePrefix = value.slice(start - prefix.length, start);
  const afterSuffix = value.slice(end, end + suffix.length);

  if (beforePrefix === prefix && afterSuffix === suffix) {
    // Unwrap: remove prefix before and suffix after
    execReplace(ta, start - prefix.length, end + suffix.length, selected);
    const newValue = ta.value;
    return {
      newValue,
      selectionStart: start - prefix.length,
      selectionEnd: end - prefix.length,
    };
  }

  // Check if selected text itself starts/ends with prefix/suffix
  if (
    selected.startsWith(prefix) &&
    selected.endsWith(suffix) &&
    selected.length >= prefix.length + suffix.length
  ) {
    const inner = selected.slice(prefix.length, -suffix.length);
    execReplace(ta, start, end, inner);
    const newValue = ta.value;
    return {
      newValue,
      selectionStart: start,
      selectionEnd: start + inner.length,
    };
  }

  if (start === end) {
    // No selection: insert placeholder
    const placeholder = getPlaceholder(prefix);
    const wrapped = prefix + placeholder + suffix;
    execReplace(ta, start, end, wrapped);
    const newValue = ta.value;
    return {
      newValue,
      selectionStart: start + prefix.length,
      selectionEnd: start + prefix.length + placeholder.length,
    };
  }

  // Wrap selection
  const wrapped = prefix + selected + suffix;
  execReplace(ta, start, end, wrapped);
  const newValue = ta.value;
  return {
    newValue,
    selectionStart: start + prefix.length,
    selectionEnd: end + prefix.length,
  };
}

function getPlaceholder(prefix: string): string {
  switch (prefix) {
    case "**":
      return "bold";
    case "*":
      return "italic";
    case "~~":
      return "strikethrough";
    case "`":
      return "code";
    default:
      return "text";
  }
}

function getLineRange(
  value: string,
  pos: number
): { lineStart: number; lineEnd: number; lineText: string } {
  let lineStart = value.lastIndexOf("\n", pos - 1) + 1;
  let lineEnd = value.indexOf("\n", pos);
  if (lineEnd === -1) lineEnd = value.length;
  return { lineStart, lineEnd, lineText: value.slice(lineStart, lineEnd) };
}

export function toggleLinePrefix(
  ta: HTMLTextAreaElement,
  prefix: string
): ActionResult {
  const { lineStart, lineEnd, lineText } = getLineRange(ta.value, ta.selectionStart);

  if (lineText.startsWith(prefix)) {
    // Remove prefix
    const newLine = lineText.slice(prefix.length);
    execReplace(ta, lineStart, lineEnd, newLine);
    const newValue = ta.value;
    const cursorPos = lineStart + newLine.length;
    return { newValue, selectionStart: cursorPos, selectionEnd: cursorPos };
  }

  // Add prefix
  const newLine = prefix + lineText;
  execReplace(ta, lineStart, lineEnd, newLine);
  const newValue = ta.value;
  const cursorPos = lineStart + newLine.length;
  return { newValue, selectionStart: cursorPos, selectionEnd: cursorPos };
}

export function cycleHeading(ta: HTMLTextAreaElement): ActionResult {
  const { lineStart, lineEnd, lineText } = getLineRange(ta.value, ta.selectionStart);

  const match = lineText.match(/^(#{1,3})\s/);
  let newLine: string;

  if (!match) {
    // plain → #
    newLine = "# " + lineText;
  } else if (match[1] === "#") {
    // # → ##
    newLine = "## " + lineText.slice(2);
  } else if (match[1] === "##") {
    // ## → ###
    newLine = "### " + lineText.slice(3);
  } else {
    // ### → plain
    newLine = lineText.slice(4);
  }

  execReplace(ta, lineStart, lineEnd, newLine);
  const newValue = ta.value;
  const cursorPos = lineStart + newLine.length;
  return { newValue, selectionStart: cursorPos, selectionEnd: cursorPos };
}

export function insertLink(ta: HTMLTextAreaElement): ActionResult {
  const start = ta.selectionStart;
  const end = ta.selectionEnd;
  const selected = ta.value.slice(start, end);

  const text = selected || "text";
  const replacement = `[${text}](url)`;
  execReplace(ta, start, end, replacement);
  const newValue = ta.value;

  // Place cursor on "url"
  const urlStart = start + text.length + 3; // [text](
  const urlEnd = urlStart + 3; // url
  return { newValue, selectionStart: urlStart, selectionEnd: urlEnd };
}
