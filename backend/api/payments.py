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

@router.post("/create-subscription")
async def create_subscription(data: CreatePreferenceRequest):
    plan = PLANES.get(data.plan)
    if not plan:
        raise HTTPException(400, "Plan inválido")
    
    preapproval_data = {
        "reason": plan["nombre"],
        "auto_recurring": {
            "frequency": 1,
            "frequency_type": "months",
            "transaction_amount": float(plan["precio"]),
            "currency_id": "ARS"
        },
        "back_url": "http://localhost:3000/checkout/success",
        "payer_email": data.email,
        "external_reference": f"{data.empresa}_{data.plan}",
        "status": "pending"
    }
    
    result = sdk.preapproval().create(preapproval_data)
    preapproval = result["response"]
    
    if "id" not in preapproval:
        print(f"MP Error: {preapproval}")
        raise HTTPException(500, f"Error MP: {preapproval.get('message', preapproval)}")
    
    return {
        "subscription_id": preapproval["id"],
        "init_point": preapproval["init_point"],
    }

class CancelSubscriptionRequest(BaseModel):
    subscription_id: str

@router.post("/cancel-subscription")
async def cancel_subscription(data: CancelSubscriptionRequest):
    result = sdk.preapproval().update(data.subscription_id, {"status": "cancelled"})
    if result["status"] == 200:
        return {"status": "ok", "message": "Subscription cancelled"}
    else:
        raise HTTPException(500, "Could not cancel subscription")

@router.post("/webhook")
async def mp_webhook(request: Request):
    data = await request.json()
    
    if data.get("type") == "subscription_preapproval":
        sub_id = data["data"]["id"]
        preapproval = sdk.preapproval().get(sub_id)["response"]
        
        if preapproval.get("status") == "authorized":
            external_ref = preapproval.get("external_reference", "")
            try:
                empresa, plan = external_ref.split("_", 1)
            except:
                empresa, plan = "Unknown", "pro"
            
            email = preapproval.get("payer_email", "")
            print(f"📦 Suscripción autorizada: {email} plan {plan}")
            try:
                from supabase import create_client, Client
                url: str = settings.SUPABASE_URL
                key: str = settings.SUPABASE_KEY
                supabase: Client = create_client(url, key)
                supabase.table("tenants").update({
                    "plan": plan,
                    "activo": True,
                    "payment_id": str(sub_id) # Usamos subscription_id para poder cancelarla luego
                }).eq("email", email).execute()
            except Exception as e:
                print(f"Update Supabase error: {e}")
                
    elif data.get("type") == "payment":
        payment_id = data["data"]["id"]
        payment = sdk.payment().get(payment_id)
        payment_info = payment["response"]
        
        if payment_info["status"] == "approved":
            email = payment_info.get("payer", {}).get("email")
            amount = payment_info.get("transaction_amount", 0)
            print(f"✅ Pago recurrente aprobado: {email} ${amount}")
            
            import os
            SUBSCRIPTION_CONTRACT = settings.subscription_contract_address or os.getenv("SUBSCRIPTION_CONTRACT_ADDRESS", "")
            if SUBSCRIPTION_CONTRACT and email:
                try:
                    from supabase import create_client, Client
                    supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
                    tenant_data = supabase.table("tenants").select("empresa, plan").eq("email", email).execute()
                    t = tenant_data.data[0] if tenant_data.data else {}
                    empresa = t.get("empresa", "Unknown")
                    plan = t.get("plan", "pro")
                except:
                    empresa, plan = "Unknown", "pro"

                from services.subscription_service import register_subscription_onchain
                tx = await register_subscription_onchain(
                    email, empresa, plan, 
                    amount, str(payment_id),
                    SUBSCRIPTION_CONTRACT
                )
                print(f"TX Avalanche: {tx}")
    
    return {"status": "ok"}
