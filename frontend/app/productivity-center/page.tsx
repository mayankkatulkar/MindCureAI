'use client';

import React, { useState, useEffect } from 'react';
import './productivity-center.css';

const ProductivityCenter = () => {
  const [productivityScore, setProductivityScore] = useState(82);
  const [mentalHealthScore, setMentalHealthScore] = useState(75);
  const [currentStreak, setCurrentStreak] = useState(7);
  const [todaysTasks, setTodaysTasks] = useState([
    { id: 1, task: '25-minute focus session', completed: true, type: 'focus', impact: '+3 mental wellness' },
    { id: 2, task: 'Take a mindful break', completed: false, type: 'wellness', impact: '+2 productivity', current: true },
    { id: 3, task: 'Complete project milestone', completed: false, type: 'work', impact: '+5 productivity' },
    { id: 4, task: 'Evening meditation (AI recommended)', completed: false, type: 'meditation', impact: '+4 mental wellness' }
  ]);

  const [weeklyProgress] = useState({
    mentalHealthImprovement: 15,
    productivityIncrease: 8,
    tasksCompleted: 24,
    focusMinutes: 180
  });

  const [focusSession, setFocusSession] = useState({
    active: false,
    timeRemaining: 25 * 60, // 25 minutes in seconds
    type: 'pomodoro'
  });

  const [habits] = useState([
    { id: 1, name: 'Morning meditation', streak: 7, completed: true, impact: 'mental_health' },
    { id: 2, name: 'Daily journaling', streak: 5, completed: false, impact: 'mental_health' },
    { id: 3, name: 'Exercise break', streak: 3, completed: true, impact: 'both' },
    { id: 4, name: 'Deep work session', streak: 7, completed: false, impact: 'productivity' }
  ]);

  const [isGeneratingTasks, setIsGeneratingTasks] = useState(false);

  // Fetch productivity data from API
  useEffect(() => {
    const fetchProductivityData = async () => {
      try {
        const response = await fetch('/api/productivity');
        if (response.ok) {
          const data = await response.json();
          setProductivityScore(data.productivityScore);
          setMentalHealthScore(data.mentalHealthScore);
          setCurrentStreak(data.currentStreak);
          setTodaysTasks(data.todaysTasks);
        }
      } catch (error) {
        console.error('Failed to fetch productivity data:', error);
      }
    };
    
    fetchProductivityData();
    const interval = setInterval(fetchProductivityData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Focus session timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (focusSession.active && focusSession.timeRemaining > 0) {
      interval = setInterval(() => {
        setFocusSession(prev => ({
          ...prev,
          timeRemaining: prev.timeRemaining - 1
        }));
      }, 1000);
    } else if (focusSession.timeRemaining === 0) {
      setFocusSession(prev => ({ ...prev, active: false }));
      alert('Focus session complete! Take a break.');
    }

    return () => clearInterval(interval);
  }, [focusSession.active, focusSession.timeRemaining]);

  const toggleTask = async (taskId: number) => {
    try {
      const response = await fetch('/api/productivity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggleTask', taskId })
      });
      
      if (response.ok) {
        const result = await response.json();
        setTodaysTasks(result.data.todaysTasks);
        setProductivityScore(result.data.productivityScore);
        setMentalHealthScore(result.data.mentalHealthScore);
      }
    } catch (error) {
      console.error('Failed to toggle task:', error);
      // Fallback to local state update
      setTodaysTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, completed: !task.completed }
          : task
      ));
    }
  };

  const startFocusSession = () => {
    setFocusSession({
      active: true,
      timeRemaining: 25 * 60,
      type: 'pomodoro'
    });
  };

  const stopFocusSession = () => {
    setFocusSession(prev => ({ ...prev, active: false }));
  };

  const generateNewTasks = () => {
    setIsGeneratingTasks(true);
    // Simulate AI task generation
    setTimeout(() => {
      const newTasks = [
        { id: Date.now() + 1, task: 'Review weekly goals', completed: false, type: 'planning', impact: '+3 productivity' },
        { id: Date.now() + 2, task: 'Practice breathing exercise', completed: false, type: 'wellness', impact: '+2 mental wellness' },
        { id: Date.now() + 3, task: 'Organize workspace', completed: false, type: 'environment', impact: '+1 productivity' }
      ];
      setTodaysTasks(prev => [...prev, ...newTasks]);
      setIsGeneratingTasks(false);
    }, 2000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTaskIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      focus: '🎯',
      wellness: '🧘',
      work: '💼',
      meditation: '🧘‍♀️',
      planning: '📋',
      environment: '🏠'
    };
    return icons[type] || '✅';
  };

  const getHabitIcon = (impact: string) => {
    const icons: { [key: string]: string } = {
      mental_health: '🧠',
      productivity: '⚡',
      both: '🌟'
    };
    return icons[impact] || '📈';
  };

  return (
    <div className="productivity-center">
      {/* Score Overview */}
      <div className="scores-overview">
        <div className="score-card productivity">
          <div className="score-header">
            <h3>Productivity Score</h3>
            <span className="score-trend">+{weeklyProgress.productivityIncrease}</span>
          </div>
          <div className="score-display">
            <div className="score-circle" style={{ '--score': productivityScore } as React.CSSProperties}>
              <div className="score-value">{productivityScore}</div>
            </div>
            <div className="score-impact">
              <p>Linked to mental wellness</p>
              <div className="connection-line"></div>
            </div>
          </div>
        </div>

        <div className="score-card mental-health">
          <div className="score-header">
            <h3>Mental Wellness</h3>
            <span className="score-trend">+{weeklyProgress.mentalHealthImprovement}</span>
          </div>
          <div className="score-display">
            <div className="score-circle" style={{ '--score': mentalHealthScore } as React.CSSProperties}>
              <div className="score-value">{mentalHealthScore}</div>
            </div>
            <div className="score-impact">
              <p>Improves with productivity</p>
            </div>
          </div>
        </div>

        <div className="streak-card">
          <div className="streak-icon">🔥</div>
          <div className="streak-content">
            <div className="streak-number">{currentStreak}</div>
            <div className="streak-label">Day Streak</div>
          </div>
        </div>
      </div>

      {/* Focus Session */}
      <div className="focus-section">
        <h3 className="section-title">Focus Session</h3>
        <div className="focus-timer">
          <div className={`timer-circle ${focusSession.active ? 'active' : ''}`}>
            <div className="timer-display">
              <div className="time-remaining">{formatTime(focusSession.timeRemaining)}</div>
              <div className="timer-label">
                {focusSession.active ? 'Focus Mode' : 'Ready to Focus'}
              </div>
            </div>
          </div>
          <div className="timer-controls">
            {!focusSession.active ? (
              <button className="start-focus-button" onClick={startFocusSession}>
                Start 25-min Session
              </button>
            ) : (
              <button className="stop-focus-button" onClick={stopFocusSession}>
                Stop Session
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Today's Tasks */}
      <div className="tasks-section">
        <div className="tasks-header">
          <h3 className="section-title">Today's Personalized Tasks</h3>
          <button 
            className="generate-tasks-button"
            onClick={generateNewTasks}
            disabled={isGeneratingTasks}
          >
            {isGeneratingTasks ? '🤖 Generating...' : '🤖 Generate More'}
          </button>
        </div>
        
        <div className="tasks-list">
          {todaysTasks.map((task) => (
            <div key={task.id} className={`task-item ${task.completed ? 'completed' : ''} ${task.current ? 'current' : ''}`}>
              <button 
                className="task-checkbox"
                onClick={() => toggleTask(task.id)}
              >
                {task.completed ? '✅' : '⭕'}
              </button>
              <div className="task-content">
                <div className="task-main">
                  <span className="task-icon">{getTaskIcon(task.type)}</span>
                  <span className="task-text">{task.task}</span>
                  {task.current && <span className="current-badge">In Progress</span>}
                </div>
                <div className="task-impact">{task.impact}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Habit Tracking */}
      <div className="habits-section">
        <h3 className="section-title">Habit Formation</h3>
        <div className="habits-grid">
          {habits.map((habit) => (
            <div key={habit.id} className="habit-card">
              <div className="habit-header">
                <span className="habit-icon">{getHabitIcon(habit.impact)}</span>
                <div className="habit-info">
                  <h4 className="habit-name">{habit.name}</h4>
                  <div className="habit-streak">
                    🔥 {habit.streak} day streak
                  </div>
                </div>
                <div className={`habit-status ${habit.completed ? 'completed' : 'pending'}`}>
                  {habit.completed ? '✅' : '⏳'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly Progress */}
      <div className="progress-section">
        <h3 className="section-title">This Week's Progress</h3>
        <div className="progress-grid">
          <div className="progress-item">
            <div className="progress-icon">📈</div>
            <div className="progress-content">
              <div className="progress-value">+{weeklyProgress.mentalHealthImprovement}</div>
              <div className="progress-label">Mental Wellness</div>
            </div>
          </div>
          <div className="progress-item">
            <div className="progress-icon">⚡</div>
            <div className="progress-content">
              <div className="progress-value">+{weeklyProgress.productivityIncrease}</div>
              <div className="progress-label">Productivity</div>
            </div>
          </div>
          <div className="progress-item">
            <div className="progress-icon">✅</div>
            <div className="progress-content">
              <div className="progress-value">{weeklyProgress.tasksCompleted}</div>
              <div className="progress-label">Tasks Completed</div>
            </div>
          </div>
          <div className="progress-item">
            <div className="progress-icon">🎯</div>
            <div className="progress-content">
              <div className="progress-value">{weeklyProgress.focusMinutes}m</div>
              <div className="progress-label">Focus Time</div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Insights */}
      <div className="insights-section">
        <h3 className="section-title">AI Productivity Insights</h3>
        <div className="insight-card">
          <div className="insight-icon">🤖</div>
          <div className="insight-content">
            <h4>Pattern Recognition</h4>
            <p>Your productivity peaks between 9-11 AM and correlates strongly with your morning meditation habit. Consider scheduling your most important tasks during this window.</p>
          </div>
        </div>
        <div className="insight-card">
          <div className="insight-icon">💡</div>
          <div className="insight-content">
            <h4>Optimization Tip</h4>
            <p>Taking a 5-minute mindful break every hour has increased your focus quality by 23%. Your brain is responding well to this rhythm.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductivityCenter;
