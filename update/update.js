const messages={
  en:["Refresh application files while keeping saved projects and your account session.","Update application","Downloading the current application…","Update ready. Return to the application.","Update could not finish. Check your connection and try again.","Return to AdigunSPs"],
  de:["Anwendungsdateien aktualisieren; gespeicherte Projekte und Anmeldung bleiben erhalten.","Anwendung aktualisieren","Aktuelle Anwendung wird geladen…","Update bereit. Zur Anwendung zurückkehren.","Update nicht abgeschlossen. Verbindung prüfen und erneut versuchen.","Zurück zu AdigunSPs"],
  yo:["Ṣe àtúnṣe àwọn fáìlì app; àwọn iṣẹ́ tí o fipamọ́ àti ìwọlé rẹ yóò wà.","Ṣe àtúnṣe app","A ń gba app tuntun…","Àtúnṣe ti ṣetán. Padà sí app.","Àtúnṣe kò parí. Ṣàyẹ̀wò ìsopọ̀ rẹ kí o tún gbìyànjú.","Padà sí AdigunSPs"],
  pcm:["Refresh app files; saved projects and your sign-in go remain.","Update app","Current app dey download…","Update ready. Return to app.","Update no finish. Check connection and try again.","Return to AdigunSPs"]
};
const locale=new URLSearchParams(location.search).get("lang")||navigator.language.split("-")[0],text=messages[locale]||messages.en;
document.documentElement.lang=messages[locale]?locale:"en";
const button=document.querySelector("#update"),status=document.querySelector("#status"),back=document.querySelector("#return");
document.querySelector("#description").textContent=text[0];button.textContent=text[1];back.textContent=text[5];
button.addEventListener("click",async()=>{
  button.disabled=true;status.textContent=text[2];back.hidden=true;
  try{
    if(!("serviceWorker"in navigator))throw Error("unavailable");
    const base=new URL("../",location.href);
    const registration=await navigator.serviceWorker.register(new URL(`service-worker.js?refresh=${Date.now()}`,base),{scope:base.pathname,updateViaCache:"none"});
    const worker=registration.installing||registration.waiting||registration.active;
    if(!worker)throw Error("missing-worker");
    if(worker.state!=="activated")await new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>{worker.removeEventListener("statechange",check);reject(Error("timeout"));},30000);
      function check(){if(worker.state==="activated"||worker.state==="redundant"){clearTimeout(timer);worker.removeEventListener("statechange",check);worker.state==="activated"?resolve():reject(Error("install-failed"));}}
      worker.addEventListener("statechange",check);check();
    });
    status.textContent=text[3];back.href=base.href;back.hidden=false;
  }catch{status.textContent=text[4];button.disabled=false;}
});
