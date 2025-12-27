import logging
import os
import random
from datetime import datetime

import asyncio
from anyio import Path
from dotenv import load_dotenv
from livekit.agents import (
    Agent,
    AgentSession,
    JobContext,
    JobProcess,
    RoomInputOptions,
    RunContext,
    WorkerOptions,
    cli,
    metrics,
    AutoSubscribe,
)
from livekit.agents.voice import MetricsCollectedEvent
from livekit.plugins import google, noise_cancellation
from google.genai import types


from prompts import AGENT_INSTRUCTIONS, SESSION_INSTRUCTIONS, GENZ_AGENT_INSTRUCTIONS, GENZ_SESSION_INSTRUCTIONS
from livekit.agents.llm import function_tool
import json

# Initialize Logger
logger = logging.getLogger("agent")

# Load environment variables
dotenv_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
load_dotenv(dotenv_path)
supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_SERVICE_KEY") or os.environ.get("SUPABASE_KEY")

# Initialize Supabase Client
supabase = None
try:
    from supabase import create_client, Client
    if supabase_url and supabase_key:
        supabase: Client = create_client(supabase_url, supabase_key)
        logger.info("✅ Connected to Supabase!")
    else:
        logger.warning("⚠️ Supabase credentials missing. Database features will be disabled.")
except ImportError:
    logger.warning("⚠️ Supabase library not installed. Database features will be disabled.")
except Exception as e:
    logger.error(f"❌ Failed to connect to Supabase: {e}")

# ========== BYOK: Bring Your Own Key Functions ==========
async def get_user_gemini_key(user_id: str) -> str:
    """Fetch user's Gemini API key from Supabase. Falls back to platform key."""
    if not supabase:
        return os.environ.get("GOOGLE_API_KEY")
    
    try:
        result = supabase.table('profiles').select(
            'encrypted_gemini_key', 'subscription_tier'
        ).eq('id', user_id).single().execute()
        
        if result.data:
            api_key = result.data.get('encrypted_gemini_key')
            tier = result.data.get('subscription_tier', 'byok_free')
            
            if api_key:
                logger.info(f"✅ Using user's BYOK API key (tier: {tier})")
                return api_key
            elif tier == 'premium_plus':
                return os.environ.get("GOOGLE_API_KEY")
        
        logger.warning(f"⚠️ User {user_id} has no API key, using platform key")
        return os.environ.get("GOOGLE_API_KEY")
    except Exception as e:
        logger.error(f"❌ Error fetching user API key: {e}")
        return os.environ.get("GOOGLE_API_KEY")

async def check_session_limit(user_id: str) -> dict:
    """Check if user has sessions remaining this month."""
    if not supabase:
        return {'allowed': True, 'remaining': 999}
    try:
        result = supabase.rpc('can_start_session', {'p_user_id': user_id}).execute()
        return result.data if result.data else {'allowed': True}
    except Exception as e:
        logger.error(f"Session limit check error: {e}")
        return {'allowed': True}

async def increment_session_usage(user_id: str):
    """Increment user's session count."""
    if not supabase:
        return
    try:
        supabase.rpc('increment_session_count', {'p_user_id': user_id}).execute()
    except Exception as e:
        logger.error(f"Session increment error: {e}")

# LAZY import for RAG - moved to function to avoid blocking agent startup
_livekit_rag_func = None
_livekit_rag_initialized = False

async def _get_livekit_rag():
    """Lazy load livekit_rag to avoid startup timeout."""
    global _livekit_rag_func, _livekit_rag_initialized
    if _livekit_rag_initialized:
        return _livekit_rag_func
    
    try:
        logger.info("Initializing LiveKit RAG (first use)...")
        from livekit_rag import livekit_rag
        _livekit_rag_func = livekit_rag
        logger.info("✅ LiveKit RAG initialized")
    except Exception as e:
        logger.warning(f"Failed to load livekit_rag: {e}")
        async def _fallback(query: str):
            return "RAG is not available at the moment."
        _livekit_rag_func = _fallback
    
    _livekit_rag_initialized = True
    return _livekit_rag_func

