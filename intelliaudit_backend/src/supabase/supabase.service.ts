import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private clientInstance: SupabaseClient;

  constructor() {
    this.clientInstance = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_KEY || '',
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );
  }

  getClient() {
    return this.clientInstance;
  }

  async verifyConnection() {
    const { data, error } = await this.clientInstance
      .from('storage.buckets')
      .select('name')
      .limit(1);

    if (error) {
      throw new Error(`Supabase connection failed: ${error.message}`);
    }
    return data;
  }
}