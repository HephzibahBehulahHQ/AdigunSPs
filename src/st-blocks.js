const mask=text=>text.replace(/[^\r\n]/g," ");
const lineAt=(source,offset)=>1+(source.slice(0,offset).match(/\n/g)||[]).length;
export function extractFunctionBlocks(source,spans){
 const errors=[],ranges=[],definitions=[];let open;
 const masked=spans.map(span=>span.kind==="comment"?mask(span.text):span.text).join("");
 for(const span of spans){
  if(span.kind!=="identifier")continue;
  if(/^FUNCTION_BLOCK$/i.test(span.text)){if(open)errors.push(`Line ${lineAt(source,span.start)}: nested FUNCTION_BLOCK declarations are not supported.`);else open=span;}
  else if(/^END_FUNCTION_BLOCK$/i.test(span.text)){if(!open)errors.push(`Line ${lineAt(source,span.start)}: END_FUNCTION_BLOCK has no matching declaration.`);else{ranges.push({start:open.start,end:span.end,bodyEnd:span.start});open=null;}}
 }
 if(open)errors.push(`Line ${lineAt(source,open.start)}: FUNCTION_BLOCK is missing END_FUNCTION_BLOCK.`);
 if(ranges.length>32)errors.push("A source supports at most 32 function-block types.");
 for(const range of ranges.slice(0,32)){
  const text=masked.slice(range.start,range.bodyEnd),header=text.match(/^FUNCTION_BLOCK\s+([A-Za-z_][A-Za-z0-9_]*)[ \t]*(?:\r?\n|$)/i),line=lineAt(source,range.start);
  if(!header||header[1].length>64){errors.push(`Line ${line}: use FUNCTION_BLOCK Name on its own line (name up to 64 characters).`);continue;}
  if(/^(BOOL|INT|REAL|TIME)$/i.test(header[1])){errors.push(`Line ${line}: a function-block type cannot reuse a scalar type name.`);continue;}
  const definition={name:header[1],line,inputs:[],outputs:[],locals:[]},bodyOffset=range.start+header[0].length;
  let body=text.slice(header[0].length);
  body=body.replace(/\b(VAR_INPUT|VAR_OUTPUT|VAR)\b([\s\S]*?)\bEND_VAR\b/gi,(section,kind,entries,offset)=>{
   const destination=/^VAR_INPUT$/i.test(kind)?definition.inputs:/^VAR_OUTPUT$/i.test(kind)?definition.outputs:definition.locals;
   if(entries.trim()&&!entries.trim().endsWith(";"))errors.push(`Line ${lineAt(source,bodyOffset+offset)}: block declarations require a semicolon.`);
   for(const entry of entries.split(";")){
    if(!entry.trim())continue;
    const match=entry.trim().match(/^([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(BOOL|INT|REAL|TIME)$/i);
    if(!match||match[1].length>64)errors.push(`Line ${lineAt(source,bodyOffset+offset)}: block variables require a scalar Name : BOOL, INT, REAL, or TIME; declaration.`);
    else destination.push({name:match[1],type:match[2].toUpperCase()});
   }
   return mask(section);
  });
  if(definition.inputs.length>16||definition.outputs.length>16||definition.inputs.length+definition.outputs.length+definition.locals.length>128)errors.push(`Line ${line}: a block supports 16 inputs, 16 outputs and 128 total scalar variables.`);
  definition.body="\n".repeat(lineAt(source,bodyOffset)-1)+body;definitions.push(definition);
 }
 return {errors,ranges,definitions};
}
export function splitBlockArguments(text,line){
 if(!text.trim())return [];
 const parts=[];let depth=0,start=0;
 for(let index=0;index<text.length;index++){
  if(text[index]==="(")depth++;else if(text[index]===")")depth--;
  if(depth<0)throw Error(`Line ${line}: unmatched function-block argument parenthesis.`);
  if(text[index]===","&&depth===0){parts.push(text.slice(start,index));start=index+1;}
 }
 if(depth!==0)throw Error(`Line ${line}: unmatched function-block argument parenthesis.`);
 parts.push(text.slice(start));
 return parts.map(part=>{const match=part.trim().match(/^([A-Za-z_][A-Za-z0-9_]*)\s*:=\s*([\s\S]+)$/);if(!match)throw Error(`Line ${line}: use named block inputs, Input := expression.`);return {name:match[1],source:match[2]};});
}
