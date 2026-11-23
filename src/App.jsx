import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, RoundedBox, Stars } from '@react-three/drei';
import { gameService } from './gameService';

const GAMES = [
  { id:'crash', title:'LUCKY JET', provider:'1WIN GAMES', className:'purple', live:'2.7K' },
  { id:'roulette', title:'ROULETTE', provider:'LIVE TABLE', className:'orange', live:'1.8K' },
  { id:'plinko', title:'CRYPTOMINES', provider:'1WIN GAMES', className:'green', live:'3.1K' },
  { id:'slots', title:'BLACKJACK', provider:'TADA GAMING', className:'blue', live:'920' }
];

function haptic(kind='light') {
  try {
    const t = window.Telegram?.WebApp?.HapticFeedback;
    if (kind === 'success') t?.notificationOccurred('success');
    else if (kind === 'heavy') t?.impactOccurred('heavy');
    else t?.impactOccurred('light');
  } catch (_) {}
}

function tone(frequency=320, duration=.12) {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx(), o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.value = frequency;
    g.gain.setValueAtTime(.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(.07, ctx.currentTime+.01);
    g.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime+duration);
    o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime+duration+.02);
  } catch (_) {}
}

function GameCanvas({ children, camera=[0,0.2,7] }) {
  return <Canvas dpr={[1,1.6]} camera={{position:camera,fov:42}} gl={{antialias:true,alpha:true,powerPreference:'high-performance'}}>
    <color attach="background" args={['#080a12']}/>
    <fog attach="fog" args={['#080a12',8,13]}/>
    <ambientLight intensity={1}/>
    <pointLight position={[4,5,4]} intensity={35} color="#7768ff" distance={12}/>
    <pointLight position={[-4,-2,3]} intensity={24} color="#19d9aa" distance={10}/>
    <Stars radius={30} depth={12} count={180} factor={1.1} saturation={0}/>
    {children}
  </Canvas>;
}

function JetScene({ running, crash }) {
  const jet=useRef(), exhaust=useRef();
  useFrame((state,delta)=>{
    if(jet.current){
      if(running){ jet.current.position.y += delta*(.45+crash*.035); jet.current.position.x = Math.sin(state.clock.elapsedTime*1.7)*.12; }
      jet.current.rotation.z=Math.sin(state.clock.elapsedTime*5)*.05;
    }
    if(exhaust.current) exhaust.current.scale.y=1+Math.sin(state.clock.elapsedTime*18)*.16;
  });
  return <>
    <mesh position={[0,-2.45,0]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[1.7,1.75,64]}/><meshBasicMaterial color="#293267" transparent opacity={.7}/></mesh>
    {[0.6,1.15,1.7].map((x,i)=><mesh key={i} position={[i===0?-x:i===2?x:0,-1.9+i*.2,0]}><torusGeometry args={[.8, .018, 8,48]}/><meshBasicMaterial color={i===1?'#24d5ad':'#6a66b7'} transparent opacity={.38}/></mesh>)}
    <group ref={jet} position={[0,-1.2,0]}>
      <Float speed={running?8:2} floatIntensity={.12}>
        <mesh rotation={[0,0,-Math.PI/2]}><coneGeometry args={[.38,1.3,32]}/><meshStandardMaterial color="#edf1ff" metalness={.8} roughness={.16}/></mesh>
        <mesh position={[.05,-.48,0]}><sphereGeometry args={[.24,24,16]}/><meshStandardMaterial color="#59d8ff" emissive="#168bd9" emissiveIntensity={2} metalness={.4}/></mesh>
      </Float>
      {running&&<mesh ref={exhaust} position={[0,-1.05,0]}><coneGeometry args={[.18,.75,20]}/><meshBasicMaterial color="#ff7148" transparent opacity={.82}/></mesh>}
    </group>
  </>;
}

