import mercadopago
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from core.config import settings

router = APIRouter(prefix="/api/payments", tags=["payments"])

sdk = mercadopago.SDK(settings.mp_access_token)

class CreatePreferenceRequest(BaseModel):
    plan: str  # starter, pro, enterprise
    email: str
    empresa: str

PLANES = {
    "starter": {"nombre": "SafeGuard Starter", "precio": 29900},
    "pro": {"nombre": "SafeGuard Pro", "precio": 79900},
    "enterprise": {"nombre": "SafeGuard Enterprise", "precio": 199900},
}

@router.post("/create-preference")
async def create_preference(data: CreatePreferenceRequest):
    plan = PLANES.get(data.plan)
    if not plan:
        raise HTTPException(400, "Plan inválido")
    
    preference_data = {
        "items": [
            {
                "title": plan["nombre"],
                "quantity": 1,
                "unit_price": float(plan["precio"]),
                "currency_id": "ARS",
            }
        ],
        "payer": {
            "email": data.email,
        },
        "back_urls": {
            "success": "http://localhost:3000/checkout/success",
            "failure": "http://localhost:3000/checkout/failure",
            "pending": "http://localhost:3000/checkout/pending",
        },
        "statement_descriptor": "SafeGuard AI",
        "external_reference": f"{data.empresa}_{data.plan}",
        "metadata": {
            "empresa": data.empresa,
            "plan": data.plan,
        }
    }
    
    result = sdk.preference().create(preference_data)
    preference = result["response"]
    
    # Agregar manejo de error:
    if "id" not in preference:
        # MP devolvió error — loguearlo
        print(f"MP Error: {preference}")
        raise HTTPException(500, f"Error MP: {preference.get('message', preference)}")
    
    return {
        "preference_id": preference["id"],
        "init_point": preference["init_point"],
        "sandbox_init_point": preference["sandbox_init_point"],
    }

@router.post("/webhook")
async def mp_webhook(request: Request):
    data = await request.json()
    
    if data.get("type") == "payment":
        payment_id = data["data"]["id"]
        payment = sdk.payment().get(payment_id)
        payment_info = payment["response"]
        
        if payment_info["status"] == "approved":
            external_ref = payment_info.get("external_reference", "")
            metadata = payment_info.get("metadata", {})
            empresa = metadata.get("empresa", "")
            plan = metadata.get("plan", "pro")
            email = payment_info["payer"]["email"]
            amount = payment_info["transaction_amount"]
            
            print(f"✅ Pago aprobado: {email} plan {plan} ${amount}")
            
            # Registrar en Avalanche (si está disponible)
            import os
            SUBSCRIPTION_CONTRACT = settings.subscription_contract_address or os.getenv("SUBSCRIPTION_CONTRACT_ADDRESS", "")
            if SUBSCRIPTION_CONTRACT:
                from services.subscription_service import register_subscription_onchain
                tx = await register_subscription_onchain(
                    email, empresa, plan, 
                    amount, str(payment_id),
                    SUBSCRIPTION_CONTRACT
                )
                print(f"TX Avalanche: {tx}")
            
            # Actualizar Supabase
            try:
                from supabase import create_client, Client
                url: str = settings.SUPABASE_URL
                key: str = settings.SUPABASE_KEY
                supabase: Client = create_client(url, key)
                supabase.table("tenants").update({
                    "plan": plan,
                    "activo": True,
                    "payment_id": str(payment_id)
                }).eq("email", email).execute()
            except Exception as e:
                print(f"Update Supabase error: {e}")
            
            print(f"Plan activado para {email}")
    
    return {"status": "ok"}
