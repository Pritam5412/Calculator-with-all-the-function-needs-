// Dentaku - script.js
// All calculator logic: menu, form-based calculators, number base converter and scientific calculator.

// Shortcut: $('#id') finds one element on the page
const $=s=>document.querySelector(s);
// Formats a number for display (Indian digit grouping, up to d decimals); shows a dash if it is not a finite number
const fmt=(x,d=2)=>isFinite(x)?Number(x).toLocaleString('en-IN',{maximumFractionDigits:d}):'—';
// Today's date as YYYY-MM-DD, used as the default for the date calculators
const today=new Date().toISOString().slice(0,10);
// Unit converter data: every unit is listed with its size relative to a base unit
// (metre, kilogram, square metre, litre, m/s, byte). Temperature is converted by formula instead.
const U={
 Length:{mm:.001,cm:.01,m:1,km:1000,inch:.0254,foot:.3048,yard:.9144,mile:1609.344},
 Mass:{mg:1e-6,g:.001,kg:1,tonne:1000,quintal:100,ounce:.028349523,pound:.45359237},
 Area:{'sq m':1,'sq km':1e6,hectare:1e4,acre:4046.8564,'sq ft':.09290304,'sq yard':.83612736},
 Volume:{mL:.001,litre:1,cup:.2365882365,'gallon (US)':3.785411784},
 Speed:{'m/s':1,'km/h':1/3.6,mph:.44704,knot:.514444},
 Data:{byte:1,KB:1024,MB:1048576,GB:1073741824,TB:1099511627776},
 Temperature:{Celsius:1,Fahrenheit:1,Kelvin:1}
};
// Difference between two dates: returns [years, months, days, total days]
const ymd=(a,b)=>{let[x,y]=[new Date(a),new Date(b)];if(x>y)[x,y]=[y,x];
 let Y=y.getUTCFullYear()-x.getUTCFullYear(),M=y.getUTCMonth()-x.getUTCMonth(),D=y.getUTCDate()-x.getUTCDate();
 if(D<0){M--;D+=new Date(Date.UTC(y.getUTCFullYear(),y.getUTCMonth(),0)).getUTCDate()}
 if(M<0){Y--;M+=12}return[Y,M,D,Math.round((y-x)/864e5)]};
