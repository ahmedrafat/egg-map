import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://ohobjnbsybdxntaewqdi.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ob2JqbmJzeWJkeG50YWV3cWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4MDExOTgsImV4cCI6MjA5MDM3NzE5OH0.QtxJXFiMDvvA22aY0iEJGSDtojbvyI5IIO3x6KH9Dnc'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
