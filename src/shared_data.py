"""
Shared data store for dashboard and productivity data.
This ensures the agent and frontend APIs use the same data.
"""
import json
import random
from datetime import datetime
from typing import Dict, Any

class SharedDataStore:
    def __init__(self):
        # Initialize with some base data
        self._dashboard_data = {
            "mentalHealthScore": 75,
            "productivityScore": 82,
            "quickStats": {
                "weeklyProgress": 15,
                "sessionsCompleted": 12,
                "streakDays": 7,
                "goalsAchieved": 4
            },
            "recentActivity": [
                {"type": "therapy", "text": "AI therapy session completed", "time": "2 hours ago", "icon": "🤖"},
                {"type": "breathing", "text": "Breathing exercise - 5 minutes", "time": "4 hours ago", "icon": "🫁"},
                {"type": "task", "text": "Completed daily mental health task", "time": "6 hours ago", "icon": "✅"},
                {"type": "progress", "text": "Mental health score improved +3", "time": "1 day ago", "icon": "📈"}
            ]
        }
        
        self._productivity_data = {
            "productivityScore": 82,
            "mentalHealthScore": 75,
            "currentStreak": 7,
            "weeklyProgress": {
                "mentalHealthImprovement": 15,
                "productivityIncrease": 8,
                "tasksCompleted": 24,
                "focusMinutes": 180
            },
            "todaysTasks": [
                {"id": 1, "task": "25-minute focus session", "completed": True, "type": "focus", "impact": "+3 mental health"},
                {"id": 2, "task": "Take a mindful break", "completed": False, "type": "wellness", "impact": "+2 productivity"},
                {"id": 3, "task": "Complete project milestone", "completed": False, "type": "work", "impact": "+5 productivity"},
                {"id": 4, "task": "Evening meditation (AI recommended)", "completed": False, "type": "meditation", "impact": "+4 mental health"}
            ]
        }

    def get_dashboard_data(self) -> Dict[str, Any]:
        """Get current dashboard data"""
        return self._dashboard_data.copy()

    def get_productivity_data(self) -> Dict[str, Any]:
        """Get current productivity data"""
        return self._productivity_data.copy()

    def update_scores(self, activity_type: str, score_change: int = 0) -> Dict[str, Any]:
        """Update scores based on activity completion"""
        if score_change == 0:
            # Auto-calculate score changes based on activity type
            score_changes = {
                "therapy": {"mental_health": 3, "productivity": 1},
                "task": {"productivity": 2, "mental_health": 1},
                "exercise": {"mental_health": 2, "productivity": 2},
                "meditation": {"mental_health": 4, "productivity": 1},
                "focus_session": {"productivity": 3, "mental_health": 1}
            }
            changes = score_changes.get(activity_type, {"mental_health": 1, "productivity": 1})
        else:
            changes = {"mental_health": score_change, "productivity": score_change}

        # Update both dashboard and productivity data
        self._dashboard_data["mentalHealthScore"] = min(100, 
            self._dashboard_data["mentalHealthScore"] + changes["mental_health"])
        self._dashboard_data["productivityScore"] = min(100, 
            self._dashboard_data["productivityScore"] + changes["productivity"])
        
        self._productivity_data["mentalHealthScore"] = self._dashboard_data["mentalHealthScore"]
        self._productivity_data["productivityScore"] = self._dashboard_data["productivityScore"]

        # Add to recent activity
        activity_text = f"{activity_type.replace('_', ' ').title()} completed"
        new_activity = {
            "type": activity_type,
            "text": activity_text,
            "time": "Just now",
            "icon": "🤖" if activity_type == "therapy" else "✅"
        }
        
        self._dashboard_data["recentActivity"].insert(0, new_activity)
        self._dashboard_data["recentActivity"] = self._dashboard_data["recentActivity"][:4]

        return {
            "activity_type": activity_type,
            "score_changes": changes,
            "new_scores": {
                "mental_health": self._dashboard_data["mentalHealthScore"],
                "productivity": self._dashboard_data["productivityScore"]
            },
            "message": f"Great job! Your {activity_type.replace('_', ' ')} session updated your scores.",
            "timestamp": datetime.now().isoformat()
        }

    def toggle_task(self, task_id: int) -> bool:
        """Toggle a task completion status"""
        for task in self._productivity_data["todaysTasks"]:
            if task["id"] == task_id:
                task["completed"] = not task["completed"]
                
                # Update scores when task is completed
                if task["completed"]:
                    if task["type"] in ["focus", "work"]:
                        self._productivity_data["productivityScore"] = min(100, 
                            self._productivity_data["productivityScore"] + 2)
                        self._dashboard_data["productivityScore"] = self._productivity_data["productivityScore"]
                    elif task["type"] in ["wellness", "meditation"]:
                        self._productivity_data["mentalHealthScore"] = min(100, 
                            self._productivity_data["mentalHealthScore"] + 2)
                        self._dashboard_data["mentalHealthScore"] = self._productivity_data["mentalHealthScore"]
                
                return True
        return False

    def get_current_scores(self) -> Dict[str, int]:
        """Get current scores for the agent to report"""
        return {
            "mental_health_score": self._dashboard_data["mentalHealthScore"],
            "productivity_score": self._dashboard_data["productivityScore"],
            "streak_days": self._dashboard_data["quickStats"]["streakDays"],
            "sessions_completed": self._dashboard_data["quickStats"]["sessionsCompleted"],
            "goals_achieved": self._dashboard_data["quickStats"]["goalsAchieved"]
        }

# Global instance to share across modules
shared_data = SharedDataStore()
