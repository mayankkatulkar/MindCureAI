import logging
from datetime import datetime

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


from prompts import AGENT_INSTRUCTIONS, SESSION_INSTRUCTIONS
from livekit.agents.llm import function_tool


logger = logging.getLogger("agent")

load_dotenv(".env.local")

# Imports for RAG with Livekit
from livekit_rag import livekit_rag

# Imports for RAG with LlamaIndex
from llamaindex_rag import setup_combined_agent

# Import for AutoGen Operator
from autogen_operator import run_operator_task, search_therapists_near, book_therapy_appointment, get_crisis_help

# Import Browser Automation
from browser import run_browser_automation

# Import shared data store
from shared_data import shared_data

workflow_agent, index, file_tools = setup_combined_agent()


class Assistant(Agent):
    def __init__(self) -> None:
        super().__init__(instructions=AGENT_INSTRUCTIONS)

    # all functions annotated with @function_tool will be passed to the LLM when this
    # agent is active

    @function_tool
    async def LiveKit_RAG_tool(self, context: RunContext, query: str):
        """
        Use this tool to get the data quickly from Livekit RAG model

        Args:
            query: The query to get the data for
        """

        try:
            response = await livekit_rag(query)
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
            response = await workflow_agent.run(query)
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
            
            # Call the browser automation function from browser.py
            result = await run_browser_automation(
                task=task,
                max_steps=max_steps,
                headless=headless
            )
            
            logger.info(f"Browser automation completed successfully")
            return str(result)
            
        except Exception as e:
            logger.error(f"Browser automation failed: {e}")
            return f"I encountered an error while performing the browser automation task: {str(e)}. I can still help you with information I have available or try a different approach."

    @function_tool
    async def web_automation_tool(self, context: RunContext, task: str):
        """
        Use this tool to perform web automation tasks like searching for therapists, 
        booking appointments, or finding mental health resources online.
        
        Examples:
        - "Search for therapists in San Francisco who specialize in anxiety"
        - "Find crisis mental health resources in New York"
        - "Look up information about depression treatment centers"
        
        Args:
            task: Describe what you want to automate or search for online
        """
        try:
            logger.info(f"Executing web automation task: {task}")
            response = await run_operator_task(task)
            return str(response)
        except Exception as e:
            logger.error(f"Web automation failed: {e}")
            return "I encountered an error while trying to help with that web search. Please try asking me for general information instead."

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
    async def emergency_resources_tool(self, context: RunContext, location: str):
        """
        Find immediate mental health crisis resources and emergency services.
        Use this when someone needs urgent help or is in crisis.
        
        Args:
            location: The city or area to find crisis resources for
        """
        try:
            logger.info(f"Finding crisis resources in {location}")
            response = await get_crisis_help(location)
            return str(response)
        except Exception as e:
            logger.error(f"Crisis resource search failed: {e}")
            return f"""I'm having trouble finding specific crisis resources right now. Please remember these important numbers:
            
            🚨 EMERGENCY SERVICES:
            - National Suicide Prevention Lifeline: 988
            - Crisis Text Line: Text HOME to 741741
            - Emergency Services: 911
            
            If you're in immediate danger, please call 911 or go to your nearest emergency room."""

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
    async def get_productivity_data(self, context: RunContext):
        """
        Get current productivity center data including scores, tasks, habits, and weekly progress.
        Use this to provide real-time productivity information.
        """
        try:
            productivity_data = shared_data.get_productivity_data()
            
            completed_tasks = len([t for t in productivity_data['todaysTasks'] if t['completed']])
            total_tasks = len(productivity_data['todaysTasks'])
            
            logger.info("Retrieved productivity data from shared store")
            return f"""Current Productivity Status:
⚡ Productivity Score: {productivity_data['productivityScore']}/100
🧠 Mental Health Score: {productivity_data['mentalHealthScore']}/100
🔥 Current Streak: {productivity_data['currentStreak']} days

Today's Tasks Progress: {completed_tasks}/{total_tasks} completed
Pending Tasks:
{chr(10).join([f"• {task['task']} ({task['impact']})" for task in productivity_data['todaysTasks'] if not task['completed']])}

Weekly Progress:
📈 Mental Health: +{productivity_data['weeklyProgress']['mentalHealthImprovement']}
⚡ Productivity: +{productivity_data['weeklyProgress']['productivityIncrease']}
✅ Tasks Completed: {productivity_data['weeklyProgress']['tasksCompleted']}
🎯 Focus Time: {productivity_data['weeklyProgress']['focusMinutes']} minutes"""
            
        except Exception as e:
            logger.error(f"Error getting productivity data: {e}")
            return "I'm having trouble accessing your productivity data right now."

    @function_tool
    async def update_user_progress(self, context: RunContext, activity_type: str, score_change: int = 0):
        """
        Update user progress after completing activities like therapy sessions, tasks, or exercises.
        
        Args:
            activity_type: Type of activity completed (therapy, task, exercise, meditation, focus_session)
            score_change: Points to add to relevant scores (default 0 for auto-calculation)
        """
        try:
            result = shared_data.update_scores(activity_type, score_change)
            
            logger.info(f"Updated progress for {activity_type}: {result['score_changes']}")
            return f"""🎉 {result['message']}

Score Updates:
🧠 Mental Health: {result['new_scores']['mental_health']}/100 (+{result['score_changes']['mental_health']})
⚡ Productivity: {result['new_scores']['productivity']}/100 (+{result['score_changes']['productivity']})

Keep up the great work! Your consistent effort is paying off."""
            
        except Exception as e:
            logger.error(f"Error updating progress: {e}")
            return "I had trouble updating your progress, but great job on completing that activity!"

    @function_tool
    async def get_current_scores(self, context: RunContext):
        """
        Get current user scores and stats. Use this when user asks about their current progress or scores.
        """
        try:
            scores = shared_data.get_current_scores()
            
            logger.info("Retrieved current scores from shared store")
            return f"""Your Current Scores & Progress:

🧠 Mental Health Score: {scores['mental_health_score']}/100
⚡ Productivity Score: {scores['productivity_score']}/100
🔥 Current Streak: {scores['streak_days']} days
💬 AI Sessions Completed: {scores['sessions_completed']}
🎯 Goals Achieved: {scores['goals_achieved']}

You're doing great! Keep up the consistent effort to maintain and improve these scores."""
            
        except Exception as e:
            logger.error(f"Error getting current scores: {e}")
            return "I'm having trouble accessing your current scores right now."


