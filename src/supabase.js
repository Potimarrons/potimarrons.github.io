const SUPABASE_URL = "https://joueovqgajmrypmbxysf.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvdWVvdnFnYWptcnlwbWJ4eXNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyNzEzOTgsImV4cCI6MjA4NDg0NzM5OH0.BeuRd-bFjgfDbm1qKd5zt-ZI3JVp0eK4DXftpuEt3n0";

const sb = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);