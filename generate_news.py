import os
import json
import re
import html
import random
import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET
from datetime import datetime

PROJECT_ID = "gamarek"
FIRESTORE_URL = f"https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/(default)/documents/newsFeed"

FEEDS = [
    "https://news.google.com/rss/search?q=%D8%AC%D9%85%D8%A7%D8%B1%D9%83+OR+%D8%A7%D9%84%D8%AC%D9%85%D8%A7%D8%B1%D9%83+OR+%D8%A7%D9%84%D8%AA%D8%B9%D8%B1%D9%8A%D9%81%D8%A9+%D8%A7%D9%84%D8%AC%D9%85%D8%B1%D9%83%D9%8A%D8%A9&hl=ar&gl=EG&ceid=EG:ar",
    "https://news.google.com/rss/search?q=%D8%AC%D9%85%D8%A7%D8%B1%D9%83+%D8%A7%D9%84%D8%B3%D8%B9%D9%88%D8%AF%D9%8A%D8%A9+OR+%D8%A7%D9%84%D8%B2%D9%83%D8%A7%D8%A9+%D9%88%D8%A7%D9%84%D8%B6%D8%B1%D9%8A%D8%A8%D8%A9+%D9%88%D8%A7%D9%84%D8%AC%D9%85%D8%A7%D8%B1%D9%83&hl=ar&gl=SA&ceid=SA:ar",
    "https://news.google.com/rss/search?q=%D9%85%D9%88%D8%A7%D9%86%D8%A6+%D8%A7%D9%84%D8%AA%D8%AE%D9%84%D9%8A%D8%B5+%D8%A7%D9%84%D8%AC%D9%85%D8%B1%D9%83%D9%8A+%D8%AD%D8%A7%D9%88%D9%8A%D8%A7%D8%AA&hl=ar&gl=EG&ceid=EG:ar"
]

# مكتبة صور جمركية وموانئ احترافية ومتنوعة تضمن أن كل خبر ترافقه صورة رائعة
HIGH_RES_IMAGES = [
    "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=800",
    "https://images.unsplash.com/photo-1578575437130-527eed3abbec?q=80&w=800",
    "https://images.unsplash.com/photo-1542314831-c6a4d27e28b8?q=80&w=800",
    "https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?q=80&w=800",
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=800",
    "https://images.unsplash.com/photo-1506015391300-4802dc74de2e?q=80&w=800",
    "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?q=80&w=800",
    "https://images.unsplash.com/photo-1559297434-fae8a1916a79?q=80&w=800",
    "https://images.unsplash.com/photo-1519003722824-194d4455a60c?q=80&w=800"
]

