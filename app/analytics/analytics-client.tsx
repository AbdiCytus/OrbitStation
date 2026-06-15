"use client";

import React, { useState, useMemo, useRef, useEffect } from 'react';
import Link from "next/link";

import { ChartPieIcon, ChartBarIcon, MapPinIcon, XMarkIcon } from "@heroicons/react/24/outline";
import StationNavbar from "@/components/station-navbar";
import { motion, AnimatePresence } from "framer-motion";
import "../station/[username]/public-profile.css";
import "./analytics.css";

type Tab = "overview" | "visitors" | "beacons";

type Props = {
  analytics: any;
  user: any;
};

export default function AnalyticsClient({ analytics, user }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [selectedMobileBeacon, setSelectedMobileBeacon] = useState<any>(null);
  
  // Animation refs
  const surfaceRef = useRef<HTMLDivElement>(null);
  const nightRef = useRef<HTMLDivElement>(null);
  const cloudsRef = useRef<HTMLDivElement>(null);
  const saturnRef = useRef<HTMLDivElement>(null);
  const animsRef = useRef<Animation[]>([]);

  useEffect(() => {
    if (!user.animationEnabled) return;
    
    if (surfaceRef.current && nightRef.current && cloudsRef.current && saturnRef.current) {
      const opts: KeyframeAnimationOptions = { duration: 120000, iterations: Infinity };
      const optsClouds: KeyframeAnimationOptions = { duration: 90000, iterations: Infinity }; // slightly faster
      
      const kf = [{ backgroundPosition: '0% 0' }, { backgroundPosition: '200% 0' }];
      
      const a1 = surfaceRef.current.animate(kf, opts);
      const a2 = nightRef.current.animate(kf, opts);
      const a3 = cloudsRef.current.animate(kf, optsClouds);
      const a4 = saturnRef.current.animate(kf, opts);
      
      animsRef.current = [a1, a2, a3, a4];
      
      return () => {
        a1.cancel(); a2.cancel(); a3.cancel(); a4.cancel();
      };
    }
  }, [user.animationEnabled]);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    if (!user.animationEnabled) return;
    
    // Burst speed to simulate fast rotation on tab change
    animsRef.current.forEach(a => {
      a.playbackRate = 60;
    });
    
    // Return to normal slow rotation loop
    setTimeout(() => {
      animsRef.current.forEach(a => {
        a.playbackRate = 1;
      });
    }, 1000);
  };

  // Mock bar chart data using recent visits
  const last7Days = useMemo(() => {
    const days: { date: string; dateString: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      days.push({
        date: d.toLocaleDateString("en-US", { weekday: "short" }),
        dateString: `${yyyy}-${mm}-${dd}`,
        count: 0
      });
    }
    
    if (analytics?.recentVisits) {
      analytics.recentVisits.forEach((v: any) => {
        const visitDate = new Date(v.createdAt);
        const yyyy = visitDate.getFullYear();
        const mm = String(visitDate.getMonth() + 1).padStart(2, '0');
        const dd = String(visitDate.getDate()).padStart(2, '0');
        const visitDateStr = `${yyyy}-${mm}-${dd}`;
        const day = days.find(d => d.dateString === visitDateStr);
        if (day) day.count++;
      });
    }
    return days;
  }, [analytics]);

  const maxVisits = Math.max(...last7Days.map(d => d.count), 1);

  return (
    <div className="analytics-container">
      {user.staticBackgroundEnabled ? (
        <div className="cosmic-bg fixed inset-0 z-[-1] pointer-events-none static-cosmic-bg" aria-hidden="true">
          <div className="cosmic-stars"></div>
          <div className="cosmic-aurora" style={{ opacity: 0.5, transform: "scale(1.2)" }}></div>
          <div className="cosmic-dust"></div>
        </div>
      ) : !user.animationEnabled ? (
        <div className="cosmic-bg" style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <div className="cosmic-stars"></div>
          <div className="cosmic-aurora"></div>
        </div>
      ) : (
        <>
          {/* Deep Space Background from Public Profile */}
          <div className="cosmic-bg" style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
            <div className="cosmic-stars"></div>
            <div className="cosmic-aurora"></div>
            <div className="cosmic-dust"></div>
            <div className="cosmic-asteroids"></div>
            <div className="cosmic-comet"></div>
            <div className="cosmic-comet comet-2"></div>
            <div className="cosmic-nebula"></div>
            <div className="cosmic-satellite"></div>
            <div className="cosmic-satellite sat-2"></div>
          </div>

          {/* Earth - Detailed Multi-Layered */}
          <div className="planet-earth-wrapper">
            <div className="planet-earth-textures" style={{ position: 'absolute', inset: 0, transform: 'rotate(90deg)' }}>
              <div ref={surfaceRef} className="planet-earth-surface"></div>
              <div ref={nightRef} className="planet-earth-night"></div>
              <div ref={cloudsRef} className="planet-earth-clouds"></div>
            </div>
            <div className="planet-earth-shadow"></div>
          </div>
          
          {/* Saturn */}
          <div className="planet-saturn-wrapper">
            <div className="saturn-ring-back"></div>
            <div ref={saturnRef} className="planet-saturn"></div>
            <div className="saturn-ring-front"></div>
          </div>

          {/* Animated Space Objects in front */}
          <div className="analytics-comet" />
          <div className="analytics-comet analytics-comet-2" />
        </>
      )}

      <StationNavbar 
        user={user} 
        hideSearch 
        displayName={user.name || user.username || "Pilot"}
      />

      <div className="analytics-content pt-20 flex flex-col h-full overflow-hidden w-full max-w-6xl mx-auto px-4 pb-6">
        <div className="analytics-tabs z-20 shrink-0 custom-scrollbar">
          <button 
            className={`analytics-tab flex items-center justify-center gap-2 ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => handleTabChange('overview')}
          >
            <ChartPieIcon className="w-5 h-5 shrink-0" /> <span>Overview</span>
          </button>
          <button 
            className={`analytics-tab flex items-center justify-center gap-2 ${activeTab === 'visitors' ? 'active' : ''}`}
            onClick={() => handleTabChange('visitors')}
          >
            <ChartBarIcon className="w-5 h-5 shrink-0" /> <span>Traffic</span>
          </button>
          <button 
            className={`analytics-tab flex items-center justify-center gap-2 ${activeTab === 'beacons' ? 'active' : ''}`}
            onClick={() => handleTabChange('beacons')}
          >
            <MapPinIcon className="w-5 h-5 shrink-0" /> <span>Top Beacons</span>
          </button>
        </div>

        <div className="flex-1 w-full flex justify-center items-start mt-6 overflow-hidden">
          <AnimatePresence mode="wait">
            {activeTab === "overview" && (
              <motion.div 
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="analytics-card z-20 flex flex-col"
                style={{ width: "100%", maxWidth: "1000px", maxHeight: "100%", overflow: "hidden" }}
              >
              <h2 className="text-3xl font-bold shrink-0" style={{ marginBottom: "2rem" }}>Station Overview</h2>
              <div className="stat-grid flex-1 overflow-y-auto custom-scrollbar pr-2 min-h-0">
                <div className="stat-box">
                  <div className="stat-value">{analytics?.totalVisits || 0}</div>
                  <div className="stat-label">Total Profile Visits</div>
                </div>
                <div className="stat-box">
                  <div className="stat-value">{analytics?.uniqueVisitorCount || 0}</div>
                  <div className="stat-label">Unique Logged-in Visitors</div>
                </div>
                <div className="stat-box">
                  <div className="stat-value">{analytics?.topBeacons?.length || 0}</div>
                  <div className="stat-label">Active Beacons</div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "visitors" && (
            <motion.div 
              key="visitors"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="analytics-card z-20 flex flex-col"
              style={{ width: "100%", maxWidth: "900px", maxHeight: "100%", overflow: "hidden" }}
            >
              <h2 className="text-3xl font-bold shrink-0" style={{ marginBottom: "0.5rem" }}>Traffic (Last 7 Days)</h2>
              <p className="text-gray-400 text-sm shrink-0" style={{ marginBottom: "2rem" }}>
                This chart displays the number of unique logged-in users who visited your public profile each day.
              </p>
              <div className="bar-chart-container w-full h-[250px] shrink-0" style={{ minHeight: "250px" }}>
                {last7Days.map((day, i) => (
                  <div key={i} className="bar-col">
                    <div 
                      className="bar" 
                      style={{ height: `${Math.max((day.count / maxVisits) * 100, 5)}%` }}
                    >
                      <span className="bar-value">{day.count}</span>
                    </div>
                    <span className="bar-label">{day.date}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === "beacons" && (
            <motion.div 
              key="beacons"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="analytics-card z-20 flex flex-col relative"
              style={{ width: "100%", maxWidth: "800px", maxHeight: "100%", overflow: "hidden", willChange: "transform, opacity", transform: "translateZ(0)" }}
            >
              <h2 className="text-3xl font-bold shrink-0" style={{ marginBottom: "2rem" }}>Top Clicked Beacons</h2>
              <div 
                className="analytics-beacon-list pb-2 flex-1 min-h-0 overflow-y-auto custom-scrollbar"
                style={{ transform: "translateZ(0)", willChange: "scroll-position" }}
              >
                {analytics?.topBeacons?.map((b: any, i: number) => {
                  const isSelected = selectedMobileBeacon === i;
                  return (
                    <div 
                      key={i} 
                      className="analytics-beacon-row cursor-pointer md:cursor-default"
                      onClick={() => {
                        if (window.innerWidth < 768) {
                          setSelectedMobileBeacon(isSelected ? null : i);
                        }
                      }}
                    >
                      <div className="flex items-center gap-4 w-full overflow-hidden">
                        <div className="w-10 h-10 md:w-12 md:h-12 shrink-0 rounded-lg bg-gray-800 overflow-hidden flex items-center justify-center">
                          {b.imageUrl ? (
                            <img src={b.imageUrl} alt={b.title} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-gray-400 font-bold">{b.title.charAt(0)}</span>
                          )}
                        </div>
                        
                        <div className="flex-1 relative h-10 md:h-auto flex items-center">
                          {/* Mobile animated container */}
                          <div className="block md:hidden w-full relative h-10">
                            <AnimatePresence mode="wait">
                              {!isSelected ? (
                                <motion.div 
                                  key="title"
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -10 }}
                                  transition={{ duration: 0.2 }}
                                  className="absolute inset-0 flex items-center"
                                >
                                  <div className="font-semibold truncate text-sm w-full">{b.title}</div>
                                </motion.div>
                              ) : (
                                <motion.div 
                                  key="stats"
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -10 }}
                                  transition={{ duration: 0.2 }}
                                  className="absolute inset-0 flex items-center"
                                >
                                  <div className="text-fuchsia-400 font-black text-2xl">
                                    {b.visits} <span className="text-xs text-gray-400 font-normal uppercase tracking-widest ml-1">Total Clicks</span>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                          
                          {/* Desktop static title */}
                          <div className="hidden md:block font-semibold truncate text-base w-full">
                            {b.title}
                          </div>
                        </div>
                        
                        <div className="hidden md:block text-violet-400 font-bold text-xl shrink-0">
                          {b.visits} <span className="text-sm text-gray-400 font-normal">clicks</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
          </AnimatePresence>
        </div>
      </div>
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .custom-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
