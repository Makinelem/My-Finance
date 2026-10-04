const $=s=>document.querySelector(s);
const money=v=>Number(v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const monthKey=()=>{let d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`};
const monthName=()=>new Date().toLocaleDateString("pt-BR",{month:"long",year:"numeric"});
let data=JSON.parse(localStorage.getItem("gp_data")||'{"income":0,"currentAmount":0,"cards":[],"purchases":[],"fixed":[]}');
if(data.currentAmount===undefined)data.currentAmount=0;
if(!Array.isArray(data.cards))data.cards=[];
if(!Array.isArray(data.purchases))data.purchases=[];
if(!Array.isArray(data.fixed))data.fixed=[];

const prefs=JSON.parse(localStorage.getItem("gp_prefs")||'{"theme":"light","fontSize":"normal"}');
const save=()=>localStorage.setItem("gp_data",JSON.stringify(data));
$("#monthTitle").textContent=monthName();
applyPreferences();

function showPage(id){
 document.querySelectorAll(".page").forEach(p=>p.classList.toggle("active",p.id===id));
 document.querySelectorAll(".bottom-nav button").forEach(b=>b.classList.toggle("active",b.dataset.page===id));
 window.scrollTo(0,0);
 render();
}
document.querySelectorAll("[data-page]").forEach(b=>b.onclick=()=>showPage(b.dataset.page));

function cardUsed(cardId){
 return data.purchases.filter(p=>p.cardId===cardId).reduce((s,p)=>s+Number(p.total||0),0);
}
function render(){
 const fixed=data.fixed.reduce((s,x)=>s+Number(x.value||0),0);
 const card=data.cards.reduce((s,x)=>s+cardUsed(x.id),0);
 const cash=data.purchases.filter(p=>(p.method||"cartao")!=="cartao").reduce((s,p)=>s+Number(p.total||0),0);
 const committed=fixed+card+cash;
 $("#currentAmount").textContent=money(data.currentAmount);
 $("#currentAmountSetting").textContent=money(data.currentAmount);
 $("#fixedTotal").textContent=money(fixed);
 $("#cardTotal").textContent=money(card);
 $("#cashTotal").textContent=money(cash);
 $("#incomeTotal").textContent=money(data.income);
 $("#committedTotal").textContent=money(committed);
 $("#available").textContent=money(Number(data.currentAmount||0)+Number(data.income||0)-committed);
 $("#cardSummary").innerHTML=data.cards.length?data.cards.slice(0,3).map(c=>cardHTML(c)).join(""):`<div class="item"><div><b>Nenhum cartão cadastrado</b><div class="sub">Cadastre seu primeiro cartão.</div></div></div>`;
 $("#cardsList").innerHTML=data.cards.length?data.cards.map(c=>cardHTML(c,true)).join(""):`<div class="item">Nenhum cartão cadastrado.</div>`;
 $("#purchasesList").innerHTML=data.purchases.length?data.purchases.slice().reverse().map(p=>purchaseHTML(p)).join(""):`<div class="item">Nenhuma compra lançada.</div>`;
 $("#fixedList").innerHTML=data.fixed.length?data.fixed.map(f=>fixedHTML(f)).join(""):`<div class="item">Nenhuma despesa fixa cadastrada.</div>`;
 const ups=[...data.fixed.map(f=>({title:f.name,sub:"Despesa fixa • dia "+f.day,value:f.value})),...data.purchases.slice(0,8).map(p=>({title:p.name,sub:`${methodLabel(p.method)} • ${p.installments||1}x`,value:Number(p.total)/Number(p.installments||1)}))];
 $("#upcoming").innerHTML=ups.length?ups.slice(0,5).map(x=>`<div class="item"><div><div class="title">${esc(x.title)}</div><div class="sub">${esc(x.sub)}</div></div><div class="value">${money(x.value)}</div></div>`).join(""):`<div class="item">Nenhum compromisso cadastrado.</div>`;
}
function cardHTML(c,actions=false){let used=cardUsed(c.id), available=Number(c.limit)-used;return `<div class="item"><div><div class="title">💳 ${esc(c.name)}</div><div class="sub">Limite ${money(c.limit)} • disponível ${money(available)}</div></div><div class="value">${money(used)}${actions?`<div class="actions"><button onclick="editCard('${c.id}')">Editar</button><button class="del" onclick="delCard('${c.id}')">Excluir</button></div>`:""}</div></div>`}
function methodLabel(method){return method==="pix"?"PIX":method==="debito"?"Débito":"Cartão"}
function purchaseHTML(p){
 let method=p.method||"cartao";
 let c=data.cards.find(x=>x.id===p.cardId);
 let payment=method==="cartao"?(c?esc(c.name):"Cartão removido"):`${methodLabel(method)}`;
 let inst=Number(p.installments||1);
 return `<div class="item"><div><div class="title">${esc(p.name)}</div><div class="sub">${payment} • ${inst}x • ${p.date}</div></div><div class="value">${money(p.total)}<div class="actions"><button onclick="editPurchase('${p.id}')">Editar</button><button class="del" onclick="delPurchase('${p.id}')">Excluir</button></div></div></div>`
}
function fixedHTML(f){return `<div class="item"><div><div class="title">↻ ${esc(f.name)}</div><div class="sub">Todo mês • dia ${f.day}</div></div><div class="value">${money(f.value)}<div class="actions"><button onclick="editFixed('${f.id}')">Editar</button><button class="del" onclick="delFixed('${f.id}')">Excluir</button></div></div></div>`}
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function openModal(title,html){$("#modalTitle").textContent=title;$("#modalBody").innerHTML=html;$("#modal").classList.remove("hidden")}
$("#closeModal").onclick=()=>$("#modal").classList.add("hidden");

$("#addCard").onclick=()=>cardForm();
function cardForm(c=null){openModal(c?"Editar cartão":"Novo cartão",`<div class="form"><label>Nome do cartão</label><input id="fName" value="${c?esc(c.name):""}" placeholder="Ex.: Nubank"><label>Limite total</label><input id="fLimit" type="number" step="0.01" value="${c?c.limit:""}" placeholder="5000"><label>Dia de fechamento</label><input id="fClose" type="number" min="1" max="31" value="${c?c.close:""}"><label>Dia de vencimento</label><input id="fDue" type="number" min="1" max="31" value="${c?c.due:""}"><button onclick="saveCard('${c?.id||""}')">Salvar</button></div>`)}
window.saveCard=id=>{let x={id:id||crypto.randomUUID(),name:$("#fName").value.trim(),limit:Number($("#fLimit").value),close:Number($("#fClose").value),due:Number($("#fDue").value)};if(!x.name||!x.limit)return alert("Informe nome e limite.");let i=data.cards.findIndex(c=>c.id===id);i>=0?data.cards[i]=x:data.cards.push(x);save();$("#modal").classList.add("hidden");render()};
window.editCard=id=>cardForm(data.cards.find(c=>c.id===id));window.delCard=id=>{if(confirm("Excluir este cartão?")){data.cards=data.cards.filter(c=>c.id!==id);save();render()}};

$("#addPurchase").onclick=()=>purchaseForm();
function purchaseForm(p=null){
 const method=p?.method||"cartao";
 openModal(p?"Editar compra":"Nova compra",`<div class="form">
 <label>Descrição</label><input id="pName" value="${p?esc(p.name):""}" placeholder="Ex.: Mercado">
 <label>Forma de pagamento</label>
 <select id="pMethod">
   <option value="cartao" ${method==="cartao"?"selected":""}>Cartão</option>
   <option value="pix" ${method==="pix"?"selected":""}>PIX</option>
   <option value="debito" ${method==="debito"?"selected":""}>Débito</option>
 </select>
 <div id="cardFields" class="${method==="cartao"?"":"hidden"}">
   <label>Cartão</label>
   <select id="pCard">${data.cards.map(c=>`<option value="${c.id}" ${p?.cardId===c.id?"selected":""}>${esc(c.name)}</option>`).join("")}</select>
 </div>
 <label>Data</label><input id="pDate" type="date" value="${p?.date||new Date().toISOString().slice(0,10)}">
 <label>Valor total</label><input id="pTotal" type="number" step="0.01" value="${p?p.total:""}">
 <div id="installmentFields" class="${method==="cartao"?"":"hidden"}">
   <label>Pagamento</label>
   <select id="pInst">
    <option value="1" ${p?.installments==1?"selected":""}>À vista</option><option value="2" ${p?.installments==2?"selected":""}>2 parcelas</option>
    <option value="3" ${p?.installments==3?"selected":""}>3 parcelas</option><option value="4" ${p?.installments==4?"selected":""}>4 parcelas</option>
    <option value="5" ${p?.installments==5?"selected":""}>5 parcelas</option><option value="6" ${p?.installments==6?"selected":""}>6 parcelas</option>
    <option value="8" ${p?.installments==8?"selected":""}>8 parcelas</option><option value="10" ${p?.installments==10?"selected":""}>10 parcelas</option>
    <option value="12" ${p?.installments==12?"selected":""}>12 parcelas</option><option value="18" ${p?.installments==18?"selected":""}>18 parcelas</option>
    <option value="24" ${p?.installments==24?"selected":""}>24 parcelas</option>
   </select>
 </div>
 <button onclick="savePurchase('${p?.id||""}')">Salvar</button></div>`);
 const methodSelect=$("#pMethod");
 const updatePaymentFields=()=>{
   const isCard=methodSelect.value==="cartao";
   $("#cardFields").classList.toggle("hidden",!isCard);
   $("#installmentFields").classList.toggle("hidden",!isCard);
 };
 methodSelect.onchange=updatePaymentFields;
 updatePaymentFields();
} 
window.savePurchase=id=>{
 let method=$("#pMethod").value;
 let isCard=method==="cartao";
 if(isCard&&!data.cards.length)return alert("Cadastre um cartão primeiro.");
 let x={id:id||crypto.randomUUID(),name:$("#pName").value.trim(),method,cardId:isCard?$("#pCard").value:null,date:$("#pDate").value,total:Number($("#pTotal").value),installments:isCard?Number($("#pInst").value):1};
 if(!x.name||!x.total)return alert("Informe descrição e valor.");
 let i=data.purchases.findIndex(p=>p.id===id);
 i>=0?data.purchases[i]=x:data.purchases.push(x);
 save();$("#modal").classList.add("hidden");render();
};
window.editPurchase=id=>purchaseForm(data.purchases.find(p=>p.id===id));
window.delPurchase=id=>{if(confirm("Excluir esta compra?")){data.purchases=data.purchases.filter(p=>p.id!==id);save();render()}};
$("#addFixed").onclick=()=>fixedForm();
function fixedForm(f=null){openModal(f?"Editar despesa fixa":"Nova despesa fixa",`<div class="form"><label>Nome</label><input id="xName" value="${f?esc(f.name):""}" placeholder="Ex.: Internet"><label>Valor mensal</label><input id="xValue" type="number" step="0.01" value="${f?f.value:""}"><label>Dia do vencimento</label><input id="xDay" type="number" min="1" max="31" value="${f?f.day:""}"><button onclick="saveFixed('${f?.id||""}')">Salvar</button></div>`)}
window.saveFixed=id=>{let x={id:id||crypto.randomUUID(),name:$("#xName").value.trim(),value:Number($("#xValue").value),day:Number($("#xDay").value)};if(!x.name||!x.value)return alert("Informe nome e valor.");let i=data.fixed.findIndex(f=>f.id===id);i>=0?data.fixed[i]=x:data.fixed.push(x);save();$("#modal").classList.add("hidden");render()};
window.editFixed=id=>fixedForm(data.fixed.find(f=>f.id===id));window.delFixed=id=>{if(confirm("Excluir esta despesa?")){data.fixed=data.fixed.filter(f=>f.id!==id);save();render()}};

function unlock(){localStorage.setItem("gp_unlocked","1");$("#lock").classList.add("hidden");$("#setup").classList.add("hidden");$("#app").classList.remove("hidden");render()}
const storedPin=localStorage.getItem("gp_pin");
if(!storedPin){$("#lock").classList.add("hidden");$("#setup").classList.remove("hidden")}
$("#enterBtn").onclick=()=>{$("#loginMsg").textContent=$("#pin").value===localStorage.getItem("gp_pin")?(unlock(),""):"PIN incorreto."};
$("#pin").onkeydown=e=>{if(e.key==="Enter")$("#enterBtn").click()};
$("#savePin").onclick=()=>{let a=$("#newPin").value,b=$("#newPin2").value;if(!/^\d{4,6}$/.test(a)||a!==b)return $("#setupMsg").textContent="Use 4 a 6 números iguais nos dois campos.";localStorage.setItem("gp_pin",a);unlock()};
$("#logout").onclick=()=>{localStorage.removeItem("gp_unlocked");location.reload()};
$("#setCurrentAmount").onclick=()=>{
 let v=prompt("Quanto você tem disponível agora?",String(Number(data.currentAmount||0).toFixed(2)));
 if(v===null)return;
 v=Number(String(v).replace(",","."));
 if(!Number.isFinite(v)||v<0)return alert("Informe um valor válido.");
 data.currentAmount=v;save();render();
};

function applyPreferences(){
 document.body.classList.toggle("theme-dark",prefs.theme==="dark");
 document.body.classList.remove("font-small","font-large");
 if(prefs.fontSize==="small")document.body.classList.add("font-small");
 if(prefs.fontSize==="large")document.body.classList.add("font-large");
 $("#themeToggle").innerHTML=(prefs.theme==="dark"?"☀️ Tema claro":"🌙 Tema escuro")+" <span>›</span>";
 $("#fontSizeLabel").textContent=prefs.fontSize==="small"?"Pequena":prefs.fontSize==="large"?"Grande":"Normal";
}
$("#themeToggle").onclick=()=>{prefs.theme=prefs.theme==="dark"?"light":"dark";localStorage.setItem("gp_prefs",JSON.stringify(prefs));applyPreferences()};
$("#fontSize").onclick=()=>{
 const next={normal:"small",small:"large",large:"normal"}[prefs.fontSize||"normal"];
 prefs.fontSize=next;localStorage.setItem("gp_prefs",JSON.stringify(prefs));applyPreferences();
};

$("#changePin").onclick=()=>{let p=prompt("Novo PIN (4 a 6 números):");if(p&&/^\d{4,6}$/.test(p)){localStorage.setItem("gp_pin",p);alert("PIN alterado.")}else if(p)alert("PIN inválido.")};
$("#clearData").onclick=()=>{if(confirm("Apagar cartões, compras, despesas e receitas?")){data={income:0,currentAmount:0,cards:[],purchases:[],fixed:[]};save();render()}};
if(localStorage.getItem("gp_unlocked")==="1")unlock();
