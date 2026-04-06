import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://ohobjnbsybdxntaewqdi.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ob2JqbmJzeWJkeG50YWV3cWRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDgwMTE5OCwiZXhwIjoyMDkwMzc3MTk4fQ.2UM0QBtAY0kau7ObkRNETZZFaUR3iRnaB9VQ7_g-tA0'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
