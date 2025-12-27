"""
Browser Automation Module for MindCure
Supports screenshot streaming for in-app browser viewing.
"""

import logging
import asyncio
import base64
import os
from typing import Dict, Any, Optional
from datetime import datetime
from playwright.async_api import async_playwright, Browser, Page

logger = logging.getLogger("browser")

# Global state for browser automation
_browser_state: Dict[str, Any] = {
    "is_running": False,
    "current_task": None,
    "screenshots": [],  # List of base64 encoded screenshots
    "status": "idle",
    "step": 0,
    "total_steps": 0,
    "current_url": None,
    "error": None,
    "started_at": None,
    "completed_at": None
}


def get_browser_state() -> Dict[str, Any]:
    """Get current browser automation state for API endpoint."""
    return _browser_state.copy()


def reset_browser_state():
    """Reset browser state for new automation."""
    global _browser_state
    _browser_state = {
        "is_running": False,
        "current_task": None,
        "screenshots": [],
        "status": "idle",
        "step": 0,
        "total_steps": 0,
        "current_url": None,
        "error": None,
        "started_at": None,
        "completed_at": None
    }


async def capture_screenshot(page: Page) -> str:
    """Capture a screenshot and return as base64 string."""
    try:
        screenshot_bytes = await page.screenshot(type='jpeg', quality=60)
        return base64.b64encode(screenshot_bytes).decode('utf-8')
    except Exception as e:
        logger.error(f"Screenshot capture failed: {e}")
        return ""


