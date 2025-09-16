# Improvements and Implementation Notes

## Turn Detection Optimization
- **Switched to English-Only Model:** Updated turn detection from `MultilingualModel()` to `EnglishModel()` to significantly reduce disk usage and improve per-turn latency.

## Auto-Join Room with Audio
- **Automatic Audio Subscription:** The agent now automatically joins the room with audio-only mode enabled:
  ```python
  await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
  ```

## Enhanced User Experience
- **Welcome Message:** Users are now greeted with a welcome message that also outlines the agent’s capabilities and how it can assist.

## Typing Sound Feedback (Unresolved)
- **Keyboard Typing Audio:** Spent several hours attempting to implement a "keyboard typing" background audio effect while the agent is processing/thinking. Despite efforts and referencing the [LiveKit example](https://github.com/livekit/agents/blob/main/examples/voice_agents/background_audio.py), this feature could not be made to work as intended.

## RAG Model Architecture
- **Dual RAG Systems:**
  - **Direct RAG:** Integrated a direct tool-call RAG model using LiveKit for fast, straightforward tasks.
  - **Multi-Agent RAG:** Added a more advanced RAG system leveraging LlamaIndex, enabling the agent to access internal tools and perform complex, reasoning-intensive tasks.

## Personality and Greetings
- **Custom Prompts:** Added personality traits and greeting messages to the agent’s prompt configuration in `src/prompts.py` for a more engaging and personalized user interaction.