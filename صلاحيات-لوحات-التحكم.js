/* أضف بعد role-password-gate.js في كل صفحة ملف الإعداد المناسب لها فقط. */

const GMARIK_ROLE_PASSWORDS = {
  // كلمة المرور الأصلية: Ed!t0r_Gm26
  editor: '98dc4574cdfefdcfc17501afc22407234b87c7dcbf32b91c47ff65307675278c',
  // كلمة المرور الأصلية: Pr00f!Gm26
  proofreader: 'cf0e8648561b9c5b0647c191508b2d2e2a120678cc41b9d107575c1bfd80c253',
  // كلمة المرور الأصلية: H3ad!Gm@rik26
  department_head: 'f1c5ac6f7d66fdc0551fe47c3f57e6158d03a8c56b0f51265041795407d3b4f2',
  // كلمة المرور الأصلية: Ch!ef#Gm26
  editor_in_chief: '01467981f18f5e36e324be22c49ce185165a0aa68e02211b1d754d4ac9d72a97'
};

// المحرر: ضعه في صفحة لوحة المحرر
function protectEditorDashboard() {
  GmarikRoleGate.protect({ role: 'editor', label: 'المحرر', passwordHash: GMARIK_ROLE_PASSWORDS.editor });
}
// المدقق اللغوي: ضعه في صفحة لوحة المدقق اللغوي
function protectProofreaderDashboard() {
  GmarikRoleGate.protect({ role: 'proofreader', label: 'المدقق اللغوي', passwordHash: GMARIK_ROLE_PASSWORDS.proofreader });
}
// رئيس القسم: ضعه في صفحة لوحة رئيس القسم
function protectDepartmentHeadDashboard() {
  GmarikRoleGate.protect({ role: 'department_head', label: 'رئيس القسم', passwordHash: GMARIK_ROLE_PASSWORDS.department_head });
}
// رئيس التحرير: ضعه في صفحة لوحة رئيس التحرير
function protectEditorInChiefDashboard() {
  GmarikRoleGate.protect({ role: 'editor_in_chief', label: 'رئيس التحرير', passwordHash: GMARIK_ROLE_PASSWORDS.editor_in_chief });
}
