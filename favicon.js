// كود موحد لإضافة الـ Favicon لكل صفحات الموقع أوتوماتيكياً
(function() {
    let link = document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/png'; // أو image/x-icon حسب صيغة الأيقونة بتاعتك
    link.href = 'C:\\Users\\omarb\\OneDrive\\Desktop\\Gamarek Magazine\\assets\\images\\favicon.png'; // حط مسار الأيقونة الصحيح هنا (مثلاً favicon.png)
    document.head.appendChild(link);
})();