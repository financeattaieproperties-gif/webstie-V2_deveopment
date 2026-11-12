import React, { useEffect, useRef, useState } from 'react';
import { original, logoLayers } from '../../../packages/brand-assets/artwork';
import { decodeLogoAsset, runLogoEntrance } from '../../../packages/brand-assets/playback';
import '../../../packages/brand-assets/entrance.css';

export interface AttaieLogoEntranceProps {
  mode?: 'header' | 'login-transition';
  onComplete?: () => void;
  className?: string;
  variant?: 'teal' | 'navy';
}

export function AttaieLogoEntrance({mode='header',onComplete,className='',variant='teal'}:AttaieLogoEntranceProps) {
  const [status,setStatus]=useState<'loading'|'playing'|'settled'>(mode==='header'?'settled':'loading');
  const [failed,setFailed]=useState(false);
  const [reducedMotion,setReducedMotion]=useState(()=>{
    try {return Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);}
    catch {return true;}
  });
  const completeRef=useRef(onComplete);
  const completedRef=useRef(false);
  completeRef.current=onComplete;
  useEffect(()=>{
    try {
      const query=window.matchMedia?.('(prefers-reduced-motion: reduce)');
      if(!query)return;
      const change=()=>setReducedMotion(query.matches);
      query.addEventListener?.('change',change);
      return ()=>query.removeEventListener?.('change',change);
    } catch {
      // Fallback safely if matchMedia is unavailable
    }
  },[]);
  useEffect(()=>{
    if(mode==='header') {setStatus('settled');return;}
    setStatus('loading');
    return runLogoEntrance({sources:[original,...logoLayers.map(layer=>layer.source)],reducedMotion,decode:decodeLogoAsset,onPlaying:()=>setStatus('playing'),onSettled:()=>setStatus('settled'),onComplete:()=>{if(!completedRef.current){completedRef.current=true;completeRef.current?.();}}});
  },[mode,reducedMotion]);
  return <div className={`attaie-logo-entrance ${mode==='login-transition'?'attaie-logo-transition-overlay':''} ${className}`} data-testid={failed?'attaie-logo-fallback':'attaie-logo-entrance'} data-mode={mode} data-status={status} data-reduced-motion={String(reducedMotion)} data-variant={variant} role="img" aria-label="Attaie Properties">
    {failed?<span className="attaie-original-fallback">Attaie Properties</span>:<svg viewBox="0 0 1870 841" width="1870" height="841" aria-hidden="true" className="attaie-original-canvas" style={{maxWidth:mode==='login-transition'?540:340}}>
      <image href={original} width="1870" height="841" opacity={status==='playing'?0:1} onError={()=>setFailed(true)}/>
      {status==='playing'&&logoLayers.map(layer=>{
        const [x,y,width,height]=layer.bounds;
        return <g key={layer.name} data-layer={layer.name} className={`attaie-original-layer attaie-original-${layer.animation}`} style={{animationDelay:`${layer.delay}s`,animationDuration:`${layer.duration}s`,transformOrigin:layer.name==='keys'?'37% 16%':'center'}}><image href={layer.source} x={x} y={y} width={width} height={height}/></g>;
      })}
    </svg>}
  </div>;
}
