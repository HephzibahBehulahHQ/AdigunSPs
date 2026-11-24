import { connectElectricalTerminals, createElectricalComponent, duplicateElectricalComponent, electricalComponentCatalog, electricalComponentBounds, moveElectricalComponent, nextElectricalReference, hasElectricalChannelBinding, electricalAnalogRangeId, isCompatibleBackplaneCpu, replaceElectricalComponent, rewireElectricalTerminal, rotateElectricalComponent, simulateElectricalDiagram, updateElectricalComponentProperties, validateElectricalDiagram } from "./electrical.js";
import { industrialCatalogCategories, industrialCatalogManufacturers, industrialProductCatalog, searchIndustrialCatalog } from "./industrial-catalog.js";

const text = {
  en:{title:"Electrical schematic",palette:"Functional component models",modelSearch:"Find component or instruction",noModelMatches:"No matching model.",add:"Place component",wire:"Connect wire",cancel:"Cancel wire",pause:"Pause wire",selectMove:"Select / Move",replace:"Replace component",replaceHint:"Choose a model in Component tools, then apply it here.",remove:"Delete selected",rotate:"Rotate 90°",copy:"Duplicate",simulate:"Simulate circuit",validate:"Validate diagram",warning:"warning",warnings:"warnings",properties:"Properties",components:"Components",connections:"Connections",select:"Select a component or terminal",name:"Label",reference:"Reference",tag:"PLC tag",coilLink:"Associated coil",unlinked:"Manual contact input",voltage:"Rated voltage (V)",current:"Rated current (A)",manufacturer:"Manufacturer (verified only)",part:"Part number (verified only)",contact:"Contact behavior",contactClosedState:"Closed",contactOpenState:"Open",selectorPosition:"Selector position",breakerPolesOpen:"Open all three poles",positionI:"Position I · 11–12 closed",positionII:"Position II · 11–14 closed",normallyOpen:"Normally open",normallyClosed:"Normally closed",manual:"Manual input states",statusReady:"Simulation-only device models · no physical device connected.",addHint:"Choose a device model; manufacturer and part-number data are not verified.",wireHint:"Select two terminal markers to connect them.",wireSaved:"Connection saved",wireError:"Terminals could not be connected",valid:"Diagram checks passed",invalid:"Diagram has errors",on:"Energized",off:"De-energized",floating:"Unwired terminals",none:"No component selected",unknown:"Unsupported component model",fuseIntact:"Fuse intact",fuseTripTest:"Blow fuse (manual test)",fuseBlown:"Fuse blown",fuseReplaceHint:"A blown fuse cannot be reset. Delete it and add a replacement. Current-based fuse operation is not modeled.",contactsClosed:"Contacts closed",tripped:"Tripped",overloadTripped:"Overload tripped",address:"Address",moveHint:"Drag or use arrow keys to move; Shift moves five grid steps",noSpace:"No free board position is available.",overlap:"Components cannot overlap. Move to an open grid area.",safety:"Simulation-only wiring reference. Verify all device ratings and physical wiring independently before construction.",safetyBadge:"SIMULATION ONLY · NO HARDWARE"},
  de:{title:"Elektrischer Schaltplan",palette:"Generische Komponentenbibliothek",modelSearch:"Komponente oder Anweisung suchen",noModelMatches:"Kein passendes Modell.",add:"Komponente platzieren",wire:"Draht verbinden",cancel:"Draht abbrechen",pause:"Draht pausieren",selectMove:"Auswählen / Verschieben",replace:"Komponente ersetzen",replaceHint:"Wählen Sie unter Komponentenwerkzeuge ein Modell und wenden Sie es hier an.",remove:"Auswahl löschen",rotate:"90° drehen",copy:"Duplizieren",simulate:"Schaltung simulieren",validate:"Plan prüfen",warning:"Warnung",warnings:"Warnungen",properties:"Eigenschaften",components:"Komponenten",connections:"Verbindungen",select:"Komponente oder Anschluss auswählen",name:"Bezeichnung",reference:"Kennzeichen",tag:"SPS-Variable",coilLink:"Zugehörige Spule",unlinked:"Manueller Kontakteingang",voltage:"Nennspannung (V)",current:"Nennstrom (A)",manufacturer:"Hersteller (nur geprüft)",part:"Artikelnummer (nur geprüft)",contact:"Kontaktverhalten",contactClosedState:"Geschlossen",contactOpenState:"Offen",selectorPosition:"Schalterstellung",breakerPolesOpen:"Alle drei Pole öffnen",positionI:"Stellung I · 11–12 geschlossen",positionII:"Stellung II · 11–14 geschlossen",normallyOpen:"Schließer",normallyClosed:"Öffner",manual:"Manuelle Eingangszustände",statusReady:"Generisches Lernmodell · kein physisches Gerät verbunden.",addHint:"Generisches Symbol auswählen; Hersteller und Artikelnummer werden nicht vorausgesetzt.",wireHint:"Zwei Anschlussmarkierungen zum Verbinden auswählen.",wireSaved:"Verbindung gespeichert",wireError:"Anschlüsse konnten nicht verbunden werden",valid:"Planprüfung bestanden",invalid:"Plan enthält Fehler",on:"Erregt",off:"Nicht erregt",floating:"Unverdrahtete Anschlüsse",none:"Keine Komponente ausgewählt",unknown:"Nicht unterstützte generische Komponente",fuseIntact:"Sicherung intakt",fuseTripTest:"Sicherung auslösen (manueller Test)",fuseBlown:"Sicherung ausgelöst",fuseReplaceHint:"Eine ausgelöste Sicherung ist nicht rückstellbar. Löschen Sie sie und fügen Sie eine Ersatzsicherung hinzu. Eine stromabhängige Auslösung wird nicht modelliert.",contactsClosed:"Kontakte geschlossen",tripped:"Ausgelöst",overloadTripped:"Überlast ausgelöst",address:"Adresse",moveHint:"Ziehen oder mit Pfeiltasten verschieben; Umschalt bewegt fünf Rasterschritte",noSpace:"Kein freier Platz auf der Zeichenfläche verfügbar.",safety:"Verdrahtung nur zur Simulation. Gerätespezifikationen und reale Verdrahtung vor dem Aufbau unabhängig prüfen.",safetyBadge:"NUR SIMULATION · KEINE HARDWARE"},
  yo:{title:"Àwòrán ìsopọ̀ iná",palette:"Àwọn àwòrán component",modelSearch:"Wá component tàbí instruction",noModelMatches:"Kò sí model tó bá mu.",add:"Gbe component sí ibì kan",wire:"So waya pọ̀",cancel:"Fagilé wire",pause:"Dá wire dúró díẹ̀",selectMove:"Yan / Gbe",replace:"Rọ́pò component",replaceHint:"Yan model tuntun nínú Component tools, kí o sì fi síbí.",remove:"Pa èyí tí a yàn rẹ́",rotate:"Yí 90°",copy:"Ṣe ẹ̀dà",simulate:"Ṣe ìṣàfarawé circuit",validate:"Ṣàyẹ̀wò àwòrán",warning:"ìkìlọ̀",warnings:"ìkìlọ̀",properties:"Àwọn àbùdá",components:"Àwọn component",connections:"Àwọn ìsopọ̀",select:"Yan component tàbí terminal",name:"Àkọlé",reference:"Ìtọ́kasí",tag:"PLC tag",coilLink:"Coil tó so mọ́ ọn",unlinked:"Input contact pẹ̀lú ọwọ́",voltage:"Voltage (V)",current:"Current (A)",manufacturer:"Olùṣe (tí a fìdí rẹ̀ múlẹ̀ nìkan)",part:"Nọ́ńbà apá (tí a fìdí rẹ̀ múlẹ̀ nìkan)",contact:"Ìhùwàsí contact",contactClosedState:"Títì",contactOpenState:"Ṣí",selectorPosition:"Ipò selector",breakerPolesOpen:"Ṣí gbogbo póòlù mẹ́tẹ̀ẹ̀ta",positionI:"Ipò I · 11–12 ti tì",positionII:"Ipò II · 11–14 ti tì",normallyOpen:"Ṣí deede",normallyClosed:"Títì deede",manual:"Ipò ìwọlé tí a ṣètò fúnra ẹni",statusReady:"Generic ẹ̀kọ́ nìkan · kò sí ẹrọ gidi tó so mọ́ ọn.",addHint:"Yan àmì generic; a kò dá olùṣe tàbí nọ́ńbà apá sílẹ̀.",wireHint:"Yan àmì terminal méjì láti so pọ̀.",wireSaved:"A ti fipamọ́ ìsopọ̀",wireError:"A kò lè so àwọn terminal pọ̀",valid:"Àyẹ̀wò àwòrán kọjá",invalid:"Àṣìṣe wà nínú àwòrán",on:"Ń ṣiṣẹ́",off:"Kò ṣiṣẹ́",floating:"Terminal tí kò ní wire",none:"Kò sí component tí a yàn",unknown:"Generic component tí a kò mọ̀",fuseIntact:"Fíúsì kò tíì gé",fuseTripTest:"Dán fíúsì wò (fí i sí ipo gígé)",fuseBlown:"Fíúsì ti gé",fuseReplaceHint:"A kò lè tún fíúsì tó ti gé ṣe. Pa á rẹ́, kí o sì fi fíúsì tuntun kún un. A kò ṣe àfihàn ìṣàn current fún fíúsì.",contactsClosed:"Àwọn contact ti pa",tripped:"Ó ti gé",overloadTripped:"Overload ti gé",address:"Àdírẹ́sì",moveHint:"Fà á tàbí lo bọ́tìnì ọfà láti gbé e; Shift ń gbé e ní ìgbésẹ̀ márùn-ún",noSpace:"Kò sí ààyè tó ṣófo lórí pátákó iṣẹ́.",safety:"Wiring jẹ́ fún ìṣàfarawé nìkan. Ṣàyẹ̀wò rating ẹrọ àti wiring gidi lọ́tọ̀ kí ẹ tó kọ́ ọ.",safetyBadge:"ÌṢÀFARAWÉ NÌKAN · KÒ SÍ HARDWARE"},
  pcm:{title:"Electrical schematic",palette:"Functional component models",modelSearch:"Find component or instruction",noModelMatches:"No matching model.",add:"Place component",wire:"Connect wire",cancel:"Cancel wire",pause:"Pause wire",replace:"Replace component",replaceHint:"Choose model for Component tools, then apply am here.",remove:"Delete selected",rotate:"Rotate 90°",copy:"Duplicate",simulate:"Simulate circuit",validate:"Check diagram",warning:"warning",warnings:"warnings",properties:"Properties",components:"Components",connections:"Connections",select:"Select component or terminal",name:"Label",reference:"Reference",tag:"PLC tag",coilLink:"Related coil",unlinked:"Manual contact input",voltage:"Rated voltage (V)",current:"Rated current (A)",manufacturer:"Manufacturer (verified only)",part:"Part number (verified only)",contact:"Contact behavior",contactClosedState:"Closed",contactOpenState:"Open",selectorPosition:"Selector position",breakerPolesOpen:"Open all three poles",positionI:"Position I · 11–12 closed",positionII:"Position II · 11–14 closed",normallyOpen:"Normally open",normallyClosed:"Normally closed",manual:"Manual input states",statusReady:"Generic learning model only · no physical device connect.",addHint:"Choose generic symbol; no maker or part number dey assumed.",wireHint:"Select two terminal markers to connect dem.",wireSaved:"Connection don save",wireError:"Terminals no fit connect",valid:"Diagram check pass",invalid:"Diagram get errors",on:"Energized",off:"De-energized",floating:"Terminals wey no get wire",none:"No component selected",unknown:"Generic component no support",fuseIntact:"Fuse dey intact",fuseTripTest:"Blow fuse (manual test)",fuseBlown:"Fuse don blow",fuseReplaceHint:"You no fit reset blown fuse. Delete am add replacement. Model no calculate current trip.",contactsClosed:"Contacts close",tripped:"E don trip",overloadTripped:"Overload don trip",address:"Address",moveHint:"Drag or use arrow keys move am; Shift moves five grid steps",noSpace:"No free space remain on the board.",safety:"Simulation wiring reference only. Verify device ratings and real wiring independently before construction.",safetyBadge:"SIMULATION ONLY · NO HARDWARE"},
};
const langText = (lang) => text[lang] || text.en;
function electricalComponentsOverlap(component,others,gap=12) {
  const bounds=electricalComponentBounds(component);
  return others.some((other)=>{const candidate=electricalComponentBounds(other);return bounds.left<candidate.right+gap&&bounds.right>candidate.left-gap&&bounds.top<candidate.bottom+gap&&bounds.bottom>candidate.top-gap;});
}
function electricalMoveKeepsClearance(next,current,others,gap=12) {
  const area=(a,b)=>{const first=electricalComponentBounds(a),second=electricalComponentBounds(b);return Math.max(0,Math.min(first.right,second.right+gap)-Math.max(first.left,second.left-gap))*Math.max(0,Math.min(first.bottom,second.bottom+gap)-Math.max(first.top,second.top-gap));};
  const startingAreas=others.map((other)=>area(current,other)),nextAreas=others.map((other)=>area(next,other));
  return nextAreas.every((value,index)=>startingAreas[index]>0||value===0)&&nextAreas.reduce((total,value)=>total+value,0)<=startingAreas.reduce((total,value)=>total+value,0);
}
function findElectricalPlacement(component,components,preferredX,preferredY) {
  const occupied=components.map(item=>electricalComponentBounds(item)),fits=(x,y)=>{const placed=moveElectricalComponent(component,x,y),bounds=electricalComponentBounds(placed);return !occupied.some(other=>bounds.left<other.right+12&&bounds.right>other.left-12&&bounds.top<other.bottom+12&&bounds.bottom>other.top-12)?placed:null;};
  const preferred=fits(preferredX,preferredY);if(preferred)return preferred;
  for(let y=0;y<=1400;y+=20)for(let x=0;x<=2200;x+=20){const placed=fits(x,y);if(placed)return placed;}
  return null;
}
export function electricalSimulationStatus(result,components,labels={on:"Energized",off:"De-energized"}) {
  const faults=(result?.faults||[]).map((fault)=>fault.message).filter(Boolean);
  if(faults.length)return faults.join(" ");
  const active=Object.entries(result?.energized||{}).filter(([,energized])=>energized).map(([id])=>components.find((component)=>component.id===id)?.reference).filter(Boolean);
  return active.length?`${labels.on}: ${active.join(", ")}`:labels.off;
}
export function electricalSignalDisplay(value, unit = "") {
  if (!Number.isFinite(value)) return "—";
  return unit ? `${Number(value.toFixed(3))} ${unit}` : String(value);
}

