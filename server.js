const express = require('express');
const Parser = require('rss-parser');
const cron = require('node-cron');
const cors = require('cors');

const app = express();
app.use(cors());

const parser = new Parser();

// جدول الـ 24 دولة حسب ساعات اليوم
const COUNTRIES_SCHEDULE = [
  { hour: 0,  name: 'مصر',            flag: '🇪🇬', query: 'جمارك مصر OR موانئ مصر' },
  { hour: 1,  name: 'السعودية',       flag: '🇸🇦', query: 'جمارك السعودية OR زاتكا' },
  { hour: 2,  name: 'الإمارات',       flag: '🇦🇪', query: 'جمارك دبي OR جمارك الإمارات' },
  { hour: 3,  name: 'الصين',          flag: '🇨🇳', query: 'تجارة الصين OR موانئ الصين' },
  { hour: 4,  name: 'أمريكا',         flag: '🇺🇸', query: 'جمارك أمريكا OR الرسوم الجمركية' },
  { hour: 5,  name: 'ألمانيا',        flag: '🇩🇪', query: 'تجارة ألمانيا OR اقتصاد ألمانيا' },
  { hour: 6,  name: 'هولندا',         flag: '🇳🇱', query: 'ميناء روتردام OR جمارك هولندا' },
  { hour: 7,  name: 'سنغافورة',       flag: '🇸🇬', query: 'موانئ سنغافورة OR تجارة سنغافورة' },
  { hour: 8,  name: 'تركيا',          flag: '🇹🇷', query: 'جمارك تركيا OR موانئ تركيا' },
  { hour: 9,  name: 'بريطانيا',       flag: '🇬🇧', query: 'جمارك بريطانيا OR تجارة بريطانيا' },
  { hour: 10, name: 'اليابان',        flag: '🇯🇵', query: 'صادرات اليابان OR تجارة اليابان' },
  { hour: 11, name: 'كوريا الجنوبية',  flag: '🇰🇷', query: 'صادرات كوريا OR موانئ كوريا' },
  { hour: 12, name: 'الهند',          flag: '🇮🇳', query: 'جمارك الهند OR تجارة الهند' },
  { hour: 13, name: 'روسيا',          flag: '🇷🇺', query: 'صادرات روسيا OR جمارك روسيا' },
  { hour: 14, name: 'فرنسا',          flag: '🇫🇷', query: 'موانئ فرنسا OR جمارك فرنسا' },
  { hour: 15, name: 'إيطاليا',        flag: '🇮🇹', query: 'تجارة إيطاليا OR موانئ إيطاليا' },
  { hour: 16, name: 'إسبانيا',        flag: '🇪🇸', query: 'موانئ إسبانيا OR جمارك إسبانيا' },
  { hour: 17, name: 'الكويت',         flag: '🇰🇼', query: 'جمارك الكويت OR ميناء الشويخ' },
  { hour: 18, name: 'قطر',            flag: '🇶🇦', query: 'جمارك قطر OR ميناء حمد' },
  { hour: 19, name: 'سلطنة عُمان',     flag: '🇴🇲', query: 'جمارك عمان OR ميناء الدقم' },
  { hour: 20, name: 'الأردن',         flag: '🇯🇴', query: 'جمارك الأردن OR ميناء العقبة' },
  { hour: 21, name: 'المغرب',         flag: '🇲🇦', query: 'جمارك المغرب OR ميناء طنجة' },
  { hour: 22, name: 'البرازيل',       flag: '🇧🇷', query: 'صادرات البرازيل OR تجارة البرازيل' },
  { hour: 23, name: 'كندا',           flag: '🇨🇦', query: 'تجارة كندا OR جمارك كندا' },
];

let currentNewsData = {
  country: {},
  article: null,
  updatedAt: null
};

// دالة جلب الخبر من جوجل نيوز
async function fetchNewsForCurrentHour() {
  const currentHour = new Date().getHours();
  const targetCountry = COUNTRIES_SCHEDULE.find(c => c.hour === currentHour) || COUNTRIES_SCHEDULE[0];

  try {
    const feedUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(targetCountry.query)}&hl=ar&gl=EG&ceid=EG:ar`;
    const feed = await parser.parseURL(feedUrl);
    
    let item = feed.items?.[0];

    // لو لم يجد نتيجة مخصصة يجلب أحدث خبر جمارك عام فوراً
    if (!item) {
      const fallbackFeed = await parser.parseURL('https://news.google.com/rss/search?q=الجمارك&hl=ar&gl=EG&ceid=EG:ar');
      item = fallbackFeed.items?.[0];
    }

    if (item) {
      // تنظيف عنوان الخبر من اسم المصدر إذا كان ملتصقاً به
      let cleanTitle = item.title;
      let sourceName = 'أخبار دولية';
      if (cleanTitle.includes(' - ')) {
        const parts = cleanTitle.split(' - ');
        sourceName = parts.pop();
        cleanTitle = parts.join(' - ');
      }

      currentNewsData = {
        country: targetCountry,
        article: {
          title: cleanTitle,
          url: item.link,
          source: sourceName,
          publishedAt: item.pubDate
        },
        updatedAt: new Date().toISOString()
      };
      
      console.log(`[الساعة ${currentHour}:00] ✅ تم جلب خبر حقيقي لـ ${targetCountry.flag} ${targetCountry.name}:`);
      console.log(`📰 ${cleanTitle} (${sourceName})`);
    }
  } catch (error) {
    console.error('خطأ أثناء جلب الأخبار:', error.message);
  }
}

// 1. جلب الخبر فور تشغيل السيرفر
fetchNewsForCurrentHour();

// 2. تحديث تلقائي بداية كل ساعة
cron.schedule('0 * * * *', () => {
  fetchNewsForCurrentHour();
});

// 3. API الفرونت إند
app.get('/api/current-customs-news', (req, res) => {
  res.json(currentNewsData);
});

const PORT = 3000;
app.listen(PORT, () => console.log(`السيرفر يعمل بنجاح على http://localhost:${PORT}`));