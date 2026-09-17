<?php
/**
 * الملف المتكامل الشامل لمدونة ومجلة الجمارك (جمارك مجازين)
 * يشمل: حالات المقالات المخصصة، أدوار المستخدمين، حاسبة التعريفة، ومنظومة الإعلانات ذاتية الخدمة
 */

// ==========================================
// 1. تسجيل حالات المقالات المخصصة (Workflow)
// ==========================================
function register_custom_post_statuses() {
    register_post_status('ready_for_review', array(
        'label'                     => 'جاهز للتدقيق',
        'public'                    => false,
        'exclude_from_search'       => true,
        'show_in_admin_all_list'    => true,
        'show_in_admin_status_list' => true,
        'label_count'               => _n_noop('جاهز للتدقيق (<span class="count">(%s)</span>)', 'جاهز للتدقيق (<span class="count">(%s)</span>)')
    ));

    register_post_status('checked_status', array(
        'label'                     => 'مُدقق (Checked)',
        'public'                    => false,
        'exclude_from_search'       => true,
        'show_in_admin_all_list'    => true,
        'show_in_admin_status_list' => true,
        'label_count'               => _n_noop('مُدقق (<span class="count">(%s)</span>)', 'مُدقق (<span class="count">(%s)</span>)')
    ));

    register_post_status('approved_by_head', array(
        'label'                     => 'معتمد من رئيس القسم',
        'public'                    => false,
        'exclude_from_search'       => true,
        'show_in_admin_all_list'    => true,
        'show_in_admin_status_list' => true,
        'label_count'               => _n_noop('معتمد من رئيس القسم (<span class="count">(%s)</span>)', 'معتمد من رئيس القسم (<span class="count">(%s)</span>)')
    ));

    register_post_status('pending_final_approval', array(
        'label'                     => 'بانتظار قرار رئيس التحرير',
        'public'                    => false,
        'exclude_from_search'       => true,
        'show_in_admin_all_list'    => true,
        'show_in_admin_status_list' => true,
        'label_count'               => _n_noop('بانتظار القرار النهائي (<span class="count">(%s)</span>)', 'بانتظار القرار النهائي (<span class="count">(%s)</span>)')
    ));
}
add_action('init', 'register_custom_post_statuses');

// إضافة الحالات المخصصة لقائمة لوحة تحكم ووردبريس
function add_custom_status_to_dropdown() {
    echo '<script>
    jQuery(document).ready(function($) {
        $("select#post_status").append("<option value=\"ready_for_review\">جاهز للتدقيق</option>");
        $("select#post_status").append("<option value=\"checked_status\">مُدقق (Checked)</option>");
        $("select#post_status").append("<option value=\"approved_by_head\">معتمد من رئيس القسم</option>");
        $("select#post_status").append("<option value=\"pending_final_approval\">بانتظار قرار رئيس التحرير</option>");
    });
    </script>';
}
add_action('admin_footer-post.php', 'add_custom_status_to_dropdown');
add_action('admin_footer-post-new.php', 'add_custom_status_to_dropdown');


// ==========================================
// 2. إنشاء الأدوار المخصصة للمجلة الجمركية
// ==========================================
function add_magazine_custom_roles() {
    // دور المراسل
    add_role('magazine_reporter', 'مراسل جمركي', array(
        'read'         => true,
        'edit_posts'   => true,
        'delete_posts' => true,
        'upload_files' => true,
        'publish_posts'=> false,
    ));

    // دور المحرر الصحفي
    add_role('magazine_editor', 'محرر صحفي', array(
        'read'                 => true,
        'edit_posts'           => true,
        'edit_others_posts'    => true,
        'publish_posts'        => false,
        'upload_files'         => true,
    ));

    // دور المدقق اللغوي
    add_role('magazine_proofreader', 'مدقق لغوي', array(
        'read'              => true,
        'edit_posts'        => true,
        'edit_others_posts' => true,
        'upload_files'      => true,
    ));

    // دور رئيس القسم
    add_role('magazine_section_head', 'رئيس قسم', array(
        'read'                 => true,
        'edit_posts'           => true,
        'edit_others_posts'    => true,
        'delete_others_posts'  => true,
        'upload_files'         => true,
    ));

    // دور مدير التحرير
    add_role('magazine_managing_editor', 'مدير التحرير', array(
        'read'                   => true,
        'edit_posts'             => true,
        'edit_others_posts'      => true,
        'edit_published_posts'   => true,
        'publish_posts'          => false,
        'upload_files'           => true,
    ));
}
add_action('init', 'add_magazine_custom_roles');


