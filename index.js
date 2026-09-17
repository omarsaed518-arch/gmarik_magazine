require('dotenv').config();
const express = require('express');
const mysql = require('mysql');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.set('view engine', 'ejs');

// اتصال قاعدة البيانات
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '', // اكتب باسورد الـ root لو عندك
    database: 'auth_demo'
});

// إعداد الإرسال بـ Nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// 1. عرض صفحة التسجيل
app.get('/register', (req, res) => {
    res.render('register');
});

// 2. استقبال بيانات التسجيل، توليد الكود، وإرساله
app.post('/register', (req, res) => {
    const { email, password } = req.body;

    // بنولد كود عشوائي من 6 أرقام
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    // صلاحية الكود 10 دقائق
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
        if (err) return res.send('Database error');
        if (results.length > 0) return res.send('User already exists!');

        const sql = 'INSERT INTO users (email, password, is_verified, otp, otp_expires) VALUES (?, ?, 0, ?, ?)';
        db.query(sql, [email, password, otp, otpExpires], (err2) => {
            if (err2) return res.send('Error saving user');

            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'رمز التحقق الخاص بك - مجلة جمارك',
                text: `رمز التحقق الخاص بك هو: ${otp}. ينتهي خلال 10 دقائق.`
            };

            transporter.sendMail(mailOptions, (mailErr) => {
                if (mailErr) {
                    console.log(mailErr);
                    return res.send('Failed to send OTP email.');
                }
                // بعد ما يبعت، يحوله لصفحة التحقق ومعاه الإيميل
                res.redirect(`/verify?email=${encodeURIComponent(email)}`);
            });
        });
    });
});

// 3. عرض صفحة إدخال الكود
app.get('/verify', (req, res) => {
    const email = req.query.email;
    res.render('verify', { email });
});

// 4. التأكد من صحة الكود اللي المستخدم دخله
app.post('/verify', (req, res) => {
    const { email, otp } = req.body;

    db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
        if (err || results.length === 0) return res.send('User not found');

        const user = results[0];
        const currentTime = new Date();

        if (user.otp !== otp) {
            return res.send('❌ الرمز غير صحيح!');
        }
        if (currentTime > new Date(user.otp_expires)) {
            return res.send('⏳ لقد انتهت صلاحية الرمز، اطلب رمزاً جديداً.');
        }

        // لو الكود تمام، نفعّل الحساب ونمسح الكود مؤقتاً
        db.query('UPDATE users SET is_verified = 1, otp = NULL, otp_expires = NULL WHERE email = ?', [email], (updateErr) => {
            if (updateErr) return res.send('Error updating verification');
            res.send('✅ تم تفعيل حسابك بنجاح يا بشمهندس!');
        });
    });
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});