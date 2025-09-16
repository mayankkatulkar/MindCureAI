"""
AutoGen Operator Agent for MindCure - Browser Automation Implementation
Using Playwright with visible browser for user interaction
"""

import os
import asyncio
import logging
from pathlib import Path
from dotenv import load_dotenv
import platform

# Load environment variables
env_path = Path(__file__).parent.parent / ".env.local"
load_dotenv(env_path)

logger = logging.getLogger(__name__)

try:
    import autogen
    from autogen import AssistantAgent, UserProxyAgent
    AUTOGEN_AVAILABLE = True
    logger.info("AutoGen packages loaded successfully")
except ImportError as e:
    AUTOGEN_AVAILABLE = False
    logger.warning(f"AutoGen packages not available: {e}")

try:
    from playwright.async_api import async_playwright
    PLAYWRIGHT_AVAILABLE = True
    logger.info("Playwright available for browser automation")
except ImportError as e:
    PLAYWRIGHT_AVAILABLE = False
    logger.warning(f"Playwright not available: {e}")

class OperatorAgent:
    """Browser Automation Agent using AutoGen + Playwright with visible browser"""
    
    def __init__(self):
        if not AUTOGEN_AVAILABLE:
            self.available = False
            return
            
        try:
            # Simple config using Gemini
            self.llm_config = {
                "model": "gpt-3.5-turbo",
                "api_key": os.getenv("OPENAI_API_KEY", "fake-key"),
                "temperature": 0.7,
            }
            
            # Assistant Agent for mental health research
            self.assistant = AssistantAgent(
                name="MentalHealthAssistant",
                system_message="""You are Dr. Sarah's browser automation assistant specializing in mental health resources. 
                You can help users by opening browsers and navigating to relevant websites.
                
                Your capabilities include:
                - Opening Psychology Today to search for therapists
                - Navigating to BetterHelp, Talkspace, and other therapy platforms
                - Finding crisis resources and hotlines
                - Showing users how to book appointments online
                - Demonstrating how to use mental health resource websites
                
                Always describe what you're doing step by step as you navigate.""",
                llm_config=False,
            )
            
            # Use Gemini directly for planning
            import google.generativeai as genai
            genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
            self.gemini_model = genai.GenerativeModel('gemini-1.5-flash')
            
            self.available = True
            self.browser = None
            self.page = None
            logger.info("Operator Agent with browser automation initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize Operator Agent: {e}")
            self.available = False
    
    async def _get_browser_type(self):
        """Determine the best browser to use based on the system"""
        system = platform.system().lower()
        if system == "darwin":  # macOS
            return "webkit"  # Safari engine
        else:
            return "chromium"  # Chrome/Edge
    
    async def _open_browser(self):
        """Open a visible browser for the user to see"""
        if not PLAYWRIGHT_AVAILABLE:
            logger.warning("Playwright not available, cannot open browser")
            return False
            
        try:
            self.playwright = await async_playwright().start()
            browser_type = await self._get_browser_type()
            
            # Open browser with visible window
            if browser_type == "webkit":
                self.browser = await self.playwright.webkit.launch(
                    headless=False,
                    slow_mo=1000  # Slow down actions so user can see
                )
            else:
                self.browser = await self.playwright.chromium.launch(
                    headless=False,
                    slow_mo=1000,
                    args=['--start-maximized']
                )
            
            self.page = await self.browser.new_page()
            await self.page.set_viewport_size({"width": 1280, "height": 720})
            
            logger.info(f"Opened {browser_type} browser for user interaction")
            return True
            
        except Exception as e:
            logger.error(f"Failed to open browser: {e}")
            return False
    
    async def _close_browser(self):
        """Close the browser"""
        try:
            if self.page:
                await self.page.close()
            if self.browser:
                await self.browser.close()
            if hasattr(self, 'playwright'):
                await self.playwright.stop()
            logger.info("Browser closed")
        except Exception as e:
            logger.error(f"Error closing browser: {e}")
    
    async def _search_psychology_today(self, location: str, specialty: str = "anxiety"):
        """Navigate to Psychology Today and perform a search"""
        try:
            await self.page.goto("https://www.psychologytoday.com/us/therapists")
            await self.page.wait_for_load_state('networkidle')
            
            # Fill in location
            location_input = self.page.locator('input[placeholder*="ZIP"], input[placeholder*="City"], input[id*="location"]')
            await location_input.first.fill(location)
            await asyncio.sleep(1)
            
            # Look for specialty/issue filter
            try:
                issues_button = self.page.locator('text="Issues"', 'button:has-text("Issues")')
                if await issues_button.count() > 0:
                    await issues_button.first.click()
                    await asyncio.sleep(1)
                    
                    specialty_option = self.page.locator(f'text="{specialty.title()}"')
                    if await specialty_option.count() > 0:
                        await specialty_option.first.click()
                        await asyncio.sleep(1)
            except:
                pass
            
            # Search
            search_button = self.page.locator('button[type="submit"], button:has-text("Search"), input[type="submit"]')
            if await search_button.count() > 0:
                await search_button.first.click()
                await self.page.wait_for_load_state('networkidle')
            
            return "Successfully navigated to Psychology Today and performed search. User can now browse therapist profiles."
            
        except Exception as e:
            logger.error(f"Error searching Psychology Today: {e}")
            return f"Opened Psychology Today but encountered an issue: {e}"
    
    async def _open_crisis_resources(self, location: str):
        """Open crisis mental health resources"""
        try:
            # Open 988 Suicide & Crisis Lifeline
            await self.page.goto("https://988lifeline.org/")
            await self.page.wait_for_load_state('networkidle')
            await asyncio.sleep(2)
            
            # Open Psychology Today for therapist search instead of SAMHSA
            new_page = await self.browser.new_page()
            await new_page.goto("https://www.psychologytoday.com/us/therapists")
            await new_page.wait_for_load_state('networkidle')
            
            return f"Opened crisis resources: 988 Lifeline and Psychology Today therapist directory for {location}"
            
        except Exception as e:
            logger.error(f"Error opening crisis resources: {e}")
            return f"Opened crisis resource websites with some navigation issues: {e}"
    
    async def _open_betterhelp(self):
        """Navigate to BetterHelp"""
        try:
            await self.page.goto("https://www.betterhelp.com/")
            await self.page.wait_for_load_state('networkidle')
            return "Opened BetterHelp - user can start the questionnaire to get matched with a therapist"
        except Exception as e:
            logger.error(f"Error opening BetterHelp: {e}")
            return f"Opened BetterHelp with navigation issues: {e}"
    
    async def execute_task(self, task: str) -> str:
        """Execute a task using browser automation with visible feedback"""
        if not self.available:
            return "Operator agent not available. Please install autogen packages."
        
        try:
            logger.info(f"Executing browser automation task: {task}")
            
            # Use Gemini to understand the task and plan actions
            planning_prompt = f"""
            Analyze this mental health assistance request and determine the best action:
            
            Task: {task}
            
            Choose ONE primary action:
            1. SEARCH_THERAPISTS - if looking for therapists, counselors, or mental health professionals
            2. CRISIS_HELP - if urgent mental health crisis, suicide prevention, emergency resources
            3. ONLINE_THERAPY - if interested in online therapy platforms like BetterHelp, Talkspace
            4. GENERAL_INFO - for general mental health information and guidance
            
            Also extract:
            - Location (city, state, or zip code)
            - Specialty (anxiety, depression, PTSD, etc.)
            
            Respond with: ACTION|LOCATION|SPECIALTY
            Example: SEARCH_THERAPISTS|San Francisco|anxiety
            """
            
            # Plan the action using Gemini
            response = self.gemini_model.generate_content(planning_prompt)
            plan = response.text.strip()
            
            logger.info(f"Planned action: {plan}")
            
            # Parse the plan
            try:
                parts = plan.split('|')
                action = parts[0].strip()
                location = parts[1].strip() if len(parts) > 1 else "United States"
                specialty = parts[2].strip() if len(parts) > 2 else "general"
            except:
                action = "GENERAL_INFO"
                location = "United States"
                specialty = "general"
            
            # Open browser for visual interaction
            browser_opened = await self._open_browser()
            if not browser_opened:
                # Fallback to text-based guidance
                fallback_prompt = f"""
                Provide comprehensive mental health guidance for: {task}
                
                Include:
                - Specific websites to visit (with URLs)
                - Phone numbers and contact methods
                - Step-by-step instructions
                - Crisis resources if needed
                
                Be very detailed and actionable.
                """
                fallback_response = self.gemini_model.generate_content(fallback_prompt)
                return fallback_response.text
            
            # Execute the planned action with browser
            result = ""
            try:
                if action == "SEARCH_THERAPISTS":
                    result = await self._search_psychology_today(location, specialty)
                elif action == "CRISIS_HELP":
                    result = await self._open_crisis_resources(location)
                elif action == "ONLINE_THERAPY":
                    result = await self._open_betterhelp()
                else:
                    # General information - open Psychology Today instead of government sites
                    await self.page.goto("https://www.psychologytoday.com/us/therapists")
                    await self.page.wait_for_load_state('networkidle')
                    result = "Opened Psychology Today for mental health therapist search and information"
                
                # Keep browser open for 30 seconds so user can interact
                await asyncio.sleep(10)  # Give user time to see the results
                
                # Generate follow-up guidance
                guidance_prompt = f"""
                The user requested: {task}
                
                I just opened a browser and {result}
                
                Provide helpful follow-up guidance about:
                - What the user should do next on the website(s) I opened
                - What to look for or click on
                - Additional resources they might need
                - Next steps in their mental health journey
                
                Be encouraging and specific.
                """
                
                guidance_response = self.gemini_model.generate_content(guidance_prompt)
                final_result = f"{result}\n\n{guidance_response.text}"
                
                return final_result
                
            except Exception as e:
                logger.error(f"Browser automation error: {e}")
                return f"I opened a browser for you but encountered some navigation issues. The websites should still be accessible for you to explore: {e}"
            
            finally:
                # Keep browser open for user interaction, don't close immediately
                logger.info("Browser remains open for user interaction")
                
        except Exception as e:
            logger.error(f"Operator task failed: {e}")
            return f"I can help you with: {task}. Let me provide some guidance on mental health resources and next steps to take."