# Imports for RAG with LlamaIndex - made optional and LAZY to avoid startup timeout
_llamaindex_initialized = False
workflow_agent, index, file_tools = None, None, None

def _init_llamaindex():
    """Lazy initialization of LlamaIndex to avoid blocking agent startup."""
    global _llamaindex_initialized, workflow_agent, index, file_tools
    if _llamaindex_initialized:
        return workflow_agent, index, file_tools
    
    try:
        logger.info("Initializing LlamaIndex (first use)...")
        from llamaindex_rag import setup_combined_agent
        workflow_agent, index, file_tools = setup_combined_agent()
        logger.info("✅ LlamaIndex initialized successfully")
    except Exception as e:
        logger.warning(f"Failed to load llamaindex_rag: {e}")
        workflow_agent, index, file_tools = None, None, None
    
    _llamaindex_initialized = True
    return workflow_agent, index, file_tools

# Import for AutoGen Operator - made optional
try:
    from autogen_operator import run_operator_task, search_therapists_near, book_therapy_appointment, get_crisis_help
except Exception as e:
    logger.warning(f"Failed to load autogen_operator: {e}")
    async def run_operator_task(task: str): return "AutoGen not available."
    async def search_therapists_near(location: str): return "AutoGen not available."
    async def book_therapy_appointment(therapist_id: str, date: str, time: str): return "AutoGen not available."
    async def get_crisis_help(): return "If you're in crisis, please call 988 Suicide & Crisis Lifeline."

# Import Browser Automation - made LAZY to avoid startup timeout
_browser_automation_func = None
_browser_initialized = False

async def _get_browser_automation():
    """Lazy load browser automation to avoid startup timeout."""
    global _browser_automation_func, _browser_initialized
    if _browser_initialized:
        return _browser_automation_func
    
    try:
        logger.info("Initializing Browser Automation (first use)...")
        from browser import run_browser_automation
        _browser_automation_func = run_browser_automation
        logger.info("✅ Browser Automation initialized")
    except Exception as e:
        logger.warning(f"Failed to load browser: {e}")
        async def _fallback(task: str):
            return "Browser automation not available."
        _browser_automation_func = _fallback
    
    _browser_initialized = True
    return _browser_automation_func

# Import shared data store (fallback)
from shared_data import shared_data

# Import user context manager for personalized AI
try:
    from user_context import load_user_context, build_personalized_instructions, get_context_manager
except Exception as e:
    logger.warning(f"Failed to load user_context: {e}")
    async def load_user_context(user_id: str): return {"name": "Friend"}
    def build_personalized_instructions(base: str, ctx: dict): return base
    def get_context_manager(): return None

# Available Gemini Live voices
GEMINI_VOICES = ["Kore", "Aoede", "Charon", "Fenrir", "Puck"]
DEFAULT_VOICE = "Kore"


def parse_participant_metadata(metadata: str) -> dict:
    """Parse participant metadata to extract voice and mode preferences."""
    try:
        if metadata:
            return json.loads(metadata)
    except json.JSONDecodeError:
        # Legacy format support: genz_mode=true
        if "genz_mode=true" in metadata:
            return {"genz_mode": True}
        elif "genz_mode=false" in metadata:
            return {"genz_mode": False}
    return {}