function RouletteScene({ spinning, pocket }) {
  const wheel=useRef(), ball=useRef();
  useFrame((state,delta)=>{
    if(wheel.current&&spinning) wheel.current.rotation.z-=delta*4.8;
    if(ball.current){
      const t=state.clock.elapsedTime*(spinning?5:1);
      const radius=spinning?1.85-Math.min(t*.02,.55):1.28;
      ball.current.position.set(Math.cos(t)*radius,.24,Math.sin(t)*radius);
    }
  });
  const pockets=useMemo(()=>Array.from({length:37},(_,i)=>i),[]);
  return <group rotation={[.42,0,0]}>
    <mesh ref={wheel} position={[0,-.15,0]}><cylinderGeometry args={[2.25,2.25,.28,64]}/><meshStandardMaterial color="#171a2a" metalness={.78} roughness={.2}/></mesh>
    {pockets.map((n,i)=>{const a=i/37*Math.PI*2;return <mesh key={n} position={[Math.cos(a)*1.72,.03,Math.sin(a)*1.72]}><boxGeometry args={[.28,.16,.28]}/><meshStandardMaterial color={n===0?'#23b77f':n%2?'#cf335e':'#252b43'} emissive={n===pocket?'#ffd66a':'#000'} emissiveIntensity={n===pocket?2.2:0}/></mesh>;})}
    <mesh position={[0,.08,0]}><cylinderGeometry args={[.45,.8,.38,48]}/><meshStandardMaterial color="#d7b86a" metalness={1} roughness={.12}/></mesh>
    <mesh ref={ball}><sphereGeometry args={[.09,18,18]}/><meshStandardMaterial color="#fff" metalness={1} roughness={.08} emissive="#cfd6ff" emissiveIntensity={.5}/></mesh>
  </group>;
}

function PlinkoScene({ drop, target }) {
  const ball=useRef(), progress=useRef(0);
  useFrame((_,delta)=>{
    if(ball.current&&drop){progress.current=Math.min(1,progress.current+delta*.9);const p=progress.current;ball.current.position.set(Math.sin(p*Math.PI*5)*.12*(1-p)+(target-3.5)*.22*p,2.2-p*3.65,-.1);} 
    if(ball.current&&!drop&&progress.current>=1)progress.current=1;
  });
  useEffect(()=>{if(drop)progress.current=0},[drop]);
  const pins=[];
  for(let row=0;row<8;row++)for(let col=0;col<=row;col++)pins.push([col-row/2,1.55-row*.38,0]);
  const slots=[8,3,1.5,.5,.3,.5,1.5,3,8];
  return <>
    {pins.map((p,i)=><mesh key={i} position={p}><sphereGeometry args={[.055,12,12]}/><meshStandardMaterial color="#73f7d2" emissive="#20e3a2" emissiveIntensity={1.8}/></mesh>)}
    {slots.map((v,i)=><mesh key={i} position={[i-4,-1.58,.02]}><RoundedBox args={[.72,.35,.12]} radius={.08}><meshStandardMaterial color={i===target?'#e8cb73':'#24233a'} emissive="#52cdb2" emissiveIntensity={i===target?.8:.15}/></RoundedBox></mesh>)}
    <mesh ref={ball} position={[0,2.2,0]}><sphereGeometry args={[.13,24,24]}/><meshStandardMaterial color="#d9ffef" emissive="#20e3a2" emissiveIntensity={2} metalness={.25}/></mesh>
  </>;
}

function SlotScene({ spinning, reels }) {
  const reelRefs=useRef([]);
  useFrame((_,delta)=>reelRefs.current.forEach((r,i)=>{if(r&&spinning)r.rotation.x-=delta*(12-i*.8)}));
  const symbols=['◆','7','★','♠','●','♦'];
  return <group>
    <RoundedBox args={[5.2,3.35,.75]} radius={.18}><meshStandardMaterial color="#171424" metalness={.55} roughness={.22}/></RoundedBox>
    <mesh position={[0,0,.41]}><planeGeometry args={[4.55,2.55]}/><meshStandardMaterial color="#090a12"/></mesh>
    {reels.map((symbol,i)=><group key={i} position={[-1.48+i*1.48,.05,.48]}>
      <mesh ref={r=>reelRefs.current[i]=r}><cylinderGeometry args={[.62,.62,.55,32,1,false]} /><meshStandardMaterial color="#28233e" emissive={spinning?'#7a62cf':'#9b5cff'} emissiveIntensity={.22}/></mesh>
      <mesh position={[0,0,.57]}><circleGeometry args={[.48,32]}/><meshBasicMaterial color="#eeeaff"/></mesh>
      <mesh position={[0,0,.59]}><ringGeometry args={[.48,.52,32]}/><meshBasicMaterial color={symbol==='7'?'#ffcf67':'#b49aff'}/></mesh>
    </group>)}
  </group>;
}

