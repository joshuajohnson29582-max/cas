import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Float, RoundedBox, Stars } from '@three/drei';
import * as THREE from 'three';

const GAMES = [
  { id:'crash', name:'Cyber Crash', sub:'Кэш-аут до взрыва', icon:'🚀', accent:'#9b5cff' },
  { id:'roulette', name:'Neon Roulette', sub:'Европейское колесо', icon:'◉', accent:'#c8a44a' },
  { id:'plinko', name:'Plasma Plinko', sub:'Падение удачи', icon:'●', accent:'#20e3a2' },
  { id:'slots', name:'Cyber Slots', sub:'Три барабана', icon:'7', accent:'#ff4fa3' }
];

function haptic(type='light') {
  const tg = window.Telegram?.WebApp;
  try {
    if (type === 'heavy') tg?.HapticFeedback?.impactOccurred('heavy');
    else if (type === 'success') tg?.HapticFeedback?.notificationOccurred('success');
    else tg?.HapticFeedback?.impactOccurred('light');
  } catch (_) {}
}

function audioTone(kind='click') {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = 'sine'; o.frequency.value = kind === 'win' ? 660 : kind === 'spin' ? 140 : 320;
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + (kind === 'win' ? .55 : .16));
    o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + .6);
  } catch (_) {}
}

function SceneFrame({ children }) {
  return <Canvas camera={{ position:[0,1.7,7], fov:42 }} dpr={[1,1.75]} gl={{ antialias:true, alpha:true }}>
    <color attach="background" args={["#090A0F"]}/>
    <ambientLight intensity={0.6}/><pointLight position={[4,5,4]} intensity={20} color="#8c5cff"/><pointLight position={[-4,2,3]} intensity={12} color="#20e3a2"/>
    <Stars radius={35} depth={20} count={250} factor={1.2} saturation={0}/><Environment preset="night"/>{children}
  </Canvas>;
}

function Rocket({ running, multiplier }) {
  const ref = useRef();
  useFrame((state, delta) => { if(ref.current) { ref.current.position.y += running ? delta * .7 : 0; ref.current.rotation.z = running ? Math.sin(state.clock.elapsedTime*8)*.08 : 0; } });
  return <Float speed={running ? 5 : 2} floatIntensity={.25}><group ref={ref} position={[0,-1.4,0]}>
    <mesh rotation={[0,0,Math.PI]}><coneGeometry args={[.42,1.35,24]}/><meshStandardMaterial color="#dbe4ff" metalness={.75} roughness={.18}/></mesh>
    <mesh position={[0,.15,0]}><sphereGeometry args={[.28,24,24]}/><meshStandardMaterial color="#20d9ff" emissive="#209cff" emissiveIntensity={2}/></mesh>
    {running && <mesh position={[0,-.9,0]}><coneGeometry args={[.18,.8,16]}/><meshBasicMaterial color="#ff9f43"/></mesh>}
  </group></Float>;
}

function RouletteWheel({ spinning, pocket }) {
  const wheel = useRef();
  useFrame((_, delta) => { if(wheel.current && spinning) wheel.current.rotation.z -= delta * 5; });
  const pockets = useMemo(() => Array.from({length:37},(_,i)=>i),[]);
  return <group ref={wheel} rotation={[Math.PI*.12,0,0]}>
    <mesh><cylinderGeometry args={[2.25,2.25,.18,48]}/><meshStandardMaterial color="#15172a" metalness=.7 roughness=.2/></mesh>
    {pockets.map((n,i)=><mesh key={n} position={[Math.cos(i/37*Math.PI*2)*1.55, .11, Math.sin(i/37*Math.PI*2)*1.55]}><sphereGeometry args={[.09,12,12]}/><meshStandardMaterial color={n===0?'#32c28a':n%2?'#c22d58':'#20283d'} emissive={n===pocket?'#ffdd66':'#000'} emissiveIntensity={n===pocket?2:0}/></mesh>)}
    <mesh position={[0,.22,0]}><cylinderGeometry args={[.35,.55,.2,32]}/><meshStandardMaterial color="#d8ba67" metalness={1}/></mesh>
  </group>;
}