class Assistant(Agent):
    def __init__(self) -> None:
        super().__init__(instructions=AGENT_INSTRUCTIONS)

    # all functions annotated with @function_tool will be passed to the LLM when this
    # agent is active

    @function_tool
    async def connect_to_therapist_tool(self, context: RunContext, issue_summary: str, urgency: str = "normal"):
        """
        Connect the user with a licensed therapist. Use this when the user requests professional help
        or when you detect a complex issue that requires human intervention.
        
        Args:
            issue_summary: Brief summary of what the user wants to talk about (e.g., "Feeling overwhelmed with work", "Having panic attacks")
            urgency: "normal" (default), "high" (significant distress), or "crisis" (immediate danger)
        """
        try:
            logger.info(f"Connecting to therapist. Issue: {issue_summary}, Urgency: {urgency}")
            
            if not supabase:
                return "I'm currently unable to connect to the therapist network directly. Please visit the Therapist Directory on your dashboard."

            # Find a random available therapist for now (in production, use matching logic)
            therapist_response = supabase.table('therapists').select('id, profile:profiles(full_name)').limit(1).execute()
            
            if not therapist_response.data:
                return "I couldn't find an available therapist immediately. I've logged your request and someone will contact you shortly."
            
            therapist = therapist_response.data[0]
            
            # Since we don't know the current user ID in the backend context easily (unless passed in metadata),
            # we'll look for the most recently active user or match by room name if possible.
            # providing a simplified flow here:
            
            # Create session request
            # For demo, using a placeholder user ID if we can't find one, or hardcoding the first user for safety
            user_response = supabase.table('profiles').select('id').limit(1).execute()
            user_id = user_response.data[0]['id'] if user_response.data else None
            
            if user_id:
                supabase.table('therapist_session_requests').insert({
                    "user_id": user_id,
                    "therapist_id": therapist['id'],
                    "urgency": urgency,
                    "issue_summary": issue_summary,
                    "status": "pending"
                }).execute()
                
                return f"I've sent a request to Dr. {therapist.get('profile', {}).get('full_name', 'Therapist')}. They have been notified and will review your request shortly. Please check your dashboard for updates."
            else:
                 return "I'm having trouble identifying your account. Please make sure you are logged in."

        except Exception as e:
            logger.error(f"Therapist connection failed: {e}")
            return "I encountered an error connecting you. Please try the 'Find Therapist' button on your dashboard."

    @function_tool
    async def record_mood_tool(self, context: RunContext, mood_score: int, emotion: str, summary: str):
        """
        Record the user's current mood and emotional state for tracking progress.
        Call this periodically during the conversation or when the user expresses strong emotions.
        
        Args:
            mood_score: 1-10 scale (1=Very Low/Depressed, 5=Neutral, 10=Excellent/Happy)
            emotion: Primary emotion identified (e.g., "Anxious", "Hopeful", "Frustrated", "Joyful")
            summary: Brief observation of the user's state
        """
        try:
            logger.info(f"Recording mood: {mood_score}/10 - {emotion}")
            
            # Update shared data store (fallback)
            shared_data.update_scores("meditation", 1) # Just bumping activity count
            
            if supabase:
                # Find user (simplified logic as above)
                user_response = supabase.table('profiles').select('id').limit(1).execute()
                user_id = user_response.data[0]['id'] if user_response.data else None
                
                if user_id:
                    # Insert score
                    # Legacy code - table does not exist yet
                    # supabase.table('conversation_scores').insert({
                    #     "user_id": user_id,
                    #     "mood_score": mood_score,
                    #     "insights": [f"Emotion: {emotion}", summary],
                    #     "conversation_summary": summary
                    # }).execute()
                    
                    # Update wellness metrics
                    supabase.rpc('update_user_progress', { # We would need this RPC function
                        "p_user_id": user_id, 
                        "p_mood": mood_score 
                    }) # Or just insert metric directly:
                    
                    supabase.table('wellness_metrics').insert({
                        "user_id": user_id,
                        "mental_health_score": min(100, mood_score * 10),
                        "recorded_at": datetime.now().strftime("%Y-%m-%d")
                    }).execute() # This might fail unique constraint, but handling simply for now
                    
            return "I've noted that in your wellness journal."
            
        except Exception as e:
            logger.error(f"Mood recording failed: {e}")
            return "Thanks for sharing that."

    @function_tool
    async def fun_task_tool(self, context: RunContext, task_type: str, details: str):
        """
        Trigger a fun, interactive task or "Gen Z" mode action.
        Use this to lighten the mood, distract the user, or provide tough love.
        
        Args:
            task_type: One of: "block_ex", "touch_grass", "rage_playlist", "meme_therapy", "gratitude_gram"
            details: Contextual details (e.g., "User is obsessing over ex-boyfriend", "User is angry at boss")
        """
        try:
            logger.info(f"Triggering FUN TASK: {task_type} - {details}")
            
            # Lazy load browser automation
            browser_func = await _get_browser_automation()
            
            if task_type == "block_ex":
                # Launch browser to Instagram/social
                await browser_func("Go to Instagram setup page (simulated) for blocking profile")
                return "Okay bestie, I've opened the browser. Time to block that toxic energy! 🚫💅 Shall we proceed?"
                
            elif task_type == "touch_grass":
                # Open maps to nearest park
                await browser_func("Find nearest park or green space on Google Maps")
                return "I'm opening Maps. Detailed satellite scan reveals... you need sunlight. 🌳 Go touch some grass, literally."
                
            elif task_type == "rage_playlist":
                # Open Spotify
                await browser_func("Open Spotify and search for high energy workout or rock playlist")
                return "Opening Spotify. Queuing up the 'Rage Against the Machine' playlist. Let it all out! 🎸🔥"
                
            elif task_type == "meme_therapy":
                # Open Reddit/Pinterest
                await browser_func("Go to a funny wholesome meme website")
                return "Prescribing 500mg of wholesome memes. Opening browser now... 😸"
                
            return f"Opening browser for {task_type}..."
            
        except Exception as e:
            logger.error(f"Fun task failed: {e}")
            return "I tried to open that designed task but got stuck. Let's just talk about it!"

    @function_tool
    async def LiveKit_RAG_tool(self, context: RunContext, query: str):
        """
        Use this tool to get the data quickly from Livekit RAG model

        Args:
            query: The query to get the data for
        """

        try:
            # Lazy load RAG to avoid startup timeout
            rag_func = await _get_livekit_rag()
            response = await rag_func(query)
            logger.info(f"Livekit RAG Response: {response}")
            return str(response)

        except Exception as e:
            logger.error(f"Error during workflow execution in LlamaIndex RAG tool: {e}")
            return "I encountered an error while searching the knowledge base."

    @function_tool
    async def Llamaindex_RAG_tool(self, context: RunContext, query: str):
        """
        Only use this tool when deep reasoning is needed.

        Args:
            query: The query to get the data for
        """

        try:
            # Lazy initialize LlamaIndex on first use
            agent, _, _ = _init_llamaindex()
            if not agent:
                return "Deep reasoning is not available at the moment."
            
            response = await agent.run(query)
            logger.info(f"Workflow Response: {response}")
            return str(response)

        except Exception as e:
            logger.error(f"Error during workflow execution: {e}")
            return "I encountered an error while processing your complex query."

    @function_tool
    async def autogen_operator_tool(self, context: RunContext, task: str):
        """
        Use this tool for complex automation tasks that require web browsing and interaction.
        This can help with booking appointments, searching for services, filling out forms, etc.
        
        Examples:
        - "Book a therapy appointment at Psychology Today for someone in Atlanta"
        - "Search for mental health crisis centers in Los Angeles"
        - "Find and compare therapist profiles in Boston"
        - "Look up insurance coverage for therapy in Miami"
        
        Args:
            task: Detailed description of the automation task to perform
        """
        try:
            logger.info(f"Running AutoGen operator for task: {task}")
            response = await run_operator_task(task)
            return str(response)
        except Exception as e:
            logger.error(f"AutoGen operator failed: {e}")
            return "I encountered an issue with the automation. Let me help you with the information I have available instead."

    @function_tool
    async def browser_automation_tool(self, context: RunContext, task: str, max_steps: int = 50, headless: bool = True):
        """
        Use this tool to perform advanced browser automation tasks with real-time streaming capabilities.
        This tool provides comprehensive web automation including form filling, navigation, data extraction, 
        and interaction with websites. Perfect for complex multi-step web tasks.
        
        Examples:
        - "Navigate to Psychology Today and search for therapists in San Francisco"
        - "Fill out a contact form on a mental health clinic website"
        - "Book an appointment on a therapy booking platform"
        - "Extract therapist information and contact details from multiple clinic websites"
        - "Search for mental health resources and compile a list"
        - "Navigate through insurance provider websites to check therapy coverage"
        
        Args:
            task: Detailed description of the browser automation task to perform
            max_steps: Maximum number of automation steps to perform (default: 50)
            headless: Whether to run browser in headless mode (default: True)
        """
        try:
            logger.info(f"Starting browser automation task: {task}")
            
            # Lazy load browser automation
            browser_func = await _get_browser_automation()
            
            # Call the browser automation function from browser.py
            result = await browser_func(task)
            
            logger.info(f"Browser automation completed successfully")
            return str(result)
            
        except Exception as e:
            logger.error(f"Browser automation failed: {e}")
            return f"I encountered an error while performing the browser automation task: {str(e)}. I can still help you with information I have available or try a different approach."

    @function_tool
    async def find_therapists_tool(self, context: RunContext, location: str, specialty: str = "anxiety"):
        """
        Search for mental health therapists in a specific location and specialty.
        
        Args:
            location: The city or area to search in (e.g., "San Francisco", "New York")
            specialty: The type of therapy specialization (e.g., "anxiety", "depression", "trauma", "couples")
        """
        try:
            logger.info(f"Searching for {specialty} therapists in {location}")
            
            # First, recommend our internal therapist directory
            internal_directory_response = f"""
I can help you find qualified therapists for {specialty} treatment in {location}! 

🏥 **MindCure Therapist Directory**: I recommend starting with our curated therapist directory at localhost:3000/therapist-directory where you'll find:
- Licensed therapists specializing in {specialty}
- Verified credentials and reviews
- Available appointment times
- Insurance coverage information
- Video, voice, and in-person session options

🌐 **Additional Options**: I can also search Psychology Today's database for more therapists in your area.

Would you like me to open our therapist directory or search external databases?
            """
            
            # Also try the external search as backup
            try:
                external_response = await search_therapists_near(location, specialty)
                return f"{internal_directory_response}\n\n**External Search Results**: {external_response}"
            except:
                return internal_directory_response
                
        except Exception as e:
            logger.error(f"Therapist search failed: {e}")
            return f"I'd recommend checking our MindCure therapist directory (localhost:3000/therapist-directory) or Psychology Today for therapists specializing in {specialty} in {location}."

    @function_tool
    async def get_dashboard_data(self, context: RunContext):
        """
        Get current dashboard data including mental health score, productivity score, streaks, and recent activity.
        Use this to provide real-time dashboard information.
        """
        try:
            dashboard_data = shared_data.get_dashboard_data()
            logger.info("Retrieved dashboard data from shared store")
            return f"""Current Dashboard Status:
🧠 Mental Health Score: {dashboard_data['mentalHealthScore']}/100
⚡ Productivity Score: {dashboard_data['productivityScore']}/100
🔥 Current Streak: {dashboard_data['quickStats']['streakDays']} days
🎯 Goals Achieved: {dashboard_data['quickStats']['goalsAchieved']}
💬 AI Sessions: {dashboard_data['quickStats']['sessionsCompleted']}
📈 Weekly Progress: +{dashboard_data['quickStats']['weeklyProgress']}

Recent Activity:
{chr(10).join([f"• {activity['icon']} {activity['text']} ({activity['time']})" for activity in dashboard_data['recentActivity']])}"""
            
        except Exception as e:
            logger.error(f"Error getting dashboard data: {e}")
            return "I'm having trouble accessing your dashboard data right now."

    @function_tool
    async def search_therapists_in_database(
        self, 
        context: RunContext, 
        specialty: str = None, 
        max_results: int = 5
    ):
        """
        Search for therapists in the MindCure database based on specialization.
        Use this to recommend therapists to users based on their needs.
        
        Args:
            specialty: Optional specialization filter (e.g., "anxiety", "depression", "trauma", "stress", "ptsd", "couples")
            max_results: Maximum number of therapists to return (default: 5)
        """
        try:
            if not supabase:
                return "Database not available. Please visit the Therapist Directory on your dashboard at /therapist-directory."
            
            # Build query
            query = supabase.table('therapists').select(
                'id, specializations, hourly_rate, bio, years_experience, rating, '
                'profile:profiles(full_name)'
            ).eq('verified', True).eq('accepting_new_clients', True)
            
            # Apply specialty filter if provided
            if specialty:
                query = query.contains('specializations', [specialty.lower()])
            
            # Order by rating and limit results
            result = query.order('rating', desc=True).limit(max_results).execute()
            
            if not result.data:
                return f"No therapists found matching '{specialty}'. I recommend checking our full Therapist Directory at /therapist-directory for all available therapists."
            
            therapist_list = []
            for t in result.data:
                name = t.get('profile', {}).get('full_name', 'Licensed Therapist') if t.get('profile') else 'Licensed Therapist'
                specs = ', '.join(t.get('specializations', [])) if t.get('specializations') else 'General Therapy'
                rate = t.get('hourly_rate', 'Contact for pricing')
                rating = t.get('rating', 'N/A')
                years = t.get('years_experience', 0)
                therapist_list.append(
                    f"• **{name}** - {specs}\n  ⭐ Rating: {rating}/5 | 💰 ${rate}/session | 📅 {years} years experience"
                )
            
            return f"""Found {len(result.data)} therapist(s) matching your needs:

{chr(10).join(therapist_list)}

You can view profiles and book sessions at /therapist-directory. Would you like me to help you with anything else?"""
            
        except Exception as e:
            logger.error(f"Therapist search error: {e}")
            return "I couldn't search the database right now. Please try the Therapist Directory at /therapist-directory."