def clean_arabic_text(text):
    if not text: return ""
    text = html.unescape(text)
    text = re.sub(r'<[^>]+>', '', text)
    text = re.sub(r'https?://\S+|www\.\S+|[a-zA-Z0-9-]+\.(com|net|org|me|info|gov|eg|sa)\S*', '', text)
    text = re.sub(r'nbsp;?', '', text)
    text = re.sub(r'[\r\n\t]+', ' ', text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def detect_category_and_source(title, desc):
    text = (title + " " + desc).lower()
    if any(k in text for k in ["سعودي", "السعودية", "الزكاة والضريبة", "الرياض", "جدة"]):
        return "جمارك السعودية", "هيئة الزكاة والضريبة والجمارك"
    elif any(k in text for k in ["مصر", "المصرية", "القاهرة", "الإسكندرية", "بورسعيد", "السخنة"]):
        return "جمارك مصر", "مصلحة الجمارك المصرية"
    elif any(k in text for k in ["دبي", "الإمارات", "أبوظبي", "جبل علي"]):
        return "جمارك الإمارات", "جمارك دبي"
    elif any(k in text for k in ["سيارات", "سيارة", "مركبات", "الملاكي"]):
        return "جمارك السيارات", "قطاع الإفراج عن السيارات"
    elif any(k in text for k in ["ميناء", "موانئ", "شحن", "بحرية", "حاويات", "سفن"]):
        return "الشحن والموانئ", "الهيئة العامة للموانئ والنقل البحري"
    else:
        return "أخبار جمركية دولية", "منظمة الجمارك العالمية"

def extract_real_image_and_paragraphs(google_url):
    real_img = ""
    paragraphs = []
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
    }
    
    try:
        req = urllib.request.Request(google_url, headers=headers)
        with urllib.request.urlopen(req, timeout=10) as response:
            final_url = response.geturl()
            html_content = response.read().decode('utf-8', errors='ignore')
            
        # استخراج الصور الأصلية
        img_matches = re.findall(r'<meta[^>]+(?:property|name)=["\'](?:og:image|twitter:image)["\'][^>]+content=["\']([^"\']+)["\']', html_content, re.I)
        if not img_matches:
            img_matches = re.findall(r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+(?:property|name)=["\'](?:og:image|twitter:image)["\']', html_content, re.I)
            
        for img in img_matches:
            img = img.strip()
            # تصحيح الروابط النسبية وتحويلها لرابط كامل
            if img.startswith("//"):
                img = "https:" + img
            elif img.startswith("/"):
                img = urllib.parse.urljoin(final_url, img)
                
            # التأكد أن الرابط يبدأ بـ http وليس لوجو جوجل
            if img.startswith("http") and not any(bad in img.lower() for bad in ["google", "gstatic", "favicon", "logo", "icon", "1x1"]):
                real_img = img
                break
                
        # استخراج فقرات المقال
        p_matches = re.findall(r'<p[^>]*>(.*?)</p>', html_content, re.DOTALL | re.I)
        for p in p_matches:
            clean_p = clean_arabic_text(p)
            if len(clean_p) > 60 and not any(bad in clean_p for bad in ["اشترك", "حقوق النشر", "تابعنا", "اضغط هنا", "cookies"]):
                paragraphs.append(clean_p)
                
    except Exception:
        pass
        
    return real_img, paragraphs

def build_editorial_article(title, orig_paragraphs, snippet, source, category):
    clean_snippet = clean_arabic_text(snippet)
    
    lead = f"في إطار المتابعة المستمرة للمستجدات والقرارات الاقتصادية والتجارية، أعلنت {source} عن تطورات جديدة بخصوص ({title}). ويأتي هذا الإجراء لتعزيز انسيابية حركة التبادل التجاري وتطوير منظومة الإفراج الجمركي في قطاع ({category})."
    
    if orig_paragraphs and len(orig_paragraphs) >= 2:
        body1 = orig_paragraphs[0]
        body2 = orig_paragraphs[1]
    elif clean_snippet and len(clean_snippet) > 40:
        body1 = f"وتشير التفاصيل الصادرة إلى أن الجهات المعنية باشرت تفعيل حزمة من التيسيرات الإجرائية التي تستهدف تقليص زمن التخليص الجمركي، مع الاعتماد على الفحص الذكي وإدارة المخاطر لضمان دقة العمليات وسرعتها."
        body2 = clean_snippet
    else:
        body1 = f"وتتضمن المنظومة الجديدة تطبيق مسارات ميسرة للشحنات الملتزمة مع التوسع في استخدام التخليص المسبق، مما يسهم في خفض تكاليف الشحن والأرضيات ومساندة المستوردين والمصدرين."
        body2 = f"ودعت الجهات المعنية كافة الشركات والمستخلصين الجمركيين للاستفادة من الخدمات الرقمية المتاحة لإنهاء المعاملات بسهولة."

    conclusion = f"وأكد خبراء الشحن والجمارك أن هذه القرارات تساهم بصورة مباشرة في تعزيز تنافسية الموانئ وتنشيط حركة الصادرات والواردات، بما يحقق استقرار الأسواق المحلية ويدعم سلاسل الإمداد العالمية."

    return f"{lead}\n\n{body1}\n\n{body2}\n\n{conclusion}"

def fetch_and_publish_customs_news():
    print("🚀 جاري سحب الأخبار وضمان وجود صورة عالية الجودة لكل خبر...")
    
    collected_articles = []
    seen_titles = set()
    img_pool = list(HIGH_RES_IMAGES)
    random.shuffle(img_pool)
    
    for feed_url in FEEDS:
        try:
            req = urllib.request.Request(feed_url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=15) as res:
                xml_data = res.read()
                
            root = ET.fromstring(xml_data)
            
            for item in root.findall('.//item'):
                raw_title = item.find('title').text if item.find('title') is not None else ""
                raw_desc = item.find('description').text if item.find('description') is not None else ""
                link = item.find('link').text if item.find('link') is not None else ""
                
                clean_title = clean_arabic_text(raw_title).split(" - ")[0].strip()
                clean_desc = clean_arabic_text(raw_desc)
                
                if not clean_title or len(clean_title) < 15 or clean_title in seen_titles:
                    continue
                seen_titles.add(clean_title)
                
                category, source = detect_category_and_source(clean_title, clean_desc)
                today_str = datetime.now().strftime("%Y-%m-%d %H:%M")
                
                print(f"🔍 تجهيز: {clean_title[:38]}...")
                
                real_img, orig_paragraphs = extract_real_image_and_paragraphs(link)
                
                # ضمان وجود صورة دائماً لكل خبر بدون استثناء
                if real_img and real_img.startswith("http"):
                    final_image = real_img
                else:
                    final_image = img_pool.pop(0) if img_pool else random.choice(HIGH_RES_IMAGES)
                    if not img_pool:
                        img_pool = list(HIGH_RES_IMAGES)
                        random.shuffle(img_pool)
                
                full_article = build_editorial_article(clean_title, orig_paragraphs, clean_desc, source, category)
                
                news_item = {
                    "العنوان الأصلي": clean_title,
                    "الجهة والمؤسسة المصدر": source,
                    "المقال المولد لحساب مجلة Gmarik": full_article,
                    "تاريخ وفحص وتوليد الخبر آلياً": today_str,
                    "image": final_image,
                    "category": category
                }
                
                collected_articles.append(news_item)
                if len(collected_articles) >= 15:
                    break
        except Exception as e:
            print(f"⚠️ تنبيه: {e}")
            continue

    if not collected_articles:
        print("❌ لم يتم العثور على أخبار جديدة.")
        return

    print(f"✅ تم تجهيز {len(collected_articles)} خبراً بصور مؤكدة 100%!")

    # 1. التحديث المحلي
    local_file = "gmarik_news_output.json"
    with open(local_file, "w", encoding="utf-8") as f:
        json.dump(collected_articles, f, ensure_ascii=False, indent=2)
    print("📁 تم تحديث ملف gmarik_news_output.json بنجاح!")

    # 2. النشر السحابي في Firebase Firestore
    success_count = 0
    for article in collected_articles[:6]:
        try:
            firestore_doc = {
                "fields": {
                    "العنوان الأصلي": {"stringValue": str(article["العنوان الأصلي"])},
                    "الجهة والمؤسسة المصدر": {"stringValue": str(article["الجهة والمؤسسة المصدر"])},
                    "المقال المولد لحساب مجلة Gmarik": {"stringValue": str(article["المقال المولد لحساب مجلة Gmarik"])},
                    "تاريخ وفحص وتوليد الخبر آلياً": {"stringValue": str(article["تاريخ وفحص وتوليد الخبر آلياً"])},
                    "image": {"stringValue": str(article["image"])},
                    "category": {"stringValue": str(article["category"])}
                }
            }
            data = json.dumps(firestore_doc).encode('utf-8')
            req_db = urllib.request.Request(
                FIRESTORE_URL,
                data=data,
                headers={'Content-Type': 'application/json'},
                method='POST'
            )
            with urllib.request.urlopen(req_db, timeout=10):
                success_count += 1
        except Exception:
            pass

    print(f"🌐 تم نشر {success_count} مقالات بصور مؤكدة وواضحة في الموقع بنجاح!")

if __name__ == "__main__":
    fetch_and_publish_customs_news()