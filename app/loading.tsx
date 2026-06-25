import React from 'react';
import StaticStarfield from '@/components/static-starfield';

export default function Loading() {
  return (
    <div id="warp-loader" className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-md pointer-events-none">
      <div className="absolute inset-0 z-0 opacity-60">
        <StaticStarfield />
      </div>
      <div className="relative w-32 h-32 flex items-center justify-center z-10">
        {/* Sun */}
        <div className="absolute w-12 h-12 bg-orange-500 rounded-full shadow-[0_0_40px_15px_rgba(249,115,22,0.6)] animate-pulse" />
        
        {/* Orbit Path 1 */}
        <div className="absolute w-full h-full rounded-full border border-white/10" />

        {/* Orbiting Planet 1 */}
        <div className="absolute w-full h-full animate-spin" style={{ animationDuration: '3s', animationTimingFunction: 'linear' }}>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.8)]">
            {/* Moon for Planet 1 */}
            <div className="absolute w-8 h-8 -top-1.5 -left-1.5 animate-spin" style={{ animationDuration: '1s', animationTimingFunction: 'linear' }}>
               <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-gray-300 rounded-full" />
            </div>
          </div>
        </div>
        
        {/* Orbit Path 2 */}
        <div className="absolute w-20 h-20 rounded-full border border-white/10" />

        {/* Orbiting Planet 2 */}
        <div className="absolute w-20 h-20 animate-spin" style={{ animationDuration: '1.5s', animationTimingFunction: 'linear', animationDirection: 'reverse' }}>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-fuchsia-500 rounded-full shadow-[0_0_15px_rgba(217,70,239,0.8)]" />
        </div>
      </div>
      <div className="absolute mt-40 text-indigo-200 font-mono text-sm tracking-widest animate-pulse z-10">
        WARP IN PROGRESS...
      </div>
    </div>
  );
}
