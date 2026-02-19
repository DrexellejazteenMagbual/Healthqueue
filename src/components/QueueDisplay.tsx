import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QueueItem } from '../types';
import { Clock, Heart, Users, Baby, Volume2, VolumeX } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { settingsManager } from '../lib/settingsManager';

interface QueueItemWithDetails extends QueueItem {
  age?: number;
  medicalHistory?: string[];
  priorityReason?: 'senior' | 'pwd' | 'pregnant' | 'none';
}

interface QueueDisplayProps {
  queue: QueueItem[];
}

const QueueDisplay: React.FC<QueueDisplayProps> = ({ queue: initialQueue }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [queue, setQueue] = useState<QueueItemWithDetails[]>(initialQueue);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [lastServedIds, setLastServedIds] = useState<Set<string>>(new Set());
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(false);

  // Function to test audio
  const testAudio = () => {
    console.log('[Audio] Testing audio...');
    if ('speechSynthesis' in window) {
      const testMessage = new SpeechSynthesisUtterance('Audio is now enabled. Queue announcements are active.');
      testMessage.lang = 'en-US';
      testMessage.rate = 0.9;
      testMessage.pitch = 1;
      testMessage.volume = 1;
      testMessage.onstart = () => console.log('[Audio] Test audio started');
      testMessage.onend = () => console.log('[Audio] Test audio complete');
      testMessage.onerror = (e) => console.error('[Audio] Test audio error:', e);
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(testMessage);
    } else {
      console.error('[Audio] Speech synthesis not supported');
    }
  };

  // Toggle audio and test it
  const toggleAudio = () => {
    const newState = !audioEnabled;
    console.log(`[Audio] Toggling audio: ${audioEnabled} -> ${newState}`);
    setAudioEnabled(newState);
    
    if (newState) {
      console.log('[Audio] User enabling audio - testing unlock...');
      // Force unlock audio on TV browsers by triggering immediately
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); // Clear any pending
        setTimeout(() => {
          console.log('[Audio] Playing test audio to confirm unlock...');
          testAudio(); // Test after short delay
        }, 100);
      } else {
        console.error('[Audio] Cannot enable - Speech synthesis not supported in this browser');
        alert('Audio announcements are not supported in this browser. Please use Chrome, Edge, or Safari.');
      }
    } else {
      console.log('[Audio] User disabling audio');
      window.speechSynthesis.cancel();
    }
  };

  // Function to announce patient
  const announcePatient = (queueNumber: number) => {
    console.log(`[Audio] Attempting to announce patient #${queueNumber}, audioEnabled: ${audioEnabled}`);
    
    if (!audioEnabled) {
      console.log('[Audio] Announcement cancelled - audio is disabled');
      return;
    }
    
    const message = `Calling patient number ${queueNumber}. Please proceed to the counter.`;
    
    // Use Web Speech API for text-to-speech
    if ('speechSynthesis' in window) {
      console.log('[Audio] Speech synthesis available, speaking...');
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.lang = 'en-US';
      utterance.rate = 0.9; // Slightly slower for clarity
      utterance.pitch = 1;
      utterance.volume = 1;
      
      utterance.onstart = () => console.log('[Audio] Started speaking (1st time)');
      utterance.onerror = (e) => console.error('[Audio] Error:', e);
      
      // Cancel any ongoing speech before starting new one
      window.speechSynthesis.cancel();
      
      // Speak the first time
      window.speechSynthesis.speak(utterance);
      
      // Speak the second time after the first one finishes
      utterance.onend = () => {
        console.log('[Audio] First announcement complete, starting second...');
        const secondUtterance = new SpeechSynthesisUtterance(message);
        secondUtterance.lang = 'en-US';
        secondUtterance.rate = 0.9;
        secondUtterance.pitch = 1;
        secondUtterance.volume = 1;
        secondUtterance.onstart = () => console.log('[Audio] Started speaking (2nd time)');
        secondUtterance.onend = () => console.log('[Audio] All announcements complete');
        window.speechSynthesis.speak(secondUtterance);
      };
    } else {
      console.error('[Audio] Speech synthesis not supported in this browser');
    }
  };

  // Fetch latest queue data with patient details
  const fetchQueue = async () => {
    const fetchStartTime = Date.now();
    try {
      console.log('[Fetch] Starting queue fetch...');
      const { data, error } = await supabase
        .from('queue')
        .select(`
          id,
          patient_id,
          patient_name,
          queue_number,
          priority,
          status,
          timestamp,
          patients:patient_id (age, medical_history)
        `)
        .order('queue_number', { ascending: true });

      if (error) {
        console.error('[Fetch] Error fetching queue:', error);
      } else if (data) {
        const fetchTime = Date.now() - fetchStartTime;
        console.log(`[Fetch] ✅ Received ${data.length} queue items in ${fetchTime}ms`);
        // Map Supabase data to QueueItemWithDetails format and determine priority reason
        const mappedQueue = data.map((q: any) => {
          let priorityReason: 'senior' | 'pwd' | 'pregnant' | 'none' = 'none';
          const age = q.patients?.[0]?.age;
          const medicalHistory = q.patients?.[0]?.medical_history || [];

          // Determine priority reason based on patient details
          if (age && age >= 60) {
            priorityReason = 'senior';
          } else if (medicalHistory.some((h: string) => h.toLowerCase().includes('pwd') || h.toLowerCase().includes('disability'))) {
            priorityReason = 'pwd';
          } else if (medicalHistory.some((h: string) => h.toLowerCase().includes('pregnan'))) {
            priorityReason = 'pregnant';
          }

          return {
            id: q.id,
            patientId: q.patient_id,
            patientName: q.patient_name,
            queueNumber: q.queue_number,
            priority: q.priority || (priorityReason !== 'none' ? 'priority' : 'normal'),
            status: q.status,
            timestamp: q.timestamp,
            age,
            medicalHistory,
            priorityReason
          };
        });
        
        // Detect newly serving patients and announce them
        const currentServingIds = new Set(
          mappedQueue.filter(q => q.status === 'serving').map(q => q.id)
        );
        
        // Only announce if it's not the initial load
        if (!isInitialLoad) {
          // Find patients that are newly serving (not in lastServedIds)
          const newlyServing = mappedQueue.filter(
            q => q.status === 'serving' && !lastServedIds.has(q.id)
          );
          
          console.log(`[Queue] Newly serving patients: ${newlyServing.length}`, newlyServing.map(p => `#${p.queueNumber}`));
          
          // Announce newly serving patients
          newlyServing.forEach(patient => {
            console.log(`[Queue] Calling announcePatient for #${patient.queueNumber}`);
            announcePatient(patient.queueNumber);
          });
        } else {
          // Mark initial load as complete
          console.log('[Queue] Initial load complete, future updates will trigger announcements');
          setIsInitialLoad(false);
        }
        
        // Update the last served IDs
        setLastServedIds(currentServingIds);
        
        setQueue(mappedQueue);
        setLastUpdate(new Date());
      }
    } catch (err) {
      console.error('Error in fetchQueue:', err);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Format time in Philippines timezone (PHT - UTC+8)
  const formatPhilippinesTime = (date: Date) => {
    return date.toLocaleString('en-PH', {
      timeZone: 'Asia/Manila',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  // Polling with settings-based interval (backup for real-time)
  useEffect(() => {
    // Fetch immediately on mount
    console.log('[Polling] Initial fetch on mount');
    fetchQueue();

    const settings = settingsManager.load();
    if (!settings.display.autoRefresh) {
      // If auto-refresh is disabled, only fetch once on mount
      console.log('[Polling] Auto-refresh disabled, no polling');
      return;
    }

    // Use refresh interval from settings (convert to milliseconds)
    const refreshInterval = settings.display.refreshInterval * 1000;
    console.log(`[Polling] Setting up backup polling every ${refreshInterval}ms (${settings.display.refreshInterval}s)`);

    // Set up polling as backup (real-time subscription is primary)
    const pollInterval = setInterval(() => {
      console.log('[Polling] Backup fetch triggered');
      fetchQueue();
    }, refreshInterval);

    // Listen for settings changes
    const unsubscribe = settingsManager.subscribe((newSettings) => {
      if (!newSettings.display.autoRefresh) {
        clearInterval(pollInterval);
      }
    });

    return () => {
      clearInterval(pollInterval);
      unsubscribe();
    };
  }, []);

  // Real-time subscription for instant updates
  useEffect(() => {
    let subscription: any;

    const setupSubscription = async () => {
      try {
        console.log('[Real-time] Setting up queue subscription...');
        subscription = supabase
          .channel('queue-changes-tv-display')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'queue'
            },
            (payload) => {
              console.log('[Real-time] Queue changed:', payload.eventType, payload.new || payload.old);
              // Fetch immediately when there's a change
              fetchQueue();
            }
          )
          .subscribe((status) => {
            console.log('[Real-time] Subscription status:', status);
            if (status === 'SUBSCRIBED') {
              console.log('[Real-time] ✅ Connected - TV display will update instantly');
            } else if (status === 'CHANNEL_ERROR') {
              console.error('[Real-time] ❌ Subscription error - falling back to polling only');
            }
          });
      } catch (err) {
        console.error('[Real-time] Error setting up subscription:', err);
      }
    };

    setupSubscription();

    return () => {
      if (subscription) {
        console.log('[Real-time] Cleaning up subscription');
        supabase.removeChannel(subscription);
      }
    };
  }, []);

  // Cleanup speech synthesis on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const currentlyServing = queue.filter(item => item.status === 'serving');
  const waitingQueue = queue
    .filter(item => item.status === 'waiting')
    .sort((a, b) => {
      // First sort by database priority (priority patients first)
      if (a.priority !== b.priority) {
        return a.priority === 'priority' ? -1 : 1;
      }
      
      // Then by queue number (lower number first)
      return a.queueNumber - b.queueNumber;
    });

  return (
    <div className="w-screen h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 text-gray-900 flex flex-col overflow-hidden">
      <style>{`
        * { box-sizing: border-box; }
        body, html { margin: 0; padding: 0; overflow: hidden; }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(var(--primary-rgb), 0.3); }
          50% { box-shadow: 0 0 40px rgba(var(--primary-rgb), 0.6); }
        }
        .serving-card {
          animation: pulse-glow 2s ease-in-out infinite;
        }
      `}</style>

      {/* Professional Healthcare Header */}
      <div className="bg-gradient-to-r from-white via-blue-50/30 to-white shadow-lg flex-shrink-0 px-8 py-6 border-b-4 border-primary/20">
        <div className="flex items-center justify-between gap-6">
          {/* Branding Section */}
          <div className="flex items-center gap-6">
            <div className="bg-white rounded-2xl p-3 shadow-md border-2 border-primary/10">
              <img 
                src="/mho-logo.png" 
                alt="MHO Logo" 
                className="w-16 h-16 object-contain"
              />
            </div>
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold text-primary tracking-tight mb-1">
                Patient Queue
              </h1>
              <p className="text-base lg:text-lg text-gray-600 font-medium">
                Municipal Health Office • Dupax Del Sur
              </p>
            </div>
          </div>

          {/* Status & Controls */}
          <div className="flex items-center gap-4">
            {/* Live Indicator */}
            <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-xl border-2 border-green-200">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-semibold text-green-700">LIVE</span>
            </div>
            
            {/* Audio Toggle */}
            <button
              onClick={toggleAudio}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl transition-all duration-200 font-semibold shadow-md ${
                audioEnabled 
                  ? 'bg-primary text-white hover:bg-primary/90 hover:shadow-lg' 
                  : 'bg-amber-400 text-gray-900 hover:bg-amber-500 animate-pulse'
              }`}
              title={audioEnabled ? 'Disable audio announcements' : 'Click to enable audio announcements'}
            >
              {audioEnabled ? (
                <Volume2 className="w-5 h-5" />
              ) : (
                <VolumeX className="w-5 h-5" />
              )}
              <span className="hidden md:inline text-sm">
                {audioEnabled ? 'AUDIO ON' : 'ENABLE AUDIO'}
              </span>
            </button>

            {/* Time Display */}
            <div className="flex items-center gap-3 bg-gradient-to-r from-primary/5 to-primary/10 px-5 py-3 rounded-xl border-2 border-primary/20">
              <Clock className="w-6 h-6 text-primary" />
              <span className="text-3xl font-mono font-bold text-primary">
                {formatPhilippinesTime(currentTime)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Professional Healthcare Layout */}
      <div className="flex-1 grid grid-rows-[auto_1fr] gap-8 p-8 overflow-hidden">
        
        {/* Now Serving Section - Prominent Display */}
        <div className="flex flex-col">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-2 h-12 bg-gradient-to-b from-primary to-primary-dark rounded-full"></div>
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 uppercase tracking-tight">
                Now Serving
              </h2>
              <p className="text-sm lg:text-base text-gray-500 font-medium mt-1">
                Please proceed to the consultation room
              </p>
            </div>
          </div>
          
          {currentlyServing.length === 0 ? (
            <motion.div 
              className="bg-white rounded-3xl shadow-xl border-2 border-gray-100 p-12 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="flex flex-col items-center gap-4">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                  <Clock className="w-10 h-10 text-gray-400" />
                </div>
                <p className="text-2xl lg:text-3xl text-gray-400 font-semibold">
                  Waiting for next patient
                </p>
                <p className="text-base text-gray-400">
                  Please wait while we prepare for your consultation
                </p>
              </div>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              <AnimatePresence mode="popLayout">
                {currentlyServing.map((item, index) => (
                  <motion.div 
                    key={item.id} 
                    className="serving-card bg-gradient-to-br from-white to-primary/5 border-4 border-primary rounded-3xl p-8 flex flex-col justify-center items-center text-center shadow-2xl hover:scale-105 transition-transform duration-300"
                    style={{ '--primary-rgb': '14, 116, 144' } as React.CSSProperties}
                    initial={{ opacity: 0, scale: 0.8, y: 50 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: -50 }}
                    transition={{ 
                      duration: 0.5,
                      delay: index * 0.1,
                      type: "spring",
                      stiffness: 100
                    }}
                  >
                  <div className="bg-primary/10 rounded-2xl px-5 py-2 mb-4">
                    <p className="text-sm lg:text-base font-bold text-primary uppercase tracking-wider">
                      Now Serving
                    </p>
                  </div>
                  <div 
                    className="text-7xl lg:text-8xl xl:text-9xl font-black text-primary leading-none mb-4"
                    style={{ fontVariantNumeric: 'tabular-nums' }}
                  >
                    {String(item.queueNumber).padStart(3, '0')}
                  </div>
                  
                  {item.priorityReason !== 'none' && (
                    <div className="bg-gradient-to-r from-amber-100 to-amber-50 border-2 border-amber-200 rounded-2xl px-4 py-2 inline-flex items-center gap-2 mt-2">
                      {item.priorityReason === 'senior' && (
                        <>
                          <Users className="w-5 h-5 text-amber-700" />
                          <span className="text-sm font-bold text-amber-700">SENIOR CITIZEN</span>
                        </>
                      )}
                      {item.priorityReason === 'pwd' && (
                        <>
                          <Heart className="w-5 h-5 text-amber-700" />
                          <span className="text-sm font-bold text-amber-700">PWD</span>
                        </>
                      )}
                      {item.priorityReason === 'pregnant' && (
                        <>
                          <Baby className="w-5 h-5 text-amber-700" />
                          <span className="text-sm font-bold text-amber-700">PREGNANT</span>
                        </>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Waiting Queue - Professional Grid Display */}
        <div className="flex flex-col overflow-hidden bg-white rounded-3xl shadow-xl border-2 border-gray-100 p-8">
          <div className="flex items-center justify-between mb-6 flex-shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-2 h-12 bg-gradient-to-b from-primary to-primary-dark rounded-full"></div>
              <div>
                <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 uppercase tracking-tight">
                  Waiting Queue
                </h2>
                <p className="text-sm lg:text-base text-gray-500 font-medium mt-1">
                  Your queue number will be called soon
                </p>
              </div>
            </div>
            <div className="bg-gradient-to-br from-primary to-primary-dark text-white px-8 py-4 rounded-2xl shadow-lg">
              <p className="text-sm font-semibold uppercase tracking-wider opacity-90 mb-1">
                In Queue
              </p>
              <p className="text-4xl lg:text-5xl font-black">
                {waitingQueue.length}
              </p>
            </div>
          </div>

          {waitingQueue.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <div className="text-5xl">✓</div>
                </div>
                <p className="text-2xl lg:text-3xl text-gray-400 font-semibold mb-2">
                  All patients served
                </p>
                <p className="text-base text-gray-400">
                  Thank you for your patience
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin' }}>
              <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 2xl:grid-cols-12 gap-4 pb-4">
                <AnimatePresence mode="popLayout">
                  {waitingQueue.map((item, index) => (
                    <motion.div
                      key={item.id}
                      className={`rounded-2xl text-center flex flex-col items-center justify-center p-6 transition-all duration-300 hover:scale-110 shadow-lg ${
                        item.priority === 'priority'
                          ? 'bg-gradient-to-br from-amber-400 via-amber-300 to-yellow-300 border-3 border-amber-500 shadow-amber-200'
                          : 'bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 hover:border-primary/30'
                      }`}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      transition={{
                        duration: 0.3,
                        delay: Math.min(index * 0.02, 0.5)
                      }}
                      layout
                    >
                    {/* Priority Badge */}
                    {item.priority === 'priority' && (
                      <div className="mb-2 bg-white/90 backdrop-blur rounded-full px-3 py-1">
                        <span className="text-xs font-bold text-amber-700">PRIORITY</span>
                      </div>
                    )}
                    
                    {/* Queue Number */}
                    <div 
                      className={`text-5xl lg:text-6xl xl:text-7xl font-black leading-none ${
                        item.priority === 'priority' ? 'text-gray-900' : 'text-primary'
                      }`} 
                      style={{ fontVariantNumeric: 'tabular-nums' }}
                    >
                      {String(item.queueNumber).padStart(2, '0')}
                    </div>
                    
                    {/* Priority Reason Icon */}
                    {item.priority === 'priority' && item.priorityReason !== 'none' && (
                      <div className="mt-3 bg-white/90 backdrop-blur rounded-full p-2">
                        {item.priorityReason === 'senior' && (
                          <Users className="w-5 h-5 text-amber-700" />
                        )}
                        {item.priorityReason === 'pwd' && (
                          <Heart className="w-5 h-5 text-amber-700" />
                        )}
                        {item.priorityReason === 'pregnant' && (
                          <Baby className="w-5 h-5 text-amber-700" />
                        )}
                      </div>
                    )}

                    {/* Position Indicator for top 3 */}
                    {!item.priority && index < 3 && (
                      <div className="mt-2 bg-primary/10 rounded-full px-2 py-1">
                        <span className="text-xs font-bold text-primary">NEXT</span>
                      </div>
                    )}
                  </motion.div>
                ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Footer Information */}
          <div className="flex-shrink-0 mt-6 pt-6 border-t-2 border-gray-100">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-gradient-to-br from-amber-400 to-yellow-300 border border-amber-500"></div>
                  <span className="text-gray-600 font-medium">Priority Patient</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-gradient-to-br from-white to-gray-50 border-2 border-primary"></div>
                  <span className="text-gray-600 font-medium">Regular Queue</span>
                </div>
              </div>
              <p className="text-gray-500 font-medium">
                Thank you for your patience • Please maintain social distancing
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QueueDisplay;
