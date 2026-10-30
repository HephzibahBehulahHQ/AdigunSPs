export function validateHardwareItem(item = {}) {
  const description = String(item.description || "").trim();
  const quantity = Number(item.quantity);
  if (!description) return { valid:false, error:"Description is required." };
  if (!Number.isInteger(quantity) || quantity < 1) return { valid:false, error:"Quantity must be a positive whole number." };
  return { valid:true, item:{
    id:String(item.id || crypto.randomUUID()), category:String(item.category || "").trim(), manufacturer:String(item.manufacturer || "").trim(),
    partNumber:String(item.partNumber || "").trim(), description, quantity, notes:String(item.notes || "").trim(),
    tag:String(item.tag || "").trim(), panelPosition:String(item.panelPosition || "").trim(),
  } };
}
