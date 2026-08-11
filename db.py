import os
from fastapi import APIRouter
from pydantic import BaseModel
from datetime import date
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

url: str = os.environ["SUPABASE_URL"]
key: str = os.environ["SUPABASE_KEY"]
supabase: Client = create_client(url, key)

router = APIRouter()

class TransactionCreate(BaseModel):
    business_id: str
    type: str
    amount: float
    category: str
    date: date
    note: str | None = None


class TransactionUpdate(BaseModel):
    business_id: str | None = None
    type: str | None = None
    amount: float | None = None
    category: str | None = None
    date: date | None = None
    note: str | None = None


@router.post("/transactions")
async def create_transaction(transaction: TransactionCreate):
    result = supabase.table("transactions").insert(transaction.model_dump(mode="json")).execute()
    return result.data

@router.get("/transactions/{business_id}")
async def get_transactions(business_id: str):
    result = supabase.table("transactions").select("*").eq("business_id", business_id).execute()
    return result.data

@router.patch("/transactions/{business_id}/{transaction_id}")
async def update_transaction(business_id: str, transaction_id: str, transaction: TransactionUpdate):
    result = supabase.table("transactions").update(transaction.model_dump(mode="json", exclude_unset=True)).eq("business_id", business_id).eq("id", transaction_id).execute()
    return result.data

@router.delete("/transactions/{business_id}/{transaction_id}")
async def delete_transaction(business_id: str, transaction_id: str):
    result = supabase.table("transactions").delete().eq("business_id", business_id).eq("id", transaction_id).execute()
    return result.data