function Plinko({ drop, multiplier }) {
  const pins=[];
  for(let row=0;row<8;row++) for(let col=0;col<=row;col++) pins.push([col-(row/2), 1.7-row*.38, 0]);
  return <><group>{pins.map((p,i)=><mesh key={i} position={p}><sphereGeometry args={[.065,10,10]}/><meshStandardMaterial color="#42ffd1" emissive="#20e3a2" emissiveIntensity={1.8}/></mesh>)}</group>
    {[-2.1,-1.55,-1,-.45,.45,1,1.55,2.1].map((x,i)=><mesh key={i} position={[x,-1.55,.02]}><RoundedBox args={[.48,.32,.12]} radius={.08}><meshStandardMaterial color={[8,3,1.5,.5,.3,.5,3,8][i]===multiplier?'#ffd166':'#29203c'} emissive="#9b5cff" emissiveIntensity={.35}/></RoundedBox></mesh>)}
    {drop && <Float speed={5}><mesh position={[0,2.7,0]}><sphereGeometry args={[.16,20,20]}/><meshStandardMaterial color="#fff" emissive="#20e3a2" emissiveIntensity={3}/></mesh></Float>}
  </>;
}

function SlotsMachine({ spinning, reels }) {
  return <group position={[0,-.2,0]}>
    <RoundedBox args={[4.5,3.2,.55]} radius={.18} position={[0,0,0]}><meshStandardMaterial color="#171329" metalness=.7 roughness=.18/></RoundedBox>
    {reels.map((symbol,i)=><Float key={i} speed={spinning?12:2} rotationIntensity={spinning?.15:0}><mesh position={[-1.25+i*1.25,.25,.35]}><boxGeometry args={[.9,1.55,.18]}/><meshStandardMaterial color="#26223e" emissive="#9b5cff" emissiveIntensity={.4}/></mesh></Float>)}
  </group>;
}

