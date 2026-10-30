export const FBD_GRID = 24;
const COLUMN_STEP = 370;
const ROW_STEP = 280;

export function createFbdInternalBoolTag(project, preferredName) {
  project.tags ||= [];
  const occupied = new Set([...(project.tags || []).map((tag) => tag.name), ...(project.io?.inputs || []), ...(project.io?.outputs || [])]);
  let name = preferredName, suffix = 2;
  while (occupied.has(name)) name = `${preferredName}_${suffix++}`;
  project.tags.push({ name, type:"BOOL", role:"internal" });
  return name;
}

export function fbdBlockPosition(block, index) {
  const x = Number(block.layout?.x), y = Number(block.layout?.y);
  if (Number.isFinite(x) && Number.isFinite(y)) return { x, y };
  return { x: 28 + (index % 3) * COLUMN_STEP, y: 28 + Math.floor(index / 3) * ROW_STEP };
}

export function fbdCanvasSize(blocks) {
  const positions = blocks.map(fbdBlockPosition);
  return {
    width: Math.max(1160, ...positions.map(({ x }) => x + 380)),
    height: Math.max(180, ...positions.map(({ y }) => y + 250)),
  };
}

export function fbdVisibleBlockIndices(blocks, viewport, selectedIds = [], overscan = 0.75) {
  const selected = new Set(selectedIds), padX = Math.max(0, viewport.width) * overscan, padY = Math.max(0, viewport.height) * overscan;
  const left = viewport.left - padX, right = viewport.left + viewport.width + padX, top = viewport.top - padY, bottom = viewport.top + viewport.height + padY;
  return blocks.flatMap((block, index) => {
    if (selected.has(block.id)) return [index];
    const { x, y } = fbdBlockPosition(block, index), height = ["SCALE", "CTU"].includes(block.type) ? 300 : 240;
    return x <= right && x + 380 >= left && y <= bottom && y + height >= top ? [index] : [];
  });
}

export function fbdZoomToFit(blocks, viewportWidth) {
  const width = fbdCanvasSize(blocks).width;
  return Math.max(60, Math.min(150, Math.round(Math.max(1, viewportWidth - 28) / width * 100)));
}

export function moveFbdBlocks(blocks, selectedIds, origins, deltaX, deltaY, snap = true) {
  const ids = new Set(selectedIds);
  return blocks.map((block, index) => {
    if (!ids.has(block.id)) return block;
    const origin = origins[block.id] || fbdBlockPosition(block, index);
    const snapToGrid = (value) => Math.max(0, snap ? Math.round(value / FBD_GRID) * FBD_GRID : value);
    return { ...block, layout: { x: snapToGrid(origin.x + deltaX), y: snapToGrid(origin.y + deltaY) } };
  });
}

export function copyFbdBlocks(blocks, selectedIds) {
  const ids = new Set(selectedIds);
  return blocks.flatMap((block, index) => ids.has(block.id) ? [{ ...structuredClone(block), layout:fbdBlockPosition(block,index) }] : []);
}

export function pasteFbdBlocks(blocks, clipboard, makeId, offset = FBD_GRID * 2) {
  const pasted = clipboard.map((block) => {
    const copy = structuredClone(block), position = fbdBlockPosition(copy, 0);
    copy.id = makeId(); copy.layout = { x:position.x + offset, y:position.y + offset };
    return copy;
  });
  return { blocks:[...blocks, ...pasted], pastedIds:pasted.map((block) => block.id) };
}

export function assignFbdCopyTags(blocks, existingTags) {
  const used = new Set(existingTags.map((tag) => tag.name)), mapping = new Map(), tags = [];
  const outputs = blocks.map((block) => {
    const source = existingTags.find((tag) => tag.name === block.outputTag), numeric = ["ADD", "SUB", "MUL", "DIV", "SCALE"].includes(block.type);
    let index = 1, name = `FBD_COPY_${index}`;
    while (used.has(name)) name = `FBD_COPY_${++index}`;
    used.add(name); if (block.outputTag) mapping.set(block.outputTag, name);
    tags.push({ name, type:source?.type || (numeric ? "REAL" : "BOOL"), role:"internal", address:"" });
    return { ...block, outputTag:name };
  });
  return { blocks:outputs.map((block) => ({ ...block, inputs:(block.inputs || []).map((tag) => mapping.get(tag) || tag) })), tags };
}

export function removeFbdBlocks(blocks, selectedIds) {
  const ids = new Set(selectedIds);
  return blocks.filter((block) => !ids.has(block.id));
}
