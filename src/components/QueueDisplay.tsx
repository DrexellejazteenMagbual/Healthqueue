import React, { useEffect, useState } from 'react';
import { QueueItem } from '../types';
import { Clock, Heart, Users, Baby } from 'lucide-react';
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

  // Fetch latest queue data with patient details
  const fetchQueue = async () => {
    try {
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
        console.error('Error fetching queue:', error);
      } else if (data) {
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

  // Polling with settings-based interval
  useEffect(() => {
    // Fetch immediately on mount
    fetchQueue();

    const settings = settingsManager.load();
    if (!settings.display.autoRefresh) {
      // If auto-refresh is disabled, only fetch once on mount
      return;
    }

    // Use refresh interval from settings (convert to milliseconds)
    const refreshInterval = settings.display.refreshInterval * 1000;

    // Set up polling
    const pollInterval = setInterval(() => {
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

  // Real-time subscription
  useEffect(() => {
    let subscription: any;

    const setupSubscription = async () => {
      try {
        subscription = supabase
          .channel('queue-changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'queue'
            },
            () => {
              // When there's a change, fetch the latest data
              fetchQueue();
            }
          )
          .subscribe((status) => {
            console.log('Subscription status:', status);
          });
      } catch (err) {
        console.error('Error setting up subscription:', err);
      }
    };

    setupSubscription();

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
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
    <div className="w-screen h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 text-gray-900 flex flex-col overflow-hidden">
      <style>{`
        * { box-sizing: border-box; }
        body, html { margin: 0; padding: 0; overflow: hidden; }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.5); }
          50% { box-shadow: 0 0 40px rgba(59, 130, 246, 0.8); }
        }
        .serving-card {
          animation: pulse-glow 2s ease-in-out infinite;
        }
      `}</style>

      {/* Header - Compact for TV */}
      <div className="bg-gradient-to-r from-primary via-primary-middle to-primary-dark text-white flex-shrink-0 px-4 sm:px-6 py-3 sm:py-4 shadow-xl">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 sm:gap-4">
            <img 
              src="/mho-logo.png" 
              alt="MHO Logo" 
              className="w-12 h-12 sm:w-16 sm:h-16 object-contain drop-shadow-lg"
            />
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-none tracking-tight">
                QUEUE DISPLAY
              </h1>
              <p className="text-xs sm:text-sm lg:text-base text-white/90 mt-0.5">
                Municipal Health Office - Dupax Del Sur
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="text-xl sm:text-2xl lg:text-3xl font-mono font-bold tracking-wider">
              {formatPhilippinesTime(currentTime)}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content - Responsive Grid Layout */}
      <div className="flex-1 grid grid-rows-[auto_1fr] gap-3 sm:gap-4 p-3 sm:p-4 lg:p-6 overflow-hidden">
        
        {/* Now Serving Section - Compact */}
        <div className="flex flex-col">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary mb-2 sm:mb-3">
            NOW SERVING
          </h2>
          
          {currentlyServing.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-3 sm:p-4 text-center">
              <p className="text-base sm:text-xl text-gray-400 font-medium">
                Waiting for next patient...
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3">
              {currentlyServing.map((item) => (
                <div 
                  key={item.id} 
                  className="serving-card bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white p-3 sm:p-4 rounded-2xl border-4 border-blue-400 flex flex-col justify-center items-center text-center relative overflow-hidden"
                >
                  {/* Background decoration */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-white rounded-full -mr-10 -mt-10"></div>
                    <div className="absolute bottom-0 left-0 w-16 h-16 bg-white rounded-full -ml-8 -mb-8"></div>
                  </div>
                  
                  <div className="relative z-10 w-full">
                    <p className="text-xs sm:text-sm font-bold mb-1 uppercase tracking-wider">
                        Serving patient
                    </p>
                    <div 
                      className="text-2xl sm:text-5xl lg:text-6xl font-black leading-none mb-2 drop-shadow-2xl" 
                      style={{ fontVariantNumeric: 'tabular-nums' }}
                    >
                      {String(item.queueNumber).padStart(3, '0')}
                    </div>
                    
                    {item.priorityReason !== 'none' && (
                      <div className="bg-white/20 backdrop-blur-sm rounded-full px-2 py-1 inline-flex items-center gap-1">
                        {item.priorityReason === 'senior' && (
                          <>
                            <Users className="w-3 h-3" />
                            <span className="text-[10px] sm:text-xs font-bold">SENIOR</span>
                          </>
                        )}
                        {item.priorityReason === 'pwd' && (
                          <>
                            <Heart className="w-3 h-3" />
                            <span className="text-[10px] sm:text-xs font-bold">PWD</span>
                          </>
                        )}
                        {item.priorityReason === 'pregnant' && (
                          <>
                            <Baby className="w-3 h-3" />
                            <span className="text-[10px] sm:text-xs font-bold">PREGNANT</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Waiting Queue - Scrollable Grid */}
        <div className="flex flex-col overflow-hidden bg-white rounded-xl shadow-lg border-2 border-gray-200 p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2 sm:mb-3 flex-shrink-0">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary">
              WAITING QUEUE
            </h2>
            <div className="bg-primary text-white px-3 py-1 rounded-full">
              <p className="text-lg sm:text-xl lg:text-2xl font-bold">
                {waitingQueue.length}
              </p>
            </div>
          </div>

          {waitingQueue.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-base sm:text-xl lg:text-2xl text-gray-200 font-medium">
                All patients have been served ✓
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 2xl:grid-cols-14 gap-2 sm:gap-3 pb-2">
                {waitingQueue.map((item) => (
                  <div
                    key={item.id}
                    className={`rounded-xl text-center border-4 flex flex-col items-center justify-center p-2 sm:p-3 transition-all duration-300 hover:scale-105 ${
                      item.priority === 'priority'
                        ? 'bg-gradient-to-br from-amber-400 to-orange-500 border-amber-600 shadow-lg'
                        : 'bg-gradient-to-br from-gray-100 to-gray-200 border-gray-400 shadow-md'
                    }`}
                  >
                    <div 
                      className={`text-3xl sm:text-4xl lg:text-5xl font-black leading-none ${
                        item.priority === 'priority' ? 'text-white drop-shadow-lg' : 'text-gray-700'
                      }`} 
                      style={{ fontVariantNumeric: 'tabular-nums' }}
                    >
                      {String(item.queueNumber).padStart(2, '0')}
                    </div>
                    
                    {item.priority === 'priority' && item.priorityReason !== 'none' && (
                      <div className="mt-1 flex items-center justify-center gap-0.5">
                        {item.priorityReason === 'senior' && (
                          <Users className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                        )}
                        {item.priorityReason === 'pwd' && (
                          <Heart className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                        )}
                        {item.priorityReason === 'pregnant' && (
                          <Baby className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QueueDisplay;
