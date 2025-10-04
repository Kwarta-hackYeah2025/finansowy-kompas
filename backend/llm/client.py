import instructor  # type: ignore
from config.settings import settings

# OpenAI
# client = instructor.from_provider("openai/gpt-4", api_key=settings.openai_api_key)
# Anthropic
# client = instructor.from_provider("anthropic/claude-3", api_key=settings.anthropic_api_key)
# Google
client = instructor.from_provider("google/gemini-2.5-flash-lite", api_key=settings.gemini_api_key)
# Ollama (local)
# client = instructor.from_provider("ollama/llama3", api_key=settings.ollama_api_key)
# DeepSeek
# client = instructor.from_provider("deepseek/deepseek-chat", api_key=settings.deepseek_api_key)