async def run_browser_automation(
    task: str, 
    max_steps: int = 50, 
    headless: bool = True,
    stream_screenshots: bool = True
) -> str:
    """
    Run browser automation with screenshot streaming support.
    
    Args:
        task: Description of the task to perform
        max_steps: Maximum number of automation steps
        headless: Whether to run in headless mode (True for streaming)
        stream_screenshots: Whether to capture screenshots for streaming
    """
    global _browser_state
    
    try:
        # Initialize state
        reset_browser_state()
        _browser_state["is_running"] = True
        _browser_state["current_task"] = task
        _browser_state["status"] = "starting"
        _browser_state["started_at"] = datetime.now().isoformat()
        
        logger.info(f"🌐 Starting browser automation: {task}")
        
        async with async_playwright() as p:
            # Launch in headless mode for streaming
            browser = await p.chromium.launch(headless=headless, slow_mo=500)
            context = await browser.new_context(
                viewport={'width': 1280, 'height': 720}
            )
            page = await context.new_page()
            
            task_lower = task.lower()
            _browser_state["status"] = "navigating"
            _browser_state["step"] = 1
            
            # Determine action based on task
            if "therapist" in task_lower or "psychology" in task_lower:
                _browser_state["total_steps"] = 3
                
                # Step 1: Navigate to Psychology Today
                _browser_state["status"] = "Opening Psychology Today..."
                await page.goto("https://www.psychologytoday.com/us/therapists")
                _browser_state["current_url"] = page.url
                
                if stream_screenshots:
                    screenshot = await capture_screenshot(page)
                    if screenshot:
                        _browser_state["screenshots"].append(screenshot)
                
                await asyncio.sleep(2)
                _browser_state["step"] = 2
                
                # Step 2: Try to search if location mentioned
                location = extract_location(task)
                if location:
                    _browser_state["status"] = f"Searching for therapists in {location}..."
                    try:
                        location_input = page.locator('input[placeholder*="City"], input[placeholder*="ZIP"]')
                        if await location_input.count() > 0:
                            await location_input.first.fill(location)
                            await asyncio.sleep(1)
                            
                            if stream_screenshots:
                                screenshot = await capture_screenshot(page)
                                if screenshot:
                                    _browser_state["screenshots"].append(screenshot)
                    except Exception as e:
                        logger.warning(f"Location search failed: {e}")
                
                _browser_state["step"] = 3
                _browser_state["status"] = "Showing results..."
                await asyncio.sleep(2)
                
                if stream_screenshots:
                    screenshot = await capture_screenshot(page)
                    if screenshot:
                        _browser_state["screenshots"].append(screenshot)
                
                result = f"✅ Opened Psychology Today therapist directory. {f'Searched for therapists in {location}.' if location else 'You can search by location.'}"
                
            elif "instagram" in task_lower or "block" in task_lower:
                _browser_state["total_steps"] = 2
                _browser_state["status"] = "Opening Instagram..."
                
                await page.goto("https://www.instagram.com")
                _browser_state["current_url"] = page.url
                
                if stream_screenshots:
                    screenshot = await capture_screenshot(page)
                    if screenshot:
                        _browser_state["screenshots"].append(screenshot)
                
                await asyncio.sleep(2)
                _browser_state["step"] = 2
                
                result = "✅ Opened Instagram. You can log in to manage your account settings and blocking."
                
            elif "spotify" in task_lower or "music" in task_lower or "playlist" in task_lower:
                _browser_state["total_steps"] = 2
                _browser_state["status"] = "Opening Spotify..."
                
                await page.goto("https://open.spotify.com")
                _browser_state["current_url"] = page.url
                
                if stream_screenshots:
                    screenshot = await capture_screenshot(page)
                    if screenshot:
                        _browser_state["screenshots"].append(screenshot)
                
                await asyncio.sleep(2)
                _browser_state["step"] = 2
                
                result = "✅ Opened Spotify. You can browse playlists to find music that matches your mood."
                
            elif "maps" in task_lower or "park" in task_lower or "grass" in task_lower:
                _browser_state["total_steps"] = 2
                _browser_state["status"] = "Finding nearby parks..."
                
                await page.goto("https://www.google.com/maps/search/parks+near+me")
                _browser_state["current_url"] = page.url
                
                if stream_screenshots:
                    screenshot = await capture_screenshot(page)
                    if screenshot:
                        _browser_state["screenshots"].append(screenshot)
                
                await asyncio.sleep(3)
                _browser_state["step"] = 2
                
                result = "✅ Opened Google Maps showing parks near you. Time to touch some grass! 🌳"
                
            elif "meme" in task_lower or "reddit" in task_lower:
                _browser_state["total_steps"] = 2
                _browser_state["status"] = "Opening wholesome memes..."
                
                await page.goto("https://www.reddit.com/r/wholesomememes/")
                _browser_state["current_url"] = page.url
                
                if stream_screenshots:
                    screenshot = await capture_screenshot(page)
                    if screenshot:
                        _browser_state["screenshots"].append(screenshot)
                
                await asyncio.sleep(3)
                _browser_state["step"] = 2
                
                result = "✅ Opened wholesome memes on Reddit. Enjoy your dose of positivity! 😊"
                
            else:
                # Default: Google search
                _browser_state["total_steps"] = 2
                _browser_state["status"] = f"Searching for: {task}"
                
                await page.goto(f"https://www.google.com/search?q={task}")
                _browser_state["current_url"] = page.url
                
                if stream_screenshots:
                    screenshot = await capture_screenshot(page)
                    if screenshot:
                        _browser_state["screenshots"].append(screenshot)
                
                await asyncio.sleep(2)
                _browser_state["step"] = 2
                
                result = f"✅ Searched Google for: {task}"
            
            # Final screenshot
            if stream_screenshots:
                screenshot = await capture_screenshot(page)
                if screenshot:
                    _browser_state["screenshots"].append(screenshot)
            
            await browser.close()
            
            _browser_state["status"] = "completed"
            _browser_state["is_running"] = False
            _browser_state["completed_at"] = datetime.now().isoformat()
            
            logger.info(f"✅ Browser automation completed: {result}")
            return result
            
    except Exception as e:
        logger.error(f"❌ Browser automation failed: {e}")
        _browser_state["status"] = "error"
        _browser_state["error"] = str(e)
        _browser_state["is_running"] = False
        _browser_state["completed_at"] = datetime.now().isoformat()
        return f"Failed to complete browser task: {e}"


def extract_location(task: str) -> Optional[str]:
    """Extract location from task string."""
    # Simple location extraction - could be enhanced with NLP
    common_cities = [
        "san francisco", "new york", "los angeles", "chicago", "boston",
        "seattle", "miami", "atlanta", "denver", "austin", "portland"
    ]
    
    task_lower = task.lower()
    for city in common_cities:
        if city in task_lower:
            return city.title()
    
    # Try to find "in [location]" pattern
    if " in " in task_lower:
        parts = task_lower.split(" in ")
        if len(parts) > 1:
            location = parts[-1].strip()
            # Clean up common words
            for word in ["for", "who", "that", "with"]:
                if word in location:
                    location = location.split(word)[0].strip()
            if len(location) > 2 and len(location) < 50:
                return location.title()
    
    return None

