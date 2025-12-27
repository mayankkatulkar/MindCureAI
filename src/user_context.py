"""
User Context Manager for MindCure Voice AI

Handles fetching user profiles, conversation history, and wellness metrics
to provide personalized context to the voice AI agent.
"""

import os
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional

logger = logging.getLogger("user_context")

# Initialize Supabase Client
supabase = None
try:
    from supabase import create_client, Client
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_KEY") or os.environ.get("SUPABASE_KEY")
    
    if supabase_url and supabase_key:
        supabase: Client = create_client(supabase_url, supabase_key)
        logger.info("✅ UserContextManager connected to Supabase")
    else:
        logger.warning("⚠️ Supabase credentials missing for UserContextManager")
except Exception as e:
    logger.error(f"❌ UserContextManager Supabase connection failed: {e}")


class UserContextManager:
    """Manages user context for personalized voice AI interactions."""
    
    def __init__(self, user_id: Optional[str] = None):
        self.user_id = user_id
        self.profile: Dict[str, Any] = {}
        self.wellness_metrics: Dict[str, Any] = {}
        self.conversation_history: List[Dict[str, Any]] = []
        self.recent_tasks: List[Dict[str, Any]] = []
        self.achievements: List[Dict[str, Any]] = []
    
    async def load_user_context(self, user_id: str) -> Dict[str, Any]:
        """Load complete user context from database."""
        self.user_id = user_id
        
        if not supabase:
            logger.warning("Supabase not available, returning minimal context")
            return self._get_minimal_context()
        
        # Validate UUID format - skip database query for anonymous/invalid users
        import re
        uuid_pattern = re.compile(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', re.IGNORECASE)
        if not uuid_pattern.match(user_id):
            logger.info(f"User ID '{user_id}' is not a valid UUID, using minimal context")
            return self._get_minimal_context()
        
        try:
            # Fetch user profile
            profile_response = supabase.table('profiles').select(
                'full_name, email, mental_health_goals, current_challenges, preferred_therapy_type'
            ).eq('id', user_id).single().execute()
            
            if profile_response.data:
                self.profile = profile_response.data
            
            # Fetch latest wellness metrics
            metrics_response = supabase.table('wellness_metrics').select(
                'mental_health_score, productivity_score, streak_days, goals_achieved, sessions_completed'
            ).eq('user_id', user_id).order('recorded_at', desc=True).limit(1).execute()
            
            if metrics_response.data:
                self.wellness_metrics = metrics_response.data[0]
            
            # Fetch recent conversation summaries (last 5 sessions) from chat_sessions
            convo_response = supabase.table('chat_sessions').select(
                'title, duration_seconds, metadata, created_at'
            ).eq('user_id', user_id).order('created_at', desc=True).limit(5).execute()
            
            if convo_response.data:
                # Transform to expected format
                self.conversation_history = [
                    {
                        'mood_score': (s.get('metadata') or {}).get('analysis', {}).get('sentimentScore', 5),
                        'conversation_summary': s.get('title', ''),
                        'insights': (s.get('metadata') or {}).get('analysis', {}).get('keyInsights', []),
                        'created_at': s.get('created_at')
                    }
                    for s in convo_response.data
                ]
            
            # Fetch incomplete fun tasks
            tasks_response = supabase.table('fun_tasks').select(
                'task_type, task_name, description, completed'
            ).eq('user_id', user_id).eq('completed', False).limit(5).execute()
            
            if tasks_response.data:
                self.recent_tasks = tasks_response.data
            
            # Fetch recent achievements
            achievements_response = supabase.table('achievements').select(
                'achievement_type, achievement_name, earned_at'
            ).eq('user_id', user_id).order('earned_at', desc=True).limit(3).execute()
            
            if achievements_response.data:
                self.achievements = achievements_response.data
            
            logger.info(f"✅ Loaded context for user {user_id[:8]}...")
            return self._build_context()
            
        except Exception as e:
            logger.error(f"Error loading user context: {e}")
            return self._get_minimal_context()
    
    def _build_context(self) -> Dict[str, Any]:
        """Build comprehensive context dictionary."""
        return {
            "user_id": self.user_id,
            "name": self.profile.get("full_name", "Friend"),
            "goals": self.profile.get("mental_health_goals", []),
            "challenges": self.profile.get("current_challenges", []),
            "preferred_therapy": self.profile.get("preferred_therapy_type"),
            "current_scores": {
                "mental_health": self.wellness_metrics.get("mental_health_score", 50),
                "productivity": self.wellness_metrics.get("productivity_score", 50),
                "streak_days": self.wellness_metrics.get("streak_days", 0),
                "sessions": self.wellness_metrics.get("sessions_completed", 0)
            },
            "recent_conversations": self.conversation_history,
            "pending_tasks": self.recent_tasks,
            "achievements": self.achievements
        }
    
    def _get_minimal_context(self) -> Dict[str, Any]:
        """Return minimal context when database is unavailable."""
        return {
            "user_id": self.user_id,
            "name": "Friend",
            "goals": [],
            "challenges": [],
            "current_scores": {
                "mental_health": 50,
                "productivity": 50,
                "streak_days": 0,
                "sessions": 0
            }
        }
    
    def build_personalized_instructions(self, base_instructions: str, context: Dict[str, Any]) -> str:
        """Build personalized instructions for the voice AI based on user context."""
        
        name = context.get("name", "Friend")
        goals = context.get("goals", [])
        challenges = context.get("challenges", [])
        scores = context.get("current_scores", {})
        recent_convos = context.get("recent_conversations", [])
        
        personalization = f"""
        
PERSONALIZED CONTEXT FOR THIS SESSION:
=====================================
User Name: {name}
Mental Health Score: {scores.get('mental_health', 50)}/100
Productivity Score: {scores.get('productivity', 50)}/100
Current Streak: {scores.get('streak_days', 0)} days
Total Sessions: {scores.get('sessions', 0)}
"""
        
        if goals:
            personalization += f"\nTheir Mental Health Goals: {', '.join(goals[:3])}"
        
        if challenges:
            personalization += f"\nCurrent Challenges: {', '.join(challenges[:3])}"
        
        if recent_convos:
            personalization += "\n\nRecent Session Insights:"
            for i, convo in enumerate(recent_convos[:3], 1):
                summary = convo.get("conversation_summary", "")
                if summary:
                    personalization += f"\n  - {summary[:100]}..."
        
        personalization += """

IMPORTANT: Use this context naturally in conversation. Address them by name occasionally.
Acknowledge their progress and current challenges. Build on previous conversations when relevant.
Remember: You have tools to update their scores, assign tasks, and connect them with therapists.
"""
        
        return base_instructions + personalization
    
    async def save_conversation_summary(
        self, 
        mood_score: int, 
        summary: str, 
        insights: List[str]
    ) -> bool:
        """Save conversation analysis after session ends."""
        if not supabase or not self.user_id:
            return False
        
        try:
            # Save to chat_sessions instead of deprecated conversation_scores
            # Note: This is handled by the frontend now (POST /api/chat-sessions)
            # This function is kept for backward compatibility but no-ops
            logger.info(f"Conversation summary received - score: {mood_score}, summary: {summary[:50]}...")
            # The actual save happens via the frontend API
            
            # Also update wellness metrics if mood improved
            if mood_score >= 6:
                current_score = self.wellness_metrics.get("mental_health_score", 50)
                new_score = min(100, current_score + 2)
                
                supabase.table('wellness_metrics').update({
                    "mental_health_score": new_score,
                    "sessions_completed": self.wellness_metrics.get("sessions_completed", 0) + 1
                }).eq('user_id', self.user_id).execute()
            
            logger.info(f"✅ Saved conversation summary for user {self.user_id[:8]}...")
            return True
            
        except Exception as e:
            logger.error(f"Error saving conversation summary: {e}")
            return False
    
    async def update_user_score(
        self, 
        score_type: str, 
        change: int
    ) -> Dict[str, Any]:
        """Update user's mental health or productivity score."""
        if not supabase or not self.user_id:
            return {"success": False, "message": "Database not available"}
        
        try:
            # Get current metrics
            response = supabase.table('wellness_metrics').select('*').eq(
                'user_id', self.user_id
            ).order('recorded_at', desc=True).limit(1).single().execute()
            
            if not response.data:
                return {"success": False, "message": "No metrics found"}
            
            current = response.data
            
            if score_type == "mental_health":
                new_score = max(0, min(100, current.get("mental_health_score", 50) + change))
                supabase.table('wellness_metrics').update({
                    "mental_health_score": new_score
                }).eq('id', current['id']).execute()
            elif score_type == "productivity":
                new_score = max(0, min(100, current.get("productivity_score", 50) + change))
                supabase.table('wellness_metrics').update({
                    "productivity_score": new_score
                }).eq('id', current['id']).execute()
            else:
                return {"success": False, "message": "Invalid score type"}
            
            return {
                "success": True,
                "new_score": new_score,
                "change": change,
                "score_type": score_type
            }
            
        except Exception as e:
            logger.error(f"Error updating score: {e}")
            return {"success": False, "message": str(e)}


# Singleton instance
_context_manager = None

def get_context_manager() -> UserContextManager:
    """Get or create the context manager instance."""
    global _context_manager
    if _context_manager is None:
        _context_manager = UserContextManager()
    return _context_manager


async def load_user_context(user_id: str) -> Dict[str, Any]:
    """Convenience function to load user context."""
    manager = get_context_manager()
    return await manager.load_user_context(user_id)


def build_personalized_instructions(base_instructions: str, context: Dict[str, Any]) -> str:
    """Convenience function to build personalized instructions."""
    manager = get_context_manager()
    return manager.build_personalized_instructions(base_instructions, context)