// List of all calculators. Each has an id, a menu group (g), a name, f() = its input fields and r() = the results to show.
// The scientific calculator and number base converter are drawn by their own functions (sci, base).
const calcs=[
{id:'sci',g:'Everyday',name:'Scientific calculator'},
// Percentage: three modes (X% of Y, X is what % of Y, % change)
{id:'pct',g:'Everyday',name:'Percentage',
 f:()=>[{id:'m',l:'Type',t:'select',o:{of:'X% of Y',is:'X is what % of Y',chg:'% change X → Y'},v:'of'},{id:'a',l:'X',v:20},{id:'b',l:'Y',v:500}],
 r:(n,v)=>v.m==='of'?[['Result',fmt(n('a')/100*n('b'),4),1]]:v.m==='is'?[['Percentage',fmt(n('a')/n('b')*100,4)+' %',1]]:[['Change',fmt((n('b')-n('a'))/n('a')*100,4)+' %',1],['Difference',fmt(n('b')-n('a'),4)]]},
// Discount: price you pay and amount you save
{id:'disc',g:'Everyday',name:'Discount',
 f:()=>[{id:'p',l:'Original price',v:2000},{id:'d',l:'Discount %',v:25}],
 r:n=>[['You pay',fmt(n('p')*(1-n('d')/100)),1],['You save',fmt(n('p')*n('d')/100)]]},
// Tip and bill split between several people
{id:'tip',g:'Everyday',name:'Tip & bill split',
 f:()=>[{id:'b',l:'Bill amount',v:1800},{id:'t',l:'Tip %',v:10},{id:'p',l:'People',v:4}],
 r:n=>{const tip=n('b')*n('t')/100,tot=n('b')+tip;return[['Each person pays',fmt(tot/n('p')),1],['Tip',fmt(tip)],['Total bill',fmt(tot)]]}},
// Unit converter: the From / To lists depend on the chosen category
{id:'unit',g:'Everyday',name:'Unit converter',
 // Keeps From / To valid for the category and builds the field list
 f:v=>{const c=v.c||'Length',k=Object.keys(U[c]);if(!(v.from in U[c])){v.from=k[0];v.to=k[1]||k[0]}
  const o=Object.fromEntries(k.map(x=>[x,x]));return[{id:'c',l:'Category',t:'select',o:Object.fromEntries(Object.keys(U).map(x=>[x,x])),v:'Length',re:1},{id:'x',l:'Value',v:1},{id:'from',l:'From',t:'select',o,v:k[0]},{id:'to',l:'To',t:'select',o,v:k[1]}]},
 // Converts: temperature uses formulas, other units multiply by their base-unit factor
 r:(n,v)=>{const c=v.c,x=n('x');let out;
  if(c==='Temperature'){let C=v.from==='Celsius'?x:v.from==='Fahrenheit'?(x-32)*5/9:x-273.15;out=v.to==='Celsius'?C:v.to==='Fahrenheit'?C*9/5+32:C+273.15}
  else out=x*U[c][v.from]/U[c][v.to];
  return[['Result',fmt(out,8)+' '+v.to,1]]}},
// Loan EMI: monthly instalment, total interest and total payment
{id:'emi',g:'Money',name:'Loan EMI',
 f:()=>[{id:'p',l:'Loan amount',v:500000},{id:'r',l:'Interest % per year',v:9},{id:'y',l:'Years',v:5}],
 r:n=>{const i=n('r')/1200,m=n('y')*12,e=i?n('p')*i*Math.pow(1+i,m)/(Math.pow(1+i,m)-1):n('p')/m;
  return[['Monthly EMI',fmt(e),1],['Total interest',fmt(e*m-n('p'))],['Total payment',fmt(e*m)]]}},
// Compound interest on a lump sum
{id:'ci',g:'Money',name:'Compound interest',
 f:()=>[{id:'p',l:'Principal',v:100000},{id:'r',l:'Rate % per year',v:7},{id:'y',l:'Years',v:10},{id:'n',l:'Compounded',t:'select',o:{1:'Yearly',2:'Half-yearly',4:'Quarterly',12:'Monthly'},v:4}],
 r:n=>{const A=n('p')*Math.pow(1+n('r')/100/n('n'),n('n')*n('y'));return[['Final amount',fmt(A),1],['Interest earned',fmt(A-n('p'))]]}},
// SIP: future value of a regular monthly investment
{id:'sip',g:'Money',name:'SIP / monthly saving',
 f:()=>[{id:'p',l:'Monthly amount',v:5000},{id:'r',l:'Expected return % per year',v:12},{id:'y',l:'Years',v:10}],
 r:n=>{const i=n('r')/1200,m=n('y')*12,F=i?n('p')*((Math.pow(1+i,m)-1)/i)*(1+i):n('p')*m;
  return[['Future value',fmt(F),1],['Total invested',fmt(n('p')*m)],['Estimated gain',fmt(F-n('p')*m)]]}},
// GST / tax: add tax to an amount or remove it from a tax-inclusive amount
{id:'gst',g:'Money',name:'GST / tax',
 f:()=>[{id:'a',l:'Amount',v:1000},{id:'r',l:'Tax rate %',t:'select',o:{5:'5%',12:'12%',18:'18%',28:'28%'},v:18},{id:'m',l:'Amount is',t:'select',o:{ex:'Without tax',inc:'Including tax'},v:'ex'}],
 r:(n,v)=>{const r=n('r')/100,net=v.m==='ex'?n('a'):n('a')/(1+r),tax=net*r;return[['Total with tax',fmt(net+tax),1],['Amount without tax',fmt(net)],['Tax',fmt(tax)]]}},
// BMI with category and healthy weight range
{id:'bmi',g:'Health & dates',name:'BMI',
 f:()=>[{id:'w',l:'Weight (kg)',v:65},{id:'h',l:'Height (cm)',v:170}],
 r:n=>{const b=n('w')/Math.pow(n('h')/100,2);return[['BMI',fmt(b,1),1],['Category',b<18.5?'Underweight':b<25?'Normal':b<30?'Overweight':'Obese'],['Healthy weight range',fmt(18.5*Math.pow(n('h')/100,2),1)+' – '+fmt(24.9*Math.pow(n('h')/100,2),1)+' kg']]}},
// Age: years, months, days, total days lived and days to the next birthday
{id:'age',g:'Health & dates',name:'Age',
 f:()=>[{id:'d',l:'Date of birth',t:'date',v:'2004-01-01'},{id:'o',l:'Age on',t:'date',v:today}],
 r:(n,v)=>{if(!v.d||!v.o)return[];const[Y,M,D,T]=ymd(v.d,v.o),b=new Date(v.d),o=new Date(v.o);
  let nb=Date.UTC(o.getUTCFullYear(),b.getUTCMonth(),b.getUTCDate());if(nb<o)nb=Date.UTC(o.getUTCFullYear()+1,b.getUTCMonth(),b.getUTCDate());
  return[['Age',Y+' y '+M+' m '+D+' d',1],['Total days lived',fmt(T,0)],['Next birthday in',fmt(Math.round((nb-o)/864e5),0)+' days']]}},
// Date difference between two dates
{id:'dd',g:'Health & dates',name:'Date difference',
 f:()=>[{id:'a',l:'From',t:'date',v:today},{id:'b',l:'To',t:'date',v:today}],
 r:(n,v)=>{if(!v.a||!v.b)return[];const[Y,M,D,T]=ymd(v.a,v.b);return[['Difference',Y+' y '+M+' m '+D+' d',1],['Total days',fmt(T,0)],['Weeks',fmt(T/7,1)]]}},
// Number base converter (drawn by base() below, so it needs no fields here)
{id:'base',g:'Programmer',name:'Number base'}
];
// App state: vals = values typed into each calculator, cur = open calculator, ans = last scientific result
const vals={};let cur='sci',ans=0;
// The menu and the main panel elements
const nav=$('#nav'),main=$('#main');
// Draws the left menu: a heading per group and a button per calculator
function drawNav(){let h='',g='';calcs.forEach(c=>{if(c.g!==g){g=c.g;h+=`<h2>${g}</h2>`}h+=`<button type="button" data-id="${c.id}" aria-current="${c.id===cur}">${c.name}</button>`});nav.innerHTML=h}
// Clicking a menu button opens that calculator
nav.onclick=e=>{const b=e.target.closest('button');if(b){cur=b.dataset.id;drawNav();draw()}};
// Draws the selected calculator: input fields first, then its results
function draw(){const c=calcs.find(x=>x.id===cur);if(c.id==='sci')return sci();if(c.id==='base')return base();
 // Keep typed values for each calculator between visits
 const v=vals[c.id]=vals[c.id]||{};const fs=c.f(v);
 // Fill in default values the first time a calculator opens
 fs.forEach(f=>{if(v[f.id]===undefined)v[f.id]=f.v});
 // Build the form: select lists or number / date / text inputs
 main.innerHTML=`<h2>${c.name}</h2><div class="fields">`+fs.map(f=>`<label>${f.l}`+(f.t==='select'
  ?`<select data-k="${f.id}" ${f.re?'data-re=1':''}>`+Object.entries(f.o).map(([k,t])=>`<option value="${k}" ${String(v[f.id])===k?'selected':''}>${t}</option>`).join('')+'</select>'
  :`<input data-k="${f.id}" type="${f.t||'number'}" ${f.t?'':'step="any" inputmode="decimal"'} value="${v[f.id]}">`)+'</label>').join('')+'</div><div class="out" id="out"></div>';
 res()}