function LobbyCard({game,onOpen}) {
  return <button className={`game-card ${game.className}`} onClick={onOpen}>
    <span className="provider">{game.provider}</span>
    <div className="art" aria-hidden="true">{game.id==='crash'?'🚀':game.id==='roulette'?'●':game.id==='plinko'?'◆':'♠'}</div>
    <div className="game-shade"><strong>{game.title}</strong><span><i/> {game.live} playing</span></div>
  </button>;
}

export default function App(){
  const [balance,setBalance]=useState(()=>gameService.getBalance());
  const [game,setGame]=useState(null),[bet,setBet]=useState(50),[modal,setModal]=useState(false),[muted,setMuted]=useState(false);
  const [message,setMessage]=useState('Добро пожаловать за столом'),[running,setRunning]=useState(false),[crash,setCrash]=useState(1);
  const [spinning,setSpinning]=useState(false),[pocket,setPocket]=useState(null),[drop,setDrop]=useState(false),[target,setTarget]=useState(4);
  const [reels,setReels]=useState(['◆','7','★']),[cashoutReady,setCashoutReady]=useState(false);

  useEffect(()=>gameService.subscribe(setBalance),[]);
  useEffect(()=>{const tg=window.Telegram?.WebApp;if(tg){tg.ready?.();tg.expand?.();}},[]);

  const adjustBet=(kind)=>{haptic();setBet(v=>kind==='max'?balance:kind==='half'?Math.max(1,Math.floor(v/2)):Math.min(balance,v*2));};
  const openGame=(id)=>{haptic();setGame(id);setMessage(GAMES.find(g=>g.id===id)?.title||'Стол готов');setCrash(1);};

  const startCrash=async()=>{if(running)return;haptic();try{await gameService.placeBet(bet,'crash');setRunning(true);setCashoutReady(true);setCrash(1);setMessage('Ракета летит — заберите вовремя');const r=await gameService.crashResult();const started=performance.now();const tick=()=>{const elapsed=(performance.now()-started)/1000;const v=Math.min(r.crash,+(1+elapsed*.18+elapsed*elapsed*.012).toFixed(2));setCrash(v);if(v>=r.crash){setRunning(false);setCashoutReady(false);setMessage(`Краш x${r.crash.toFixed(2)} — новый раунд`);haptic('heavy');tone(80,.35);return;}if(running)requestAnimationFrame(tick);};requestAnimationFrame(tick);}catch(e){setMessage(e.message)}};
  const cashout=async()=>{if(!cashoutReady)return;haptic('success');setRunning(false);setCashoutReady(false);const win=Math.floor(bet*crash);await gameService.payout(win);setMessage(`Красиво: забрали x${crash.toFixed(2)} · +${win}`);tone(660,.45);};

  const spinRoulette=async()=>{if(spinning)return;haptic();try{await gameService.placeBet(bet,'roulette');setSpinning(true);setPocket(null);setMessage('Колесо вращается…');const r=await gameService.rouletteResult();setTimeout(async()=>{setPocket(r.pocket);setSpinning(false);const win=Math.random()<.486;await gameService.payout(win?bet*2:0);setMessage(win?`Сектор ${r.pocket} · выигрыш +${bet*2}`:`Сектор ${r.pocket} · удача ждёт следующего раунда`);haptic(win?'success':'heavy');if(win)tone(620,.38);},2200);}catch(e){setMessage(e.message)}};
  const playPlinko=async()=>{if(drop)return;haptic();try{await gameService.placeBet(bet,'plinko');const r=await gameService.plinkoResult();setTarget(r.position);setDrop(true);setMessage('Шарик летит в лунку…');setTimeout(async()=>{const win=Math.floor(bet*r.multiplier);await gameService.payout(win);setDrop(false);setMessage(`Лунка x${r.multiplier} · +${win}`);haptic(win>bet?'success':'light');if(win>bet)tone(660,.4);},1800);}catch(e){setMessage(e.message)}};
  const spinSlots=async()=>{if(spinning)return;haptic();try{await gameService.placeBet(bet,'slots');setSpinning(true);setMessage('Барабаны вращаются…');const r=await gameService.slotsResult();setTimeout(async()=>{setReels(r.reels);setSpinning(false);const win=Math.floor(bet*r.multiplier);await gameService.payout(win);setMessage(win?`Комбинация собрана · +${win}`:'Почти идеально — попробуйте снова');haptic(win?'success':'light');if(win)tone(700,.5);},1500);}catch(e){setMessage(e.message)}};

  const buyCoins=async()=>{haptic('success');await gameService.addDemoCoins(5000);setModal(false);setMessage('На счёт зачислено 5 000 тестовых монет');tone(520,.35);};

  return <div className="app-shell">
    <aside className="sidebar">
      <button className="login"><span>●</span><b>Log in</b><i>›</i></button>
      <button className="wallet"><span>Free<br/>money</span><div>♠ ♥</div></button>
      <button className="token"><b>1</b><span>Twin Token (TWIN)<br/><small>USDT 0.0384572 −6.62%</small></span></button>
      <nav>{['Casino','Sports','Markets','Betwave','Bonuses','VIP Loyalty','VIP Club','Promotions','Blog','Poker'].map((v,i)=><button key={v} className={i===0?'active':''}><span>{i===0?'◉':i===1?'◈':i===2?'◔':i===3?'◫':i===4?'◆':i===5?'♛':i===6?'♛':i===7?'◒':i===8?'▣':'♠'}</span>{v}{i===4&&<b>1</b>}{i===5&&<em>NEW</em>}</button>)}</nav>
    </aside>

    <div className="main-shell">
      <header className="topbar"><div className="logo">NEON<span>◆</span></div><nav><button className="active">⌂ Home</button><button>◉ Casino</button><button>$ Free money</button><button>◒ Sports</button></nav><div className="top-actions"><button className="login-small">Login</button><button className="register">Registration</button></div></header>
      <main>
        {!game?<>
          <section className="promo-grid"><article className="hero"><div><span>TONIGHT'S EVENT</span><h1>FREE BETS ON<br/>NEON MAJOR 2026</h1><button>Learn more</button></div><div className="hostess"><div className="host-head"/><div className="host-body">V</div></div></article><div className="side-promos"><article><span>Free money</span><strong>Range Rover<br/>and other prizes</strong><b>◆</b></article><article><span>Bonuses</span><strong>1 available bonus</strong><b>🎁</b></article></div></section>
          <section className="rail"><div className="rail-title"><b>♢ &nbsp; 1WIN GAMES</b><span>›</span></div><div className="cards">{GAMES.map(g=><LobbyCard key={g.id} game={g} onOpen={()=>openGame(g.id)}/>)}</div></section>
        </>:<section className="game-screen">
          <div className="game-head"><button onClick={()=>{haptic();setGame(null);setRunning(false);setSpinning(false)}}>‹ Lobby</button><div><div className="avatar">V</div><span>{message}</span></div><div className="game-balance"><span>{Math.floor(balance).toLocaleString()}</span><button onClick={()=>setModal(true)}>+</button></div></div>
          <div className="game-stage">
            <GameCanvas>{game==='crash'&&<JetScene running={running} crash={crash}/>} {game==='roulette'&&<RouletteScene spinning={spinning} pocket={pocket}/>} {game==='plinko'&&<PlinkoScene drop={drop} target={target}/>} {game==='slots'&&<SlotScene spinning={spinning} reels={reels}/></GameCanvas>
            {game==='crash'&&<div className="crash-value">×{crash.toFixed(2)}</div>} {game==='roulette'&&pocket!==null&&<div className="pocket-value">{pocket}</div>}
          </div>
          <div className="controls"><div className="bets"><button onClick={()=>adjustBet('half')}>½</button><button onClick={()=>adjustBet('double')}>×2</button><button onClick={()=>adjustBet('max')}>MAX</button><strong>{bet}<small> COINS</small></strong></div>
            {game==='crash'&&<button className="primary" onClick={running?cashout:startCrash}>{running?`CASHOUT ×${crash.toFixed(2)}`:'START FLIGHT'}</button>}
            {game==='roulette'&&<button className="primary" disabled={spinning} onClick={spinRoulette}>{spinning?'SPINNING…':'SPIN ROULETTE'}</button>}
            {game==='plinko'&&<button className="primary" disabled={drop} onClick={playPlinko}>{drop?'DROP IN PROGRESS…':'DROP BALL'}</button>}
            {game==='slots'&&<button className="primary" disabled={spinning} onClick={spinSlots}>{spinning?'SPINNING…':'SPIN REELS'}</button>}
          </div>
        </section>}
      </main>
    </div>

    {modal&&<div className="overlay" onClick={()=>setModal(false)}><section className="modal" onClick={e=>e.stopPropagation()}><button className="close" onClick={()=>setModal(false)}>×</button><div className="coin">$</div><h2>Deposit coming soon</h2><p>This is a virtual-currency demo.</p><button className="primary" onClick={buyCoins}>ADD 5 000 TEST COINS</button></section></div>}
  </div>;
}