export default function App() {
  const [balance,setBalance]=useState(2500); const [game,setGame]=useState(null); const [bet,setBet]=useState(50);
  const [crashRunning,setCrashRunning]=useState(false); const [crash,setCrash]=useState(1); const [crashTarget,setCrashTarget]=useState(null);
  const [cashed,setCashed]=useState(false); const [spinning,setSpinning]=useState(false); const [pocket,setPocket]=useState(null);
  const [drop,setDrop]=useState(false); const [reels,setReels]=useState(['◆','7','★']); const [modal,setModal]=useState(false); const [muted,setMuted]=useState(false); const [message,setMessage]=useState('Добро пожаловать, амбициозный игрок');
  useEffect(()=>gameService.subscribe(setBalance),[]);
  useEffect(()=>{const tg=window.Telegram?.WebApp; if(tg){tg.ready();tg.expand(); if(tg.themeParams?.bg_color) document.documentElement.style.setProperty('--bg',`#${tg.themeParams.bg_color.replace('#','')}`)}},[]);

  const adjustBet=(kind)=>{haptic(); setBet(v=>kind==='MAX'?balance:kind==='half'?Math.max(1,Math.floor(v/2)):kind==='double'?Math.min(balance,v*2):Math.min(balance,v+10));};
  const buyIn=async()=>{haptic('success'); const n=await gameService.addDemoCoins(5000);setBalance(n);setModal(false);setMessage('5 000 тестовых монет начислено');};
  const startCrash=async()=>{if(crashRunning)return; haptic();try{await gameService.placeBet(bet,'crash'); setCrashRunning(true);setCashed(false);setCrash(1);setCrashTarget(null);setMessage('Ракета стартовала! Заберите вовремя');const r=await gameService.crashResult();setCrashTarget(r.crash);}catch(e){setMessage(e.message)}};
  useEffect(()=>{if(!crashRunning||!crashTarget)return; const id=setInterval(()=>{setCrash(v=>{const n=+(v+.025*(1+v*.09)).toFixed(2);if(n>=crashTarget){clearInterval(id);setCrashRunning(false);setMessage(`Краш на x${crashTarget.toFixed(2)} — демо-раунд завершён`);haptic('heavy');return crashTarget;}return n;});},70);return()=>clearInterval(id);},[crashRunning,crashTarget]);
  const cashout=async()=>{if(!crashRunning||cashed)return;haptic('success');setCashed(true);setCrashRunning(false);await gameService.payout(Math.floor(bet*crash));setMessage(`Кэш-аут x${crash.toFixed(2)} — красиво!`);if(!muted)audioTone('win');};
  const spinRoulette=async()=>{if(spinning)return;haptic();try{await gameService.placeBet(bet,'roulette');setSpinning(true);setPocket(null);setMessage('Колесо вращается…');const r=await gameService.rouletteResult();setTimeout(async()=>{setPocket(r.pocket);setSpinning(false);const win=Math.random()<.486;await gameService.payout(win?bet*2:0);setMessage(win?`Сектор ${r.pocket}: выигрыш +${bet*2}`:`Сектор ${r.pocket}: удача ждёт следующего раунда`);haptic(win?'success':'heavy');},1800)}catch(e){setMessage(e.message)}};
  const dropPlinko=async()=>{haptic();try{await gameService.placeBet(bet,'plinko');setDrop(true);setMessage('Шарик в полете…');const r=await gameService.plinkoResult();setTimeout(async()=>{setDrop(false);const win=Math.floor(bet*r.multiplier);await gameService.payout(win);setMessage(`Коэффициент x${r.multiplier} · +${win}`);haptic(win>bet?'success':'light');},1500)}catch(e){setMessage(e.message)}};
  const spinSlots=async()=>{if(spinning)return;haptic();try{await gameService.placeBet(bet,'slots');setSpinning(true);const r=await gameService.slotsResult();setTimeout(async()=>{setReels(r.reels);setSpinning(false);const win=Math.floor(bet*r.multiplier);await gameService.payout(win);setMessage(win?`Символы совпали! x${r.multiplier}`:'Почти идеально — попробуйте снова');if(win){haptic('success');if(!muted)audioTone('win');}},1300)}catch(e){setMessage(e.message)}};

  return <div className="app">
    <header><div className="brand"><b>N</b><span>NEON<br/><small>CASINO</small></span></div>
      <div className="balance"><span>{Math.floor(balance).toLocaleString()}</span><small> COINS</small><button onClick={()=>setModal(true)}>+</button></div>
      <button className="icon" onClick={()=>{setMuted(v=>{if(!v)audioTone('click');return!v})}}>{muted?'🔇':'🔊'}</button>
    </header>
    <div className="live"><span className="dot"/> LIVE <strong>@alex_win</strong> сорвал x42.5! <i/><span className="online">● 1 284 online</span></div>

    {!game ? <main className="lobby"><div className="welcome"><div><p>Добро пожаловать</p><h1>{window.Telegram?.WebApp?.initDataUnsafe?.user?.first_name || 'Игрок'}<br/><em>Tonight is yours.</em></h1></div><div className="vip"><span>GOLD VIP</span><div><i/></div><small>72% до Diamond</small></div></div>
      <section className="game-grid">{GAMES.map(g=><button className="game-card" key={g.id} style={{'--accent':g.accent}} onClick={()=>{haptic();setGame(g.id);setMessage(g.name)}}>
        <div className="hot">HOT</div><div className="card-icon">{g.icon}</div><div className="card-info"><h3>{g.name}</h3><p>{g.sub}</p></div><span className="play">→</span>
      </button>)}</section></main> : <main className="game-screen">
      <button className="back" onClick={()=>{haptic();setGame(null);setCrashRunning(false)}}>‹ Лобби</button>
      <div className="host"><div className="avatar">V</div><span>{message}</span></div>
      <div className="canvas-wrap"><SceneFrame>
        {game==='crash'&&<Rocket running={crashRunning} multiplier={crash}/>} {game==='roulette'&&<RouletteWheel spinning={spinning} pocket={pocket}/>} {game==='plinko'&&<Plinko drop={drop} multiplier={1.5}/>} {game==='slots'&&<SlotsMachine spinning={spinning} reels={reels}/>
      </SceneFrame>
        {game==='crash'&&<div className="multiplier">x{crash.toFixed(2)}</div>}
      </div>
      <div className="controls"><div className="bet-row"><button onClick={()=>adjustBet('half')}>1/2</button><button onClick={()=>adjustBet('double')}>x2</button><button onClick={()=>adjustBet('MAX')}>MAX</button><strong>{bet} <small>COINS</small></strong></div>
        {game==='crash'&&<button className="primary" onClick={crashRunning?cashout:startCrash}>{crashRunning?'Забрать':'Запустить'} {crashRunning?`x${crash.toFixed(2)}`:''}</button>}
        {game==='roulette'&&<button className="primary" onClick={spinRoulette} disabled={spinning}>{spinning?'Вращение…':'Крутить рулетку'}</button>}
        {game==='plinko'&&<button className="primary" onClick={dropPlinko} disabled={drop}>{drop?'Шарик летит…':'Бросить шарик'}</button>}
        {game==='slots'&&<button className="primary" onClick={spinSlots} disabled={spinning}>{spinning?'Крутим…':'Крутить барабаны'}</button>}
      </div>
    </main>}

    {modal&&<div className="overlay" onClick={()=>setModal(false)}><section className="modal" onClick={e=>e.stopPropagation()}><button className="close" onClick={()=>setModal(false)}>×</button><div className="coin">$</div><h2>Пополнение скоро</h2><p>Вы сейчас в демо-режиме на виртуальных монетах.</p><button className="primary" onClick={buyIn}>Получить 5 000 тестовых монет</button></section></div>}
  </div>;
}
