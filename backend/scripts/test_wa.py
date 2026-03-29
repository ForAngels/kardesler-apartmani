"""
Test: 905326363250 numarasina test mesaji gonder.
Django gerektirmez - sadece playwright kullanir.
"""
import os
import sys
import time

PHONE = "905326363250"
MESSAGE = "Merhaba! Bu mesaj Kardesler Apartmani yonetim sistemi WP robotunun test mesajidir. Robot basariyla calisyor!"

def send_test():
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("HATA: playwright kurulu degil.")
        sys.exit(1)
        
    with sync_playwright() as p:
        print("Tarayici aciliyor...")
        script_dir = os.path.dirname(os.path.abspath(__file__))
        user_data_dir = os.path.join(script_dir, 'wa_session')
        
        browser = p.chromium.launch_persistent_context(
            user_data_dir=user_data_dir,
            headless=False,
            args=["--disable-blink-features=AutomationControlled"],
            no_viewport=True
        )
        
        if len(browser.pages) > 0:
            page = browser.pages[0]
        else:
            page = browser.new_page()
        
        print("WhatsApp Web aciliyor...")
        page.goto("https://web.whatsapp.com")
        
        print()
        print("=" * 60)
        print("ILKK DEFA ACIYORSANIZ:")
        print("  Telefonda WhatsApp > Baglanmis Cihazlar > Cihaz Ekle")
        print("  QR kodu taratip giris yapin.")
        print("  Giris yaptiktan sonra robot devam eder.")
        print("=" * 60)
        print()
        
        print("Bekleniyor... (maks 120 saniye)")
        try:
            # Sohbet listesi veya sohbet alan? gorununce hazir
            page.wait_for_selector('div[contenteditable="true"]', timeout=120000)
            print("WhatsApp Web hazir!")
        except Exception:
            print("Zaman asimi. Lutfen QR taratip tekrar deneyin.")
            browser.close()
            return
        
        time.sleep(2)
        
        # Direkt link ile mesaj sayfasina gidin
        encoded = MESSAGE.replace(' ', '%20')
        url = f"https://web.whatsapp.com/send?phone={PHONE}&text={encoded}"
        print(f"Mesaj hazirlaniyor > {PHONE}")
        page.goto(url)
        
        print("Gonder butonu bekleniyor...")
        try:
            send_btn = page.wait_for_selector('span[data-icon="send"]', timeout=25000)
            time.sleep(1.5)
            send_btn.click()
            print()
            print("MESAJ BASARIYLA GONDERILDI!")
            time.sleep(4)
        except Exception as e:
            print(f"Gonderme hatasi: {e}")
            print("Pencereyi manuel kontrol edin...")
            time.sleep(15)
        
        browser.close()
        print("Test tamamlandi.")

if __name__ == "__main__":
    send_test()