// Calculates and shows results (only the results box updates, so typing is never interrupted)
function res(){const c=calcs.find(x=>x.id===cur),v=vals[cur];const n=k=>parseFloat(v[k]);
 let rows;try{rows=c.r(n,v)}catch(e){rows=[]}
 $('#out').innerHTML=rows.map(([l,x,big])=>`<div class="row${big?' big':''}"><span>${l}</span><b>${x}</b></div>`).join('')}
// When a field changes: store its value, then redraw (if it controls other fields) or just recalculate
main.addEventListener('input',e=>{const k=e.target.dataset.k;if(!k)return;vals[cur][k]=e.target.value;e.target.dataset.re?draw():res()});
// bv = current number-base value as a BigInt (exact even for very large numbers)
let bv=255n;
// Number base converter: edit any box and the other three update
function base(){
 // The four bases
 const B=[['Binary',2],['Octal',8],['Decimal',10],['Hexadecimal',16]];
 // Build the page: heading, hint and one input per base
 main.innerHTML=`<h2>Number base</h2><p class="hint">Type in any box. The other three update as you type.</p><div class="fields">`+B.map(([n,b])=>`<label>${n}<input class="bx" data-b="${b}" autocomplete="off" spellcheck="false" aria-label="${n}"></label>`).join('')+'</div><div class="out" id="out"></div>';
 // The four input boxes
 const ins=[...main.querySelectorAll('.bx')];
 // Parses text as a number in the given base: null = empty, NaN = invalid digit
 const parse=(s,b)=>{s=s.toLowerCase().replace(/[\s_]/g,'');if(!s)return null;const neg=s[0]==='-';if(neg)s=s.slice(1);const dg='0123456789abcdef'.slice(0,b);if(!s||[...s].some(c=>!dg.includes(c)))return NaN;let v=0n;for(const c of s)v=v*BigInt(b)+BigInt(dg.indexOf(c));return neg?-v:v};
 // Fills the other boxes from bv and shows extra information
 const show=src=>{ins.forEach(i=>{if(i!==src)i.value=bv===null?'':bv.toString(+i.dataset.b).toUpperCase()});
  const o=$('#out');if(bv===null){o.innerHTML='';return}
  // Binary grouped in 4s and the number of bits needed
  const a=bv<0n?-bv:bv,bin=a.toString(2),pad=bin.padStart(Math.ceil(bin.length/4)*4,'0').replace(/(.{4})(?=.)/g,'$1 ');
  o.innerHTML=`<div class="row"><span>Binary in groups of 4</span><b>${bv<0n?'-':''}${pad}</b></div><div class="row"><span>Bits needed</span><b>${bin.length}</b></div>`};
 // On typing: parse, mark invalid digits, update the other boxes
 ins.forEach(i=>i.oninput=()=>{const v=parse(i.value,+i.dataset.b);i.setAttribute('aria-invalid',v!==v);if(v!==v)return;bv=v;show(i)});
 // Start with the stored value
 show(null)}
