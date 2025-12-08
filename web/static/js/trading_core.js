
const ctx = document.getElementById('mainChart').getContext('2d');
let chart = new Chart(ctx, {
  type:'line',
  data:{labels:[],datasets:[
    {label:'Equity',data:[],borderColor:'#00ffaa',fill:false},
    {label:'Confidence',data:[],borderColor:'#0088ff',fill:false}
  ]},
  options:{responsive:true,maintainAspectRatio:false}
});

// Signals toggle
document.getElementById('close-signals').onclick=()=>document.getElementById('signals').classList.add('collapsed');
document.getElementById('clear-signals').onclick=()=>document.getElementById('signals-list').innerHTML='';

// AI Chat simulation
document.getElementById('send').onclick=()=>{
  const log=document.getElementById('chat-log');
  const inp=document.getElementById('chat-input');
  if(!inp.value.trim())return;
  log.innerHTML+=`<div><b>You:</b> ${inp.value}</div>`;
  setTimeout(()=>log.innerHTML+=`<div><b>Anton:</b> ok, running "${inp.value}"</div>`,500);
  inp.value='';
  log.scrollTop=log.scrollHeight;
};
