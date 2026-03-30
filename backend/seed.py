# backend/seed.py
import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# The Complete 24-Question RIASEC Content Payload (Arabic)
cards_data = [
    # Realistic (R)
    {"prompt_text": "أستمتع ببناء الأشياء بيدي (مثل الليجو أو النماذج)", "primary_trait": "Realistic", "image_url": "/assets/cards/r1.png"},
    {"prompt_text": "أحب إصلاح الألعاب أو الأجهزة المعطلة", "primary_trait": "Realistic", "image_url": "/assets/cards/r2.png"},
    {"prompt_text": "أفضل القيام بالأنشطة العملية بدلاً من القراءة", "primary_trait": "Realistic", "image_url": "/assets/cards/r3.png"},
    {"prompt_text": "هل ترغب في الانضمام إلى نادي الروبوتات أو الهندسة؟", "primary_trait": "Realistic", "image_url": "/assets/cards/r4.png"},
    
    # Investigative (I)
    {"prompt_text": "أحب حل الألغاز والأحاجي الذهنية", "primary_trait": "Investigative", "image_url": "/assets/cards/i1.png"},
    {"prompt_text": "أستمتع بتعلم كيفية عمل الأشياء", "primary_trait": "Investigative", "image_url": "/assets/cards/i2.png"},
    {"prompt_text": "أحب إجراء التجارب العلمية", "primary_trait": "Investigative", "image_url": "/assets/cards/i3.png"},
    {"prompt_text": "هل تستمتع بالبحث في المواضيع التي تجدها مثيرة للاهتمام؟", "primary_trait": "Investigative", "image_url": "/assets/cards/i4.png"},
    
    # Artistic (A)
    {"prompt_text": "أستمتع بالرسم أو التلوين أو إنشاء الأعمال الفنية", "primary_trait": "Artistic", "image_url": "/assets/cards/a1.png"},
    {"prompt_text": "أحب تأليف القصص أو الكتابة الإبداعية", "primary_trait": "Artistic", "image_url": "/assets/cards/a2.png"},
    {"prompt_text": "لدي الكثير من الأفكار الإبداعية", "primary_trait": "Artistic", "image_url": "/assets/cards/a3.png"},
    {"prompt_text": "هل ترغب في إنشاء مقاطع فيديو أو بودكاست؟", "primary_trait": "Artistic", "image_url": "/assets/cards/a4.png"},
    
    # Social (S)
    {"prompt_text": "أحب مساعدة أصدقائي عندما يواجهون مشاكل", "primary_trait": "Social", "image_url": "/assets/cards/s1.png"},
    {"prompt_text": "أستمتع بالعمل في مجموعات وفرق", "primary_trait": "Social", "image_url": "/assets/cards/s2.png"},
    {"prompt_text": "أشعر بالرضا عندما أستطيع تعليم الآخرين شيئاً جديداً", "primary_trait": "Social", "image_url": "/assets/cards/s3.png"},
    {"prompt_text": "هل ترغب في تنظيم فعاليات لزملائك في الصف؟", "primary_trait": "Social", "image_url": "/assets/cards/s4.png"},
    
    # Enterprising (E)
    {"prompt_text": "أحب أن أكون قائداً وأتخذ القرارات", "primary_trait": "Enterprising", "image_url": "/assets/cards/e1.png"},
    {"prompt_text": "أستمتع بإقناع الآخرين بتجربة أفكاري", "primary_trait": "Enterprising", "image_url": "/assets/cards/e2.png"},
    {"prompt_text": "أحب البدء بمشاريع جديدة", "primary_trait": "Enterprising", "image_url": "/assets/cards/e3.png"},
    {"prompt_text": "هل ترغب في إدارة عملك الخاص يوماً ما؟", "primary_trait": "Enterprising", "image_url": "/assets/cards/e4.png"},
    
    # Conventional (C)
    {"prompt_text": "أحب تنظيم وترتيب الأشياء بشكل منظم", "primary_trait": "Conventional", "image_url": "/assets/cards/c1.png"},
    {"prompt_text": "أفضل أن يكون لدي قواعد وتعليمات واضحة", "primary_trait": "Conventional", "image_url": "/assets/cards/c2.png"},
    {"prompt_text": "أستمتع بتتبع المعلومات والبيانات", "primary_trait": "Conventional", "image_url": "/assets/cards/c3.png"},
    {"prompt_text": "هل ترغب في المساعدة في إدارة مكتبة الصف؟", "primary_trait": "Conventional", "image_url": "/assets/cards/c4.png"}
]

def seed_database():
    print("Initiating database seed for HalmanApp...")
    
    print("Clearing old assessment cards...")
    supabase.table("assessment_cards").delete().neq("id", 0).execute()
    
    print("Injecting the 24-question RIASEC curriculum...")
    response = supabase.table("assessment_cards").insert(cards_data).execute()
    
    print(f"Success! Seeded {len(response.data)} cards into the database.")

if __name__ == "__main__":
    seed_database()