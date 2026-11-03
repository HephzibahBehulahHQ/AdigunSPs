export function validateCyclicTasks(tasks, programNames = null) {
 if (!Array.isArray(tasks) || tasks.length < 1 || tasks.length > 16) return ["Configure 1–16 cyclic tasks."];
 const errors=[],names=new Set(),assigned=new Set(),programs=programNames && new Map(programNames.map(name=>[name.toLowerCase(),name]));
 if(programs && !programs.size) errors.push("Declare named ST programs before configuring cyclic tasks.");
 for(const [index,task] of tasks.entries()){
  const label=`Task ${index+1}`;
  if(!task || typeof task!=="object" || Array.isArray(task)){errors.push(`${label} must be an object.`);continue;}
  if(typeof task.name!=="string" || !task.name.trim() || task.name.length>64) errors.push(`${label} requires a name of 1–64 characters.`);
  else {const name=task.name.trim().toLowerCase();if(names.has(name))errors.push(`${label} repeats a task name (ignoring case).`);names.add(name);}
  if(!Number.isInteger(task.cycleMs)||task.cycleMs<1||task.cycleMs>60000)errors.push(`${label} cycle must be 1–60000 whole milliseconds.`);
  const priority=task.priority===undefined?0:task.priority;
  if(!Number.isInteger(priority)||priority<0||priority>31)errors.push(`${label} priority must be 0–31 (0 runs first).`);
  if(task.enabled!==undefined&&typeof task.enabled!=="boolean")errors.push(`${label} enabled must be true or false.`);
  if(!Array.isArray(task.programs)||task.programs.length>32){errors.push(`${label} requires a list of up to 32 program names.`);continue;}
  for(const program of task.programs){
   if(typeof program!=="string"||!program||program.length>128){errors.push(`${label} has an invalid program name.`);continue;}
   const key=program.toLowerCase();if(assigned.has(key))errors.push(`Program "${program}" is assigned more than once.`);assigned.add(key);
   if(programs&&!programs.has(key))errors.push(`Program "${program}" is not declared.`);
  }
 }
 if(programs)for(const [key,name] of programs)if(!assigned.has(key))errors.push(`Program "${name}" must be assigned to one task (which may be disabled).`);
 return errors;
}
export function cyclicTaskSchedule(tasks,programNames,dtMs=100,previous=null){
 if(tasks===undefined)return {errors:[],releases:programNames.map(name=>({programs:[name],at:0,task:null})),state:null};
 const errors=validateCyclicTasks(tasks,programNames);
 if(!Number.isInteger(dtMs)||dtMs<1||dtMs>60000)errors.push("Scan duration must be 1–60000 whole milliseconds.");
 if(errors.length)return {errors,releases:[],state:previous};
 const programs=new Map(programNames.map(name=>[name.toLowerCase(),name]));
 const normalized=tasks.map(task=>({name:task.name.trim(),cycleMs:task.cycleMs,priority:task.priority===undefined?0:task.priority,enabled:task.enabled!==false,programs:task.programs.map(name=>programs.get(name.toLowerCase()))}));
 const schema=JSON.stringify(normalized.map(task=>({...task,name:task.name.toLowerCase(),programs:task.programs.map(name=>name.toLowerCase())}))),timeMs=previous?.schema===schema?previous.timeMs:0;
 if(!Number.isSafeInteger(timeMs)||timeMs<0||timeMs>Number.MAX_SAFE_INTEGER-dtMs)return {errors:["Task clock is invalid or has exceeded its supported range. Reset the simulation."],releases:[],state:previous};
 const end=timeMs+dtMs,counts=normalized.map(task=>task.enabled&&task.programs.length?Math.floor(end/task.cycleMs)-Math.floor(timeMs/task.cycleMs):0);
 if(counts.reduce((sum,count,index)=>sum+count*normalized[index].programs.length,0)>1024)return {errors:["More than 1024 program activations in one scan. Reduce the base task cycle or increase task periods."],releases:[],state:previous};
 if(counts.reduce((sum,count)=>sum+count,0)>1024)return {errors:["More than 1024 task releases in one scan. Reduce the base task cycle or increase task periods."],releases:[],state:previous};
 const releases=[];
 normalized.forEach((task,index)=>{for(let release=1;release<=counts[index];release++)releases.push({periodMs:task.cycleMs,task:task.name,at:(Math.floor(timeMs/task.cycleMs)+release)*task.cycleMs,priority:task.priority,index,programs:task.programs});});
 releases.sort((a,b)=>a.at-b.at||a.priority-b.priority||a.index-b.index);
 return {errors:[],releases,state:{schema,timeMs:end}};
}
