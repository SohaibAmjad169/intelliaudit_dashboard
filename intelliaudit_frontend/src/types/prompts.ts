export interface AIPrompt {
  id: string;
  name: string;
  description: string | null;
  prompt: string;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
  is_active: boolean;
}

export interface AIPromptVersion {
  id: string;
  prompt_id: string;
  prompt: string;
  created_at: string;
  created_by: string;
  version_number: number;
  change_description: string | null;
}

export interface AIPromptInput {
  name: string;
  description?: string;
  prompt: string;
}