// ===== Scientific calculator =====
// Memory variables (A-F, X, Y, M)
const V={A:0,B:0,C:0,D:0,E:0,F:0,X:0,Y:0,M:0};
// State: angle unit, SHIFT / hyp / STO flags, fraction view, last result
let ang='deg',shift=0,hyp=0,sto=0,fr=0,lastN=null;
// Angle helpers: to radians for sin/cos/tan, and back for asin/acos/atan (deg, rad or gra)
const tr=x=>ang=='deg'?x*Math.PI/180:ang=='gra'?x*Math.PI/200:x,ia=x=>ang=='deg'?x*180/Math.PI:ang=='gra'?x*200/Math.PI:x;
// Factorial for whole numbers (NaN otherwise)
const fact=n=>{if(n<0||n%1)return NaN;let r=1;for(let i=2;i<=n;i++)r*=i;return r};
// Functions the user can type: trig, hyperbolic, logs, roots, nPr, nCr, constants and more
const FN={sin:x=>Math.sin(tr(x)),cos:x=>Math.cos(tr(x)),tan:x=>Math.tan(tr(x)),asin:x=>ia(Math.asin(x)),acos:x=>ia(Math.acos(x)),atan:x=>ia(Math.atan(x)),
 sinh:Math.sinh,cosh:Math.cosh,tanh:Math.tanh,asinh:Math.asinh,acosh:Math.acosh,atanh:Math.atanh,ln:Math.log,log:Math.log10,sqrt:Math.sqrt,cbrt:Math.cbrt,abs:Math.abs,
 fact,npr:(n,r)=>fact(n)/fact(n-r),ncr:(n,r)=>fact(n)/fact(r)/fact(n-r),root:(n,x)=>x<0&&n%2?-Math.pow(-x,1/n):Math.pow(x,1/n),
 rnd:x=>parseFloat(x.toPrecision(10)),rand:()=>Math.floor(Math.random()*1000)/1000,dms:(d,m=0,s=0)=>d+m/60+s/3600,pi:Math.PI,e:Math.E};
