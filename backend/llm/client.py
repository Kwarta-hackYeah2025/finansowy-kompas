from pydantic_ai import Agent
from pydantic_ai.models.google import GoogleModel
from pydantic_ai.providers.google import GoogleProvider

from config.settings import settings


class ChatAdapter:
    def __init__(self, agent: Agent):
        self.agent = agent

    class _Completions:
        def __init__(self, agent: Agent):
            self.agent = agent

        def create(self, response_model, messages):
            system_prompt = ""
            for m in messages:
                if m["role"] == "system":
                    system_prompt += m["content"] + "\n"
            user_prompt = next((m["content"] for m in messages if m["role"] == "user"), "")

            result = self.agent.run_sync(
                f"{system_prompt}\nUser: {user_prompt}",
                output_type=response_model,
            )
            return result.output

    @property
    def chat(self):
        class _Chat:
            def __init__(self, agent):
                self.completions = ChatAdapter._Completions(agent)

        return _Chat(self.agent)


provider = GoogleProvider(api_key=settings.gemini_api_key)
model = GoogleModel("gemini-2.5-flash-lite", provider=provider)
agent = Agent(model)

client = ChatAdapter(agent=agent)