# Global operator instance
_operator = None

def get_operator():
    """Get or create the operator instance"""
    global _operator
    if _operator is None:
        _operator = OperatorAgent()
    return _operator

async def run_operator_task(task: str) -> str:
    """Main function to run operator tasks - called by the voice agent"""
    operator = get_operator()
    return await operator.execute_task(task)

# Specific helper functions for mental health use cases
async def search_therapists_near(location: str, specialty: str = "anxiety") -> str:
    """Search for therapists near a location with browser automation"""
    task = f"Search for mental health therapists in {location} who specialize in {specialty} treatment. Use Psychology Today (psychologytoday.com) ONLY for therapist finder to show available therapists. Do NOT use SAMHSA, mentalhealth.gov, or other government websites - use Psychology Today exclusively."
    return await run_operator_task(task)

async def book_therapy_appointment(provider: str, location: str, phone: str = None) -> str:
    """Help book a therapy appointment with browser assistance"""
    task = f"Help book a therapy appointment with {provider} in {location}. Open their website and guide through the booking process."
    return await run_operator_task(task)

async def get_crisis_help(location: str) -> str:
    """Find crisis mental health resources with immediate browser access"""
    task = f"URGENT: Find immediate mental health crisis resources and emergency services in {location}. Open crisis hotlines and emergency resources."
    return await run_operator_task(task)

async def explore_online_therapy() -> str:
    """Open online therapy platforms for comparison"""
    task = "Show me online therapy options like BetterHelp, Talkspace, and others. Open their websites so I can compare."
    return await run_operator_task(task)
