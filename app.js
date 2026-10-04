const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const KEY='gp_v3_data', PIN='gp_v3_pin', OLD='gp_data', OLD_PIN='gp_pin';
let data=JSON.parse(localStorage.getItem(KEY)||'null')||JSON.parse(localStorage.getItem(OLD)||'null')||{income:0,cards:[],purchases:[],fixed:[],pix:[],margin:0};
data={income:Number(data.income||0),cards:data.cards||[],purchases:data.purchases||[],fixed:data.fixed||[],pix:data.pix||[],margin:Number(data.margin||0)};
let pin=localStorage.getItem(PIN)||localStorage.getItem(OLD_PIN)||'';
let currentPage='home', fontSize=localStorage.getItem('gp_font')||'normal', dark=localStorage.getItem('gp_dark')==='1';
const money=n=>Number(n||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const save=()=>localStorage.setItem(KEY,JSON.stringify(data));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function applyPrefs(){document.body.classList.toggle('dark',dark);document.body.classList.toggle('font-small',fontSize==='small');document.body.classList.toggle('font-smaller',fontSize==='smaller');$('#themeState').textContent=dark?'Ligado':'Desligado';$('#fontState').textContent=fontSize==='normal'?'Normal':fontSize==='small'?'Pequena':'Muito pequena'}
function show(id){['lock','setup','recovery','app'].forEach(x=>$('#'+x).classList.add('hidden'));$('#'+id).classList.remove('hidden')}
function start(){applyPrefs(); if(!pin){show('setup')}else show('lock')}
function validPin(p){return /^\d{4,8}$/.test(p)}
function unlock(){show('app');render();go('home')}
function fail(el,msg){$(el).textContent=msg;setTimeout(()=>$(el).textContent='',2500)}
$('#createPinBtn').onclick=()=>{let a=$('#newPin').value,b=$('#newPin2').value;if(!validPin(a))return fail('#setupMsg','Use de 4 a 8 números.');if(a!==b)return fail('#setupMsg','Os PINs não conferem.');localStorage.setItem(PIN,a);pin=a;unlock()};
$('#loginBtn').onclick=()=>{$('#loginPin').value===pin?unlock():fail('#loginMsg','PIN incorreto.')};
$('#loginPin').onkeydown=e=>{if(e.key==='Enter')$('#loginBtn').click()};
$('#forgotBtn').onclick=()=>show('recovery');
$('#backLoginBtn').onclick=()=>show('lock');
$('#recoverBtn').onclick=()=>{let a=$('#recoverPin').value,b=$('#recoverPin2').value;if(!validPin(a))return fail('#recoverMsg','Use de 4 a 8 números.');if(a!==b)return fail('#recoverMsg','Os PINs não conferem.');localStorage.setItem(PIN,a);pin=a;unlock()};
$('#lockBtn').onclick=()=>{show('lock');$('#loginPin').value=''};
$('#logoutBtn').onclick=()=>{show('lock');$('#loginPin').value=''};
function go(p){currentPage=p;$$('.page').forEach(x=>x.classList.remove('active'));$('#page-'+p).classList.add('active');$$('nav button').forEach(x=>x.classList.toggle('active',x.dataset.page===p));$('#pageTitle').textContent={home:'Início',income:'Receita',cards:'Cartões',purchases:'Compras',fixed:'Despesas fixas',pix:'PIX',margin:'Margem',settings:'Ajustes'}[p]||'Início'}
$$('nav button').forEach(b=>b.onclick=()=>{go(b.dataset.page);render()});
function render(){
applyPrefs();
$('#incomeView').textContent=money(data.income);
let fixed=data.fixed.reduce((s,x)=>s+Number(x.value||0),0), pix=data.pix.reduce((s,x)=>s+Number(x.value||0),0);
let card=data.purchases.reduce((s,x)=>s+Number(x.value||0),0),commit=fixed+pix+card;
let available=data.income-commit;
$('#available').textContent=money(available);$('#safeSpend').textContent='Após a margem: '+money(available-data.margin);
$('#commitView').textContent=money(commit);$('#fixedView').textContent=money(fixed);$('#cardsView').textContent=money(card);$('#pixView').textContent=money(pix);$('#marginView').textContent=money(data.margin);
$('#incomeInput').value=data.income||'';$('#marginInput').value=data.margin||'';
$('#cardsList').innerHTML=data.cards.length?data.cards.map((x,i)=>`<div class="item"><div><b>${esc(x.name)}</b><small>Limite ${money(x.limit)} · Fecha dia ${x.close} · Vence dia ${x.due}</small></div><div><b>${money(x.used||0)}</b><div class="item-actions"><button class="mini" onclick="editCard(${i})">✎</button><button class="mini" onclick="del('cards',${i})">🗑</button></div></div></div>`).join(''):'<div class="muted">Nenhum cartão cadastrado.</div>';
$('#purchasesList').innerHTML=data.purchases.length?data.purchases.map((x,i)=>`<div class="item"><div><b>${esc(x.desc)}</b><small>${esc(x.card||'Sem cartão')} · ${x.date||''} · ${x.installments||1}x</small></div><div><b>${money(x.value)}</b><div class="item-actions"><button class="mini" onclick="editPurchase(${i})">✎</button><button class="mini" onclick="del('purchases',${i})">🗑</button></div></div></div>`).join(''):'<div class="muted">Nenhuma compra.</div>';
$('#fixedList').innerHTML=data.fixed.length?data.fixed.map((x,i)=>`<div class="item"><div><b>${esc(x.desc)}</b><small>Vencimento dia ${x.due}</small></div><div><b>${money(x.value)}</b><div class="item-actions"><button class="mini" onclick="editFixed(${i})">✎</button><button class="mini" onclick="del('fixed',${i})">🗑</button></div></div></div>`).join(''):'<div class="muted">Nenhuma despesa fixa.</div>';
$('#pixList').innerHTML=data.pix.length?data.pix.map((x,i)=>`<div class="item"><div><b>${esc(x.desc)}</b><small>${x.date||''}</small></div><div><b>${money(x.value)}</b><div class="item-actions"><button class="mini" onclick="editPix(${i})">✎</button><button class="mini" onclick="del('pix',${i})">🗑</button></div></div></div>`).join(''):'<div class="muted">Nenhum PIX lançado.</div>';
let ups=[...data.fixed.map(x=>({d:x.due||31,t:x.desc,v:x.value})),...data.cards.map(x=>({d:x.due||31,t:'Fatura '+x.name,v:x.used||0}))].sort((a,b)=>a.d-b.d).slice(0,5);
$('#upcoming').innerHTML=ups.length?ups.map(x=>`<div class="item"><div><b>${esc(x.t)}</b><small>Dia ${x.d}</small></div><b>${money(x.v)}</b></div>`).join(''):'<div class="muted">Nenhum compromisso cadastrado.</div>';
}
function modal(title,fields,onSave){
$('#modalTitle').textContent=title;$('#modalBody').innerHTML=fields.map(f=>`<label>${f.label}</label>${f.type==='select'?`<select id="m_${f.key}">${f.options.map(o=>`<option ${o===f.value?'selected':''}>${esc(o)}</option>`).join('')}</select>`:`<input id="m_${f.key}" type="${f.type||'text'}" value="${esc(f.value??'')}" placeholder="${esc(f.placeholder||'')}">`}`).join('');
$('#modal').classList.remove('hidden');$('#modalSave').onclick=()=>{let o={};fields.forEach(f=>o[f.key]=$('#m_'+f.key).value);onSave(o);$('#modal').classList.add('hidden');save();render()};
$('#modalCancel').onclick=()=>$('#modal').classList.add('hidden');
}
function editCard(i){let x=data.cards[i];modal('Cartão',[{key:'name',label:'Nome',value:x.name},{key:'limit',label:'Limite total',type:'number',value:x.limit},{key:'close',label:'Dia de fechamento',type:'number',value:x.close},{key:'due',label:'Dia de vencimento',type:'number',value:x.due},{key:'used',label:'Valor usado',type:'number',value:x.used}],o=>data.cards[i]={...o,limit:+o.limit,close:+o.close,due:+o.due,used:+o.used})}
function editPurchase(i){let x=data.purchases[i];modal('Compra',[{key:'desc',label:'Descrição',value:x.desc},{key:'card',label:'Cartão',value:x.card||'',type:'select',options:['',...data.cards.map(c=>c.name)]},{key:'date',label:'Data',value:x.date,type:'date'},{key:'value',label:'Valor total',type:'number',value:x.value},{key:'installments',label:'Parcelas',type:'number',value:x.installments||1}],o=>data.purchases[i]={...o,value:+o.value,installments:+o.installments})}
function editFixed(i){let x=data.fixed[i];modal('Despesa fixa',[{key:'desc',label:'Descrição',value:x.desc},{key:'value',label:'Valor mensal',type:'number',value:x.value},{key:'due',label:'Dia de vencimento',type:'number',value:x.due}],o=>data.fixed[i]={...o,value:+o.value,due:+o.due})}
function editPix(i){let x=data.pix[i];modal('PIX',[{key:'desc',label:'Descrição',value:x.desc},{key:'date',label:'Data',type:'date',value:x.date},{key:'value',label:'Valor',type:'number',value:x.value}],o=>data.pix[i]={...o,value:+o.value})}
$('#addCard').onclick=()=>modal('Novo cartão',[{key:'name',label:'Nome'},{key:'limit',label:'Limite total',type:'number'},{key:'close',label:'Dia de fechamento',type:'number'},{key:'due',label:'Dia de vencimento',type:'number'},{key:'used',label:'Valor usado',type:'number',value:0}],o=>data.cards.push({...o,limit:+o.limit,close:+o.close,due:+o.due,used:+o.used}));
$('#addPurchase').onclick=()=>modal('Nova compra',[{key:'desc',label:'Descrição'},{key:'card',label:'Cartão',type:'select',options:['',...data.cards.map(c=>c.name)]},{key:'date',label:'Data',type:'date'},{key:'value',label:'Valor total',type:'number'},{key:'installments',label:'Parcelas',type:'number',value:1}],o=>data.purchases.push({...o,value:+o.value,installments:+o.installments}));
$('#addFixed').onclick=()=>modal('Nova despesa fixa',[{key:'desc',label:'Descrição'},{key:'value',label:'Valor mensal',type:'number'},{key:'due',label:'Dia de vencimento',type:'number'}],o=>data.fixed.push({...o,value:+o.value,due:+o.due}));
$('#addPix').onclick=()=>modal('Novo PIX',[{key:'desc',label:'Descrição'},{key:'date',label:'Data',type:'date'},{key:'value',label:'Valor',type:'number'}],o=>data.pix.push({...o,value:+o.value}));
$('#saveIncome').onclick=()=>{data.income=Number($('#incomeInput').value||0);save();render()};
$('#saveMargin').onclick=()=>{data.margin=Number($('#marginInput').value||0);save();render()};
window.del=(arr,i)=>{if(confirm('Excluir este lançamento?')){data[arr].splice(i,1);save();render()}};
$('#themeBtn').onclick=()=>{dark=!dark;localStorage.setItem('gp_dark',dark?'1':'0');render()};
$('#fontBtn').onclick=()=>{fontSize=fontSize==='normal'?'small':fontSize==='small'?'smaller':'normal';localStorage.setItem('gp_font',fontSize);render()};
$('#changePinBtn').onclick=()=>{let old=prompt('PIN atual:');if(old!==pin)return alert('PIN atual incorreto.');let n=prompt('Novo PIN (4 a 8 números):');if(!validPin(n))return alert('PIN inválido.');localStorage.setItem(PIN,n);pin=n;alert('PIN alterado.')};
$('#exportBtn').onclick=()=>{let blob=new Blob([JSON.stringify({version:3,data,pin},null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='gestao-pessoal-backup.json';a.click();URL.revokeObjectURL(a.href)};
$('#importFile').onchange=e=>{let f=e.target.files[0];if(!f)return;let r=new FileReader();r.onload=()=>{try{let o=JSON.parse(r.result);if(!o.data)throw 0;data=o.data;if(o.pin){pin=o.pin;localStorage.setItem(PIN,pin)}save();render();alert('Backup restaurado com sucesso.')}catch(_){alert('Arquivo de backup inválido.')}};r.readAsText(f)};
start();