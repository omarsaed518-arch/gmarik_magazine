const fs = require('fs');
const path = require('path');

const NEWS_FILE = path.join(__dirname, 'news.json');

async function generateAndSaveNews() {
    try {
        console.log('جاري تجهيز وحفظ الخبر الجديد...');

        const newArticle = {
            id: Date.now(),

            title: 'تسهيلات جمركية جديدة للإفراج عن السلع بالموانئ المصرية',

            summary:
                'أعلنت مصلحة الجمارك عن بدء تطبيق حزمة إجراءات جديدة لتسريع وتيرة الإفراج عن البضائع.',

            content:
                'في إطار حرص الدولة على دعم حركة التجارة الخارجية وتخفيف الأعباء، أصدرت مصلحة الجمارك توجيهات جديدة تتضمن سرعة إنهاء الإجراءات الجمركية للسلع الاستراتيجية ومستلزمات الإنتاج بالموانئ المصرية...',

            date: new Date().toISOString(),

            source: 'جمارك مجازين',

            image: '',

            url: ''
        };

        let allNews = [];

        // قراءة الأخبار القديمة
        if (fs.existsSync(NEWS_FILE)) {
            try {
                const fileData = fs.readFileSync(NEWS_FILE, 'utf8').trim();

                if (fileData) {
                    const parsed = JSON.parse(fileData);

                    if (Array.isArray(parsed)) {
                        allNews = parsed;
                    } else {
                        console.warn(
                            'تحذير: news.json لا يحتوي على Array، سيتم البدء بقائمة جديدة.'
                        );
                    }
                }
            } catch (error) {
                console.error(
                    'تعذر قراءة news.json بشكل صحيح:',
                    error.message
                );

                // نعمل Backup قبل استبدال الملف
                const backupFile = `${NEWS_FILE}.backup-${Date.now()}`;

                try {
                    fs.copyFileSync(NEWS_FILE, backupFile);
                    console.log(`تم إنشاء نسخة احتياطية: ${backupFile}`);
                } catch (backupError) {
                    console.error(
                        'فشل إنشاء النسخة الاحتياطية:',
                        backupError.message
                    );
                }
            }
        }

        // منع تكرار الخبر نفسه
        const alreadyExists = allNews.some(
            article => article.title === newArticle.title
        );

        if (alreadyExists) {
            console.log('الخبر موجود بالفعل، لن تتم إضافته مرة أخرى.');
            return;
        }

        // إضافة الخبر الجديد في البداية
        allNews.unshift(newArticle);

        // حفظ الملف
        fs.writeFileSync(
            NEWS_FILE,
            JSON.stringify(allNews, null, 2),
            'utf8'
        );

        console.log(
            '\n----------------- تم حفظ الخبر بنجاح -----------------'
        );

        console.log('عنوان الخبر:', newArticle.title);
        console.log('ID:', newArticle.id);
        console.log('إجمالي الأخبار:', allNews.length);

        console.log(
            '-------------------------------------------------------'
        );

    } catch (error) {
        console.error('حصل خطأ أثناء الحفظ:', error);
    }
}

generateAndSaveNews();