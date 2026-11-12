export function hmiDragPosition(x, y, cellW, cellH, gapX = 12, gapY = 12, snap = true) {
  const colIndex = Math.max(0, Math.min(5, Math.floor(Math.max(0, x) / (cellW + gapX))));
  const rowIndex = Math.max(0, Math.min(11, Math.floor(Math.max(0, y) / (cellH + gapY))));
  const offsetX = snap ? 0 : Math.max(0, Math.min(cellW - 24, x - colIndex * (cellW + gapX)));
  const offsetY = snap ? 0 : Math.max(0, Math.min(cellH - 24, y - rowIndex * (cellH + gapY)));
  return { col:colIndex + 1, row:rowIndex + 1, offsetX, offsetY };
}

export function hmiPointerPosition(clientX, clientY, bounds, { scrollLeft = 0, scrollTop = 0, paddingLeft = 0, paddingTop = 0, cellW, cellH, gapX = 12, gapY = 12, snap = true }) {
  return hmiDragPosition(clientX - bounds.left + scrollLeft - paddingLeft, clientY - bounds.top + scrollTop - paddingTop, cellW, cellH, gapX, gapY, snap);
}
