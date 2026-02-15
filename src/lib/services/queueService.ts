import { supabase } from '../supabase';
import { QueueItem } from '../../types';

// QUEUE TABLE OPERATIONS

export const queueService = {
  // Add patient to queue
  async addToQueue(queueItem: Omit<QueueItem, 'id'>) {
    try {
      const { data, error } = await supabase
        .from('queue')
        .insert([
          {
            patient_id: queueItem.patientId,
            patient_name: queueItem.patientName,
            queue_number: queueItem.queueNumber,
            priority: queueItem.priority,
            status: queueItem.status,
            timestamp: queueItem.timestamp
          }
        ])
        .select();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Get current queue
  async getQueue() {
    try {
      const { data, error } = await supabase
        .from('queue')
        .select('*')
        .in('status', ['waiting', 'called', 'serving'])
        .order('priority', { ascending: false })
        .order('queue_number', { ascending: true });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Update queue status
  async updateQueueStatus(id: string, status: QueueItem['status']) {
    try {
      const { data, error } = await supabase
        .from('queue')
        .update({ status })
        .eq('id', id)
        .select();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Remove from queue
  async removeFromQueue(id: string) {
    try {
      const { data, error } = await supabase
        .from('queue')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Get queue statistics
  async getQueueStats() {
    try {
      const { data: waitingCount, error: error1 } = await supabase
        .from('queue')
        .select('*', { count: 'exact' })
        .eq('status', 'waiting');

      const { data: servingCount, error: error2 } = await supabase
        .from('queue')
        .select('*', { count: 'exact' })
        .eq('status', 'serving');

      const { data: priorityCount, error: error3 } = await supabase
        .from('queue')
        .select('*', { count: 'exact' })
        .eq('priority', 'priority')
        .eq('status', 'waiting');

      if (error1 || error2 || error3) throw new Error('Error fetching stats');

      return {
        data: {
          waiting: waitingCount?.length || 0,
          serving: servingCount?.length || 0,
          priority: priorityCount?.length || 0
        },
        error: null
      };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Get queue history
  async getQueueHistory(limit = 50) {
    try {
      const { data, error } = await supabase
        .from('queue')
        .select('*')
        .eq('status', 'completed')
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }
};