// ==========================================
// 3. أداة حساب التعريفة الجمركية التفاعلية (Shortcode)
// ==========================================
function customs_calculator_shortcode() {
    ob_start();
    ?>
    <div id="customs-calculator-box" style="background: #f9f9f9; padding: 20px; border-radius: 8px; border: 1px solid #ddd; font-family: Arial, sans-serif;">
        <h3 style="color: #1a365d; margin-top: 0;">🧮 أداة حساب التعريفة الجمركية الفورية</h3>
        <p style="font-size: 14px; color: #555;">أدخل قيمة البضاعة ورسوم الشحن لمعرفة الرسوم الجمركية التقديرية بدقة:</p>
        
        <div style="margin-bottom: 15px;">
            <label style="display: block; font-weight: bold; margin-bottom: 5px;">قيمة البضاعة (بالدولار أو العملة المحلية):</label>
            <input type="number" id="item-value" placeholder="مثال: 5000" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
        </div>
        
        <div style="margin-bottom: 15px;">
            <label style="display: block; font-weight: bold; margin-bottom: 5px;">نوع البضاعة / كود التعريفة:</label>
            <select id="tariff-category" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
                <option value="5">إلكترونيات وأجهزة (5%)</option>
                <option value="10">سيارات ومحركات (10%)</option>
                <option value="2">مواد خام ومستلزمات إنتاج (2%)</option>
                <option value="7">أطعمة ومستهلاك (7%)</option>
            </select>
        </div>
        
        <button id="calculate-btn" style="background: #2271b1; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-weight: bold;">احسب الرسوم الآن</button>
        
        <div id="calculation-result" style="margin-top: 20px; padding: 15px; background: #e2e8f0; border-radius: 4px; display: none; font-weight: bold; color: #1a365d;"></div>
    </div>

    <script>
    document.getElementById('calculate-btn').addEventListener('click', function() {
        var val = parseFloat(document.getElementById('item-value').value);
        var rate = parseFloat(document.getElementById('tariff-category').value);
        
        if(isNaN(val) || val <= 0) {
            alert('الرجاء إدخال قيمة صحيحة للبضاعة.');
            return;
        }
        
        var customsDuty = (val * rate) / 100;
        var vat = (val + customsDuty) * 0.14; 
        var total = customsDuty + vat;
        
        var resultDiv = document.getElementById('calculation-result');
        resultDiv.style.display = 'block';
        resultDiv.innerHTML = '📊 النتيجة التقديرية:<br>' +
                              '- الرسوم الجمركية (' + rate + '%): $' + customsDuty.toFixed(2) + '<br>' +
                              '- ضريبة القيمة المضافة (14%): $' + vat.toFixed(2) + '<br>' +
                              '<span style="color: #b7791f; font-size: 16px;">- إجمالي الرسوم المستحقة: $' + total.toFixed(2) + '</span>';
    });
    </script>
    <?php
    return ob_get_clean();
}
add_shortcode('customs_calculator', 'customs_calculator_shortcode');


// ==========================================
// 4. منظومة الإعلانات ذاتية الخدمة (Self-Service Ads)
// ==========================================
function register_ads_custom_statuses() {
    register_post_status('ad_pending_review', array(
        'label'                     => 'إعلان بانتظار المراجعة',
        'public'                    => false,
        'exclude_from_search'       => true,
        'show_in_admin_all_list'    => true,
        'show_in_admin_status_list' => true,
        'label_count'               => _n_noop('إعلان بانتظار المراجعة (<span class="count">(%s)</span>)', 'إعلان بانتظار المراجعة (<span class="count">(%s)</span>)')
    ));

    register_post_status('ad_expired', array(
        'label'                     => 'إعلان منتهي الصلاحية',
        'public'                    => false,
        'exclude_from_search'       => true,
        'show_in_admin_all_list'    => true,
        'show_in_admin_status_list' => true,
        'label_count'               => _n_noop('إعلان منتهي (<span class="count">(%s)</span>)', 'إعلان منتهي (<span class="count">(%s)</span>)')
    ));
}
add_action('init', 'register_ads_custom_statuses');

