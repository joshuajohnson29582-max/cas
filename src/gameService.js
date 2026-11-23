// Async API boundary. UI and 3D scenes never generate outcomes.
let balance = 2500;
const listeners = new Set();
const wait = (ms=200)=>new Promise(r=>setTimeout(r,ms));

export const gameService={
  getBalance:()=>balance,
  subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn)},
  notify(){listeners.forEach(fn=>fn(balance))},
  async addDemoCoins(amount=5000){await wait();balance+=amount;this.notify();return balance},
  async placeBet(amount,game){await wait();if(!Number.isFinite(amount)||amount<=0)throw new Error('Неверная ставка');if(amount>balance)throw new Error('Недостаточно монет');balance-=amount;this.notify();return{ok:true,balance,game}},
  async payout(amount){await wait();balance+=amount;this.notify();return balance},
  async crashResult(){await wait(180);return{crash:+(1.12+Math.random()*7*Math.pow(Math.random(),1.25)).toFixed(2)}},
  async rouletteResult(){await wait(180);const pocket=Math.floor(Math.random()*37);return{pocket,red:pocket!==0&&[1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(pocket)}},
  async plinkoResult(){await wait(180);let position=0;for(let i=0;i<8;i++)position+=Math.random()>.5?1:0;position=Math.min(8,position);const multipliers=[8,3,1.5,.5,.3,.5,1.5,3,8];return{position,multiplier:multipliers[position]}},
  async slotsResult(){await wait(180);const symbols=['◆','7','◆','★','♠','●','♦'];const reels=[0,0,0].map(()=>symbols[Math.floor(Math.random()*symbols.length)]);const count=reels.filter(x=>x===reels[0]).length;return{reels,multiplier:count===3?5:count===2?1.5:0}}
};
