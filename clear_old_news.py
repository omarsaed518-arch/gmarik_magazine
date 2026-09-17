import os
import json
import urllib.request

PROJECT_ID = "gamarek"
FIRESTORE_URL = f"https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/(default)/documents/newsFeed"

def clear_all_old_news():
    print("🧹 جاري فحص ومسح جميع الأخبار القديمة من Firebase Firestore...")
    
    # 1. جلب وحذف المستندات القديمة من Firestore
    try:
        req = urllib.request.Request(FIRESTORE_URL, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=15) as res:
            data = json.loads(res.read().decode('utf-8'))
            
        docs = data.get('documents', [])
        deleted_count = 0
        
        for doc in docs:
            doc_name = doc.get('name')  # الرابط الكامل للمستند
            if doc_name:
                del_url = f"https://firestore.googleapis.com/v1/{doc_name}"
                del_req = urllib.request.Request(del_url, method='DELETE')
                try:
                    with urllib.request.urlopen(del_req, timeout=10):
                        deleted_count += 1
                except Exception:
                    pass
                    
        print(f"🗑️ تم مسح {deleted_count} خبراً قديماً من Firebase Firestore بنجاح!")
    except Exception as e:
        print("ℹ️ تم فحص الـ Firestore (أو كانت فارغة بالفعل).")

    # 2. تصفير ملف gmarik_news_output.json المحلي
    local_file = "gmarik_news_output.json"
    with open(local_file, "w", encoding="utf-8") as f:
        json.dump([], f, ensure_ascii=False, indent=2)
    print("📁 تم تفريغ ملف gmarik_news_output.json بنجاح!")

    print("\n✨ تم تنظيف الموقع بالكامل بنجاح!")
    print("👉 الآن قم بتشغيل: python generate_news.py لتنزيل الأخبار الجديدة النظيفة فقط.")

if __name__ == "__main__":
    clear_all_old_news()