def prewarm(proc: JobProcess):
    # No need for VAD prewarming with Gemini Live API
    pass


async def entrypoint(ctx: JobContext):
    # Logging setup
    # Add any other context you want in all log entries here
    ctx.log_context_fields = {
        "room": ctx.room.name,
    }

    # Create session with Gemini Live API (speech-to-speech)
    # No separate STT, TTS, or turn detection needed - all handled by Gemini Live
    session = AgentSession(
        llm=google.beta.realtime.RealtimeModel(
            model="gemini-2.0-flash-exp",
            voice="Puck",  # Available voices: Puck, Charon, Kore, Fenrir, Aoede
            temperature=0.8,
            instructions=AGENT_INSTRUCTIONS,
            _gemini_tools=[types.GoogleSearch()],  # Optional: Enable Google Search
        ),
    )

    # Log metrics as they are emitted, and total usage after session is over
    usage_collector = metrics.UsageCollector()

    @session.on("metrics_collected")
    def _on_metrics_collected(ev: MetricsCollectedEvent):
        metrics.log_metrics(ev.metrics)
        usage_collector.collect(ev.metrics)

    async def log_usage():
        summary = usage_collector.get_summary()
        logger.info(f"Usage: {summary}")

    # Shutdown callbacks are triggered when the session is over
    ctx.add_shutdown_callback(log_usage)

    # Start the session
    await session.start(
        agent=Assistant(),
        room=ctx.room,
        room_input_options=RoomInputOptions(
            # LiveKit Cloud enhanced noise cancellation (optional)
            # - If self-hosting, omit this parameter
            noise_cancellation=noise_cancellation.BVC(),
            video_enabled=True,
        ),
    )

    # 1. join the room when agent is ready
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

    # 2. greet the user
    await session.say(SESSION_INSTRUCTIONS, allow_interruptions=True)


if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint, prewarm_fnc=prewarm))
