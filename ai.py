import os
import json
from fastapi import APIRouter
from dotenv import load_dotenv
from google import genai
from google.genai import types
from pydantic import BaseModel


load_dotenv()
gemini_api_key = os.getenv("GEMINI_API_KEY")

client = genai.Client(api_key=gemini_api_key)



class UserInput(BaseModel):
    notes: str
router = APIRouter()
with open('prompt.txt', 'r') as f:
    system_instruction = f.read()

@router.post("/chat")
async def ai_response(user_input: UserInput):
    gemini_result = client.models.generate_content(
       model="gemini-3.5-flash",
       config=types.GenerateContentConfig(system_instruction=system_instruction),
        contents=user_input.notes
    )
    return {"reply": gemini_result.text}

