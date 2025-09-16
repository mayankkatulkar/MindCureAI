/**
 * Shared data store for dashboard and productivity data.
 * This ensures the agent and frontend APIs use the same data.
 */

interface DashboardData {
  mentalHealthScore: number;
  productivityScore: number;
  quickStats: {
    weeklyProgress: number;
    sessionsCompleted: number;
    streakDays: number;
    goalsAchieved: number;
  };
  recentActivity: Array<{
    type: string;
    text: string;
    time: string;
    icon: string;
  }>;
}

interface ProductivityData {
  productivityScore: number;
  mentalHealthScore: number;
  currentStreak: number;
  weeklyProgress: {
    mentalHealthImprovement: number;
    productivityIncrease: number;
    tasksCompleted: number;
    focusMinutes: number;
  };
  todaysTasks: Array<{
    id: number;
    task: string;
    completed: boolean;
    type: string;
    impact: string;
  }>;
}

class SharedDataStore {
  private dashboardData: DashboardData;
  private productivityData: ProductivityData;

  constructor() {
    // Initialize with some base data
    this.dashboardData = {
      mentalHealthScore: 75,
      productivityScore: 82,
      quickStats: {
        weeklyProgress: 15,
        sessionsCompleted: 12,
        streakDays: 7,
        goalsAchieved: 4
      },
      recentActivity: [
        { type: 'therapy', text: 'AI therapy session completed', time: '2 hours ago', icon: '🤖' },
        { type: 'breathing', text: 'Breathing exercise - 5 minutes', time: '4 hours ago', icon: '🫁' },
        { type: 'task', text: 'Completed daily mental wellness task', time: '6 hours ago', icon: '✅' },
        { type: 'progress', text: 'Mental wellness score improved +3', time: '1 day ago', icon: '📈' }
      ]
    };
    
    this.productivityData = {
      productivityScore: 82,
      mentalHealthScore: 75,
      currentStreak: 7,
      weeklyProgress: {
        mentalHealthImprovement: 15,
        productivityIncrease: 8,
        tasksCompleted: 24,
        focusMinutes: 180
      },
      todaysTasks: [
        { id: 1, task: '25-minute focus session', completed: true, type: 'focus', impact: '+3 mental health' },
        { id: 2, task: 'Take a mindful break', completed: false, type: 'wellness', impact: '+2 productivity' },
        { id: 3, task: 'Complete project milestone', completed: false, type: 'work', impact: '+5 productivity' },
        { id: 4, task: 'Evening meditation (AI recommended)', completed: false, type: 'meditation', impact: '+4 mental health' }
      ]
    };
  }

  getDashboardData(): DashboardData {
    return JSON.parse(JSON.stringify(this.dashboardData));
  }

  getProductivityData(): ProductivityData {
    return JSON.parse(JSON.stringify(this.productivityData));
  }

  updateScores(activityType: string, scoreChange: number = 0) {
    let changes: { mental_health: number; productivity: number };
    if (scoreChange === 0) {
      // Auto-calculate score changes based on activity type
      const scoreChanges: Record<string, { mental_health: number; productivity: number }> = {
        therapy: { mental_health: 3, productivity: 1 },
        task: { productivity: 2, mental_health: 1 },
        exercise: { mental_health: 2, productivity: 2 },
        meditation: { mental_health: 4, productivity: 1 },
        focus_session: { productivity: 3, mental_health: 1 }
      };
      changes = scoreChanges[activityType] || { mental_health: 1, productivity: 1 };
    } else {
      changes = { mental_health: scoreChange, productivity: scoreChange };
    }

    // Update both dashboard and productivity data
    this.dashboardData.mentalHealthScore = Math.min(100, 
      this.dashboardData.mentalHealthScore + changes.mental_health);
    this.dashboardData.productivityScore = Math.min(100, 
      this.dashboardData.productivityScore + changes.productivity);
    
    this.productivityData.mentalHealthScore = this.dashboardData.mentalHealthScore;
    this.productivityData.productivityScore = this.dashboardData.productivityScore;

    // Add to recent activity
    const activityText = activityType.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) + ' completed';
    const newActivity = {
      type: activityType,
      text: activityText,
      time: 'Just now',
      icon: activityType === 'therapy' ? '🤖' : '✅'
    };
    
    this.dashboardData.recentActivity.unshift(newActivity);
    this.dashboardData.recentActivity = this.dashboardData.recentActivity.slice(0, 4);

    return {
      activity_type: activityType,
      score_changes: changes,
      new_scores: {
        mental_health: this.dashboardData.mentalHealthScore,
        productivity: this.dashboardData.productivityScore
      },
      message: `Great job! Your ${activityType.replace('_', ' ')} session updated your scores.`,
      timestamp: new Date().toISOString()
    };
  }

  toggleTask(taskId: number): boolean {
    const task = this.productivityData.todaysTasks.find(t => t.id === taskId);
    if (task) {
      task.completed = !task.completed;
      
      // Update scores when task is completed
      if (task.completed) {
        if (['focus', 'work'].includes(task.type)) {
          this.productivityData.productivityScore = Math.min(100, 
            this.productivityData.productivityScore + 2);
          this.dashboardData.productivityScore = this.productivityData.productivityScore;
        } else if (['wellness', 'meditation'].includes(task.type)) {
          this.productivityData.mentalHealthScore = Math.min(100, 
            this.productivityData.mentalHealthScore + 2);
          this.dashboardData.mentalHealthScore = this.productivityData.mentalHealthScore;
        }
      }
      
      return true;
    }
    return false;
  }

  getCurrentScores() {
    return {
      mental_health_score: this.dashboardData.mentalHealthScore,
      productivity_score: this.dashboardData.productivityScore,
      streak_days: this.dashboardData.quickStats.streakDays,
      sessions_completed: this.dashboardData.quickStats.sessionsCompleted,
      goals_achieved: this.dashboardData.quickStats.goalsAchieved
    };
  }
}

// Global instance to share across the frontend
const sharedData = new SharedDataStore();

export default sharedData;