// Keypad definition. Each string is: label | SHIFT label | text inserted | SHIFT text inserted | style class.
// Text starting with # is a special action handled in press().
const K=['SHIFT||#sh||op','hyp||#hy||op','STO||#st||op','DEG||#drg||op','a b/c||#fr||op',
'x²|x³|^2|^3|fn','x⁻¹|x!|^(-1)|!|fn','xʸ|ˣ√|^|root(|fn','√|∛|sqrt(|cbrt(|fn','log|10ˣ|log(|10^(|fn',
'ln|eˣ|ln(|e^(|fn','sin|sin⁻¹|sin(|asin(|fn','cos|cos⁻¹|cos(|acos(|fn','tan|tan⁻¹|tan(|atan(|fn','nPr|nCr|npr(|ncr(|fn',
'(|Abs|(|abs(|fn',')||)||fn',',||,||fn','π|e|π|e|fn','EXP||E||fn',
'd/dx||dx(||fn','∫dx||int(||fn','Σ||sum(||fn','SOLVE||solve(||fn','°′″||dms(||fn',
'7||7||','8||8||','9||9||','DEL||#del||op','AC||#ac||op',
'4||4||','5||5||','6||6||','×||×||op','÷||÷||op',
'1||1||','2||2||','3||3||','+||+||op','−||−||op',
'0|Rnd|0|rnd(|','.|Ran#|.|rand()|','Ans||ans||fn','M+|M−|#mp|#mm|op','=||#eq||eq'];
// Calculus functions: dx (derivative), int (integral), sum (summation), solve (equation).
// Each is calculated first and replaced in the text by its numeric result.
function spec(s){
 // Handle each function name, innermost call first
 for(const nm of ['dx','int','sum','solve']){let i;
  while((i=s.lastIndexOf(nm+'('))>=0){
   // Find the matching closing bracket and split the arguments at commas
   let d=1,j=i+nm.length+1,b=j;const p=[];
   for(;j<s.length;j++){const c=s[j];if(c=='(')d++;else if(c==')'){if(!--d)break}else if(c==','&&d==1){p.push(s.slice(b,j));b=j+1}}
   if(d)throw Error('Check brackets');p.push(s.slice(b,j));
   // f(x) evaluates the first argument for a given X
   const f=x=>ev(p[0],x),n=k=>ev(p[k]);let r;
   // Derivative: 5-point central difference at the given point
   if(nm=='dx'){const x=n(1),h=1e-3;r=(-f(x+2*h)+8*f(x+h)-8*f(x-h)+f(x-2*h))/(12*h)}
   // Integral: Simpson's rule with 1000 steps between the limits
   else if(nm=='int'){const a=n(1),z=n(2),N=1000,h=(z-a)/N;r=f(a)+f(z);for(let k=1;k<N;k++)r+=(k%2?4:2)*f(a+k*h);r*=h/3}
   // Sum: adds f(k) for each whole number from a to b
   else if(nm=='sum'){r=0;for(let k=n(1);k<=n(2);k++)r+=f(k)}
   // Solve: Newton's method (2nd argument is the starting guess; a=b is treated as a-b=0)
   else{let x=p[1]?n(1):1;const q=p[0].split('='),g=y=>ev(q.length==2?'('+q[0]+')-('+q[1]+')':p[0],y);
    for(let k=0;k<60;k++){const v=g(x),dv=(g(x+1e-6)-v)/1e-6;if(!dv)break;const nx=x-v/dv;if(Math.abs(nx-x)<1e-12){x=nx;break}x=nx}r=x}
   // Replace the call with its numeric result
   if(!isFinite(r))throw Error('Math error');
   s=s.slice(0,i)+'('+r.toLocaleString('en-US',{useGrouping:false,maximumFractionDigits:20})+')'+s.slice(j+1)}}
 return s}
