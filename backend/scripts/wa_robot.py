import os
import sys
import time
import random
import django
from datetime import datetime

# Django Setup
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import NotificationLog

try:
    from playwright.sync_api import sync_playwright
except ImportError:
    print("HATA: Playwright kurulu değil. Lütfen 'pip install playwright' ve 'playwright install chromium' komutlarını çalıştırın.")
    sys.exit(1)

def run_robot():
    with sync_playwright() as p:
        print("🤖 WP Robotu başlatılıyor...")
        # Oturumu kaydetmek için kullanıcı verileri klasörü kullanıyoruz
        user_data_dir = os.path.join(os.path.dirname(__file__), 'wa_session')
        
        browser = p.chromium.launch_persistent_context(
            user_data_dir=user_data_dir,
            headless=False, # QR kodunu taramak için görünür olması lazım
            args=["--disable-blink-features=AutomationControlled"]
        )
        
        page = browser.new_page()
        page.goto("https://web.whatsapp.com")
        
        print("💡 Eğer giriş yapmadıysanız lütfen QR kodunu taratın.")
        # WP Web yüklenene kadar bekle (sohbet listesi görünene kadar)
        try:
            page.wait_for_selector('div[contenteditable="true"]', timeout=60000)
            print("✅ WhatsApp Web hazır!")
        except Exception:
            print("⚠️ Bekleme süresi doldu. Lütfen QR kodunu tarattığınızdan emin olun ve tekrar deneyin.")
            browser.close()
            return

        while True:
            # Kuyruktaki bekleyen bildirimleri al
            pending = NotificationLog.objects.filter(status='PENDING')
            
            if not pending.exists():
                print(f"[{datetime.now().strftime('%H:%M:%S')}] Bekleyen mesaj yok. 30 saniye sonra tekrar kontrol edilecek...")
                time.sleep(30)
                continue
                
            for log in pending:
                phone = log.apartment.phone_number
                if not phone:
                    log.status = 'FAILED'
                    log.save()
                    continue
                
                # Mesaj içeriğini hazırla
                message = ""
                if log.message_type == 'YENI_AIDAT':
                    message = f"Sayın Sakin (Daire {log.apartment.number}), {datetime.now().strftime('%m/%Y')} ayı aidat borcunuz {log.payment.amount} TL olarak belirlenmiştir. İyi günler dileriz."
                elif log.message_type == 'HATIRLATMA':
                    message = f"Hatırlatma: Daire {log.apartment.number} için {log.payment.amount} TL tutarındaki borcun son ödeme tarihi {log.payment.due_date} günüdür. Ödemenizi rica ederiz."
                
                print(f"➡️ Gönderiliyor: Daire {log.apartment.number} ({phone})")
                
                try:
                    # Direk link ile mesaj sayfasına git
                    encoded_msg = message.replace(' ', '%20')
                    page.goto(f"https://web.whatsapp.com/send?phone={phone}&text={encoded_msg}")
                    
                    # Gönder butonunun görünmesini bekle
                    send_btn_selector = 'span[data-icon="send"]'
                    page.wait_for_selector(send_btn_selector, timeout=20000)
                    time.sleep(1) # Biraz bekleme (insansı)
                    page.click(send_btn_selector)
                    
                    # Gönderildiğini doğrula (mesaj kutusundan temizlendi mi veya icon değişti mi)
                    time.sleep(2)
                    log.status = 'SENT'
                    log.save()
                    print(f"✅ Başarıyla gönderildi: Daire {log.apartment.number}")
                    
                except Exception as e:
                    print(f"❌ Hata oluştu (Daire {log.apartment.number}): {str(e)}")
                    log.status = 'FAILED'
                    log.save()
                
                # Spam filtresine yakalanmamak için rastgele bekleme
                wait_time = random.randint(10, 20)
                print(f"⏳ {wait_time} saniye bekleniyor...")
                time.sleep(wait_time)
            
            time.sleep(5)

if __name__ == "__main__":
    run_robot()
