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

class InventoryCreate(BaseModel):
    business_id: str
    name: str
    quantity: int
    cost_price: float
    sales_price: float
    note: str | None = None


class InventoryUpdate(BaseModel):
    business_id: str | None = None
    name: str | None = None
    quantity: int | None = None
    cost_price: float | None = None
    sales_price: float | None = None
    note: str | None = None


@router.post("/inventory")
async def create_inventory(inventory: InventoryCreate):
    result = supabase.table("inventory").insert(inventory.model_dump(mode="json")).execute()
    return result.data

@router.get("/inventory/{business_id}")
async def get_inventory(business_id: str):
    result = supabase.table("inventory").select("*").eq("business_id", business_id).execute()
    return result.data

@router.patch("/inventory/{business_id}/{inventory_id}")
async def update_inventory(business_id: str, inventory_id: str, inventory: InventoryUpdate):
    result = supabase.table("inventory").update(inventory.model_dump(mode="json", exclude_unset=True)).eq("business_id", business_id).eq("id", inventory_id).execute()
    return result.data

@router.delete("/inventory/{business_id}/{inventory_id}")
async def delete_inventory(business_id: str, inventory_id: str):
    result = supabase.table("inventory").delete().eq("business_id", business_id).eq("id", inventory_id).execute()
    return result.data