// Rewrites what the user typed into valid JavaScript: symbols, E notation, factorials, powers
// and implied multiplication (2sin(30) means 2*sin(30))
const prep=s=>s.replace(/×/g,'*').replace(/÷/g,'/').replace(/−/g,'-').replace(/π/g,'pi')
 .replace(/(\d+(?:\.\d+)?)E([+-]?\d+)/g,'$1*10**($2)')
 .replace(/\(([^()]*)\)!/g,'fact($1)').replace(/(\d+(?:\.\d+)?|[A-FXYM])!/g,'fact($1)')
 .replace(/\^/g,'**').replace(/-(\d+(?:\.\d+)?|[A-FXYM])\*\*(\d+(?:\.\d+)?|[A-FXYM]|\([^()]*\))/g,'-($1**$2)')
 .replace(/(\d|\))\s*(?=[a-zA-Z(])/g,'$1*');
// Evaluates an expression: checks every word is a known function / variable, then computes it
function ev(s,x){s=prep(spec(s));
 // Everything the expression may use (null prototype so nothing unexpected is reachable)
 const S=Object.assign(Object.create(null),FN,V,{ans});if(x!==undefined)S.X=x;
 // Reject unknown words
 const bad=(s.match(/[A-Za-z]+/g)||[]).find(i=>!(i in S));if(bad)throw Error('Unknown word: '+bad);
 return Function('F','with(F){return ('+s+')}')(S)}
// Public calculation function: returns {n: number} or {err: message}
function calc(s){if(!s.trim())return{n:null};
 try{const r=ev(s);if(typeof r!='number'||!isFinite(r))return{err:'Math error'};return{n:parseFloat(r.toPrecision(12))}}
 catch(e){return{err:/^(Math|Unknown|Check)/.test(e.message)?e.message:'Check your expression'}}}
// Turns a decimal into a fraction (continued fractions), e.g. 1 1/2; returns '' if there is no simple fraction
function frac(x){if(!isFinite(x))return'';const s=x<0?'-':'',a=Math.abs(x);let h1=1,h0=0,k1=0,k0=1,b=a;
 for(let i=0;i<20;i++){const f=Math.floor(b);[h1,h0]=[f*h1+h0,h1];[k1,k0]=[f*k1+k0,k1];if(Math.abs(a-h1/k1)<1e-9||k1>1e4)break;b=1/(b-f)}
 if(k1>1e4||Math.abs(a-h1/k1)>1e-9)return'';const w=Math.floor(h1/k1),n=h1-w*k1;
 return k1==1?s+h1:s+(w?w+' ':'')+n+'/'+k1}
// Formats a result in the chosen display format (Norm, Fix, Sci, Eng, DMS) or as a fraction
function fmtN(x){const m=$('#fm')?.value||'norm';if(fr){const f=frac(x);if(f)return f}
 if(m=='fix')return x.toFixed(2);
 if(m=='sci')return x.toExponential(5).replace('e',' ×10^').replace('+','');
 if(m=='eng'){if(!x)return'0';const e=Math.floor(Math.log10(Math.abs(x))/3)*3;return parseFloat((x/10**e).toPrecision(6))+(e?' ×10^'+e:'')}
 if(m=='dms'){const a=Math.abs(x),d=Math.floor(a),mm=Math.floor((a-d)*60),ss=((a-d)*60-mm)*60;return(x<0?'-':'')+d+'°'+mm+'′'+parseFloat(ss.toFixed(2))+'″'}
 return String(x)}
// Shows the last result in the display
const showRes=()=>{$('#res').textContent=lastN===null?'':fmtN(lastN)};
// The = key: evaluates the expression box. q = quiet (updates Ans without showing it)
function go(q){const r=calc($('#ex').value);
 if(r.err){if(!q)$('#res').innerHTML='<span class="err">'+r.err+'</span>';return}
 if(r.n===null)return;ans=lastN=r.n;if(!q)showRes()}
