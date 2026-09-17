const fs = require('fs');
const Parser = require('rss-parser');

const parser = new Parser();

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

async function updateNews() {
  const currentHour = new Date().getHours();
  const targetCountry = COUNTRIES_SCHEDULE.find(c => c.hour === currentHour) || COUNTRIES_SCHEDULE[0];

  try {
    const feedUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(targetCountry.query)}&hl=ar&gl=EG&ceid=EG:ar`;
    const feed = await parser.parseURL(feedUrl);
    
    let item = feed.items?.[0];

    if (!item) {
      const fallbackFeed = await parser.parseURL('https://news.google.com/rss/search?q=الجمارك&hl=ar&gl=EG&ceid=EG:ar');
      item = fallbackFeed.items?.[0];
    }

    let cleanTitle = item ? item.title : `متابعة مستمرة لحركة الجمارك والشحن في ${targetCountry.name}`;
    let sourceName = 'أخبار دولية';
    
    if (cleanTitle.includes(' - ')) {
      const parts = cleanTitle.split(' - ');
      sourceName = parts.pop();
      cleanTitle = parts.join(' - ');
    }

    const newsData = {
      country: targetCountry,
      article: {
        title: cleanTitle,
        url: item ? item.link : '#',
        source: sourceName,
        publishedAt: item ? item.pubDate : new Date().toISOString()
      },
      updatedAt: new Date().toISOString()
    };

    // كتابة الملف
    fs.writeFileSync('current_customs_news.json', JSON.stringify(newsData, null, 2), 'utf8');
    console.log(`✅ تم حفظ خبر: ${targetCountry.name}`);
  } catch (err) {
    console.error('❌ خطأ:', err.message);
    process.exit(1);
  }
}

updateNews();