def prewarm(proc: JobProcess):
    # No need for VAD prewarming with Gemini Live API
    pass


async def entrypoint(ctx: JobContext):
    # Logging setup
    ctx.log_context_fields = {
        "room": ctx.room.name,
    }
    
    # Connect first
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
    
    # Extract user_id from room metadata
    user_id = None
    personalized_instructions = AGENT_INSTRUCTIONS
    selected_voice = DEFAULT_VOICE
    genz_mode = False
    
    try:
        # Try to get user_id from room name pattern
        room_name = ctx.room.name
        if room_name and room_name.startswith("mindcure-"):
            # Format: mindcure-{USER_ID}-{RANDOM_SUFFIX}
            # UUIDs contain hyphens, so we can't just split by hyphen and take index 0
            # We assume USER_ID is a UUID (36 chars) or at least the part before the last hyphen if appended
            
            parts = room_name.replace("mindcure-", "").split("-")
            
            # Reconstruct UUID if it was split
            # Standard UUID has 4 hyphens. 
            if len(parts) >= 5:
                # likely a UUID
                user_id = "-".join(parts[:5])
            else:
                # Fallback for simple IDs
                user_id = parts[0]
                
            logger.info(f"Extracted user_id from room name: {user_id}")
        
        # Check for existing participants (non-blocking)
        # Wait a bit for the frontend to set metadata after connection
        for attempt in range(5):  # Try up to 5 times over 2.5 seconds
            for participant in ctx.room.remote_participants.values():
                if participant.metadata:
                    prefs = parse_participant_metadata(participant.metadata)
                    genz_mode = prefs.get("genz_mode", False)
                    requested_voice = prefs.get("voice", DEFAULT_VOICE)
                    if requested_voice in GEMINI_VOICES:
                        selected_voice = requested_voice
                    logger.info(f"🎙️ Voice: {selected_voice}, Gen Z Mode: {genz_mode}")
                    break
            
            # Also check local participant metadata (the user connecting)
            local_meta = ctx.room.local_participant.metadata if hasattr(ctx.room, 'local_participant') else None
            if local_meta:
                prefs = parse_participant_metadata(local_meta)
                genz_mode = prefs.get("genz_mode", genz_mode)
                requested_voice = prefs.get("voice", selected_voice)
                if requested_voice in GEMINI_VOICES:
                    selected_voice = requested_voice
                logger.info(f"🎙️ From local participant - Voice: {selected_voice}, Gen Z Mode: {genz_mode}")
                break
            
            if genz_mode or selected_voice != DEFAULT_VOICE:
                break  # Found settings, stop waiting
                
            await asyncio.sleep(0.5)  # Wait 500ms before trying again
        
        # Select the appropriate prompt based on mode
        base_instructions = GENZ_AGENT_INSTRUCTIONS if genz_mode else AGENT_INSTRUCTIONS
        
        # If we have a user_id, load their context
        if user_id:
            user_context = await load_user_context(user_id)
            personalized_instructions = build_personalized_instructions(
                base_instructions, 
                user_context
            )
            logger.info(f"✅ Loaded personalized context for user {user_context.get('name', 'Unknown')}")
        else:
            personalized_instructions = base_instructions
            logger.info("No user_id found, using default instructions")
            
    except Exception as e:
        logger.warning(f"Error loading user context: {e}, using default instructions")

    # ========== BYOK: Get user's API key ==========
    user_api_key = os.environ.get("GOOGLE_API_KEY")  # Default to platform key
    
    if user_id:
        try:
            # Check session limit
            session_check = await check_session_limit(user_id)
            if not session_check.get('allowed', True):
                logger.warning(f"⚠️ User {user_id} exceeded session limit")
            
            # Get user's BYOK API key
            user_api_key = await get_user_gemini_key(user_id)
            
            # Increment session count
            await increment_session_usage(user_id)
            logger.info(f"✅ BYOK session started for {user_id}")
        except Exception as e:
            logger.error(f"BYOK error: {e}")
            user_api_key = os.environ.get("GOOGLE_API_KEY")

    # Create session with Gemini Live API (speech-to-speech)
    # Using gemini-2.5-flash-native-audio-preview for better audio support
    session = AgentSession(
        llm=google.beta.realtime.RealtimeModel(
            model="gemini-2.5-flash-native-audio-preview-09-2025",
            voice=selected_voice,
            temperature=0.8,
            instructions=personalized_instructions,
            api_key=user_api_key,  # BYOK: Use user's key or platform key
        ),
    )

    # Log metrics
    usage_collector = metrics.UsageCollector()

    @session.on("metrics_collected")
    def _on_metrics_collected(ev: MetricsCollectedEvent):
        metrics.log_metrics(ev.metrics)
        usage_collector.collect(ev.metrics)

    async def log_usage():
        summary = usage_collector.get_summary()
        logger.info(f"Usage: {summary}")

    ctx.add_shutdown_callback(log_usage)

    # Start the session
    await session.start(
        agent=Assistant(),
        room=ctx.room,
        room_input_options=RoomInputOptions(
            noise_cancellation=noise_cancellation.BVC(),
            video_enabled=True,
        ),
    )


if __name__ == "__main__":
    cli.run_app(WorkerOptions(
        entrypoint_fnc=entrypoint, 
        prewarm_fnc=prewarm,
        initialize_process_timeout=60.0,  # Increase from 10s to 60s for slow imports
    ))