// Inserts text at the cursor position in the expression box
const ins=t=>{const e=$('#ex');e.setRangeText(t,e.selectionStart,e.selectionEnd,'end')};
// Handles every keypad press: SHIFT / hyp / STO / DEG toggles, AC, DEL, =, M+ / M-, or inserting text
function press(i){const[,,n,sn]=K[i].split('|'),e=$('#ex');let t=shift&&sn?sn:n;
 if(t=='#sh')shift=!shift;else if(t=='#hy')hyp=!hyp;else if(t=='#st')sto=!sto;
 else if(t=='#drg')ang=ang=='deg'?'rad':ang=='rad'?'gra':'deg';
 else if(t=='#fr'){fr=!fr;go(1);showRes()}
 // Any other key switches SHIFT off afterwards
 else{shift=0;
  // AC clears, DEL deletes before the cursor, = calculates, M+ / M- change memory M
  if(t=='#ac'){e.value='';lastN=null;showRes()}
  else if(t=='#del'){const p=e.selectionStart;e.selectionStart==e.selectionEnd&&p>0?e.setRangeText('',p-1,p,'end'):e.setRangeText('',e.selectionStart,e.selectionEnd,'end')}
  else if(t=='#eq')go();
  else if(t=='#mp'||t=='#mm'){go(1);V.M+=(t=='#mp'?1:-1)*ans;$('#res').textContent='M = '+fmtN(V.M)}
  // hyp turns sin / cos / tan into sinh / cosh / tanh
  else{if(hyp&&/^a?(sin|cos|tan)\(/.test(t)){t=t.replace('(','h(');hyp=0}ins(t)}}
 drawPad();e.focus()}
// Draws the keypad for the current SHIFT / hyp / angle state, and the status line
function drawPad(){$('#pad').innerHTML=K.map((k,i)=>{const[l,s,,,c]=k.split('|'),on=[shift,hyp,sto][i];
  return `<button type="button" data-i="${i}" class="${c}${shift&&s?' sh':''}"${on?' aria-pressed="true"':''}>${i==3?ang.toUpperCase():shift&&s?s:l}${!shift&&s?`<i>${s}</i>`:''}</button>`}).join('');
 $('#st').textContent=[shift&&'SHIFT',hyp&&'HYP',sto&&'STO: pick A-F, X, Y or M',ang.toUpperCase()].filter(Boolean).join('  ')}
// Builds the scientific calculator page: display, format menu, variable buttons, keypad and hint
function sci(){
 main.innerHTML=`<h2>Scientific calculator</h2><div class="disp"><input id="ex" aria-label="Expression" autocomplete="off" spellcheck="false" inputmode="none" placeholder="0"><div id="res"></div><div id="st"></div></div>
 <label class="fmw">Result format<select id="fm"><option value="norm">Norm</option><option value="fix">Fix 2</option><option value="sci">Sci 5</option><option value="eng">Eng</option><option value="dms">° ′ ″</option></select></label>
 <div class="vars">${Object.keys(V).map(k=>`<button type="button" data-v="${k}" title="${k} = ${V[k]}">${k}</button>`).join('')}</div><div class="pad" id="pad"></div>
 <p class="hint">Red labels are SHIFT functions. Press hyp before sin, cos or tan for hyperbolic. STO then A–F, X, Y or M saves the result. Calculus uses X as the variable: dx(X^2,3), int(X^2,0,1), sum(X,1,10), solve(X^2-4,1). Roots: root(3,27).</p>`;
 // Keypad clicks
 $('#pad').onclick=e=>{const b=e.target.closest('button');if(b)press(+b.dataset.i)};
 // Variable buttons: store the result (after STO) or insert the variable
 main.querySelector('.vars').onclick=e=>{const b=e.target.closest('button');if(!b)return;const k=b.dataset.v;
  if(sto){go(1);V[k]=ans;sto=0;b.title=k+' = '+ans;$('#res').textContent=k+' = '+fmtN(ans)}else ins(k);drawPad()};
 // Enter key calculates; changing the format redraws the result; then draw the keypad
 $('#ex').onkeydown=e=>{if(e.key=='Enter')go()};$('#fm').onchange=showRes;drawPad()}

// Theme button: switches light / dark by setting data-theme on the page
$('#theme').onclick=()=>{const d=document.documentElement,dark=d.dataset.theme?d.dataset.theme==='dark':matchMedia('(prefers-color-scheme:dark)').matches;d.dataset.theme=dark?'light':'dark'};
// Start the app: draw the menu and open the first calculator
drawNav();draw();