function create_advertisements_post_type() {
    $args = array(
        'labels' => array(
            'name'          => 'إدارة الإعلانات',
            'singular_name' => 'إعلان',
        ),
        'public'             => true,
        'has_archive'        => false,
        'supports'           => array('title', 'editor', 'thumbnail'),
        'show_in_rest'       => true,
        'menu_icon'          => 'dashicons-money-alt',
    );
    register_post_type('magazine_ad', $args);
}
add_action('init', 'create_advertisements_post_type');

function advertiser_booking_form_shortcode() {
    ob_start();
    ?>
    <div style="background: #fff; padding: 25px; border-radius: 8px; border: 1px solid #e2e8f0; font-family: Arial, sans-serif; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <h3 style="color: #1a365d; margin-top: 0;">📢 المنصة الإعلانية للمجلة الجمركية</h3>
        <p style="font-size: 14px; color: #4a5568;">اختر باقتك الإعلانية واملأ البيانات للوصول لأبرز المستثمرين والمستوردين والمخلصين الجمركيين:</p>
        
        <form action="" method="POST" enctype="multipart/form-data" style="margin-top: 20px;">
            <div style="margin-bottom: 15px;">
                <label style="display: block; font-weight: bold; margin-bottom: 5px;">اسم الشركة أو المكتب:</label>
                <input type="text" name="ad_company_name" required placeholder="مثال: شركة الشاهين للتخليص الجمركي" style="width: 100%; padding: 10px; border: 1px solid #cbd5e0; border-radius: 4px;">
            </div>

            <div style="margin-bottom: 15px;">
                <label style="display: block; font-weight: bold; margin-bottom: 5px;">رقم السجل التجاري / البطاقة الضريبية:</label>
                <input type="text" name="ad_tax_number" required placeholder="مطلوب لإصدار الفواتير الرسمية" style="width: 100%; padding: 10px; border: 1px solid #cbd5e0; border-radius: 4px;">
            </div>

            <div style="margin-bottom: 15px;">
                <label style="display: block; font-weight: bold; margin-bottom: 5px;">اختر المساحة الإعلانية (الباقة):</label>
                <select name="ad_package" style="width: 100%; padding: 10px; border: 1px solid #cbd5e0; border-radius: 4px;">
                    <option value="leaderboard">البانر العلوي الرئيسي (728x90) - 50$ شهرياً</option>
                    <option value="in_article">إعلان داخل المقال الجمركي - 40$ شهرياً</option>
                    <option value="sidebar">البانر الجانبي (300x250) - 30$ شهرياً</option>
                    <option value="footer">البانر السفلي (728x90) - 20$ شهرياً</option>
                    <option value="sponsored_post">مقال ترويجي مدعوم - 45$ للمقال</option>
                </select>
            </div>

            <div style="margin-bottom: 15px;">
                <label style="display: block; font-weight: bold; margin-bottom: 5px;">رابط التوجيه (Destination URL):</label>
                <input type="url" name="ad_target_url" required placeholder="https://yourcompany.com" style="width: 100%; padding: 10px; border: 1px solid #cbd5e0; border-radius: 4px;">
            </div>

            <div style="margin-bottom: 20px;">
                <label style="display: block; font-weight: bold; margin-bottom: 5px;">ملف الإعلان (بانر الصورة):</label>
                <input type="file" name="ad_banner_image" required style="width: 100%; padding: 5px; border: 1px solid #cbd5e0; border-radius: 4px; background: #f8fafc;">
            </div>

            <button type="submit" name="submit_ad_booking" style="background: #2b6cb0; color: white; border: none; padding: 12px 25px; border-radius: 4px; cursor: pointer; font-weight: bold; width: 100%;">إرسال الحملة الإعلانية والدفع</button>
        </form>
    </div>
    <?php
    return ob_get_clean();
}
add_shortcode('advertiser_form', 'advertiser_booking_form_shortcode');
<?php
// إضافة ودجت الشات بوت الذكي العائم في واجهة الموقع الخلفية
function add_custom_ai_chatbot_widget() {
    ?>
    <!-- صندوق الشات بوت العائم -->
    <div id="custom-chatbot-container" style="position: fixed; bottom: 20px; right: 20px; z-index: 9999; font-family: Arial, sans-serif;">
        <!-- زر فتح الشات -->
        <button id="chatbot-toggle-btn" style="background: #1a365d; color: white; border: none; border-radius: 50%; width: 60px; height: 60px; font-size: 24px; cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">💬</button>
        
        <!-- نافذة المحادثة -->
        <div id="chatbot-window" style="display: none; position: absolute; bottom: 75px; right: 0; width: 320px; background: white; border-radius: 8px; border: 1px solid #cbd5e0; box-shadow: 0 5px 15px rgba(0,0,0,0.2); overflow: hidden;">
            <div style="background: #1a365d; color: white; padding: 12px; font-weight: bold; display: flex; justify-content: space-between; align-items: center;">
                <span>مساعد جمارك ماجازين الذكي</span>
                <button id="chatbot-close-btn" style="background: none; border: none; color: white; font-size: 16px; cursor: pointer;">✕</button>
            </div>
            
            <div id="chatbot-messages" style="height: 250px; padding: 10px; overflow-y: auto; background: #f8fafc; font-size: 13px; color: #333;">
                <div style="margin-bottom: 10px; background: #e2e8f0; padding: 8px; border-radius: 6px; width: fit-content;">
                    أهلاً بك! كيف يمكنني مساعدتك في قوانين أو حسابات الجمارك اليوم؟
                </div>
            </div>
            
            <div style="padding: 10px; border-top: 1px solid #e2e8f0; display: flex;">
                <input type="text" id="chatbot-input" placeholder="اكتب سؤالك هنا..." style="flex: 1; padding: 8px; border: 1px solid #cbd5e0; border-radius: 4px; font-size: 13px;">
                <button id="chatbot-send-btn" style="background: #2b6cb0; color: white; border: none; padding: 8px 12px; margin-right: 5px; border-radius: 4px; cursor: pointer; font-size: 13px;">إرسال</button>
            </div>
        </div>
    </div>

    <script>
    document.addEventListener('DOMContentLoaded', function() {
        const toggleBtn = document.getElementById('chatbot-toggle-btn');
        const closeBtn = document.getElementById('chatbot-close-btn');
        const windowBox = document.getElementById('chatbot-window');
        const sendBtn = document.getElementById('chatbot-send-btn');
        const inputField = document.getElementById('chatbot-input');
        const messagesContainer = document.getElementById('chatbot-messages');

        toggleBtn.addEventListener('click', function() {
            windowBox.style.display = windowBox.style.display === 'none' ? 'block' : 'none';
        });

        closeBtn.addEventListener('click', function() {
            windowBox.style.display = 'none';
        });

        sendBtn.addEventListener('click', function() {
            let text = inputField.value.trim();
            if(text === '') return;

            // إضافة رسالة المستخدم
            messagesContainer.innerHTML += '<div style="margin-bottom: 10px; background: #2b6cb0; color: white; padding: 8px; border-radius: 6px; width: fit-content; margin-left: auto;">' + text + '</div>';
            inputField.value = '';
            messagesContainer.scrollTop = messagesContainer.scrollHeight;

            // محاكاة الرد الآلي الذكي
            setTimeout(function() {
                messagesContainer.innerHTML += '<div style="margin-bottom: 10px; background: #e2e8f0; padding: 8px; border-radius: 6px; width: fit-content;">جاري مراجعة الأرشيف الجمركي للإجابة على سؤالك بدقة...</div>';
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }, 1000);
        });
    });
    </script>
    <?php
}
add_action('wp_footer', 'add_custom_ai_chatbot_widget');