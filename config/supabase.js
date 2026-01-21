// Supabase Configuration
// Your Supabase credentials

const SUPABASE_URL = "https://hoftpsvhqqlnsojhjvod.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvZnRwc3ZocXFsbnNvamhqdm9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5NzczNTYsImV4cCI6MjA4NDU1MzM1Nn0.5OxrVq00D7_LkNPMHQyIor5s6h_gYlQ5Jfw_YbAffXk";

// Discord OAuth Configuration
const DISCORD_CLIENT_ID = "1462789095787855914";
const DISCORD_REDIRECT_URI = "https://plork.store/login.html";

// Initialize Supabase client
// Check if supabase library is loaded
if (typeof window.supabase === "undefined") {
  console.error(
    "Supabase library not loaded! Make sure the CDN script is included before this file.",
  );
  alert("Error: Supabase library not loaded. Please refresh the page.");
} else {
  try {
    const supabase = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
    );

    // Export for use in other files
    window.supabaseClient = supabase;
    window.discordConfig = {
      clientId: DISCORD_CLIENT_ID,
      redirectUri: DISCORD_REDIRECT_URI,
    };

    console.log("✅ Supabase client initialized successfully");
  } catch (error) {
    console.error("❌ Error initializing Supabase client:", error);
    alert(
      "Error connecting to database. Please check your internet connection.",
    );
  }
}
