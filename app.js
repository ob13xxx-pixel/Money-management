const KEY="triwealth_v1";
const defaults={
  income:0, spending:0, saving:0, investing:0,
  budget:600, pin:"", goals:[], expenses:[],
  chat:[{role:"bot",text:"Hi. I’m TriAI, your basic money assistant. Ask me about your budget, goals, or spending."}]
};
let state=load();
let currentTab="home";

function load(){try{return {...defaults,...JSON.parse(localStorage.getItem(KEY)||"{}")}}catch{return {...defaults}}}
function save(){localStorage.setItem(KEY,JSON.stringify(state))}
function money(n){return "$"+Number(n||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function pct(a,b){return b?Math.min(100,Math.max(0,a/b*100)):0}
function remaining(g){return Math.max(0,Number(g.target)-Number(g.current||0))}
function monthsFor(g){let r=remaining(g),c=Number(g.contribution||0);if(!c)return Infinity;return Math.ceil(r/(g.frequency==="weekly"?c*4.345:c))}
function render(){
  document.querySelectorAll(".nav-btn").forEach(b=>b.classList.toggle("active",b.dataset.tab===currentTab));
  const el=document.getElementById("screen");
  ({home:renderHome,budget:renderBudget,goals:renderGoals,ai:renderAI,security:renderSecurity}[currentTab])();
}
function renderHome(){
 const total=Number(state.spending)+Number(state.saving)+Number(state.investing);
 const score=Math.round(Math.min(100,50+(state.saving/(state.income||1))*30+(state.investing/(state.income||1))*20));
 document.getElementById("screen").innerHTML=`
 <h1>Dashboard</h1><p class="muted">Your money, organized into three wealths.</p>
 <div class="hero"><div class="tiny">TOTAL ALLOCATED</div><div class="amount">${money(total)}</div>
 <div class="row"><span>Money Score</span><b class="orange">${score}/100</b></div><div class="progress"><i style="width:${score}%"></i></div>
 <div class="btnrow"><button class="primary" onclick="openIncome()">+ Add income</button><button class="secondary" onclick="openExpense()">+ Add expense</button></div></div>
 <div class="grid3">
 <div class="card wealth"><h3>💳 SPEND</h3><div class="value">${money(state.spending)}</div><div class="tiny">Budget ${money(state.budget)}</div><div class="progress"><i style="width:${pct(state.spending,state.budget)}%"></i></div></div>
 <div class="card wealth"><h3>🏦 SAVE</h3><div class="value green">${money(state.saving)}</div><div class="tiny">Reserved for goals</div></div>
 <div class="card wealth"><h3>📈 INVEST</h3><div class="value blue">${money(state.investing)}</div><div class="tiny">Tracked manually</div></div>
 </div>
 <div class="card"><div class="row"><h2>Recent activity</h2><button class="secondary" onclick="currentTab='budget';render()">View</button></div>
 ${state.expenses.length?state.expenses.slice(-4).reverse().map(e=>`<div class="check"><span>${esc(e.name)}</span><b class="red">-${money(e.amount)}</b></div>`).join(""):"<p class='muted'>No expenses yet.</p>"}</div>
 <div class="card"><h2>🎯 Goal progress</h2>${state.goals.length?state.goals.slice(0,3).map(g=>goalMini(g)).join(""):"<p class='muted'>Create your first financial goal.</p>"}</div>`;
}
function goalMini(g){return `<div style="margin-bottom:14px"><div class="row"><b>${esc(g.name)}</b><span>${money(g.current)} / ${money(g.target)}</span></div><div class="progress"><i style="width:${pct(g.current,g.target)}%"></i></div><div class="tiny">${monthsFor(g)===Infinity?"Set a contribution to estimate time":monthsFor(g)+" month(s) estimated"}</div></div>`}
function renderBudget(){
 const left=Number(state.budget)-Number(state.spending);
 document.getElementById("screen").innerHTML=`
 <h1>Budget</h1><p class="muted">Track income and spending without connecting a bank.</p>
 <div class="statgrid"><div class="stat"><span class="muted">Income</span><b class="green">${money(state.income)}</b></div><div class="stat"><span class="muted">Spent</span><b class="red">${money(state.spending)}</b></div><div class="stat"><span class="muted">Budget</span><b>${money(state.budget)}</b></div><div class="stat"><span class="muted">Remaining</span><b class="${left<0?'red':'green'}">${money(left)}</b></div></div>
 <div class="card"><h2>Set monthly spending budget</h2><input id="budgetInput" type="number" value="${state.budget}" min="0"><button class="primary" style="margin-top:10px" onclick="setBudget()">Save budget</button></div>
 <div class="card"><div class="row"><h2>Expenses</h2><button class="primary" onclick="openExpense()">+ Add</button></div>
 ${state.expenses.length?state.expenses.slice().reverse().map((e,i)=>`<div class="check"><span>${esc(e.name)}<small class="tiny"> · ${esc(e.category||"Other")}</small></span><b class="red">-${money(e.amount)}</b></div>`).join(""):"<p class='muted'>No expenses.</p>"}</div>
 <div class="card"><h2>Three-wealth allocation</h2><p class="muted">For each income entry, you can choose how much goes to spending, saving, and investing.</p></div>`;
}
function renderGoals(){
 document.getElementById("screen").innerHTML=`
 <h1>Goals</h1><p class="muted">Turn a target into a measurable plan.</p>
 <button class="primary" onclick="openGoal()">+ New goal</button>
 <div style="margin-top:14px">${state.goals.length?state.goals.map((g,i)=>`<div class="card">
 <div class="row"><div><h2>${esc(g.name)}</h2><span class="tiny">${esc(g.frequency)} contribution</span></div><b class="orange">${Math.round(pct(g.current,g.target))}%</b></div>
 <div class="progress"><i style="width:${pct(g.current,g.target)}%"></i></div>
 <div class="row"><span>${money(g.current)} saved</span><span>${money(remaining(g))} remaining</span></div>
 <div class="row" style="margin-top:10px"><span class="muted">${g.contribution?money(g.contribution)+" / "+g.frequency:"No contribution"}</span><b>${monthsFor(g)===Infinity?"—":monthsFor(g)+" mo."}</b></div>
 <div class="btnrow"><button class="secondary" onclick="addToGoal(${i})">Add money</button><button class="danger" onclick="deleteGoal(${i})">Delete</button></div>
 </div>`).join(""):"<div class='card'><p class='muted'>No goals yet. Add one and TRIWEALTH will calculate the estimated time.</p></div>"}</div>`;
}
function renderAI(){
 document.getElementById("screen").innerHTML=`
 <h1>TriAI</h1><p class="muted">A modest local assistant. It does not access bank accounts or secrets.</p>
 <div class="card chat">${state.chat.map(m=>`<div class="bubble ${m.role}">${esc(m.text)}</div>`).join("")}</div>
 <div class="chat-input"><input id="aiInput" placeholder="Ask about your money..." onkeydown="if(event.key==='Enter')askAI()"><button onclick="askAI()">➤</button></div>
 <div class="btnrow"><button class="secondary" onclick="quickAI('How am I doing?')">How am I doing?</button><button class="secondary" onclick="quickAI('Analyze my goals')">Analyze goals</button></div>`;
}
function aiAnswer(q){
 const x=q.toLowerCase(), left=Number(state.budget)-Number(state.spending);
 if(x.includes("goal")) return state.goals.length?state.goals.map(g=>`${g.name}: ${Math.round(pct(g.current,g.target))}% complete. ${monthsFor(g)===Infinity?"Add a contribution to estimate completion.":"Estimated time: "+monthsFor(g)+" month(s)."}`).join(" "):"You have no goals yet. Create one with a target, current amount, and weekly or monthly contribution.";
 if(x.includes("how")||x.includes("doing")||x.includes("budget")) return `Income: ${money(state.income)}. Spending: ${money(state.spending)}. Saving: ${money(state.saving)}. Investing: ${money(state.investing)}. Budget remaining: ${money(left)}. ${left<0?"You are over budget. Review recent expenses.":"Your spending is within the current budget."}`;
 if(x.includes("invest")) return `Your tracked investment amount is ${money(state.investing)}. TRIWEALTH can simulate growth, but it does not guarantee returns or tell you what to buy.`;
 return "I can help analyze your budget, goals, saving, and tracked investments. Try: “How am I doing?” or “Analyze my goals.”";
}
function askAI(){const i=document.getElementById("aiInput"),q=i.value.trim();if(!q)return;state.chat.push({role:"user",text:q},{role:"bot",text:aiAnswer(q)});save();renderAI()}
function quickAI(q){document.getElementById("aiInput").value=q;askAI()}
function renderSecurity(){
 document.getElementById("screen").innerHTML=`
 <h1>Security</h1><p class="muted">Privacy-first V1 controls.</p>
 <div class="card"><div class="check"><span>Local storage</span><b class="security-good">ON</b></div><div class="check"><span>Bank connection</span><b>OFF</b></div><div class="check"><span>AI database access</span><b>OFF</b></div><div class="check"><span>App lock PIN</span><b>${state.pin?'SET':'NOT SET'}</b></div></div>
 <div class="card"><h2>App lock</h2><p class="muted">This V1 lock is a local prototype feature. It is not a replacement for device security.</p><button class="primary" onclick="setPIN()">Set / change PIN</button></div>
 <div class="card"><h2>Data</h2><button class="secondary" onclick="exportData()">Export backup</button><button class="danger" style="margin-left:7px" onclick="wipeData()">Delete all local data</button></div>`;
}
function openIncome(){showModal(`<h2>Add income</h2><label>Amount<input id="incAmount" type="number" min="0" placeholder="1000"></label><h3 style="margin-top:16px">Allocate it</h3><label>Spend<input id="incSpend" type="number" min="0" value="600"></label><label>Save<input id="incSave" type="number" min="0" value="250"></label><label>Invest<input id="incInvest" type="number" min="0" value="150"></label><button class="primary" style="margin-top:14px" onclick="addIncome()">Add income</button>`)}
function addIncome(){let a=+document.getElementById("incAmount").value,s=+document.getElementById("incSpend").value,sv=+document.getElementById("incSave").value,iv=+document.getElementById("incInvest").value;if(a<=0||Math.abs(s+sv+iv-a)>0.001)return alert("The three allocations must equal the income.");state.income+=a;state.spending+=s;state.saving+=sv;state.investing+=iv;save();closeModal();render()}
function openExpense(){showModal(`<h2>Add expense</h2><label>Name<input id="expName" placeholder="Food"></label><label>Amount<input id="expAmount" type="number" min="0"></label><label>Category<select id="expCat"><option>Food</option><option>Transport</option><option>Shopping</option><option>Entertainment</option><option>Subscriptions</option><option>Other</option></select></label><button class="primary" style="margin-top:14px" onclick="addExpense()">Add expense</button>`)}
function addExpense(){let n=document.getElementById("expName").value.trim(),a=+document.getElementById("expAmount").value;if(!n||a<=0)return alert("Enter a name and amount.");state.spending+=a;state.expenses.push({name:n,amount:a,category:document.getElementById("expCat").value,date:new Date().toISOString()});save();closeModal();render()}
function setBudget(){let a=+document.getElementById("budgetInput").value;if(a<0)return;state.budget=a;save();render()}
function openGoal(){showModal(`<h2>Create goal</h2><label>Goal name<input id="gName" placeholder="New Laptop"></label><label>Target amount<input id="gTarget" type="number" min="0" placeholder="1200"></label><label>Current amount<input id="gCurrent" type="number" min="0" value="0"></label><label>Contribution<input id="gCon" type="number" min="0" placeholder="100"></label><label>Frequency<select id="gFreq"><option value="monthly">Monthly</option><option value="weekly">Weekly</option></select></label><button class="primary" style="margin-top:14px" onclick="createGoal()">Create goal</button>`)}
function createGoal(){let name=document.getElementById("gName").value.trim(),target=+document.getElementById("gTarget").value,current=+document.getElementById("gCurrent").value,contribution=+document.getElementById("gCon").value;if(!name||target<=0||current<0||contribution<0)return alert("Complete the goal fields.");state.goals.push({name,target,current,contribution,frequency:document.getElementById("gFreq").value});save();closeModal();render()}
function addToGoal(i){showModal(`<h2>Add to ${esc(state.goals[i].name)}</h2><label>Amount<input id="goalAdd" type="number" min="0"></label><button class="primary" style="margin-top:14px" onclick="confirmGoalAdd(${i})">Add</button>`)}
function confirmGoalAdd(i){let a=+document.getElementById("goalAdd").value;if(a<=0)return;state.goals[i].current+=a;state.saving+=a;save();closeModal();render()}
function deleteGoal(i){if(confirm("Delete this goal?")){state.goals.splice(i,1);save();render()}}
function setPIN(){showModal(`<h2>Set app PIN</h2><label>4–6 digit PIN<input id="pin1" type="password" inputmode="numeric" maxlength="6"></label><label>Confirm PIN<input id="pin2" type="password" inputmode="numeric" maxlength="6"></label><button class="primary" style="margin-top:14px" onclick="savePIN()">Save PIN</button>`)}
function savePIN(){let a=document.getElementById("pin1").value,b=document.getElementById("pin2").value;if(!/^\d{4,6}$/.test(a)||a!==b)return alert("PIN must be 4–6 digits and match.");state.pin=a;save();closeModal();render()}
function lock(){if(!state.pin)return alert("Set a PIN first.");document.getElementById("lockScreen").classList.remove("hidden")}
function unlock(){if(document.getElementById("pinInput").value===state.pin){document.getElementById("pinInput").value="";document.getElementById("lockScreen").classList.add("hidden")}else alert("Incorrect PIN.")}
function exportData(){const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="triwealth-backup.json";a.click();URL.revokeObjectURL(a.href)}
function wipeData(){if(confirm("This permanently deletes local V1 data from this browser.")){localStorage.removeItem(KEY);state=load();render()}}
function showModal(html){document.getElementById("modalContent").innerHTML=html;document.getElementById("modal").classList.remove("hidden")}
function closeModal(){document.getElementById("modal").classList.add("hidden")}
document.querySelectorAll(".nav-btn").forEach(b=>b.onclick=()=>{currentTab=b.dataset.tab;render()});
document.getElementById("closeModal").onclick=closeModal;
document.getElementById("modal").onclick=e=>{if(e.target.id==="modal")closeModal()};
document.getElementById("lockBtn").onclick=lock;
document.getElementById("unlockBtn").onclick=unlock;
render();