const componentName = (type) => electricalComponentCatalog[type]?.name || type;
const escape = (value) => String(value ?? "").replace(/[&<>"']/g,(char) => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[char]));
const terminalPosition = (component,terminal) => {
  const spec=electricalComponentCatalog[component.type], pins = spec?.terminalLayout || spec?.terminals || [], index = Math.max(0,pins.indexOf(terminal)), leftCount = Math.ceil(pins.length/2), left = index < leftCount, slot = left ? index : index-leftCount, sideCount = left ? leftCount : pins.length-leftCount;
  const local = [left ? -60 : 60, Math.min(150,32+slot*22)], angle = Number(component.rotation || 0) * Math.PI / 180;
  return [component.x + 60 + local[0] * Math.cos(angle) - (local[1]-40) * Math.sin(angle), component.y + 40 + local[0] * Math.sin(angle) + (local[1]-40) * Math.cos(angle)];
};
export function electricalWirePath(wire,components) {
  const a=components.find(item=>item.id===wire.from?.componentId);
  if(!a)return "";
  const [x1,y1]=terminalPosition(a,wire.from.terminal);
  if(wire.draft&&!wire.to){const x2=wire.end?.x??wire.waypoints?.at(-1)?.x??x1,y2=wire.end?.y??wire.waypoints?.at(-1)?.y??y1;return [`M${x1} ${y1}`,...(wire.waypoints||[]).map((point)=>`L${point.x} ${point.y}`),`L${x2} ${y2}`].join("");}
  const b=components.find(item=>item.id===wire.to?.componentId);if(!b)return "";
  const [x2,y2]=terminalPosition(b,wire.to.terminal);
  if(wire.waypoints?.length)return [`M${x1} ${y1}`,...wire.waypoints.map((point)=>`L${point.x} ${point.y}`),`L${x2} ${y2}`].join("");
  const obstacles=components.filter(item=>item.id!==a.id&&item.id!==b.id).map(item=>electricalComponentBounds(item));
  const gap=12,blocked=(first,second)=>obstacles.some(box=>{
    if(first.y===second.y)return first.y>box.top-gap&&first.y<box.bottom+gap&&Math.max(Math.min(first.x,second.x),box.left-gap)<Math.min(Math.max(first.x,second.x),box.right+gap);
    if(first.x===second.x)return first.x>box.left-gap&&first.x<box.right+gap&&Math.max(Math.min(first.y,second.y),box.top-gap)<Math.min(Math.max(first.y,second.y),box.bottom+gap);
    return true;
  });
  const candidates=[],addCandidate=points=>{
    const route=[{x:x1,y:y1},...points,{x:x2,y:y2}],compact=route.filter((point,index)=>index===0||point.x!==route[index-1].x||point.y!==route[index-1].y);
    if(compact.slice(1).some((point,index)=>blocked(compact[index],point)))return;
    const length=compact.slice(1).reduce((sum,point,index)=>sum+Math.abs(point.x-compact[index].x)+Math.abs(point.y-compact[index].y),0);
    candidates.push({route:compact,cost:length+Math.max(0,compact.length-2)*24});
  };
  const defaultX=Math.round((x1+x2)/40)*20;
  addCandidate([{x:defaultX,y:y1},{x:defaultX,y:y2}]);
  if(candidates.length)return `M${x1} ${y1}H${defaultX}V${y2}H${x2}`;
  for(let x=0;x<=2200;x+=20)addCandidate([{x,y:y1},{x,y:y2}]);
  for(let y=0;y<=1400;y+=20)addCandidate([{x:x1,y},{x:x2,y}]);
  candidates.sort((first,second)=>first.cost-second.cost);
  const route=candidates[0]?.route;
  if(route)return [`M${route[0].x} ${route[0].y}`,...route.slice(1).map(point=>`L${point.x} ${point.y}`)].join("");

  const minX=Math.min(-20,Math.floor(Math.min(x1,x2)/20)*20),maxX=Math.max(2220,Math.ceil(Math.max(x1,x2)/20)*20);
  const minY=Math.min(-20,Math.floor(Math.min(y1,y2)/20)*20),maxY=Math.max(1420,Math.ceil(Math.max(y1,y2)/20)*20);
  const xs=new Set([x1,x2]),ys=new Set([y1,y2]);
  for(let x=minX;x<=maxX;x+=20)xs.add(x);
  for(let y=minY;y<=maxY;y+=20)ys.add(y);
  for(const box of obstacles){xs.add(box.left-gap);xs.add(box.right+gap);ys.add(box.top-gap);ys.add(box.bottom+gap);}
  const xValues=[...xs].sort((first,second)=>first-second),yValues=[...ys].sort((first,second)=>first-second),width=xValues.length;
  const startX=xValues.indexOf(x1),startY=yValues.indexOf(y1),goalX=xValues.indexOf(x2),goalY=yValues.indexOf(y2);
  const inside=(x,y)=>obstacles.some(box=>x>box.left-gap&&x<box.right+gap&&y>box.top-gap&&y<box.bottom+gap);
  const startNode=startY*width+startX,goalNode=goalY*width+goalX,startState=startNode*3+2,distances=new Map([[startState,0]]),previous=new Map(),heap=[];
  const push=(item)=>{let index=heap.length;heap.push(item);while(index){const parent=(index-1)>>1;if(heap[parent][0]<=item[0])break;heap[index]=heap[parent];index=parent;}heap[index]=item;};
  const pop=()=>{const first=heap[0],last=heap.pop();if(heap.length){let index=0;while(true){let child=index*2+1;if(child>=heap.length)break;if(child+1<heap.length&&heap[child+1][0]<heap[child][0])child++;if(heap[child][0]>=last[0])break;heap[index]=heap[child];index=child;}heap[index]=last;}return first;};
  push([Math.abs(x2-x1)+Math.abs(y2-y1),0,startState]);
  let goalState=-1;
  while(heap.length){
    const [,cost,state]=pop();if(cost!==distances.get(state))continue;
    const node=Math.floor(state/3),direction=state%3,xi=node%width,yi=Math.floor(node/width),x=xValues[xi],y=yValues[yi];
    if(node===goalNode){goalState=state;break;}
    const neighbors=[];
    if(xi>0)neighbors.push([node-1,0,xValues[xi-1],y]);
    if(xi+1<width)neighbors.push([node+1,0,xValues[xi+1],y]);
    if(yi>0)neighbors.push([node-width,1,x,yValues[yi-1]]);
    if(yi+1<yValues.length)neighbors.push([node+width,1,x,yValues[yi+1]]);
    for(const [nextNode,nextDirection,nextX,nextY] of neighbors){
      if(inside(nextX,nextY)||blocked({x,y},{x:nextX,y:nextY}))continue;
      const nextState=nextNode*3+nextDirection,nextCost=cost+Math.abs(nextX-x)+Math.abs(nextY-y)+(direction!==2&&direction!==nextDirection?24:0);
      if(nextCost>=(distances.get(nextState)??Infinity))continue;
      distances.set(nextState,nextCost);previous.set(nextState,state);
      push([nextCost+Math.abs(x2-nextX)+Math.abs(y2-nextY),nextCost,nextState]);
    }
  }
  if(goalState<0)return "";
  const points=[];
  for(let state=goalState;state!==undefined;state=previous.get(state)){
    const node=Math.floor(state/3);points.push({x:xValues[node%width],y:yValues[Math.floor(node/width)]});
    if(state===startState)break;
  }
  points.reverse();
  const compact=points.filter((point,index)=>index===0||index===points.length-1||((point.x!==points[index-1].x||point.x!==points[index+1].x)&&(point.y!==points[index-1].y||point.y!==points[index+1].y)));
  return [`M${compact[0].x} ${compact[0].y}`,...compact.slice(1).map(point=>`L${point.x} ${point.y}`)].join("");
}
export function electricalSymbolSvg(component) {
  const spec=electricalComponentCatalog[component.type],common='fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"',line=(x1,y1,x2,y2)=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${common}/`,text=(x,y,value,size=8)=>`<text x="${x}" y="${y}" text-anchor="middle" font-size="${size}" fill="currentColor" stroke="none">${escape(value)}</text>`;
  if(!spec)return "";
  const contact=(normallyClosed,closed=normallyClosed)=>`${line(4,22,31,22)}${line(31,10,31,34)}${line(65,10,65,34)}${line(65,22,92,22)}${line(31,22,closed?65:58,closed?22:12)}${normallyClosed?line(43,9,54,35):""}`;
  let body="";
  switch(component.type){
    case "sitopPSU100C":body=`<rect x="10" y="3" width="76" height="38" rx="1" ${common}/>${text(48,13,"SITOP PSU100C",7)}${text(48,23,"24 V DC · 2.5 A",7)}${text(48,33,"AC / DC",6)}`;break;
    case "ifmPN2070":body=`<rect x="18" y="3" width="60" height="38" rx="1" ${common}/>${text(48,14,"PN2070",9)}${text(48,24,"0–400 bar",6)}${text(48,34,"OUT1 · OUT2",5)}`;break;
    case "siemensS71214CG2Transistor":
    case "siemensS71214CG2AcRelay":
    case "siemensS71214CG2Relay":
    case "siemensS71212CG2AcRelay":
    case "siemensS71212CG2Relay":
    case "siemensS71212CG2":body=`<rect x="15" y="3" width="66" height="38" rx="2" ${common}/>${text(48,12,component.type.startsWith("siemensS71214C") ? "CPU 1214C" : "CPU 1212C",7)}<rect x="20" y="16" width="16" height="19" rx="1" ${common}/><rect x="40" y="16" width="16" height="19" rx="1" ${common}/><rect x="60" y="16" width="16" height="19" rx="1" ${common}/>${text(28,28,"X80",6)}${text(48,28,"X10",6)}${text(68,28,"X11",6)}${text(28,40,component.type.endsWith("AcRelay") ? "AC" : "24V",5)}${text(48,40,"DI",5)}${text(68,40,component.type.endsWith("Relay") ? "RLY" : "DQ",5)}`;break;
    case "supply24vdc": body=`<circle cx="48" cy="21" r="16" ${common}/>${text(48,24,"DC",9)}${line(5,21,32,21)}${line(64,21,91,21)}${text(48,7,"+",7)}${text(48,39,"−",7)}`;break;
    case "singlePhaseSupply": body=`<circle cx="48" cy="21" r="16" ${common}/>${text(48,19,"1~",9)}${text(48,28,"AC",6)}${line(5,21,32,21)}${line(64,21,91,21)}${text(48,5,"L/N",6)}`;break;
    case "supply3phase": body=`<circle cx="48" cy="21" r="16" ${common}/>${text(48,19,"3~",9)}${text(48,28,"AC",6)}${line(5,21,32,21)}${line(64,21,91,21)}`;break;
    case "genericPlc24v4di4do": body=`<rect x="18" y="5" width="60" height="32" rx="2" ${common}/>${text(48,18,"PLC",9)}${text(48,29,"DI 4 · DO 4",6)}${line(5,12,18,12)}${line(5,21,18,21)}${line(5,30,18,30)}${line(78,12,91,12)}${line(78,21,91,21)}${line(78,30,91,30)}`;break;
    case "siemensSM1221G2DI16":
      body=`<rect x="16" y="3" width="64" height="38" rx="2" ${common}/>${text(48,12,"SM 1221 · 16 DI",7)}<rect x="21" y="16" width="54" height="9" ${common}/><rect x="21" y="28" width="54" height="9" ${common}/>${text(48,23,"X10 · 1M / 2M",6)}${text(48,35,"X11 · 3M / 4M",6)}`;
      break;
    case "siemensSM1222G2Relay16":
      body=`<rect x="16" y="3" width="64" height="38" rx="2" ${common}/>${text(48,12,"SM 1222 · 16 RLY",7)}<rect x="21" y="16" width="54" height="9" ${common}/><rect x="21" y="28" width="54" height="9" ${common}/>${text(48,23,"X10 · 1L",6)}${text(48,35,"X11 · 2L",6)}`;
      break;
    case "siemensSM1222G2Transistor16":
      body=`<rect x="16" y="3" width="64" height="38" rx="2" ${common}/>${text(48,12,"SM 1222 · 16 DQ",7)}<rect x="21" y="16" width="54" height="9" ${common}/><rect x="21" y="28" width="54" height="9" ${common}/>${text(48,23,"X10 · 1L+ / 1M",6)}${text(48,35,"X11 · 2L+ / 2M",6)}`;
      break;
    case "siemensSM1231G2AI8":
      body=`<rect x="16" y="3" width="64" height="38" rx="2" ${common}/>${text(48,12,"SM 1231 · 8 AI",7)}<rect x="21" y="16" width="54" height="9" ${common}/><rect x="21" y="28" width="54" height="9" ${common}/>${text(48,23,"X10 · AI 0–3",6)}${text(48,35,"X11 · AI 4–7",6)}`;
      break;
    case "siemensSM1232G2AQ8":
      body=`<rect x="16" y="3" width="64" height="38" rx="2" ${common}/>${text(48,12,"SM 1232 · 8 AQ",7)}<rect x="21" y="16" width="54" height="9" ${common}/><rect x="21" y="28" width="54" height="9" ${common}/>${text(48,23,"X10 · AQ 0–3",6)}${text(48,35,"X11 · AQ 4–7",6)}`;
      break;
    case "siemensSM1233G2AI4AQ4":
      body=`<rect x="16" y="3" width="64" height="38" rx="2" ${common}/>${text(48,12,"SM 1233 · AI/AQ",7)}<rect x="21" y="16" width="54" height="9" ${common}/><rect x="21" y="28" width="54" height="9" ${common}/>${text(48,23,"X10 · AI 0–3",6)}${text(48,35,"X11 · AQ 0–3",6)}`;
      break;
    case "digitalInputModule4":case "digitalOutputModule4":case "analogInputModule2":case "analogOutputModule2": {const title=component.type.startsWith("analog")?component.type.startsWith("analogInput")?"AI":"AO":component.type.startsWith("digitalInput")?"DI":"DO";body=`<rect x="20" y="5" width="56" height="32" rx="2" ${common}/>${text(48,20,title,10)}${text(48,30,component.type.startsWith("analog")?"2 CH":"4 CH",7)}${[0,1,2].map((i)=>line(5,12+i*9,20,12+i*9)).join("")}${[0,1,2].map((i)=>line(76,12+i*9,91,12+i*9)).join("")}`;break;}
    case "analogSignalSource":case "analogVoltageSource":case "analogCurrentSource":case "analogLoopCurrentSource":body=`<circle cx="48" cy="22" r="13" ${common}/><path d="M40 22h5l4-7 5 14 4-7h5" ${common}/>${line(4,22,35,22)}${line(61,22,92,22)}`;break;
    case "analogVoltageIndicator":case "analogCurrentIndicator":
    case "analogSignalIndicator":body=`<circle cx="58" cy="22" r="12" ${common}/>${text(58,25,electricalComponentCatalog[component.type].analogSignalUnit || "AI",8)}${line(4,22,46,22)}<path d="M37 16l9 6-9 6" ${common}/>${line(70,22,92,22)}`;break;
    case "contactor3P":body=`<rect x="36" y="8" width="24" height="26" ${common}/>${text(48,24,"KM",8)}${line(4,21,36,21)}${line(60,21,92,21)}${text(48,6,"A1",6)}${text(48,40,"A2",6)}`;break;
    case "relayCoil":body=`<rect x="35" y="8" width="26" height="26" ${common}/>${text(48,24,"K",10)}${line(4,21,35,21)}${line(61,21,92,21)}${text(48,6,"A1",6)}${text(48,40,"A2",6)}`;break;
    case "siemensSirius3RT20171WB41":{const closed=Boolean(component.mainContactsClosed);body=`${text(48,6,"3RT20 · 3 NO",6)}${[0,1,2].map((index)=>{const y=13+index*9;return `${line(5,y,31,y)}${line(31,y-3,31,y+3)}${line(65,y-3,65,y+3)}${line(31,y,closed?65:58,closed?y:y-5)}${line(65,y,91,y)}`;}).join("")}${text(48,43,`A1+ / A2− · 13/14 ${closed?"CLOSED":"NO"}`,5)}`;break;}
    case "siemensSirius3RV20111JA10":{const open=Boolean(component.breakerOpen);body=`${text(48,6,"3RV2 · 3 POLE",6)}${[0,1,2].map((index)=>{const y=13+index*9;return `${line(5,y,31,y)}${line(31,y-3,31,y+3)}${line(65,y-3,65,y+3)}${line(31,y,open?58:65,open?y-5:y)}${line(65,y,91,y)}${text(48,y+2,"I>",5)}`;}).join("")}`;break;}
    case "phoenixPT25PE":body=`${line(5,22,31,22)}<rect x="31" y="10" width="34" height="24" ${common}/>${text(48,25,"PE",10)}${line(65,22,91,22)}${line(48,34,48,38)}${line(39,38,57,38)}${line(42,41,54,41)}${line(45,44,51,44)}`;break;
    case "selectorSwitch":{const closedThrow=component.selectorPosition==="II"?54:32;body=`${line(4,32,31,32)}<circle cx="31" cy="32" r="2" fill="currentColor" stroke="none"/>${line(31,32,closedThrow===32?65:58,closedThrow)}${line(65,32,92,32)}${line(65,54,92,54)}${text(48,11,component.selectorPosition||"I",7)}`;break;}
    case "siemens3SU1400NCContact":body=contact(true,component.contactClosed??true);break;
    case "siemens3RU21264BC0OverloadRelay":{const states=component.contactPairStates||[true,false],nc=Boolean(states[0]),no=Boolean(states[1]),main=[8,20,32].map((y,index)=>`${line(4,y,30,y)}<rect x="30" y="${y-4}" width="36" height="8" ${common}/>${line(35,y+3,61,y-3)}${line(66,y,92,y)}${text(48,y+3,`L${index+1}/T${index+1}`,4)}`).join(""),aux=(y,closed,normallyClosed,label)=>`${line(4,y,31,y)}${line(31,y-5,31,y+5)}${line(65,y-5,65,y+5)}${line(65,y,92,y)}${line(31,y,closed?65:58,closed?y:y-6)}${normallyClosed?line(42,y-6,53,y+6):""}${text(48,y+9,label,5)}`;body=`${main}${aux(48,nc,true,"95–96 NC")}${aux(68,no,false,"97–98 NO")}`;break;}
    case "siemens3SU14001NO1NCContact":{const states=component.contactPairStates||[true,false],ncClosed=Boolean(states[0]),noClosed=Boolean(states[1]);body=`${line(4,12,31,12)}${line(31,4,31,20)}${line(65,4,65,20)}${line(65,12,92,12)}${line(31,12,ncClosed?65:58,ncClosed?12:5)}${line(42,3,53,21)}${text(48,3,"NC",5)}${line(4,36,31,36)}${line(31,28,31,44)}${line(65,28,65,44)}${line(65,36,92,36)}${line(31,36,noClosed?65:58,noClosed?36:29)}${text(48,46,"NO",5)}`;break;}
    case "schneiderXB5AA31GreenPushbutton":body=`${contact(false,component.contactClosed??false)}<circle cx="48" cy="7" r="3" ${common}/>${line(48,10,48,18)}${text(48,41,"13–14 NO",5)}`;break;
    case "schneiderXB5AA42RedPushbuttonNC":body=`${contact(true,component.contactClosed??true)}<circle cx="48" cy="7" r="3" ${common}/>${line(48,10,48,18)}${text(48,41,"21–22 NC",5)}`;break;
    case "siemens3SU1400NOContact":body=contact(false);break;
    case "pushbuttonNO":case "toggleSwitchNO":case "limitSwitchNO":case "proximityNO":case "photoelectricNO":case "pressureSwitchNO":case "temperatureSwitchNO":case "floatSwitchNO":case "pushbuttonNC":case "emergencyStopNC":case "toggleSwitchNC":case "temperatureSwitchNC":case "limitSwitchNC":case "proximityNC":case "photoelectricNC":case "auxiliaryNO":case "auxiliaryNC":case "overloadNC":{const normallyClosed=Boolean(component.normallyClosed)||["auxiliaryNC","overloadNC"].includes(component.type);body=contact(normallyClosed,component.contactClosed??normallyClosed);break;}
    case "circuitBreaker":body=`${line(4,22,29,22)}<circle cx="31" cy="22" r="2" fill="currentColor"/><circle cx="65" cy="22" r="2" fill="currentColor"/>${component.closed?line(33,22,63,22):line(33,20,58,11)}${line(65,22,92,22)}${text(48,38,"QF",7)}`;break;
    case "phoenixPT25KnifeDisconnect":body=contact(false,component.closed);break;
    case "fuse":body=component.tripped?`${line(4,22,31,22)}<rect x="31" y="14" width="34" height="16" ${common}/>${line(35,26,43,21)}${line(53,17,61,13)}${line(65,22,92,22)}${text(48,10,"FU · OPEN",6)}`:`${line(4,22,31,22)}<rect x="31" y="14" width="34" height="16" ${common}/>${line(35,26,61,18)}${line(65,22,92,22)}${text(48,10,"FU",7)}`;break;
    case "siemens3SU1152AmberIndicator":body=`${line(4,22,31,22)}<circle cx="48" cy="22" r="15" fill="#f59e0b" fill-opacity=".24" stroke="currentColor" stroke-width="2"/><path d="M42 27V17l6-4 6 4v10z" ${common}/><path d="M57 12l4-4m-2 10 6-1m-12-7-1-5" ${common}/>${line(65,22,92,22)}${text(48,42,"24 V AC/DC",5)}`;break;
    case "pilotLamp":body=`${line(4,22,31,22)}<circle cx="48" cy="22" r="16" ${common}/>${line(39,13,57,31)}${line(57,13,39,31)}${line(64,22,92,22)}`;break;
    case "buzzer":body=`${line(4,22,30,22)}<path d="M30 17h8l11-9v28l-11-9h-8z" ${common}/><path d="M56 15q12 7 0 14m5-19q17 12 0 24" ${common}/>${line(74,22,92,22)}`;break;
    case "heaterElement":body=`${line(4,22,24,22)}<rect x="24" y="9" width="48" height="26" ${common}/><path d="M29 27q5-16 10 0t10 0t10 0t10 0" ${common}/>${line(72,22,92,22)}`;break;
    case "solenoidValve":body=`${line(4,22,31,22)}<rect x="31" y="11" width="34" height="22" ${common}/>${text(48,25,"Y",11)}${line(65,22,92,22)}${text(48,7,"A1",6)}${text(48,40,"A2",6)}`;break;
    case "wegW22XBCMotor":body=`${line(4,22,31,22)}<circle cx="48" cy="22" r="17" ${common}/>${text(48,25,"M",12)}${line(65,22,92,22)}${text(48,5,"WEG W22XB-C · 6 LEAD",5)}`;break;
    case "wegW22IE2Motor":body=`${line(4,22,31,22)}<circle cx="48" cy="22" r="17" ${common}/>${text(48,25,"M",12)}${line(65,22,92,22)}${text(48,5,"WEG W22 IE2 · 1.5 kW",5)}`;break;
    case "singlePhaseMotor":case "threePhaseMotor":body=`${line(4,22,31,22)}<circle cx="48" cy="22" r="17" ${common}/>${text(48,25,"M",12)}${line(65,22,92,22)}${text(48,5,component.type==="singlePhaseMotor"?"1~":"3~",7)}`;break;
    case "phoenixPT25FeedThrough":body=`${line(4,22,31,22)}<rect x="31" y="12" width="34" height="20" ${common}/>${line(38,22,58,22)}${line(65,22,92,22)}${text(48,9,"PT 2,5",6)}${text(48,28,"24 A",6)}`;break;
    case "terminal":body=`${line(4,22,31,22)}<rect x="31" y="12" width="34" height="20" ${common}/>${line(38,22,58,22)}${line(65,22,92,22)}${text(48,9,"X",7)}`;break;
    case "dcPowerRail":body=`${line(5,13,91,13)}${[15,35,55,75].map((x)=>`${line(x,13,x,30)}<circle cx="${x}" cy="31" r="2" fill="currentColor"/>`).join("")}${text(48,40,"+24 V DC",7)}`;break;
    case "neutralRail":body=`${line(5,13,91,13)}${[15,35,55,75].map((x)=>`${line(x,13,x,30)}<circle cx="${x}" cy="31" r="2" fill="currentColor"/>`).join("")}${text(48,40,"N",8)}`;break;
    case "junction":
      body = component.type === "phoenixPT25Twin"
        ? `<rect x="6" y="5" width="84" height="34" rx="3" ${common}/>${line(50,22,78,22)}${line(50,12,50,32)}${line(18,12,50,12)}${line(18,32,50,32)}${[[18,12], [18,32], [78,22]].map(([x,y]) => `<circle cx="${x}" cy="${y}" r="3" fill="currentColor"/>`).join("")}`
        : `${line(4,22,92,22)}${line(48,5,48,39)}<circle cx="48" cy="22" r="4" fill="currentColor" stroke="none"/>`;
      break;
    case "protectiveEarth":body=`${line(48,4,48,19)}${line(31,19,65,19)}${line(36,25,60,25)}${line(41,31,55,31)}${line(45,37,51,37)}`;break;
    case "groundCommon":body=`${[0,1,2,3].map((i)=>line(7,8+i*9,39,8+i*9)).join("")}<circle cx="52" cy="22" r="12" ${common}/>${text(52,25,"COM",7)}${line(64,22,91,22)}`;break;
    default:body=`<rect x="22" y="7" width="52" height="30" rx="2" ${common}/>${text(48,25,spec.prefix,9)}${line(5,22,22,22)}${line(74,22,91,22)}`;
  }
  const viewBox=component.type==="selectorSwitch"?"0 0 96 64":component.type==="siemens3RU21264BC0OverloadRelay"?"0 0 96 80":"0 0 96 44";
  return `<svg class="electrical-standard-symbol" viewBox="${viewBox}" role="img" aria-label="${escape(spec.name)}"><title>${escape(spec.name)}</title>${body}</svg>`;
}

const electricalViewports = new WeakMap();

export function renderElectricalWorkspace(root, project, {language="en",toolboxHost=null,inspectorHost=null,onBeforeChange=()=>{},onChange=()=>{},onInputChange=()=>{},onViewChange=()=>{},inputValues={},outputValues={}} = {}) {
  const t = langText(language); project.electrical ||= {components:[],wires:[],inputStates:{}}; const diagram = project.electrical;
  diagram.components ||= []; diagram.wires ||= []; diagram.inputStates ||= {};
  let catalogQuery = "", paletteQuery = "", paletteType = Object.keys(electricalComponentCatalog)[0] || "";
  let catalogOffset = 0, catalogManufacturer = "", catalogCategory = "";
  const catalogPageSize = 8;
  project.viewState ||= {};
  let electricalZoom = Number.isInteger(project.viewState.electricalZoom) ? Math.min(150, Math.max(30, project.viewState.electricalZoom)) : 100;
  let electricalGridVisible = project.viewState.electricalGridVisible !== false;
  let electricalSnapToGrid = project.viewState.electricalSnapToGrid !== false;
  const savedSelection = diagram.components.find((component) => component.id === root.dataset.selectedComponent);
  let selectedId = savedSelection?.id ?? diagram.components[0]?.id ?? "", selectedWireId = "", pendingTerminal = null, pendingWaypoints=[], resumingWireId=null, rewireEndpoint=null, wireArmed=false, routeDrag=null, simulatedOutputs = diagram.simulation?.energized || {};
  const expandedInspectorSections = new Set();
  let viewport = electricalViewports.get(root);
  if (viewport?.project !== project) {
    viewport = { project, left:0, top:0, host:null };
    electricalViewports.set(root, viewport);
  }
  const renderPropertyResult = (message, active) => {
    const selector = active?.name ? `[name="${CSS.escape(active.name)}"]` : active?.type === "submit" ? '[type="submit"]' : null;
    const start = active?.selectionStart, end = active?.selectionEnd, direction = active?.selectionDirection;
    render(message);
    if (!selector) return;
    const replacement = (inspectorHost || root).querySelector(`#electricalProperties ${selector}`);
    replacement?.focus({ preventScroll:true });
    if (replacement && typeof start === "number" && typeof replacement.selectionStart === "number") {
      replacement.setSelectionRange(start, end, direction);
    }
  };
  const render = (message = t.statusReady, { resetViewport = false } = {}) => {
    const catalogOpen = (toolboxHost || root).querySelector(".industrial-catalog")?.open;
    if (resetViewport) {
      viewport.left = 0;
      viewport.top = 0;
    } else if (viewport.host?.clientWidth) {
      viewport.left = viewport.host.scrollLeft;
      viewport.top = viewport.host.scrollTop;
    }
    root._electricalCanvasRouteHandler=(event,board)=>{
      if(!wireArmed||!pendingTerminal||event.target.closest?.("[data-component-id]")||event.target.closest?.(".electrical-waypoint-handle")||event.target.closest?.(".electrical-wire-draft-end"))return;
      const rect=board.getBoundingClientRect(),scale=electricalZoom/100,x=Math.max(0,Math.min(2200,Math.round((event.clientX-rect.left)/scale/20)*20)),y=Math.max(0,Math.min(1400,Math.round((event.clientY-rect.top)/scale/20)*20));
      pendingWaypoints.push({x,y});render(`Route point ${pendingWaypoints.length} added. Choose the destination terminal to finish.`);
    };
    const previousInspector=inspectorHost?.querySelector(".electrical-inspector")||root.querySelector(".electrical-inspector");
    previousInspector?.querySelectorAll("details[data-inspector-section]").forEach((section)=>{if(section.open)expandedInspectorSections.add(section.dataset.inspectorSection);else expandedInspectorSections.delete(section.dataset.inspectorSection);});
    const selected = diagram.components.find((item) => item.id === selectedId), issues = validateElectricalDiagram(diagram,project.tags || []), paletteMatches = Object.entries(electricalComponentCatalog).filter(([type,spec]) => `${spec.category} ${componentName(type)} ${type} ${spec.partNumber ?? ""}`.toLowerCase().includes(paletteQuery.trim().toLowerCase())), paletteTypeExists = paletteMatches.some(([type]) => type === paletteType);
    if (!paletteTypeExists) paletteType = paletteMatches[0]?.[0] || "";
    const palette = paletteMatches.map(([type]) => `<option value="${escape(type)}" ${type === paletteType ? "selected" : ""}>${escape(componentName(type))}</option>`).join("") || `<option value="">${escape(t.noModelMatches)}</option>`;
    const wires = diagram.wires.map((wire) => {
      const a = diagram.components.find((item) => item.id === wire.from?.componentId), b = diagram.components.find((item) => item.id === wire.to?.componentId); if (!a || (!b && !wire.draft)) return "";
      const start=terminalPosition(a,wire.from.terminal),end=b?terminalPosition(b,wire.to.terminal):[wire.end?.x??wire.waypoints?.at(-1)?.x??start[0],wire.end?.y??wire.waypoints?.at(-1)?.y??start[1]],path=b?electricalWirePath(wire,diagram.components):[`M${start[0]} ${start[1]}`,...(wire.waypoints||[]).map((point)=>`L${point.x} ${point.y}`),`L${end[0]} ${end[1]}`].join(""),handles=selectedWireId===wire.id?(wire.waypoints||[]).map((point,index)=>`<circle class="electrical-waypoint-handle" data-wire-waypoint="${escape(wire.id)}" data-waypoint-index="${index}" cx="${point.x}" cy="${point.y}" r="6" role="button" tabindex="0" aria-label="Route point ${index+1}; drag to edit or press Delete to remove"/>`).join(""):"",looseEnd=wire.draft?`<circle class="electrical-wire-draft-end" data-resume-wire="${escape(wire.id)}" cx="${end[0]}" cy="${end[1]}" r="7" role="button" tabindex="0" aria-label="Resume paused wire ${escape(wire.id)}"/>` :"";
      return `<path class="electrical-wire ${selectedWireId === wire.id ? "selected" : ""} ${wire.draft?"paused":""} ${diagram.simulation?.energizedWires?.includes(wire.id) ? "energized" : ""}" data-wire-id="${escape(wire.id)}" d="${path}"/>${handles}${looseEnd}`;
    }).join("");
    const pendingComponent=pendingTerminal&&diagram.components.find((item)=>item.id===pendingTerminal.componentId),pendingStart=pendingComponent&&terminalPosition(pendingComponent,pendingTerminal.terminal),pendingRoute=wireArmed&&pendingStart&&pendingWaypoints.length?`<path class="electrical-wire electrical-wire-preview" d="M${pendingStart[0]} ${pendingStart[1]}${pendingWaypoints.map((point)=>`L${point.x} ${point.y}`).join("")}"/>${pendingWaypoints.map((point)=>`<circle class="electrical-waypoint-handle preview" cx="${point.x}" cy="${point.y}" r="5"/>`).join("")}`:"";
    const components = diagram.components.map((component) => {
      const spec = electricalComponentCatalog[component.type]; if (!spec) return "";
      const runtimeState=diagram.simulation?.componentStates?.[component.id]||{}, symbol = electricalSymbolSvg({...component,...runtimeState}), selectedClass = component.id === selectedId ? "selected" : "", height=Math.max(80,32+Math.ceil((spec.terminalLayout||spec.terminals).length/2)*22), signalKind=["analog-signal-source","analog-signal-indicator"].includes(spec.kind), signalValue=runtimeState.signalValue, stateLabel=runtimeState.selectorPosition?(runtimeState.selectorPosition==="II"?t.positionII:t.positionI):runtimeState.contactClosed===undefined?(runtimeState.coilEnergized===undefined?"":runtimeState.coilEnergized?t.on:t.off):runtimeState.contactClosed?t.contactClosedState:t.contactOpenState, energized=simulatedOutputs[component.id]||Number(signalValue)>0||runtimeState.coilEnergized;
      return `<article class="electrical-component ${selectedClass} ${energized ? "energized" : ""}" data-component-type="${escape(component.type)}" data-component-id="${escape(component.id)}" data-electrical-state="${escape(component.id)}" data-contact-state="${runtimeState.contactClosed===undefined?"":runtimeState.contactClosed?"closed":"open"}" style="left:${component.x}px;top:${component.y}px;height:${height}px;transform:rotate(${component.rotation || 0}deg)" aria-label="${escape(component.reference)} ${escape(component.label)}${stateLabel?` · ${escape(stateLabel)}`:""}"><button class="electrical-component-head" data-drag-component="${escape(component.id)}" title="${escape(t.moveHint)}" aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown">${escape(component.reference)} · ${escape(component.label)}</button><div class="electrical-symbol" aria-hidden="true">${symbol}</div>${signalKind?`<output class="electrical-signal-value" data-electrical-signal="${escape(component.id)}" data-electrical-unit="${escape(spec.analogSignalUnit)}">${escape(electricalSignalDisplay(signalValue, spec.analogSignalUnit))}</output>`:""}${(spec.terminalLayout||spec.terminals).map((pin,index) => {const leftCount=Math.ceil((spec.terminalLayout||spec.terminals).length/2),left=index<leftCount,slot=left?index:index-leftCount,pinNote=spec.terminalNotes?.[pin]||pin,pinLabel=spec.terminalLabels?.[pin]||pin;return spec.terminals.includes(pin)?`<button class="electrical-port port-${left?"left":"right"}" style="top:${32+slot*22}px" data-terminal-component="${escape(component.id)}" data-terminal="${escape(pin)}" aria-label="${escape(component.reference)} terminal ${escape(pinLabel)} (${escape(pin)}): ${escape(pinNote)}" title="${escape(pinNote)}">${escape(pinLabel)}</button>`:`<button type="button" class="electrical-port electrical-port-unassigned port-${left?"left":"right"}" style="top:${32+slot*22}px" disabled aria-disabled="true" aria-label="${escape(component.reference)} physical position ${escape(pin)} is unassigned and cannot be wired" title="${escape(pinNote)}">${escape(pin)}</button>`;}).join("")}</article>`;
    }).join("");
    const contactInputs = diagram.components.filter((item) => electricalComponentCatalog[item.type]?.kind === "contact" && !(["auxiliaryNO","auxiliaryNC"].includes(item.type) && item.coilRef)).map((item) => {
      const tag = item.tag || item.reference, checked = Boolean(inputValues[tag] ?? diagram.inputStates[tag]);
      return `<label class="electrical-input"><input type="checkbox" data-electrical-input="${escape(tag)}" ${checked ? "checked" : ""}><span>${escape(item.reference)} · ${escape(item.label)}${item.tag ? ` [${escape(item.tag)}]` : ""}</span></label>`;
    }).join("");
    const componentOptions = diagram.components.map((item) => `<option value="${escape(item.id)}" ${item.id === selectedId ? "selected" : ""}>${escape(item.reference)} · ${escape(item.label)}</option>`).join("");
    const fuseFields=selected?.type==="fuse"?'<label class="electrical-field"><span>'+escape(selected.tripped?t.fuseBlown:t.fuseTripTest)+'</span><input name="tripped" type="checkbox" '+(selected.tripped?"checked disabled":"")+'></label>'+(selected.tripped?'<p class="electrical-muted">'+escape(t.fuseReplaceHint)+'</p>':""):"";
    const selectedSpec=selected&&electricalComponentCatalog[selected.type], coilFields=selected&&["auxiliaryNO","auxiliaryNC"].includes(selected.type)?`<label class="electrical-field">${escape(t.coilLink)}<select name="coilRef"><option value="">${escape(t.unlinked)}</option>${diagram.components.filter((item)=>item.id!==selected.id&&(electricalComponentCatalog[item.type]?.kind==="contactor"||item.type==="relayCoil")).map((item)=>`<option value="${escape(item.reference)}" ${selected.coilRef===item.reference?"selected":""}>${escape(item.reference)} · ${escape(item.label)}</option>`).join("")}</select></label>`:"", channelFields=selectedSpec?.channels?Object.entries(selected.ioMap||{}).map(([channel,mapping])=>{const role=selectedSpec.channels.inputs?.includes(channel)||selectedSpec.channels.analogInputs?.includes(channel)?"input":"output",allowed=(project.tags||[]).filter(tag=>tag.role===role&&(selectedSpec.channels.analogInputs?.includes(channel)||selectedSpec.channels.analogOutputs?.includes(channel)?["INT","REAL"].includes(tag.type):tag.type==="BOOL")),options=allowed.map(tag=>`<option value="${escape(tag.name)}" ${mapping.tag===tag.name?"selected":""}>${escape(tag.name)} · ${escape(tag.address||"no address")}</option>`).join("");return `<fieldset class="electrical-channel"><legend>${escape(channel)}</legend><label class="electrical-field">${escape(t.tag)}<select name="mapTag:${escape(channel)}"><option value="">—</option>${options}</select></label><label class="electrical-field">${escape(t.address)}<input name="mapAddress:${escape(channel)}" value="${escape(mapping.address)}" maxlength="24"></label></fieldset>`;}).join(""):"", switchFields=selectedSpec?.kind==="multi-pole-breaker"?`<label class="electrical-field"><span>${escape(t.breakerPolesOpen)}</span><input name="breakerOpen" type="checkbox" ${selected.breakerOpen?"checked":""}></label>`:selectedSpec?.kind==="manual-switch"&&selected.type==="fuse"?fuseFields:selectedSpec?.kind==="manual-switch"?`<label class="electrical-field"><span>${escape(t.contactsClosed)}</span><input name="closed" type="checkbox" ${selected.closed?"checked":""}></label><label class="electrical-field"><span>${escape(t.tripped)}</span><input name="tripped" type="checkbox" ${selected.tripped?"checked":""}></label>`:selectedSpec?.kind==="overload-contact"?`<label class="electrical-field"><span>${escape(t.overloadTripped)}</span><input name="tripped" type="checkbox" ${selected.tripped?"checked":""}></label>`:"";
     const selectorFields=selectedSpec?.kind==="selector-switch"?`<label class="electrical-field">${escape(t.selectorPosition)}<select name="selectorPosition"><option value="I" ${selected.selectorPosition==="I"?"selected":""}>${escape(t.positionI)}</option><option value="II" ${selected.selectorPosition==="II"?"selected":""}>${escape(t.positionII)}</option></select></label>`:"";
    const backplaneLabel = ({ en:"Backplane CPU", de:"Rückwandbus-CPU", yo:"CPU bọ́ọ̀sì ẹ̀yìn", pcm:"Backplane CPU" })[language] || "Backplane CPU";
    const backplaneField = selectedSpec?.backplaneCpuTypes ? `<label class="electrical-field">${escape(backplaneLabel)}
      <select name="backplaneCpuId"><option value="">${escape(t.unlinked)}</option>${diagram.components
        .filter((cpu) => isCompatibleBackplaneCpu(selected, cpu))
        .map((cpu) => `<option value="${escape(cpu.id)}" ${selected.backplaneCpuId === cpu.id ? "selected" : ""}>${escape(cpu.reference)} · ${escape(cpu.label)}</option>`).join("")}</select></label>` : "";
    const rangeLabel = ({ de:"Messbereich", yo:"Ìwọ̀n ìfihàn", pcm:"Signal range" })[language] || "Signal range";
    const rangeProperties = ["analogInputRanges", "analogOutputRanges"].filter((property) => selectedSpec?.[property]);
    const analogRangeFields = rangeProperties.map((rangeProperty) => {
      const isOutput = rangeProperty === "analogOutputRanges";
      const analogRanges = selectedSpec[rangeProperty];
      const rangeChannels = selectedSpec.channels[isOutput ? "analogOutputs" : "analogInputs"];
      const rangeGroupSize = isOutput ? 1 : selectedSpec.analogRangeGroupSize || 1;
      return Array.from({ length:Math.ceil(rangeChannels.length / rangeGroupSize) }, (_, group) => {
        const first = group * rangeGroupSize;
        const label = rangeChannels.slice(first, first + rangeGroupSize).join("–");
        const range = electricalAnalogRangeId(selected, group, rangeProperty);
        return `<label class="electrical-field">${escape(rangeLabel)} ${escape(label)}
          <select name="${rangeProperty}">${Object.entries(analogRanges).map(([id, { label }]) =>
            `<option value="${escape(id)}" ${id === range ? "selected" : ""}>${escape(label)}</option>`).join("")}</select>
        </label>`;
      }).join("");
    }).join("");
    const catalog = searchIndustrialCatalog({
      query:catalogQuery, manufacturer:catalogManufacturer, category:catalogCategory,
      limit:catalogPageSize, offset:catalogOffset,
    });
    const catalogDetails=language==="de"?"Verifizierte Daten und Quelle":language==="yo"?"Àlàyé tí a fìdí múlẹ̀ àti orísun":language==="pcm"?"Verified specs and source":"Verified specifications and source";
    const findSchematicModel = ({
      de:"Schaltplanmodell finden", yo:"Wá awoṣe àwòrán", pcm:"Find schematic model",
    })[language] || "Find schematic model";
    const catalogRows = catalog.items.map((item) => {
      const matchingModels = Object.entries(electricalComponentCatalog).filter(([, model]) =>
        model.source && model.manufacturer === item.manufacturer && model.partNumber === item.identifier);
      const exactMatch = matchingModels.length === 1 ? matchingModels[0][0] : null;
      return `<li><strong>${escape(item.manufacturer)} ${escape(item.identifier)}</strong> · ${escape(item.family)} · ${escape(item.simulation.status)}
        ${exactMatch ? `<button class="secondary" type="button" data-catalog-model="${escape(exactMatch)}">${escape(findSchematicModel)}</button>` : ""}
        <details><summary>${escape(catalogDetails)}</summary>
          <dl>${Object.entries(item.attributes).map(([key,value])=>`<dt>${escape(key)}</dt><dd>${escape(value)}</dd>`).join("")}</dl>
          <a href="${escape(item.source.url)}" target="_blank" rel="noopener">${escape(item.source.title)}</a>
          <p>${escape(item.simulation.limitations)}</p>
        </details></li>`;
    }).join("");
    const catalogHeading = language==="de"?"Herstellerreferenzen":language==="yo"?"Àwọn ìtọ́kasí àwọn olùṣe":"Manufacturer references";
    const catalogSearch = language==="de"?"Modell, Hersteller oder Spezifikation suchen":language==="yo"?"Wá model, olùṣe tàbí àlàyé":language==="pcm"?"Search model, maker or spec":"Search model, manufacturer or specification";
    const catalogNote = language==="de"?"Herstellerangaben zur Referenz; nicht automatisch platzierbar. Nur als unterstützt bezeichnete generische Modelle beeinflussen die Simulation.":language==="yo"?"Àlàyé olùṣe fún ìtọ́kasí; kò sí fún fífi sí àwòrán. Generic model tó ní àmì supported nìkan ló ń ní ipa lórí ìṣàfarawé.":language==="pcm"?"Manufacturer reference data only; no direct placement. Only generic models marked supported affect simulation.":"Manufacturer reference data only; entries cannot be placed as supported devices. Only generic models marked supported affect simulation.";
    const catalogSubmit=language==="de"?"Suchen":language==="yo"?"Wá":language==="pcm"?"Search":"Search";
    const catalogLabels = ({
      de: { manufacturer:"Hersteller", category:"Kategorie", all:"Alle", previous:"Zurück", next:"Weiter", results:"Ergebnisse" },
      yo: { manufacturer:"Olùṣe", category:"Ẹ̀ka", all:"Gbogbo", previous:"Ẹ̀yìn", next:"Itele", results:"Àbájáde" },
      pcm: { manufacturer:"Maker", category:"Category", all:"All", previous:"Back", next:"Next", results:"Results" },
    })[language] || { manufacturer:"Manufacturer", category:"Category", all:"All", previous:"Previous", next:"Next", results:"Results" };
    const catalogCount = catalog.total ? `${catalogLabels.results} ${catalogOffset + 1}–${catalogOffset + catalog.items.length} / ${catalog.total}` : `${catalogLabels.results} 0`;
    const catalogSelect = (name, values, selectedValue) => `<label>${escape(catalogLabels[name])}
      <select name="${name}" aria-label="${escape(catalogLabels[name])}"><option value="">${escape(catalogLabels.all)}</option>
        ${values.map((value) => `<option value="${escape(value)}" ${value === selectedValue ? "selected" : ""}>${escape(value)}</option>`).join("")}
      </select></label>`;
    const catalogPaging = catalog.total > catalogPageSize ? `<div class="industrial-catalog-pagination">
      <button type="button" data-catalog-page="-1" ${catalogOffset === 0 ? "disabled" : ""}>${escape(catalogLabels.previous)}</button>
      <button type="button" data-catalog-page="1" ${catalogOffset + catalogPageSize >= catalog.total ? "disabled" : ""}>${escape(catalogLabels.next)}</button>
    </div>` : "";
    const catalogEmpty=language==="de"?"Keine passenden verifizierten Produkte.":language==="yo"?"Kò sí ọjà tí àwárí fìdí rẹ̀ múlẹ̀.":language==="pcm"?"No verified product match.":"No matching verified products.";
    const circuitTitle=language==="de"?"HAUPTSCHALTKREIS":language==="yo"?"ÀYÍPO ÀKỌ́KỌ́":language==="pcm"?"MAIN CIRCUIT":"MAIN CIRCUIT";
    const circuitSubtitle=language==="de"?"Steuerstromkreis · Rasterausrichtung":language==="yo"?"Àyípo ìṣàkóso · Ìlà grid":language==="pcm"?"Control circuit · grid aligned":"Control circuit · grid aligned";
    const snapOnLabel=language==="de"?"Raster ein":language==="yo"?"Snap tan":language==="pcm"?"Snap on":"Snap on",snapOffLabel=language==="de"?"Raster aus":language==="yo"?"Snap pa":language==="pcm"?"Snap off":"Snap off",expandLabel=language==="de"?"Erweitern":language==="yo"?"Fẹ̀fẹ̀ síta":"Expand";
    const contextLabels=language==="de"?{select:"Auswählen",wire:"Klemmen verbinden"}:language==="yo"?{select:"Yan",wire:"So ebute pọ"}:language==="pcm"?{select:"Select",wire:"Connect terminal dem"}:{select:"Select",wire:"Connect terminals"};    const viewLabels=language==="de"?{toolbar:"Schaltplanwerkzeuge",actions:"Diagrammaktionen",view:"Ansichtswerkzeuge",grid:"Raster 20",fit:"Ansicht einpassen",zoomOut:"Verkleinern",zoomIn:"Vergrößern",zoom:"Zoom",expand:"Vollbild umschalten"}:language==="yo"?{toolbar:"Àwọn irinṣẹ́ àwòrán",actions:"Àwọn iṣẹ́ àwòrán",view:"Àwọn irinṣẹ́ ìwò",grid:"Grid 20",fit:"Fit view",zoomOut:"Zoom out",zoomIn:"Zoom in",zoom:"Zoom",expand:"Yí full screen padà"}:language==="pcm"?{toolbar:"Canvas tools",actions:"Diagram actions",view:"View tools",grid:"Grid 20",fit:"Fit view",zoomOut:"Zoom out",zoomIn:"Zoom in",zoom:"Zoom",expand:"Expand"}:{toolbar:"Electrical canvas tools",actions:"Diagram actions",view:"Canvas view",grid:"Grid 20",fit:"Fit view",zoomOut:"Zoom out",zoomIn:"Zoom in",zoom:"Zoom",expand:"Expand"};    const legendLabels=language==="de"?{title:"Schaltplanlegende",terminal:"Anschluss",signal:"Verbundenes Signal",edit:"Drähte über die linke Werkzeugleiste verbinden"}:language==="yo"?{title:"Àlàyé àwòrán",terminal:"Ìsopọ̀ ebute",signal:"Àmì tó so pọ̀",edit:"So àwọn waya pọ̀ ní toolbar òsì"}:language==="pcm"?{title:"Schematic legend",terminal:"Terminal connection",signal:"Connected signal",edit:"Use the left toolbox to connect wires"}:{title:"Schematic legend",terminal:"Terminal connection",signal:"Connected signal",edit:"Edit wires from the left toolbox"};    root.innerHTML = `<details class="industrial-catalog"${catalogOpen ? " open" : ""}><summary><span>${escape(catalogHeading)}</span><small>${industrialProductCatalog.length}</small></summary><p>${escape(catalogNote)}</p><form id="industrialCatalogSearch"><label>${escape(catalogSearch)}<input name="query" value="${escape(catalogQuery)}"></label>${catalogSelect("manufacturer", industrialCatalogManufacturers, catalogManufacturer)}${catalogSelect("category", industrialCatalogCategories, catalogCategory)}<button type="submit">${escape(catalogSubmit)}</button></form><p role="status">${escape(catalogCount)}</p><ul>${catalogRows || `<li>${escape(catalogEmpty)}</li>`}</ul>${catalogPaging}</details><div class="electrical-pane"><div class="electrical-toolbar"><label>${escape(t.modelSearch)}<input id="electricalModelSearch" type="search" aria-label="${escape(t.modelSearch)}" placeholder="${escape(t.modelSearch)}" value="${escape(paletteQuery)}" autocomplete="off"></label><label>${escape(t.palette)}<select id="electricalPalette" aria-label="${escape(t.palette)}" ${paletteMatches.length ? "" : "disabled"}>${palette}</select></label><button class="secondary" data-electrical-action="select" aria-pressed="${!wireArmed}">${escape(t.selectMove)}</button><button class="primary" data-electrical-action="add" ${paletteMatches.length ? "" : "disabled"}>＋ ${escape(t.add)}</button><button data-electrical-action="wire" aria-pressed="${wireArmed}">${escape(wireArmed ? pendingTerminal ? t.pause : t.cancel : t.wire)}</button><button data-electrical-action="rotate">${escape(t.rotate)}</button><button data-electrical-action="duplicate">${escape(t.copy)}</button><button class="danger-button" data-electrical-action="delete">${escape(t.remove)}</button><button class="secondary electrical-advanced-action" data-electrical-action="validate">${escape(t.validate)}</button><button class="primary electrical-advanced-action" data-electrical-action="simulate">▶ ${escape(t.simulate)}</button></div><div id="electricalCanvasContext" class="electrical-canvas-context" role="toolbar" aria-label="${escape(viewLabels.toolbar)}"><div class="electrical-canvas-primary-tools" role="group" aria-label="${escape(viewLabels.actions)}"><button class="secondary" data-electrical-action="select" aria-pressed="${!wireArmed}" aria-label="${escape(contextLabels.select)}" title="${escape(contextLabels.select)}">↖</button><button class="secondary" data-electrical-action="wire" aria-pressed="${wireArmed}" aria-label="${escape(wireArmed?t.cancel:contextLabels.wire)}" title="${escape(wireArmed?t.cancel:contextLabels.wire)}">⟷</button><button class="secondary" data-electrical-action="validate" aria-label="${escape(t.validate)}" title="${escape(t.validate)}">✓</button><button class="primary" data-electrical-action="simulate" aria-label="${escape(t.simulate)}" title="${escape(t.simulate)}">▶</button></div><div class="electrical-canvas-secondary-tools" role="group" aria-label="${escape(viewLabels.view)}"><button class="secondary" data-electrical-action="grid" aria-pressed="${electricalGridVisible}" aria-label="${escape(viewLabels.grid)}" title="${escape(viewLabels.grid)}">▦</button><button class="secondary" data-electrical-action="fit-view" aria-label="${escape(viewLabels.fit)}" title="${escape(viewLabels.fit)}">⛶</button><button class="secondary" data-electrical-action="snap" aria-label="${escape(electricalSnapToGrid?snapOnLabel:snapOffLabel)}" title="${escape(electricalSnapToGrid?snapOnLabel:snapOffLabel)}" aria-pressed="${electricalSnapToGrid}">⌗</button><div class="electrical-zoom-tools" role="group" aria-label="${escape(viewLabels.zoom)}"><button class="secondary" data-electrical-action="zoom-out" aria-label="${escape(viewLabels.zoomOut)}" title="${escape(viewLabels.zoomOut)}">−</button><output data-electrical-zoom aria-label="${escape(viewLabels.zoom)}">${electricalZoom}%</output><button class="secondary" data-electrical-action="zoom-in" aria-label="${escape(viewLabels.zoomIn)}" title="${escape(viewLabels.zoomIn)}">＋</button></div><button class="secondary" data-electrical-action="expand" aria-label="${escape(viewLabels.expand)}" title="${escape(viewLabels.expand)}">⤢</button></div></div><div class="electrical-body"><div class="electrical-board-wrap"><div class="electrical-board-label"><strong>${escape(circuitTitle)}</strong><span>${escape(circuitSubtitle)}</span><small class="electrical-safety-badge" title="${escape(t.safety)}" aria-label="${escape(t.safety)}">${escape(t.safetyBadge)}</small></div><div class="electrical-board-scroll"><div id="electricalBoard" class="electrical-board ${electricalGridVisible?"":"no-grid"}" style="zoom:${electricalZoom}%" role="region" aria-label="${escape(t.title)}"><svg class="electrical-wire-layer" width="2200" height="1400" aria-label="${escape(t.connections)}">${wires}${pendingRoute}</svg>${components}</div></div><div class="electrical-canvas-legend" role="group" aria-label="${escape(legendLabels.title)}"><span><i class="legend-terminal"></i>${escape(legendLabels.terminal)}</span><span><i class="legend-signal"></i>${escape(legendLabels.signal)}</span><span class="legend-edit">${escape(legendLabels.edit)}</span></div></div><aside class="electrical-inspector"><h3>${escape(t.properties)}</h3>${selected?`<section class="electrical-selected-component"><small>${escape(language==="de"?"AUSGEWÄHLTE KOMPONENTE":language==="yo"?"COMPONENT TÍ A YÀN":"SELECTED COMPONENT")}</small><h2>${escape(selected.reference)} · ${escape(componentName(selected.type))}</h2><p>${escape(selectedSpec?.category||"")} ${selectedSpec?.source?.url?"source-backed schematic symbol":"simulation model"} · reference ${escape(selected.reference)}</p>${selectedSpec?.source?`<p><a href="${escape(selectedSpec.source.url)}" target="_blank" rel="noopener">${[selectedSpec.source,...(selectedSpec.sources||[])].map((source)=>`<a href="${escape(source.url)}" target="_blank" rel="noopener">${escape(source.title)}</a>`).join(" · ")}</p><p>${escape(selectedSpec.simulationLimitations)}</p>`:""}</section>`:""}<label class="electrical-field">${escape(t.components)}<select id="electricalSelection">${componentOptions || `<option value="">${escape(t.none)}</option>`}</select></label>${selected ? `<form id="electricalProperties"><label class="electrical-field">${escape(t.name)}<input name="label" maxlength="80" value="${escape(selected.label)}"></label><label class="electrical-field">${escape(t.reference)}<input name="reference" maxlength="24" required value="${escape(selected.reference)}"></label><label class="electrical-field">${escape(t.tag)}<input name="tag" maxlength="48" value="${escape(selected.tag)}"></label>${electricalComponentCatalog[selected.type].kind === "contact" ? `<label class="electrical-field">${escape(t.contact)}<select name="normallyClosed"><option value="false" ${selected.normallyClosed ? "" : "selected"}>${escape(t.normallyOpen)}</option><option value="true" ${selected.normallyClosed ? "selected" : ""}>${escape(t.normallyClosed)}</option></select></label>` : ""}${coilFields}${selectorFields}${backplaneField}${analogRangeFields}<label class="electrical-field">${escape(t.voltage)}<input name="ratedVoltageV" type="number" min="0.001" step="any" value="${selected.ratedVoltageV ?? ""}"></label><label class="electrical-field">${escape(t.current)}<input name="ratedCurrentA" type="number" min="0.001" step="any" value="${selected.ratedCurrentA ?? ""}"></label><label class="electrical-field">${escape(t.manufacturer)}<input name="manufacturer" maxlength="120" value="${escape(selected.manufacturer)}"></label><label class="electrical-field">${escape(t.part)}<input name="partNumber" maxlength="120" value="${escape(selected.partNumber)}"></label>${channelFields}${switchFields}<button class="primary" type="submit">${escape(t.properties)}</button></form>` : `<p class="electrical-muted">${escape(t.none)}</p>`}${selected?`<div class="electrical-selected-actions"><button class="secondary" data-electrical-action="rotate">${escape(t.rotate)}</button><button class="secondary" data-electrical-action="duplicate">${escape(t.copy)}</button><button class="danger-button" data-electrical-action="delete">${escape(t.remove)}</button></div>`:""}<h3 id="electricalManualInputStates" tabindex="-1">${escape(t.manual)}</h3>${contactInputs || `<p class="electrical-muted">${escape(t.none)}</p>`}<h3>${escape(t.connections)} · ${diagram.wires.length}</h3><div class="electrical-wire-list">${diagram.wires.map((wire) => { const a=diagram.components.find((item)=>item.id===wire.from.componentId),b=diagram.components.find((item)=>item.id===wire.to?.componentId);return `<button class="electrical-wire-row ${selectedWireId===wire.id?"selected":""}" data-select-wire="${escape(wire.id)}">${escape(a?.reference||"?")}.${escape(wire.from.terminal)} ${wire.draft?"· Paused wire · use the free end to continue":`↔ ${escape(b?.reference||"?")}.${escape(wire.to.terminal)}`}</button>`; }).join("") || `<p class="electrical-muted">${escape(t.wireHint)}</p>`}${selectedWireId ? `<div class="electrical-wire-actions"><button class="secondary" data-electrical-action="rewire-from">${language==="de"?"Start neu verbinden":language==="yo"?"Tun ìbẹ̀rẹ̀ so pọ̀":"Reconnect start"}</button><button class="secondary" data-electrical-action="rewire-to">${language==="de"?"Ende neu verbinden":language==="yo"?"Tun òpin so pọ̀":"Reconnect end"}</button><button class="danger-button" data-electrical-action="delete-wire">${escape(t.remove)}</button></div>` : ""}</div><h3>${escape(t.validate)}</h3><p class="electrical-validation ${issues.some((item) => item.level === "error") ? "has-error" : ""}">${escape(issues.some((item) => item.level === "error") ? t.invalid : t.valid)} · ${issues.filter((item) => item.code === "electrical-floating-terminal").length} ${escape(t.floating)}</p><ul class="electrical-issues">${issues.slice(0,8).map((issue) => `<li class="${issue.level}">${escape(issue.message)}</li>`).join("")}</ul><p class="electrical-status" role="status" aria-live="polite">${escape(message)}</p></aside></div></div>`;
    const selectedActions=root.querySelector(".electrical-selected-actions");
    if(selected&&selectedActions){const replaceButton=document.createElement("button");replaceButton.type="button";replaceButton.className="secondary";replaceButton.dataset.electricalAction="replace";replaceButton.title=t.replaceHint;replaceButton.textContent=t.replace;selectedActions.insertBefore(replaceButton,selectedActions.lastElementChild);}
    const inspector=root.querySelector(".electrical-inspector");
    const wrapInspectorSection=(heading,key,label,count)=>{
      if(!heading)return;
      const details=document.createElement("details");details.className="electrical-inspector-section";details.dataset.inspectorSection=key;details.open=expandedInspectorSections.has(key);
      const summary=document.createElement("summary"),title=document.createElement("span"),value=document.createElement("b");title.textContent=label;value.textContent=count;summary.append(title,value);details.append(summary);heading.replaceWith(details);
      while(details.nextSibling&&!(details.nextSibling.nodeType===1&&(details.nextSibling.matches("h3")||details.nextSibling.classList.contains("electrical-status"))))details.append(details.nextSibling);
    };
    if(inspector){
      inspector.querySelector(":scope > h3")?.remove();
      const headings=[...inspector.querySelectorAll(":scope > h3")];
      const connectionsHeading=headings.find((heading)=>heading.textContent.startsWith(`${t.connections} ·`));
      const validationHeading=headings.find((heading)=>heading.textContent===t.validate);
      wrapInspectorSection(connectionsHeading,"connections",language==="de"?"Klemmenverbindungen":language==="yo"?"Ìsopọ̀ terminal":language==="pcm"?"Terminal connections":"Terminal connections",String(diagram.wires.length));
      const errorCount=issues.filter((issue)=>issue.level==="error").length,warningCount=issues.filter((issue)=>issue.level==="warning").length;
      wrapInspectorSection(validationHeading,"diagnostics",language==="de"?"Prüfung & Diagnose":language==="yo"?"Ìmúdájú àti ìwádìí":language==="pcm"?"Check & diagnostics":"Validation & diagnostics",`${errorCount} ${language==="de"?"Fehler":language==="yo"?"àṣìṣe":"errors"}${warningCount?` · ${warningCount} ${warningCount===1?t.warning:t.warnings}`:""}`);
    }
    root.querySelector("#industrialCatalogSearch")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      catalogQuery = form.get("query") || "";
      catalogManufacturer = form.get("manufacturer") || "";
      catalogCategory = form.get("category") || "";
      catalogOffset = 0;
      render();
      (toolboxHost || root).querySelector("#industrialCatalogSearch input")?.focus();
    });
    root.querySelectorAll("[data-catalog-page]").forEach((button) => button.addEventListener("click", () => {
      catalogOffset += Number(button.dataset.catalogPage) * catalogPageSize;
      render();
      const catalogHost = toolboxHost || root;
      (catalogHost.querySelector(`[data-catalog-page="${button.dataset.catalogPage}"]:enabled`) ||
        catalogHost.querySelector(".industrial-catalog-pagination button:enabled"))?.focus();
    }));
    root.querySelectorAll("[data-catalog-model]").forEach((button) => button.addEventListener("click", () => {
      paletteType = button.dataset.catalogModel;
      paletteQuery = electricalComponentCatalog[paletteType].partNumber;
      render();
      (toolboxHost || root).querySelector("#electricalPalette")?.focus();
    }));
    root.querySelector("#electricalModelSearch")?.addEventListener("input",(event)=>{paletteQuery=event.currentTarget.value;paletteType=(toolboxHost?.querySelector("#electricalPalette")||root.querySelector("#electricalPalette"))?.value||paletteType;render();const input=toolboxHost?.querySelector("#electricalModelSearch")||root.querySelector("#electricalModelSearch");input?.focus();input?.setSelectionRange(paletteQuery.length,paletteQuery.length);});
    root.querySelector("#electricalPalette")?.addEventListener("change",(event)=>{paletteType=event.currentTarget.value;});
    const showReplacementMapping = (type) => {
      const target = electricalComponentCatalog[type];
      if (!target || selected.type === type) {
        render(t.replaceHint);
        return;
      }
      const labels = ({
        de: { terminal:"Klemme", channel:"Kanal", choose:"Zuordnen", apply:"Ersetzen", cancel:"Abbrechen" },
        yo: { terminal:"Tẹ́mínà", channel:"Ikanni", choose:"Yan", apply:"Rọ́pò", cancel:"Fagilé" },
        pcm: { terminal:"Terminal", channel:"Channel", choose:"Choose", apply:"Replace", cancel:"Cancel" },
      })[language] || { terminal:"Terminal", channel:"Channel", choose:"Choose a mapping", apply:"Replace", cancel:"Cancel" };
      const terminals = new Set(diagram.wires.flatMap(({ from, to }) =>
        [from, to].filter((endpoint) => endpoint?.componentId === selected.id).map(({ terminal }) => terminal)));
      const fields = [];
      for (const terminal of terminals) fields.push({ group:"terminal", original:terminal, options:target.terminals });
      for (const direction of ["inputs", "outputs", "analogInputs", "analogOutputs"]) {
        for (const channel of selectedSpec.channels?.[direction] || []) {
          if (hasElectricalChannelBinding(selected, channel)) fields.push({
            group:"channel", original:channel, options:target.channels?.[direction] || [],
          });
        }
      }
      const dialog = document.createElement("dialog");
      dialog.className = "modal electrical-replacement-dialog";
      dialog.setAttribute("aria-labelledby", "electricalReplacementTitle");
      dialog.innerHTML = `<form class="modal-body">
        <h3 id="electricalReplacementTitle">${escape(t.replace)}</h3>
        <p>${escape(selected.reference)} → ${escape(target.name)}</p>
        ${fields.map(({ group, original, options }, index) =>
          `<label class="electrical-field">${escape(labels[group])} ${escape(original)}
            <select name="mapping-${index}" required><option value="">${escape(labels.choose)}</option>
            ${options.map((option) => `<option value="${escape(option)}" ${option === original ? "selected" : ""}>${escape(option)}</option>`).join("")}</select>
          </label>`).join("")}
        <p role="alert"></p>
        <button class="secondary" type="button" data-cancel-replacement>${escape(labels.cancel)}</button>
        <button class="primary" type="submit">${escape(labels.apply)}</button>
      </form>`;
      dialog.querySelector("[data-cancel-replacement]").addEventListener("click", () => dialog.close());
      dialog.addEventListener("close", () => dialog.remove(), { once:true });
      const error = dialog.querySelector('[role="alert"]');
      const missing = fields.find(({ options }) => !options.length);
      if (missing) {
        error.textContent = `${labels[missing.group]} ${missing.original}: ${t.noModelMatches}`;
        dialog.querySelector('[type="submit"]').disabled = true;
      }
      dialog.querySelector("form").addEventListener("submit", (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const terminalMap = {}, channelMap = {};
        fields.forEach(({ group, original }, index) => {
          const mapping = group === "terminal" ? terminalMap : channelMap;
          mapping[original] = form.get(`mapping-${index}`);
        });
        const result = replaceElectricalComponent(diagram, selected.id, type, { terminalMap, channelMap });
        if (!result.ok) {
          error.textContent = result.error;
          return;
        }
        const others = diagram.components.filter(({ id }) => id !== selected.id);
        const replacement = moveElectricalComponent(result.component, selected.x, selected.y, { snap:false });
        if (!electricalMoveKeepsClearance(replacement, selected, others)) {
          error.textContent = t.noSpace;
          return;
        }
        onBeforeChange();
        diagram.components[diagram.components.indexOf(selected)] = replacement;
        diagram.wires = result.wires;
        for (const linked of diagram.components) {
          if (result.referenceUpdates.includes(linked.id)) linked.coilRef = result.component.reference;
        }
        dialog.close();
        onChange();
        render(`${result.previousReference} → ${result.component.reference} · ${result.component.label}`);
      });
      root.append(dialog);
      dialog.showModal();
    };
    root.querySelectorAll("[data-electrical-action]").forEach((button) => button.addEventListener("click",() => {
      const action=button.dataset.electricalAction;
      if(action==="select"){wireArmed=false;pendingTerminal=null;pendingWaypoints=[];resumingWireId=null;rewireEndpoint=null;render(t.statusReady);}else if(action==="add"){const type=(toolboxHost?.querySelector("#electricalPalette")||root.querySelector("#electricalPalette"))?.value;if(!type)return;const spec=electricalComponentCatalog[type],reference=nextElectricalReference(type,diagram.components),sequence=Number(reference.slice(spec.prefix.length)),component=createElectricalComponent(type,sequence,120+(diagram.components.length%7)*180,120+Math.floor(diagram.components.length/7)*140,diagram.components),placed=findElectricalPlacement(component,diagram.components,component.x,component.y);if(!placed){render(t.noSpace);return;}Object.assign(component,{x:placed.x,y:placed.y});onBeforeChange();diagram.components.push(component);selectedId=component.id;onChange();render();}
      else if(action==="wire"){rewireEndpoint=null;if(wireArmed&&pendingTerminal){const component=diagram.components.find((item)=>item.id===pendingTerminal.componentId),anchor=component&&terminalPosition(component,pendingTerminal.terminal),last=pendingWaypoints.at(-1),pinIndex=component?electricalComponentCatalog[component.type].terminals.indexOf(pendingTerminal.terminal):-1,leftPin=pinIndex>=0&&pinIndex<Math.ceil((electricalComponentCatalog[component?.type]?.terminals?.length||0)/2),offset=leftPin?(anchor?.[0]>=40?-40:160):(anchor?.[0]<=2040?40:-160),end=last||{x:Math.max(0,Math.min(2200,(anchor?.[0]||0)+offset)),y:anchor?.[1]||0},draft=resumingWireId?diagram.wires.find((item)=>item.id===resumingWireId):null;onBeforeChange();if(draft){draft.waypoints=structuredClone(pendingWaypoints);draft.end=end;}else diagram.wires.push({id:crypto.randomUUID(),from:{...pendingTerminal},to:null,draft:true,waypoints:structuredClone(pendingWaypoints),end});onChange();wireArmed=false;pendingTerminal=null;pendingWaypoints=[];resumingWireId=null;render("Wire paused. Click Connect wire, then its free endpoint, to continue.");}else{wireArmed=!wireArmed;pendingTerminal=null;pendingWaypoints=[];resumingWireId=null;render(wireArmed?t.wireHint:t.statusReady);}}
      else if(action==="rotate"&&selected){const rotated=rotateElectricalComponent(selected);if(!electricalMoveKeepsClearance(rotated,selected,diagram.components.filter((item)=>item.id!==selected.id))){render(t.noSpace);return;}onBeforeChange();Object.assign(selected,rotated);onChange();render();}
      else if(action==="duplicate"&&selected){const copy=duplicateElectricalComponent(selected,nextElectricalReference(selected.type,diagram.components)),placed=findElectricalPlacement(copy,diagram.components,selected.x+80,selected.y+60);if(!placed){render(t.noSpace);return;}Object.assign(copy,{x:placed.x,y:placed.y});onBeforeChange();diagram.components.push(copy);selectedId=copy.id;onChange();render();}
      else if(action==="replace"&&selected){showReplacementMapping((toolboxHost || root).querySelector("#electricalPalette")?.value);}
      else if(action==="delete"&&selected){onBeforeChange();diagram.components=diagram.components.filter((item)=>item.id!==selected.id);diagram.wires=diagram.wires.filter((wire)=>wire.from.componentId!==selected.id&&wire.to?.componentId!==selected.id);selectedId=diagram.components[0]?.id||"";onChange();render();}
      else if((action==="rewire-from"||action==="rewire-to")&&selectedWireId){const selectedWire=diagram.wires.find((wire)=>wire.id===selectedWireId);if(!selectedWire||selectedWire.draft||!selectedWire.to){render("Only a completed wire can be reconnected.");return;}rewireEndpoint=action==="rewire-from"?"from":"to";wireArmed=false;pendingTerminal=null;pendingWaypoints=[];render(`Select a replacement ${rewireEndpoint==="from"?"start":"end"} terminal; the routed cable will be preserved.`);}
      else if(action==="delete-wire"&&selectedWireId){rewireEndpoint=null;onBeforeChange();diagram.wires=diagram.wires.filter((wire)=>wire.id!==selectedWireId);selectedWireId="";onChange();render();}
      else if(action==="grid"){electricalGridVisible=!electricalGridVisible;project.viewState.electricalGridVisible=electricalGridVisible;onViewChange();render();}
      else if(action==="snap"){electricalSnapToGrid=!electricalSnapToGrid;project.viewState.electricalSnapToGrid=electricalSnapToGrid;onViewChange();render();}
      else if(action==="expand"){const editor=root.closest(".editor-area");if(document.fullscreenElement)document.exitFullscreen();else editor?.requestFullscreen?.();}
      else if(action==="zoom-in"||action==="zoom-out"){electricalZoom=Math.min(150,Math.max(30,electricalZoom+(action==="zoom-in"?10:-10)));project.viewState.electricalZoom=electricalZoom;onViewChange();render();}
      else if(action==="fit-view"){const viewport=root.querySelector(".electrical-board-scroll"),scale=Math.min(viewport.clientWidth/2200,viewport.clientHeight/1400,1);electricalZoom=Math.max(30,Math.floor(scale*100/5)*5);project.viewState.electricalZoom=electricalZoom;onViewChange();render(t.statusReady,{resetViewport:true});}
      else if(action==="validate"){const errors=issues.some((item)=>item.level==="error"),warnings=issues.filter((item)=>item.level==="warning").length;render(errors?t.invalid:warnings?`${t.valid} · ${warnings} ${warnings===1?t.warning:t.warnings}`:t.valid);}
      else if(action==="simulate"){const result=simulateElectricalDiagram(diagram,{...inputValues,...diagram.inputStates},outputValues);diagram.simulation=result;simulatedOutputs=result.energized;render(electricalSimulationStatus(result,diagram.components,t));}
    }));
    root.querySelector("#electricalSelection")?.addEventListener("change",(event)=>{selectedId=event.target.value;root.dataset.selectedComponent=selectedId;render();});
    root.querySelectorAll("[data-select-wire]").forEach((button)=>button.addEventListener("click",()=>{selectedWireId=button.dataset.selectWire;selectedId="";rewireEndpoint=null;render();}));
    root.querySelectorAll(".electrical-wire[data-wire-id]").forEach((path)=>path.addEventListener("click",(event)=>{if(wireArmed&&pendingTerminal)return;event.stopPropagation();selectedWireId=path.dataset.wireId;selectedId="";rewireEndpoint=null;render();}));
    root.querySelectorAll("[data-terminal-component]").forEach((button)=>button.addEventListener("click",()=>{const endpoint={componentId:button.dataset.terminalComponent,terminal:button.dataset.terminal};if(rewireEndpoint){const wire=diagram.wires.find((item)=>item.id===selectedWireId),result=wire&&rewireElectricalTerminal(diagram,wire.id,rewireEndpoint,endpoint);if(!result?.ok){render(`${t.wireError}: ${result?.error||"Select a completed wire first."}`);return;}onBeforeChange();Object.assign(wire,result.wire);rewireEndpoint=null;onChange();render("Wire endpoint reconnected; the route was preserved.");return;}if(!wireArmed)return;if(!pendingTerminal){pendingTerminal=endpoint;pendingWaypoints=[];render(`${t.wireHint} ${endpoint.terminal}. Click the canvas to add route bends, then choose the destination terminal.`);return;}const resumeId=resumingWireId,result=connectElectricalTerminals(diagram,pendingTerminal,endpoint,pendingWaypoints);pendingTerminal=null;pendingWaypoints=[];wireArmed=false;resumingWireId=null;if(result.ok){onBeforeChange();if(resumeId){result.wire.id=resumeId;diagram.wires=diagram.wires.filter((wire)=>wire.id!==resumeId);}diagram.wires.push(result.wire);onChange();render(t.wireSaved);}else render(`${t.wireError}: ${result.error}`);}));
    root.querySelectorAll("[data-resume-wire]").forEach((end)=>end.addEventListener("click",()=>{if(!wireArmed)return;const draft=diagram.wires.find((wire)=>wire.id===end.dataset.resumeWire&&wire.draft);if(!draft)return;resumingWireId=draft.id;pendingTerminal={...draft.from};pendingWaypoints=structuredClone(draft.waypoints||[]);render(`Continuing paused wire ${draft.id}. Add bends or select a destination terminal.`);}));
    root.querySelectorAll("[data-wire-waypoint]").forEach((handle)=>{handle.addEventListener("pointerdown",(event)=>{if(event.button!==0)return;const wire=diagram.wires.find((item)=>item.id===handle.dataset.wireWaypoint),index=Number(handle.dataset.waypointIndex);if(!wire?.waypoints?.[index])return;onBeforeChange();selectedWireId=wire.id;routeDrag={wire,index};board?.setPointerCapture?.(event.pointerId);event.preventDefault();event.stopPropagation();});handle.addEventListener("keydown",(event)=>{if(!["Delete","Backspace"].includes(event.key))return;const wire=diagram.wires.find((item)=>item.id===handle.dataset.wireWaypoint),index=Number(handle.dataset.waypointIndex);if(!wire?.waypoints?.[index])return;event.preventDefault();onBeforeChange();wire.waypoints.splice(index,1);onChange();render();});});    root.querySelectorAll("[data-component-id]").forEach((card)=>card.addEventListener("click",(event)=>{if(event.target.closest("[data-terminal-component]")||event.target.closest("[data-drag-component]"))return;selectedId=card.dataset.componentId;root.dataset.selectedComponent=selectedId;render();}));
    root.querySelectorAll("[data-electrical-input]").forEach((input) => input.addEventListener("change", () => {
      const tag = input.dataset.electricalInput, checked = input.checked;
      const retainFocus = input === document.activeElement;
      diagram.inputStates[tag] = checked;
      inputValues = { ...inputValues, [tag]: checked };
      diagram.simulation = simulateElectricalDiagram(diagram, { ...inputValues, ...diagram.inputStates }, outputValues);
      onInputChange(tag, checked);
      simulatedOutputs = diagram.simulation.energized;
      render();
      onChange();
      if (retainFocus) (inspectorHost || root).querySelector(`[data-electrical-input="${CSS.escape(tag)}"]`)?.focus({ preventScroll: true });
    }));
    root.querySelector("#electricalProperties")?.addEventListener("submit",(event)=>{event.preventDefault();const active=event.currentTarget.contains(document.activeElement)?document.activeElement:null;const form=new FormData(event.currentTarget),updates=Object.fromEntries(form.entries()),nextMap=structuredClone(selected.ioMap||{});for(const property of rangeProperties)updates[property]=form.getAll(property);for(const field of ["ratedVoltageV","ratedCurrentA"])updates[field]=updates[field]===""?null:Number(updates[field]);if(event.currentTarget.elements.normallyClosed)updates.normallyClosed=updates.normallyClosed==="true";updates.closed=event.currentTarget.elements.closed?.checked??selected.closed;updates.tripped=event.currentTarget.elements.tripped?.checked??selected.tripped;if(event.currentTarget.elements.breakerOpen)updates.breakerOpen=event.currentTarget.elements.breakerOpen.checked;for(const [name,value] of form.entries()){if(name.startsWith("mapTag:"))nextMap[name.slice(7)].tag=value;if(name.startsWith("mapAddress:"))nextMap[name.slice(11)].address=value.trim();}delete updates.ioMap;for(const name of Object.keys(updates))if(name.startsWith("mapTag:")||name.startsWith("mapAddress:"))delete updates[name];const duplicate=diagram.components.some((item)=>item.id!==selected.id&&item.reference.toUpperCase()===updates.reference?.trim().toUpperCase());if(!updates.reference.trim()||duplicate||["ratedVoltageV","ratedCurrentA"].some((field)=>updates[field]!==null&&(!Number.isFinite(updates[field])||updates[field]<=0))){renderPropertyResult(t.invalid,active);return;}onBeforeChange();const previousReference=selected.reference;Object.assign(selected,updateElectricalComponentProperties(selected,updates));if(previousReference!==selected.reference)for(const component of diagram.components)if(String(component.coilRef||"").toUpperCase()===previousReference.toUpperCase())component.coilRef=selected.reference;selected.ioMap=nextMap;const result=simulateElectricalDiagram(diagram,{...inputValues,...diagram.inputStates},outputValues);diagram.simulation=result;simulatedOutputs=result.energized;onChange();renderPropertyResult(t.valid,active);});
    const board=root.querySelector("#electricalBoard"); let drag=null;
    board?.addEventListener("click",(event)=>root._electricalCanvasRouteHandler?.(event,board),true);
    root.querySelectorAll("[data-drag-component]").forEach((head)=>head.addEventListener("click",(event)=>{
      if(event.detail!==0)return;
      selectedId=head.dataset.dragComponent;root.dataset.selectedComponent=selectedId;render();
      root.querySelector(`[data-drag-component="${CSS.escape(selectedId)}"]`)?.focus();
    }));
    root.querySelectorAll("[data-drag-component]").forEach((head)=>head.addEventListener("keydown",(event)=>{
      const direction={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[event.key];
      if(!direction||event.altKey||event.ctrlKey||event.metaKey)return;
      const component=diagram.components.find((item)=>item.id===head.dataset.dragComponent);
      if(!component)return;
      event.preventDefault();event.stopPropagation();onBeforeChange();
      const distance=event.shiftKey?100:20,next=moveElectricalComponent(component,Math.max(0,component.x+direction[0]*distance),Math.max(0,component.y+direction[1]*distance),{snap:electricalSnapToGrid});
      if(!electricalMoveKeepsClearance(next,component,diagram.components.filter((item)=>item.id!==component.id))){render(t.noSpace);return;}
      Object.assign(component,next);
      selectedId=component.id;root.dataset.selectedComponent=selectedId;onChange();render();
      root.querySelector(`[data-drag-component="${CSS.escape(component.id)}"]`)?.focus();
    }));
    const beginComponentDrag=(event,componentId,fromHandle=false)=>{if(event.button!==0||event.target?.closest?.(".electrical-port"))return;const component=diagram.components.find((item)=>item.id===componentId),rect=board.getBoundingClientRect();if(!component)return;if(fromHandle)event.stopPropagation();onBeforeChange();selectedId=component.id;root.dataset.selectedComponent=selectedId;const scale=electricalZoom/100;drag={id:component.id,start:{...component},lastValid:{...component},dx:(event.clientX-rect.left)/scale-component.x,dy:(event.clientY-rect.top)/scale-component.y};board?.setPointerCapture?.(event.pointerId);event.preventDefault();};
    root.querySelectorAll("[data-drag-component]").forEach((head)=>head.addEventListener("pointerdown",(event)=>beginComponentDrag(event,head.dataset.dragComponent,true)));
    root.querySelectorAll(".electrical-component").forEach((card)=>card.addEventListener("pointerdown",(event)=>beginComponentDrag(event,card.dataset.componentId)));
    board?.addEventListener("pointermove",(event)=>{const rect=board.getBoundingClientRect();if(routeDrag){const point={x:Math.max(0,Math.min(2200,Math.round((event.clientX-rect.left)/(electricalZoom/100)/20)*20)),y:Math.max(0,Math.min(1400,Math.round((event.clientY-rect.top)/(electricalZoom/100)/20)*20))};routeDrag.wire.waypoints[routeDrag.index]=point;board.querySelector(`[data-wire-id="${CSS.escape(routeDrag.wire.id)}"]`)?.setAttribute("d",electricalWirePath(routeDrag.wire,diagram.components));const handle=board.querySelector(`[data-wire-waypoint="${CSS.escape(routeDrag.wire.id)}"][data-waypoint-index="${routeDrag.index}"]`);handle?.setAttribute("cx",point.x);handle?.setAttribute("cy",point.y);return;}if(!drag)return;const component=diagram.components.find((item)=>item.id===drag.id);if(!component)return;const next=moveElectricalComponent(component,(event.clientX-rect.left)/(electricalZoom/100)-drag.dx,(event.clientY-rect.top)/(electricalZoom/100)-drag.dy,{snap:electricalSnapToGrid});drag.blocked=!electricalMoveKeepsClearance(next,drag.start,diagram.components.filter((item)=>item.id!==component.id));if(!drag.blocked)drag.lastValid={...next};Object.assign(component,next);const card=board.querySelector(`[data-component-id="${CSS.escape(component.id)}"]`);if(card){card.style.left=`${component.x}px`;card.style.top=`${component.y}px`;}for(const wire of diagram.wires.filter(w=>w.from.componentId===component.id||w.to?.componentId===component.id))board.querySelector(`[data-wire-id="${CSS.escape(wire.id)}"]`)?.setAttribute("d",electricalWirePath(wire,diagram.components));});
    const finishDrag=(cancelled=false)=>{if(!drag&&!routeDrag)return;const message=drag?.blocked?t.noSpace:t.statusReady;if(drag&&(cancelled||drag.blocked)){const component=diagram.components.find((item)=>item.id===drag.id);if(component)Object.assign(component,cancelled?drag.start:drag.lastValid);}drag=null;routeDrag=null;onChange();render(message);};
    board?.addEventListener("pointerup",()=>finishDrag(false));
    board?.addEventListener("pointercancel",()=>finishDrag(true));
    root.dataset.selectedComponent=selectedId;
    // Port already-bound controls, not clones: existing tool actions and properties retain listeners.
    if (toolboxHost) {
      const toolbar=root.querySelector(".electrical-toolbar"),catalog=root.querySelector(".industrial-catalog");
      const heading=document.createElement("div"),title=document.createElement("h2"),active=document.createElement("span");
      heading.className="electrical-toolbox-heading";title.textContent=language==="de"?"KOMPONENTENWERKZEUGE":language==="yo"?"ÀWỌN Ọ̀RỌ̀ COMPONENT":"COMPONENT TOOLS";active.textContent=language==="de"?"AKTIV":language==="yo"?"Ń ṢIṢẸ́":"ACTIVE";heading.append(title,active);
const workflows=document.createElement("section"),workflowsTitle=document.createElement("h2"),genericLink=document.createElement("button"),simulationDetails=document.createElement("details"),simulationSummary=document.createElement("summary"),manualInputLink=document.createElement("button"),simulationActions=document.createElement("div"),paletteControl=toolbar?.querySelector("#electricalPalette"),faultsButton=toolboxHost.ownerDocument.querySelector('.toolbar .sim-tools [data-action="faults"]')||toolboxHost.querySelector('[data-action="faults"]');workflows.id="electricalLibraryWorkflows";workflows.className="electrical-library-workflows";workflowsTitle.textContent=language==="de"?"BIBLIOTHEK & WORKFLOWS":language==="yo"?"ÀWỌN ÀKÓṢÍLẸ̀ & ÌṢẸ́":"LIBRARY & WORKFLOWS";genericLink.type="button";genericLink.className="electrical-library-link";genericLink.textContent=language==="de"?"Generische Komponenten ›":language==="yo"?"Àwọn component generic ›":"Generic components ›";genericLink.addEventListener("click",()=>paletteControl?.focus());simulationDetails.id="electricalSimulationWorkflow";simulationDetails.className="electrical-simulation-workflow";simulationSummary.textContent=language==="de"?"Simulierte E/A / Fehler":language==="yo"?"I/O tí a ṣe àfarawé / àṣìṣe":"Simulated I/O / faults";simulationDetails.append(simulationSummary);simulationActions.id="electricalSimulationWorkflowActions";simulationActions.className="electrical-simulation-workflow-actions";manualInputLink.type="button";manualInputLink.id="electricalManualInputLink";manualInputLink.className="electrical-library-link";manualInputLink.textContent=t.manual;manualInputLink.addEventListener("click",()=>{const target=inspectorHost?.querySelector("#electricalManualInputStates");target?.scrollIntoView({block:"nearest",behavior:"smooth"});target?.focus({preventScroll:true});});simulationActions.append(manualInputLink);if(faultsButton)simulationActions.append(faultsButton);simulationDetails.append(simulationActions);workflows.append(workflowsTitle,genericLink);if(catalog)workflows.append(catalog);workflows.append(simulationDetails);
      toolboxHost.replaceChildren(heading,...[toolbar,workflows].filter(Boolean));
    }
    if (inspectorHost) {
      const inspector=root.querySelector(".electrical-inspector");
      if (inspector) inspectorHost.replaceChildren(inspector);
    }
    const scrollHost = root.querySelector(".electrical-board-scroll");
    viewport.host = scrollHost;
    if (!scrollHost) return;
    scrollHost.addEventListener("scroll", () => {
      if (viewport.host !== scrollHost || !scrollHost.clientWidth) return;
      viewport.left = scrollHost.scrollLeft;
      viewport.top = scrollHost.scrollTop;
    }, { passive:true });
    const restoreViewport = () => {
      if (viewport.host === scrollHost && scrollHost.isConnected) scrollHost.scrollTo(viewport.left, viewport.top);
    };
    if (scrollHost.clientWidth) restoreViewport();
    else requestAnimationFrame(restoreViewport);
  };
  render();
}

