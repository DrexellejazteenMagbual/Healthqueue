import { supabase } from '../supabase';

// ANALYTICS TABLE OPERATIONS

export const analyticsService = {
  // Log patient visit
  async logPatientVisit(patientId: string, visitType: string = 'regular') {
    try {
      const { data, error } = await supabase
        .from('analytics')
        .insert([
          {
            patient_id: patientId,
            visit_type: visitType,
            timestamp: new Date().toISOString(),
            date: new Date().toISOString().split('T')[0]
          }
        ])
        .select();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Get daily visits
  async getDailyVisits(date?: string) {
    try {
      const queryDate = date || new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('analytics')
        .select('*')
        .eq('date', queryDate);

      if (error) throw error;
      return { data: data?.length || 0, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Get weekly visits
  async getWeeklyVisits() {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const dateString = sevenDaysAgo.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('analytics')
        .select('*')
        .gte('date', dateString);

      if (error) throw error;
      return { data: data?.length || 0, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Get monthly visits
  async getMonthlyVisits() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const dateString = thirtyDaysAgo.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('analytics')
        .select('*')
        .gte('date', dateString);

      if (error) throw error;
      return { data: data?.length || 0, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Get visit statistics by date range
  async getVisitStats(startDate: string, endDate: string) {
    try {
      const { data, error } = await supabase
        .from('analytics')
        .select('date, visit_type')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

      if (error) throw error;

      // Group data by date
      const stats: { [key: string]: number } = {};
      if (data) {
        data.forEach((record: any) => {
          stats[record.date] = (stats[record.date] || 0) + 1;
        });
      }

      return { data: stats, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Get common illness tracking
  async trackIllness(patientId: string, illness: string) {
    try {
      const { data, error } = await supabase
        .from('illness_tracking')
        .insert([
          {
            patient_id: patientId,
            illness_name: illness,
            timestamp: new Date().toISOString(),
            date: new Date().toISOString().split('T')[0]
          }
        ])
        .select();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Get common illnesses
  async getCommonIllnesses(limit = 10) {
    try {
      const { data, error } = await supabase
        .from('illness_tracking')
        .select('illness_name')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Count occurrences
      const illnessCounts: { [key: string]: number } = {};
      if (data) {
        data.forEach((record: any) => {
          illnessCounts[record.illness_name] = (illnessCounts[record.illness_name] || 0) + 1;
        });
      }

      // Get top illnesses
      const topIllnesses = Object.entries(illnessCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, limit)
        .map(([name, count]) => ({ name, count }));

      return { data: topIllnesses, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }
};
