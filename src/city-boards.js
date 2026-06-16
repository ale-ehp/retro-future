export function cityDepartmentPageItems(page, config) {
  const start = page * config.rows;
  return config.departments.slice(start, start + config.rows);
}

function cityDepartmentBoardChar(oldText, newText, row, index, progress, textureUpdates, config) {
  const total = config.rows * config.charSlots;
  const cursor = progress * total;
  const charCursor = row * config.charSlots + index;
  if (cursor >= charCursor + 1) return newText[index] || ' ';
  if (cursor <= charCursor) return oldText[index] || ' ';
  const scrambleIndex = (row * 17 + index * 11 + textureUpdates * 3) % config.scramble.length;
  return config.scramble[scrambleIndex];
}

export function cityDepartmentInterpolatedText(oldText, newText, row, progress, textureUpdates, config) {
  const oldPadded = oldText.padEnd(config.charSlots, ' ');
  const newPadded = newText.padEnd(config.charSlots, ' ');
  let result = '';
  for (let i = 0; i < config.charSlots; i++) {
    result += cityDepartmentBoardChar(oldPadded, newPadded, row, i, progress, textureUpdates, config);
  }
  return result.trimEnd();
}
