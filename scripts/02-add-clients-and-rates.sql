-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  hourly_rate DECIMAL(10,2) DEFAULT 0,
  color VARCHAR(7) DEFAULT '#22c55e',
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add client_id and hourly_rate to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE CASCADE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(10,2);

-- Add hourly_rate to activities table
ALTER TABLE activities ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(10,2);

-- Create RLS policy for clients
CREATE POLICY "Users can only see their own clients" ON clients
  FOR ALL USING (auth.uid() = user_id);

-- Enable RLS on clients table
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);

-- Update existing projects to have a default client (optional migration)
-- This creates a "Personal" client for existing projects without a client
DO $$
DECLARE
    user_record RECORD;
    default_client_id UUID;
BEGIN
    FOR user_record IN SELECT DISTINCT user_id FROM projects WHERE client_id IS NULL
    LOOP
        -- Create default client for this user
        INSERT INTO clients (name, description, user_id, hourly_rate)
        VALUES ('Personal', 'Default client for personal projects', user_record.user_id, 0)
        RETURNING id INTO default_client_id;
        
        -- Update projects to use this default client
        UPDATE projects 
        SET client_id = default_client_id 
        WHERE user_id = user_record.user_id AND client_id IS NULL;
    END LOOP;
END $$;

-- Make client_id required for new projects
ALTER TABLE projects ALTER COLUMN client_id SET NOT NULL;
