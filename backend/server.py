from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import asyncio
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
from io import BytesIO
import resend

from data import (
    MATERIALS, FORM_TYPES, MANUFACTURING_METHODS,
    PROJECT_STATUSES, PART_STATUSES, ORDER_STATUSES, QUOTE_STATUSES, CURRENCIES
)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Resend setup
resend_api_key = os.environ.get('RESEND_API_KEY')
if resend_api_key:
    resend.api_key = resend_api_key
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')

app = FastAPI(title="ProManufakt API", version="1.0.0")
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ===================== PYDANTIC MODELS =====================

# Project Models
class ProjectCreate(BaseModel):
    name: str
    customer_name: Optional[str] = None
    start_date: str
    end_date: str
    notes: Optional[str] = None

class Project(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    code: str = ""
    name: str
    customer_name: Optional[str] = None
    start_date: str
    end_date: str
    status: str = "planning"
    notes: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# Part Models
class PartDimensions(BaseModel):
    width: Optional[float] = None
    height: Optional[float] = None
    length: Optional[float] = None
    diameter: Optional[float] = None
    outer_diameter: Optional[float] = None
    inner_diameter: Optional[float] = None

class PartCreate(BaseModel):
    project_id: str
    name: str
    code: str
    quantity: int
    material: Optional[str] = None
    form_type: Optional[str] = None
    dimensions: Optional[PartDimensions] = None
    manufacturing_methods: List[str] = []
    notes: Optional[str] = None
    technical_drawing_url: Optional[str] = None

class Part(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    project_id: str
    name: str
    code: str
    quantity: int
    material: Optional[str] = None
    form_type: Optional[str] = None
    dimensions: Optional[PartDimensions] = None
    manufacturing_methods: List[str] = []
    status: str = "pending"
    notes: Optional[str] = None
    technical_drawing_url: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# Supplier Models
class SupplierCreate(BaseModel):
    name: str
    contact_person: str
    email: EmailStr
    phone: Optional[str] = None
    address: Optional[str] = None
    tax_id: Optional[str] = None
    specializations: List[str] = []
    payment_terms: Optional[int] = 30
    notes: Optional[str] = None

class SupplierPerformance(BaseModel):
    total_orders: int = 0
    on_time_deliveries: int = 0
    quality_rejections: int = 0
    average_price_ratio: float = 1.0
    delivery_score: float = 40.0
    quality_score: float = 30.0
    price_score: float = 15.0
    payment_score: float = 10.0
    total_score: float = 95.0

class Supplier(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    contact_person: str
    email: EmailStr
    phone: Optional[str] = None
    address: Optional[str] = None
    tax_id: Optional[str] = None
    specializations: List[str] = []
    payment_terms: int = 30
    performance: SupplierPerformance = Field(default_factory=SupplierPerformance)
    notes: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# Quote Models
class QuoteRequestCreate(BaseModel):
    part_id: str
    supplier_ids: List[str]
    manufacturing_method: str
    deadline: str
    notes: Optional[str] = None

class QuoteResponseCreate(BaseModel):
    quote_request_id: str
    supplier_id: str
    unit_price: float
    currency: str = "TRY"
    total_price: float
    delivery_date: str
    payment_terms: int = 30
    notes: Optional[str] = None

class QuoteRequest(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    part_id: str
    supplier_ids: List[str]
    manufacturing_method: str
    deadline: str
    status: str = "requested"
    notes: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class QuoteResponse(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    quote_request_id: str
    supplier_id: str
    unit_price: float
    currency: str = "TRY"
    total_price: float
    delivery_date: str
    payment_terms: int = 30
    status: str = "received"
    notes: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# Order Models
class OrderCreate(BaseModel):
    quote_response_id: str
    part_id: str
    supplier_id: str
    quantity: int
    unit_price: float
    currency: str = "TRY"
    total_price: float
    expected_delivery: str
    notes: Optional[str] = None

class Order(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    code: str = ""
    quote_response_id: str
    part_id: str
    supplier_id: str
    quantity: int
    unit_price: float
    currency: str = "TRY"
    total_price: float
    expected_delivery: str
    actual_delivery: Optional[str] = None
    status: str = "pending"
    notes: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# Notification Models
class Notification(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: str
    title: str
    message: str
    reference_type: Optional[str] = None
    reference_id: Optional[str] = None
    is_read: bool = False
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# Currency Rate Models
class CurrencyRateUpdate(BaseModel):
    usd_to_try: float
    eur_to_try: float

class CurrencyRate(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    usd_to_try: float
    eur_to_try: float
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_by: str = "manual"

# Settings Models
class SettingsUpdate(BaseModel):
    company_name: Optional[str] = None
    company_email: Optional[str] = None
    company_phone: Optional[str] = None
    company_address: Optional[str] = None

class Settings(BaseModel):
    id: str = "settings"
    company_name: str = "ProManufakt"
    company_email: str = ""
    company_phone: str = ""
    company_address: str = ""

# Email Models
class EmailRequest(BaseModel):
    recipient_email: EmailStr
    subject: str
    html_content: str

# ===================== HELPER FUNCTIONS =====================

async def generate_project_code():
    year = datetime.now().year
    count = await db.projects.count_documents({"code": {"$regex": f"^PRJ-{year}"}})
    return f"PRJ-{year}-{str(count + 1).zfill(3)}"

async def generate_order_code():
    year = datetime.now().year
    count = await db.orders.count_documents({"code": {"$regex": f"^SIP-{year}"}})
    return f"SIP-{year}-{str(count + 1).zfill(3)}"

async def create_notification(notification_type: str, title: str, message: str, ref_type: str = None, ref_id: str = None):
    notification = Notification(
        type=notification_type,
        title=title,
        message=message,
        reference_type=ref_type,
        reference_id=ref_id
    )
    await db.notifications.insert_one(notification.model_dump())
    return notification

def calculate_supplier_score(performance: dict) -> dict:
    total_orders = performance.get("total_orders", 0)
    on_time = performance.get("on_time_deliveries", 0)
    rejections = performance.get("quality_rejections", 0)
    price_ratio = performance.get("average_price_ratio", 1.0)
    payment_terms = performance.get("payment_terms", 30)
    
    # Delivery Score (40 points)
    if total_orders > 0:
        delivery_rate = on_time / total_orders
        delivery_score = delivery_rate * 40
    else:
        delivery_score = 40.0
    
    # Quality Score (30 points)
    if total_orders > 0:
        rejection_rate = rejections / total_orders
        quality_score = (1 - rejection_rate) * 30
    else:
        quality_score = 30.0
    
    # Price Score (20 points)
    if price_ratio <= 0.95:
        price_score = 20.0
    elif price_ratio <= 1.0:
        price_score = 15.0
    elif price_ratio <= 1.1:
        price_score = 10.0
    else:
        price_score = 5.0
    
    # Payment Terms Score (10 points)
    if payment_terms >= 90:
        payment_score = 10.0
    elif payment_terms >= 60:
        payment_score = 8.0
    elif payment_terms >= 30:
        payment_score = 5.0
    else:
        payment_score = 3.0
    
    total_score = delivery_score + quality_score + price_score + payment_score
    
    return {
        "delivery_score": round(delivery_score, 1),
        "quality_score": round(quality_score, 1),
        "price_score": round(price_score, 1),
        "payment_score": round(payment_score, 1),
        "total_score": round(total_score, 1)
    }

# ===================== API ROUTES =====================

@api_router.get("/")
async def root():
    return {"message": "ProManufakt API", "version": "1.0.0"}

# --- Static Data Routes ---
@api_router.get("/materials")
async def get_materials():
    return MATERIALS

@api_router.get("/form-types")
async def get_form_types():
    return FORM_TYPES

@api_router.get("/manufacturing-methods")
async def get_manufacturing_methods():
    return MANUFACTURING_METHODS

@api_router.get("/statuses")
async def get_statuses():
    return {
        "project": PROJECT_STATUSES,
        "part": PART_STATUSES,
        "order": ORDER_STATUSES,
        "quote": QUOTE_STATUSES
    }

@api_router.get("/currencies")
async def get_currencies():
    return CURRENCIES

# --- Project Routes ---
@api_router.post("/projects", response_model=Project)
async def create_project(data: ProjectCreate):
    code = await generate_project_code()
    project = Project(code=code, **data.model_dump())
    doc = project.model_dump()
    await db.projects.insert_one(doc)
    await create_notification("project", "Yeni Proje", f"{project.name} projesi oluşturuldu", "project", project.id)
    return project

@api_router.get("/projects")
async def get_projects(status: Optional[str] = None):
    query = {}
    if status:
        query["status"] = status
    projects = await db.projects.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return projects

@api_router.get("/projects/{project_id}")
async def get_project(project_id: str):
    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Proje bulunamadı")
    return project

@api_router.put("/projects/{project_id}")
async def update_project(project_id: str, data: dict):
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.projects.update_one({"id": project_id}, {"$set": data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Proje bulunamadı")
    return await db.projects.find_one({"id": project_id}, {"_id": 0})

@api_router.delete("/projects/{project_id}")
async def delete_project(project_id: str):
    result = await db.projects.delete_one({"id": project_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Proje bulunamadı")
    await db.parts.delete_many({"project_id": project_id})
    return {"message": "Proje silindi"}

# --- Part Routes ---
@api_router.post("/parts", response_model=Part)
async def create_part(data: PartCreate):
    # Check if project exists
    project = await db.projects.find_one({"id": data.project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Proje bulunamadı")
    
    part = Part(**data.model_dump())
    doc = part.model_dump()
    if doc.get("dimensions"):
        doc["dimensions"] = doc["dimensions"]
    await db.parts.insert_one(doc)
    return part

@api_router.get("/parts")
async def get_parts(project_id: Optional[str] = None, status: Optional[str] = None):
    query = {}
    if project_id:
        query["project_id"] = project_id
    if status:
        query["status"] = status
    parts = await db.parts.find(query, {"_id": 0}).to_list(1000)
    return parts

@api_router.get("/parts/{part_id}")
async def get_part(part_id: str):
    part = await db.parts.find_one({"id": part_id}, {"_id": 0})
    if not part:
        raise HTTPException(status_code=404, detail="Parça bulunamadı")
    return part

@api_router.put("/parts/{part_id}")
async def update_part(part_id: str, data: dict):
    result = await db.parts.update_one({"id": part_id}, {"$set": data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Parça bulunamadı")
    return await db.parts.find_one({"id": part_id}, {"_id": 0})

@api_router.delete("/parts/{part_id}")
async def delete_part(part_id: str):
    result = await db.parts.delete_one({"id": part_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Parça bulunamadı")
    return {"message": "Parça silindi"}

# --- Supplier Routes ---
@api_router.post("/suppliers", response_model=Supplier)
async def create_supplier(data: SupplierCreate):
    supplier = Supplier(**data.model_dump())
    doc = supplier.model_dump()
    await db.suppliers.insert_one(doc)
    return supplier

@api_router.get("/suppliers")
async def get_suppliers(specialization: Optional[str] = None):
    query = {}
    if specialization:
        query["specializations"] = specialization
    suppliers = await db.suppliers.find(query, {"_id": 0}).to_list(1000)
    return suppliers

@api_router.get("/suppliers/{supplier_id}")
async def get_supplier(supplier_id: str):
    supplier = await db.suppliers.find_one({"id": supplier_id}, {"_id": 0})
    if not supplier:
        raise HTTPException(status_code=404, detail="Tedarikçi bulunamadı")
    return supplier

@api_router.put("/suppliers/{supplier_id}")
async def update_supplier(supplier_id: str, data: dict):
    result = await db.suppliers.update_one({"id": supplier_id}, {"$set": data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Tedarikçi bulunamadı")
    return await db.suppliers.find_one({"id": supplier_id}, {"_id": 0})

@api_router.delete("/suppliers/{supplier_id}")
async def delete_supplier(supplier_id: str):
    result = await db.suppliers.delete_one({"id": supplier_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Tedarikçi bulunamadı")
    return {"message": "Tedarikçi silindi"}

# --- Quote Routes ---
@api_router.post("/quote-requests", response_model=QuoteRequest)
async def create_quote_request(data: QuoteRequestCreate):
    quote_request = QuoteRequest(**data.model_dump())
    doc = quote_request.model_dump()
    await db.quote_requests.insert_one(doc)
    
    # Create notifications for each supplier
    part = await db.parts.find_one({"id": data.part_id}, {"_id": 0})
    for supplier_id in data.supplier_ids:
        supplier = await db.suppliers.find_one({"id": supplier_id}, {"_id": 0})
        if supplier and part:
            await create_notification(
                "quote_request",
                "Teklif Talebi",
                f"{part.get('name', '')} parçası için teklif talebi oluşturuldu",
                "quote_request",
                quote_request.id
            )
    
    return quote_request

@api_router.get("/quote-requests")
async def get_quote_requests(part_id: Optional[str] = None, status: Optional[str] = None):
    query = {}
    if part_id:
        query["part_id"] = part_id
    if status:
        query["status"] = status
    requests = await db.quote_requests.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return requests

@api_router.post("/quote-responses", response_model=QuoteResponse)
async def create_quote_response(data: QuoteResponseCreate):
    quote_response = QuoteResponse(**data.model_dump())
    doc = quote_response.model_dump()
    await db.quote_responses.insert_one(doc)
    
    # Update quote request status
    await db.quote_requests.update_one(
        {"id": data.quote_request_id},
        {"$set": {"status": "received"}}
    )
    
    return quote_response

@api_router.get("/quote-responses")
async def get_quote_responses(quote_request_id: Optional[str] = None):
    query = {}
    if quote_request_id:
        query["quote_request_id"] = quote_request_id
    responses = await db.quote_responses.find(query, {"_id": 0}).to_list(1000)
    return responses

@api_router.get("/quote-comparison/{quote_request_id}")
async def get_quote_comparison(quote_request_id: str):
    """Compare quotes for a specific request with scoring"""
    quote_request = await db.quote_requests.find_one({"id": quote_request_id}, {"_id": 0})
    if not quote_request:
        raise HTTPException(status_code=404, detail="Teklif talebi bulunamadı")
    
    responses = await db.quote_responses.find({"quote_request_id": quote_request_id}, {"_id": 0}).to_list(100)
    
    # Get currency rates
    rates = await db.currency_rates.find_one({}, {"_id": 0}, sort=[("updated_at", -1)])
    usd_rate = rates.get("usd_to_try", 33.0) if rates else 33.0
    eur_rate = rates.get("eur_to_try", 36.5) if rates else 36.5
    
    # Calculate comparison data
    comparison = []
    min_price_try = float('inf')
    
    for resp in responses:
        supplier = await db.suppliers.find_one({"id": resp["supplier_id"]}, {"_id": 0})
        
        # Convert to TRY
        if resp["currency"] == "USD":
            price_try = resp["total_price"] * usd_rate
        elif resp["currency"] == "EUR":
            price_try = resp["total_price"] * eur_rate
        else:
            price_try = resp["total_price"]
        
        if price_try < min_price_try:
            min_price_try = price_try
        
        comparison.append({
            "response": resp,
            "supplier": supplier,
            "price_try": price_try
        })
    
    # Calculate scores
    deadline = datetime.fromisoformat(quote_request["deadline"].replace("Z", "+00:00"))
    
    for item in comparison:
        resp = item["response"]
        supplier = item["supplier"]
        
        # Price score (40%)
        if min_price_try > 0:
            price_ratio = min_price_try / item["price_try"]
            price_score = price_ratio * 40
        else:
            price_score = 40
        
        # Delivery score (30%)
        delivery_date = datetime.fromisoformat(resp["delivery_date"].replace("Z", "+00:00"))
        days_diff = (delivery_date - deadline).days
        if days_diff <= 0:
            delivery_score = 30 + min(abs(days_diff) * 2, 6)  # Bonus for early
        else:
            delivery_score = max(30 - days_diff * 3, 0)
        
        # Quality score (20%) - from supplier performance
        if supplier and supplier.get("performance"):
            quality_score = supplier["performance"].get("quality_score", 24) * 20 / 30
        else:
            quality_score = 16
        
        # Payment score (10%)
        payment_terms = resp.get("payment_terms", 30)
        if payment_terms >= 90:
            payment_score = 10
        elif payment_terms >= 60:
            payment_score = 8
        elif payment_terms >= 30:
            payment_score = 5
        else:
            payment_score = 3
        
        item["scores"] = {
            "price": round(price_score, 1),
            "delivery": round(delivery_score, 1),
            "quality": round(quality_score, 1),
            "payment": round(payment_score, 1),
            "total": round(price_score + delivery_score + quality_score + payment_score, 1)
        }
    
    # Sort by total score
    comparison.sort(key=lambda x: x["scores"]["total"], reverse=True)
    
    return {
        "quote_request": quote_request,
        "comparison": comparison,
        "currency_rates": {"usd": usd_rate, "eur": eur_rate}
    }

# --- Order Routes ---
@api_router.post("/orders", response_model=Order)
async def create_order(data: OrderCreate):
    code = await generate_order_code()
    order = Order(code=code, **data.model_dump())
    doc = order.model_dump()
    await db.orders.insert_one(doc)
    
    # Update quote response status
    await db.quote_responses.update_one(
        {"id": data.quote_response_id},
        {"$set": {"status": "approved"}}
    )
    
    # Update part status
    await db.parts.update_one(
        {"id": data.part_id},
        {"$set": {"status": "in_production"}}
    )
    
    # Create notification
    supplier = await db.suppliers.find_one({"id": data.supplier_id}, {"_id": 0})
    part = await db.parts.find_one({"id": data.part_id}, {"_id": 0})
    await create_notification(
        "order",
        "Sipariş Oluşturuldu",
        f"{code}: {part.get('name', '')} siparişi {supplier.get('name', '')} tedarikçisine verildi",
        "order",
        order.id
    )
    
    return order

@api_router.get("/orders")
async def get_orders(status: Optional[str] = None, supplier_id: Optional[str] = None):
    query = {}
    if status:
        query["status"] = status
    if supplier_id:
        query["supplier_id"] = supplier_id
    orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return orders

@api_router.get("/orders/{order_id}")
async def get_order(order_id: str):
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Sipariş bulunamadı")
    return order

@api_router.put("/orders/{order_id}")
async def update_order(order_id: str, data: dict):
    result = await db.orders.update_one({"id": order_id}, {"$set": data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Sipariş bulunamadı")
    
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    
    # If order is delivered, update supplier performance
    if data.get("status") == "delivered":
        supplier_id = order["supplier_id"]
        supplier = await db.suppliers.find_one({"id": supplier_id}, {"_id": 0})
        if supplier:
            perf = supplier.get("performance", {})
            perf["total_orders"] = perf.get("total_orders", 0) + 1
            
            # Check if on time
            if order.get("actual_delivery") and order.get("expected_delivery"):
                actual = datetime.fromisoformat(order["actual_delivery"].replace("Z", "+00:00"))
                expected = datetime.fromisoformat(order["expected_delivery"].replace("Z", "+00:00"))
                if actual <= expected:
                    perf["on_time_deliveries"] = perf.get("on_time_deliveries", 0) + 1
            
            # Recalculate scores
            scores = calculate_supplier_score(perf)
            perf.update(scores)
            
            await db.suppliers.update_one(
                {"id": supplier_id},
                {"$set": {"performance": perf}}
            )
        
        # Update part status
        await db.parts.update_one(
            {"id": order["part_id"]},
            {"$set": {"status": "completed"}}
        )
    
    return order

# --- Notification Routes ---
@api_router.get("/notifications")
async def get_notifications(is_read: Optional[bool] = None):
    query = {}
    if is_read is not None:
        query["is_read"] = is_read
    notifications = await db.notifications.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return notifications

@api_router.put("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str):
    await db.notifications.update_one({"id": notification_id}, {"$set": {"is_read": True}})
    return {"message": "Bildirim okundu olarak işaretlendi"}

@api_router.put("/notifications/read-all")
async def mark_all_notifications_read():
    await db.notifications.update_many({}, {"$set": {"is_read": True}})
    return {"message": "Tüm bildirimler okundu olarak işaretlendi"}

# --- Currency Rate Routes ---
@api_router.get("/currency-rates")
async def get_currency_rates():
    rates = await db.currency_rates.find_one({}, {"_id": 0}, sort=[("updated_at", -1)])
    if not rates:
        return {"usd_to_try": 33.0, "eur_to_try": 36.5, "updated_at": datetime.now(timezone.utc).isoformat()}
    return rates

@api_router.post("/currency-rates")
async def update_currency_rates(data: CurrencyRateUpdate):
    rate = CurrencyRate(**data.model_dump())
    doc = rate.model_dump()
    await db.currency_rates.insert_one(doc)
    return doc

# --- Settings Routes ---
@api_router.get("/settings")
async def get_settings():
    settings = await db.settings.find_one({"id": "settings"}, {"_id": 0})
    if not settings:
        return Settings().model_dump()
    return settings

@api_router.put("/settings")
async def update_settings(data: SettingsUpdate):
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    await db.settings.update_one(
        {"id": "settings"},
        {"$set": update_data},
        upsert=True
    )
    return await db.settings.find_one({"id": "settings"}, {"_id": 0})

# --- Email Routes ---
@api_router.post("/send-email")
async def send_email(request: EmailRequest):
    if not resend_api_key:
        raise HTTPException(status_code=500, detail="E-posta servisi yapılandırılmamış")
    
    params = {
        "from": SENDER_EMAIL,
        "to": [request.recipient_email],
        "subject": request.subject,
        "html": request.html_content
    }
    
    try:
        email = await asyncio.to_thread(resend.Emails.send, params)
        return {
            "status": "success",
            "message": f"E-posta {request.recipient_email} adresine gönderildi",
            "email_id": email.get("id")
        }
    except Exception as e:
        logger.error(f"E-posta gönderme hatası: {str(e)}")
        raise HTTPException(status_code=500, detail=f"E-posta gönderilemedi: {str(e)}")

# --- Dashboard Routes ---
@api_router.get("/dashboard/stats")
async def get_dashboard_stats():
    # Project stats
    total_projects = await db.projects.count_documents({})
    active_projects = await db.projects.count_documents({"status": {"$in": ["planning", "in_progress"]}})
    
    # Part stats
    total_parts = await db.parts.count_documents({})
    parts_in_production = await db.parts.count_documents({"status": "in_production"})
    
    # Order stats
    total_orders = await db.orders.count_documents({})
    pending_orders = await db.orders.count_documents({"status": {"$in": ["pending", "confirmed", "in_production"]}})
    
    # Supplier stats
    total_suppliers = await db.suppliers.count_documents({})
    
    # Upcoming deadlines (next 7 days)
    now = datetime.now(timezone.utc)
    next_week = now + timedelta(days=7)
    
    upcoming_orders = await db.orders.find({
        "status": {"$in": ["pending", "confirmed", "in_production"]},
        "expected_delivery": {
            "$gte": now.isoformat(),
            "$lte": next_week.isoformat()
        }
    }, {"_id": 0}).to_list(10)
    
    # Pending quotes
    pending_quotes = await db.quote_requests.count_documents({"status": "requested"})
    
    # Unread notifications
    unread_notifications = await db.notifications.count_documents({"is_read": False})
    
    return {
        "projects": {"total": total_projects, "active": active_projects},
        "parts": {"total": total_parts, "in_production": parts_in_production},
        "orders": {"total": total_orders, "pending": pending_orders},
        "suppliers": {"total": total_suppliers},
        "pending_quotes": pending_quotes,
        "upcoming_orders": upcoming_orders,
        "unread_notifications": unread_notifications
    }

@api_router.get("/dashboard/gantt/{project_id}")
async def get_gantt_data(project_id: str):
    """Get Gantt chart data for a project"""
    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Proje bulunamadı")
    
    parts = await db.parts.find({"project_id": project_id}, {"_id": 0}).to_list(1000)
    
    gantt_data = []
    current_date = datetime.fromisoformat(project["start_date"].replace("Z", "+00:00"))
    
    for part in parts:
        part_start = current_date
        methods = part.get("manufacturing_methods", [])
        
        for method_code in methods:
            method = MANUFACTURING_METHODS.get(method_code)
            if method:
                duration = method.get("duration_days", 2)
                end_date = part_start + timedelta(days=duration)
                
                gantt_data.append({
                    "id": f"{part['id']}_{method_code}",
                    "part_id": part["id"],
                    "part_name": part["name"],
                    "part_code": part["code"],
                    "method_code": method_code,
                    "method_name": method["name"],
                    "category": method["category"],
                    "start": part_start.isoformat(),
                    "end": end_date.isoformat(),
                    "duration_days": duration
                })
                
                part_start = end_date
    
    return {
        "project": project,
        "tasks": gantt_data
    }

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
