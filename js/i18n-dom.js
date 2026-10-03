// ══════════════════════════════════════════════════════════════════
//  ترجمة الواجهة كاملةً إلى الإنجليزية.
//  نظام data-i18n يغطي جزءاً من النصوص الثابتة فقط؛ أغلب النصوص تُبنى
//  بالكود (الجداول، النوافذ، الرسائل). هذه الطبقة تترجم كل نص ظاهر عبر
//  قاموس عربي→إنجليزي، وتراقب الصفحة لترجمة ما يُضاف لاحقاً، وتحفظ الأصل
//  لتعيده عند الرجوع للعربية. بيانات المستخدم (الأسماء، الملاحظات) لا تطابق
//  القاموس فتبقى كما هي.
//  مفاتيح القاموس بلا رموز تعبيرية في الطرفين، والأرقام تُكتب # وتُعاد مكانها.
// ══════════════════════════════════════════════════════════════════
(function () {
  var D = {
    // ── القائمة والشريط ──
    'اللمسة الأخيرة': 'The Final Touch', 'الرئيسية': 'Home', 'لوحة التحكم': 'Dashboard', 'إدارة السيارات': 'Car Management',
    'السيارات في الورشة': 'Cars in Workshop', 'السيارات المُسلَّمة': 'Delivered Cars', 'التنبيهات': 'Alerts', 'الخدمات': 'Services',
    'أوامر الصيانة': 'Work Orders', 'قائمة الخدمات': 'Services List', 'المالية': 'Finance', 'الفواتير والإيصالات': 'Invoices & Receipts',
    'المصروفات': 'Expenses', 'التقارير المالية': 'Financial Reports', 'الإغلاق الشهري': 'Monthly Closing', 'النظام': 'System',
    'العملاء': 'Customers', 'تتبع العملاء': 'Customer Tracking', 'إدارة المستخدمين': 'User Management', 'إدارة الحالات': 'Manage Stages',
    'الموظفون': 'Employees', 'الدوام والإجازات': 'Attendance & Leave', 'مسؤول': 'Admin', 'عامل': 'Worker', 'محاسب': 'Accountant',
    'خروج': 'Logout', 'خروج ↩': 'Logout ↩', 'متصل بالسحابة': 'Cloud connected', 'السحابة متصلة': 'Cloud connected', 'حالة السحابة': 'Cloud status',
    'محلي فقط': 'Local only', 'جاري الحفظ...': 'Saving...', 'تم الحفظ': 'Saved', 'تم التزامن': 'Synced', 'خطأ الاتصال': 'Connection error',
    'السحابة متصلة — بياناتك محفوظة تلقائياً': 'Cloud connected — your data is saved automatically',
    'تم استقبال تحديثات جديدة من السحابة': 'New updates received from the cloud',
    'طي القائمة': 'Collapse menu', 'تسجيل الخروج': 'Log out', 'هل تريد تسجيل الخروج؟': 'Do you want to log out?',
    'إضافة سيارة': 'Add Car',

    // ── لوحة التحكم ──
    'يوجد': 'There are', 'سيارة تجاوزت # أيام في الورشة!': 'car(s) exceeded # days in the workshop!', 'عرض التفاصيل': 'View details',
    'سيارات في الورشة': 'Cars in workshop', 'إجمالي الإيرادات': 'Total revenue', 'إجمالي المصروفات': 'Total expenses', 'صافي الربح': 'Net profit',
    'مبالغ معلقة (غير مقبوضة)': 'Pending amounts (uncollected)', 'توزيع الخدمات': 'Services distribution', 'أحدث السيارات': 'Latest cars',
    'اللوحة': 'Plate', 'المالك': 'Owner', 'الحالة': 'Status', 'الأيام': 'Days', 'إصلاح': 'Repair', 'جاهزة': 'Ready', 'انتظار': 'Waiting',
    'مُسلَّمة': 'Delivered', 'مُسلّمة': 'Delivered', 'لا توجد سيارات': 'No cars', '# يوم': '# days', '# أيام': '# days', '# د': '# min', '#د': '#m',

    // ── السيارات ──
    'الهاتف': 'Phone', 'السيارة': 'Car', 'الخدمة': 'Service', 'المرحلة': 'Stage', 'الدفع': 'Payment', 'التسليم المتوقع': 'Expected delivery',
    'إجراءات': 'Actions', 'استلام': 'Reception', 'تشخيص': 'Diagnosis', 'دهان': 'Painting', 'تسليم': 'Delivery', 'سمكرة': 'Body work',
    'جاهزة للتسليم': 'Ready for delivery', 'في الانتظار': 'Waiting', 'تشطيبات قبل الدهان': 'Pre-paint finishing', 'دهان السيارة': 'Car painting',
    'تغيير الزيت والفلاتر': 'Oil & filter change', 'إصلاح الفرامل': 'Brake repair', 'إصلاح المكيف': 'A/C repair', 'تشخيص كهربائي': 'Electrical diagnosis',
    'إصلاح كهربائي': 'Electrical repair', 'استلام السيارة': 'Car received',
    'دهان وتلميع': 'Paint & Polish', 'صيانة ميكانيكية': 'Mechanical Maintenance', 'سمكرة وهيكل': 'Body & Frame', 'خدمة شاملة': 'Full Service',
    'تغيير زيت': 'Oil Change', 'فرامل': 'Brakes', 'مكيف': 'A/C', 'كهرباء': 'Electrical', 'دهان كامل': 'Full Paint', 'سمكرة ودهان': 'Body & Paint',
    'صيانة': 'Maintenance', 'أخرى': 'Other', 'شاملة': 'Full', 'زيت': 'Oil',
    'كل الحالات': 'All statuses', 'كل الخدمات': 'All services', 'بحث...': 'Search...', 'انقر لتغيير الحالة': 'Click to change status',
    'طباعة بطاقة العمل': 'Print job card', 'مسح': 'Clear', 'المبلغ': 'Amount', 'المدفوع': 'Paid', 'تاريخ الدخول': 'Date in',
    'تاريخ التسليم': 'Delivery date', '(# سيارة)': '(# cars)', 'متبقي: #': 'Remaining: #', 'تأكيد الدفع': 'Confirm payment',
    'بحث باسم أو لوحة...': 'Search by name or plate...', 'تعديل': 'Edit', 'إيصال': 'Receipt', 'استرجاع إلى الورشة': 'Return to workshop',
    'حذف': 'Delete', 'تحديث': 'Update', 'مدفوع': 'Paid', 'متبقي': 'Remaining', 'مكتمل': 'Complete', 'غير محدد': 'Not specified',
    'سيارات تجاوزت المدة المحددة': 'Cars over the time limit', 'الأيام في الورشة': 'Days in workshop', 'إعداد حد التنبيه': 'Alert threshold',
    'تنبيه عند تجاوز:': 'Alert after:', 'أيام': 'days', 'لا توجد تنبيهات': 'No alerts',

    // ── أوامر الصيانة والخدمات ──
    'إضافة أمر صيانة': 'Add work order', 'نوع العمل': 'Work type', 'الوصف': 'Description', 'التكلفة': 'Cost', 'الفني': 'Technician',
    'جاري': 'In progress', 'لا توجد أوامر': 'No orders', 'إضافة خدمة': 'Add service', 'قائمة الخدمات والأسعار': 'Services & Prices',
    'النوع': 'Type', 'السعر (ر.ع)': 'Price (OMR)', 'تغيير زيت المحرك': 'Engine oil change', 'تغيير زيت المحرك والفلتر': 'Change engine oil and filter',
    'فحص وإصلاح نظام التبريد': 'Inspect and repair the cooling system', 'إصلاح الهيكل': 'Body repair', 'تقويم وإصلاح هيكل السيارة': 'Straighten and repair the car body',
    'دهان خارجي كامل': 'Full exterior paint', 'استبدال تيل الفرامل': 'Replace brake pads', 'بولش وتلميع': 'Polish & Shine', 'تلميع وتشميع السيارة': 'Polish and wax the car',
    'الفني المسؤول': 'Responsible technician', 'التكلفة (ر.ع)': 'Cost (OMR)', 'وصف العمل': 'Work description', 'إضافة': 'Add',
    'اختر أو اكتب اسم الفني': 'Choose or type technician name', 'تفاصيل العمل...': 'Work details...', 'اسم الخدمة *': 'Service name *',
    'السعر الافتراضي (ر.ع)': 'Default price (OMR)', 'حفظ': 'Save', 'مثال: تغيير زيت المحرك': 'e.g. Engine oil change', 'وصف مختصر...': 'Short description...',

    // ── الصندوق والذمم والفواتير ──
    'الصندوق اليومي': 'Daily Cash Box', 'طباعة': 'Print', 'المقبوضات': 'Receipts', 'الصافي': 'Net', 'لا مقبوضات في هذا اليوم': 'No receipts on this day',
    'الذمم المدينة وأعمارها': 'Receivables Aging', '#–# يوم': '#–# days', 'أكثر من #': 'Over #', 'مستحق على سيارات مُسلَّمة:': 'Due on delivered cars:',
    '· متبقٍّ على سيارات ما زالت في الورشة:': '· Remaining on cars still in workshop:', '(العمر من تاريخ التسليم)': '(age from delivery date)',
    'العميل': 'Customer', 'منذ التسليم': 'Since delivery', 'المتبقي': 'Remaining', 'لا ذمم على سيارات مُسلَّمة': 'No receivables on delivered cars',
    'طابِق «# كاش» مع النقد الفعلي في الدرج، و«# تحويل» مع كشف البنك.': 'Match "cash" with the actual cash in the drawer, and "transfer" with the bank statement.',
    'كاش': 'Cash', 'بطاقة': 'Card', 'تحويل': 'Transfer', 'فيزا': 'Visa', 'فيزا / بطاقة': 'Visa / Card', 'تحويل بنكي': 'Bank transfer',
    'كاش: #': 'Cash: #', 'بطاقة: #': 'Card: #', 'تحويل: #': 'Transfer: #', 'غير محدد: #': 'Not specified: #',
    'المستلم': 'Received by', 'دفعة': 'Payment', 'دفعة مقدّمة': 'Deposit', 'تصحيح': 'Correction', 'مُرحَّلة': 'migrated',
    'رقم الفاتورة': 'Invoice #', 'المبلغ الكلي': 'Total amount', 'المقدمة': 'Deposit', 'التاريخ': 'Date', 'لا توجد فواتير': 'No invoices',
    'تصدير PDF': 'Export PDF',

    // ── المصروفات ──
    'إضافة مصروف': 'Add expense', 'توزيع فاتورة أصباغ': 'Distribute paint invoice', 'الإجمالي الكلي': 'Grand total', 'هذا الشهر': 'This month',
    'متوسط الفاتورة': 'Average invoice', 'قطع الغيار': 'Spare parts', 'المرافق والتشغيل': 'Utilities & operations', 'الرواتب والعمالة': 'Salaries & labor',
    'سجل المصروفات': 'Expenses log', '# سجل': '# records', '# من أصل #': '# of #', 'البيان / الملاحظات': 'Description / Notes', 'الفاتورة': 'Invoice',
    'مرافق': 'Utilities', 'أصباغ': 'Paints', 'إيجار': 'Rent', 'رواتب': 'Salaries', 'أدوات': 'Tools', 'قطع غيار': 'Spare parts',
    'قطع الغيار ': 'Spare parts', 'مرافق وتشغيل': 'Utilities & operations', 'رواتب وعمالة': 'Salaries & labor', 'أدوات ومعدات': 'Tools & equipment',
    'أصباغ ومواد دهان': 'Paints & paint materials', 'جميع الأنواع': 'All types', 'بحث في المصروفات...': 'Search expenses...',
    'لا توجد مصروفات': 'No expenses', 'لا توجد نتائج للفلتر': 'No results for this filter', 'مسح الفلتر': 'Clear filter',
    'إضافة مصروف ': 'Add expense', 'تعديل المصروف': 'Edit expense', 'البيان *': 'Description *', 'المبلغ (ر.ع) *': 'Amount (OMR) *', 'ملاحظات': 'Notes',
    'صورة الفاتورة / الإيصال': 'Invoice / receipt photo', 'اختر صورة': 'Choose photo', 'لا توجد صورة': 'No photo',
    'السيارة (للتكلفة المباشرة — اختياري)': 'Car (direct cost — optional)', '— مصروف عام (غير مرتبط بسيارة) —': '— General expense (not linked to a car) —',
    'مثال: شراء زيت محرك، فاتورة كهرباء...': 'e.g. engine oil purchase, electricity bill...', 'أي تفاصيل إضافية...': 'Any extra details...',
    'عرض الفاتورة': 'View invoice', 'الشهر مُغلق': 'Month is closed',

    // ── التقارير ──
    'المالي': 'Financial', 'السيارات': 'Cars', 'الربحية': 'Profitability', 'ملخص مالي': 'Financial summary', 'الإيرادات': 'Revenue',
    'عدد الفواتير': 'Invoices count', 'عدد البنود': 'Items count', 'متوسط المصروف': 'Average expense', 'ربح': 'Profit', 'خسارة': 'Loss',
    'ربحية الأعمال (حسب تاريخ التسليم)': 'Job profitability (by delivery date)', 'كل الفترات': 'All periods', 'فواتير السيارات المُسلَّمة': 'Delivered cars invoices',
    'التكاليف المباشرة': 'Direct costs', 'منها أصباغ #': 'of which paints #', 'مجمل الربح #': 'Gross profit #', 'مصروفات عامة': 'Overheads',
    'صافي الربح التشغيلي': 'Operating net profit', 'حسب الخدمة': 'By service', 'عدد': 'Count', 'الفواتير': 'Invoices', 'التكاليف': 'Costs',
    'الأصباغ': 'Paints', 'الربح': 'Profit', 'الهامش': 'Margin', 'ربح/سيارة': 'Profit/car', 'حسب السيارة (الأقل ربحاً أولاً)': 'By car (least profitable first)',
    'لا تكاليف': 'No costs', 'بانتظار الفاتورة': 'Awaiting invoice', 'لا سيارات مُسلَّمة في هذه الفترة': 'No delivered cars in this period',
    'كل الفترات ': 'All periods', 'الفترة:': 'Period:', 'تكاليف على سيارات لم تُسلَّم بعد:': 'Costs on cars not yet delivered:', '(تُحسب عند التسليم)': '(counted at delivery)',

    // ── الإغلاق ──
    'تصدير Excel': 'Export Excel', 'تقرير الشركاء': 'Partners report', 'إغلاق شهر': 'Close month', 'هامش الربح': 'Profit margin',
    'سيارات معلقة': 'Pending cars', 'الملخص السنوي': 'Yearly summary', 'السنة:': 'Year:', 'صافي الربح السنوي': 'Annual net profit',
    'سيارات مستلمة': 'Cars received', 'أفضل شهر': 'Best month', 'أضعف شهر': 'Weakest month', 'مقارنة الأشهر الأخيرة': 'Recent months comparison',
    'حركة السيارات شهرياً': 'Monthly car movement', 'سجل الإغلاقات': 'Closings log', 'إعادة فتح': 'Reopen', 'إعادة الحساب': 'Recalculate',
    'إعادة فتح الشهر للتعديل': 'Reopen the month for editing', '(أُعيد فتحه)': '(reopened)', 'حذف السجل': 'Delete record', 'سيارة': 'cars',
    'غير محدد ': 'Not specified', 'المصروفات ': 'Expenses', 'الإيرادات ': 'Revenue',

    // ── العملاء والتتبع ──
    'الاسم': 'Name', 'عدد السيارات': 'Cars count', 'إجمالي المدفوع': 'Total paid', 'إرسال رابط التتبع عبر واتساب': 'Send tracking link via WhatsApp',
    'اختر سيارة وأرسل رابط التتبع للعميل مباشرة عبر واتساب — يرى حالة سيارته لحظة بلحظة.': 'Choose a car and send the tracking link to the customer via WhatsApp — they see their car status live.',
    'اختر السيارة': 'Choose car', 'معاينة الرسالة': 'Message preview', 'فتح واتساب وإرسال الرابط': 'Open WhatsApp and send link',
    'روابط التتبع النشطة': 'Active tracking links', 'رابط التتبع': 'Tracking link', 'نسخ الرابط': 'Copy link', 'واتساب': 'WhatsApp',
    'إحصائيات التتبع': 'Tracking statistics', 'إجمالي السيارات': 'Total cars', 'تحت الإصلاح': 'Under repair',

    // ── إضافة سيارة ──
    'إضافة سيارة جديدة': 'Add new car', 'بحث عن عميل سابق': 'Find previous customer', 'خدمة سريعة': 'Quick service',
    'قوالب السيارات الشائعة': 'Common car templates', 'كامري': 'Camry', 'لاندكروزر': 'Land Cruiser', 'هايلكس': 'Hilux', 'باترول': 'Patrol',
    'صني': 'Sunny', 'النترا': 'Elantra', 'سيراتو': 'Cerato', 'سيفيك': 'Civic', 'باجيرو': 'Pajero', 'رقم اللوحة *': 'Plate number *',
    'صوّر اللوحة واقرأ الرقم': 'Photograph the plate and read the number', 'اسم المالك *': 'Owner name *', 'رقم الهاتف': 'Phone number',
    'أدخل الرقم كاملاً مع كود الدولة للإشعارات (عُمان: #XXXXXXXX)': 'Enter the full number with country code for notifications (Oman: 968XXXXXXXX)',
    'موديل السيارة': 'Car model', 'نوع الخدمة *': 'Service type *', 'أسبوع': 'Week', 'المبلغ التقديري (ر.ع)': 'Estimated amount (OMR)',
    'الدفعة المقدمة (ر.ع)': 'Deposit (OMR)', 'تفاصيل إضافية (اختياري)': 'Extra details (optional)', 'صور الاستلام (اختياري)': 'Reception photos (optional)',
    'إضافة صورة': 'Add photo', 'إلغاء': 'Cancel', 'حفظ السيارة': 'Save car', 'اكتب اسم العميل أو رقم الهاتف...': 'Type customer name or phone...',
    'مثال: # ع م': 'e.g. 12345 AM', 'الاسم الكامل': 'Full name', 'مثال: # أو #': 'e.g. 96812345678 or 91234567', 'يوم': 'day', 'يومين': '2 days',
    '# أسابيع': '# weeks', 'أسبوعين': '2 weeks', 'ملاحظات إضافية': 'Additional notes',

    // ── تحديث السيارة ──
    'تحديث السيارة': 'Update car', 'مراحل الإصلاح': 'Repair stages', 'صور السيارة': 'Car photos', 'عند الاستلام': 'At reception',
    'صورة': 'Photo', 'عند التسليم': 'At delivery', 'المبلغ الكلي (ر.ع)': 'Total amount (OMR)', 'المدفوع حتى الآن (ر.ع)': 'Paid so far (OMR)',
    'سجل الدفعات': 'Payments log', 'لا توجد دفعات مسجّلة بعد': 'No payments recorded yet',
    'تعديل حقل «المدفوع» يُسجَّل كدفعة أو تصحيح بتاريخ اليوم، ولا يمحو السجل.': 'Editing the "Paid" field is recorded as a payment or correction dated today; it does not erase the log.',
    'ربحية السيارة': 'Car profitability', 'إضافة تكلفة': 'Add cost', 'الفاتورة: #': 'Invoice: #', 'التكاليف: #': 'Costs: #', 'الربح: # (#)': 'Profit: # (#)',
    'لا تكاليف مسجّلة لهذه السيارة — الربح الظاهر هو كامل الفاتورة.': 'No costs recorded for this car — the shown profit is the full invoice.',
    'تكلفة الأصباغ': 'Paint cost', 'البيان (اختياري): لون، كمية، المحل…': 'Description (optional): color, quantity, shop…', 'طريقة الدفع': 'Payment method',
    'حالة الدفع': 'Payment status', 'متبقي #': 'Remaining #', 'مدفوع بالكامل': 'Fully paid', 'تاريخ التسليم المتوقع': 'Expected delivery date',
    'ملاحظات الإصلاح': 'Repair notes', 'رقم هاتف العميل': 'Customer phone', 'أدخل الرقم كاملاً مع كود الدولة (عُمان: #XXXXXXXX)': 'Enter the full number with country code (Oman: 968XXXXXXXX)',
    'مفتاح WhatsApp (CallMeBot)': 'WhatsApp key (CallMeBot)', 'تفاصيل الأعمال المنجزة...': 'Details of completed work...',
    'أدخل API Key من CallMeBot لإرسال إشعارات تلقائية': 'Enter the CallMeBot API key to send automatic notifications',
    'من نافذة تعديل السيارة': 'from the car edit window', 'تسوية تلقائية: المدفوع عُدِّل من نسخة قديمة من التطبيق': 'Auto settlement: paid amount changed by an older app version',

    // ── تأكيد الدفع ──
    'تأكيد استلام الدفع': 'Confirm payment received', 'إجمالي:': 'Total:', 'مدفوع:': 'Paid:', 'متبقي:': 'Remaining:',
    'الدفعة المستلمة الآن (ر.ع)': 'Payment received now (OMR)', 'تُضاف هذه الدفعة إلى المدفوع سابقاً ولا تستبدله': 'This payment is added to the previous paid amount; it does not replace it',

    // ── فاتورة الأصباغ والشركاء ──
    'توزيع فاتورة الأصباغ': 'Distribute paint invoice', 'تاريخ فاتورة المورّد': 'Supplier invoice date', 'إجمالي الفاتورة (ر.ع) *': 'Invoice total (OMR) *',
    'المورّد / رقم الفاتورة': 'Supplier / invoice #', 'سيارات شهر': 'Cars of month', 'إظهار كل السيارات (لا سيارات الدهان فقط)': 'Show all cars (not only paint jobs)',
    'وزّع بالتساوي': 'Split equally', 'وزّع حسب قيمة الفاتورة': 'Split by invoice value',
    'على السيارات المؤشَّرة — أو اكتب مبلغ كل سيارة من تفصيل الفاتورة': 'over the checked cars — or type each car amount from the invoice details',
    'أصباغ سابقة': 'Previous paints', 'الموزَّع على السيارات:': 'Distributed to cars:', 'من # ·': 'of # ·', 'مطابق للفاتورة': 'Matches the invoice',
    'حفظ التوزيع': 'Save distribution', 'مثال: محل الألوان — #': 'e.g. Paint shop — 1234', 'لا سيارات في هذا الشهر': 'No cars in this month',
    'في الورشة': 'in workshop', 'تقرير الأرباح للشركاء': 'Partners profit report', 'الشهر': 'Month', 'الشركاء ونسبهم': 'Partners & shares',
    'إضافة شريك': 'Add partner', 'إنشاء التقرير (PDF)': 'Create report (PDF)', 'اسم الشريك': 'Partner name',
    'الشهر غير مُغلق — ستظهر الأرقام في التقرير «أولية»': 'Month not closed — figures will show as "preliminary" in the report',
    'الشهر مُغلق — الأرقام نهائية': 'Month closed — figures are final',

    // ── الإيصال والنوافذ الأخرى ──
    'إيصال الدفع': 'Payment receipt', 'THE FINAL TOUCH | للصيانة والسمكرة والدهان': 'THE FINAL TOUCH | Maintenance, Body & Paint',
    'مسقط، سلطنة عُمان': 'Muscat, Sultanate of Oman', 'رقم الإيصال:': 'Receipt #:', 'التاريخ:': 'Date:', 'اسم العميل': 'Customer name',
    'رقم اللوحة': 'Plate number', 'نوع الخدمة': 'Service type', 'الأعمال المنجزة': 'Work done', 'يوجد مبلغ متبقي': 'There is a remaining amount',
    'تم الدفع بالكامل': 'Paid in full', 'شكراً لثقتكم بورشة اللمسة الأخيرة': 'Thank you for trusting The Final Touch', 'إغلاق': 'Close',
    'إدارة حالات السيارة': 'Manage car stages', 'الحالات الافتراضية': 'Default stages', 'قوالب الخدمات': 'Service templates',
    'إضافة حالة جديدة': 'Add new stage', 'رمز': 'Icon', 'اسم الحالة': 'Stage name', 'الحساب الحالي': 'Current account',
    'إضافة / تعديل مستخدم': 'Add / edit user', 'اسم المستخدم': 'Username', 'كلمة المرور': 'Password', 'الصلاحية': 'Role',
    'مثال: ahmed': 'e.g. ahmed', 'إضافة أمر صيانة ': 'Add work order', 'تأكيد': 'Confirm', 'نعم': 'Yes', 'لا': 'No',
    'تسجيل الدخول': 'Login', 'دخول': 'Sign in', 'اسم المستخدم أو كلمة المرور غير صحيحة': 'Incorrect username or password',
    'يرجى إدخال اسم المستخدم وكلمة المرور': 'Please enter username and password',

    // ── رسائل التنبيه ──
    'هذا الإجراء متاح للمدير فقط': 'This action is for the admin only', 'حذف المصروف؟': 'Delete the expense?', 'حذف هذا الإغلاق؟': 'Delete this closing?',
    'يرجى إدخال البيان': 'Please enter the description', 'يرجى إدخال المبلغ': 'Please enter the amount', 'يرجى اختيار طريقة الدفع': 'Please choose the payment method',
    'يرجى إدخال مبلغ صحيح': 'Please enter a valid amount', 'يرجى إدخال مبلغ الأصباغ': 'Please enter the paint amount', 'يجب كتابة السبب': 'A reason is required',
    'أدخل إجمالي الفاتورة أولاً': 'Enter the invoice total first', 'أدخل إجمالي الفاتورة': 'Enter the invoice total', 'أدخل اسم كل شريك': 'Enter each partner name',
    'أشِّر على السيارات التي تُوزَّع عليها الفاتورة': 'Check the cars to distribute the invoice over', 'اختر الشهر': 'Choose the month',
    'المبلغ الموزَّع أكبر من إجمالي الفاتورة': 'The distributed amount exceeds the invoice total',
    'أعِد فتح الشهر أولاً؛ الإغلاق الساري لا يُحذف.': 'Reopen the month first; an active closing cannot be deleted.',
    'للتعديل أعِد فتح الشهر من صفحة «الإغلاق الشهري» (للمدير، ويُسجَّل السبب).': 'To edit, reopen the month from "Monthly Closing" (admin only; the reason is logged).',
    'اسمح بالنوافذ المنبثقة لهذا الموقع ثم أعد المحاولة': 'Allow pop-ups for this site and try again',
    'تنبيه: هذا الحقل يضيف دفعة جديدة إلى المدفوع ولا يستبدله.': 'Note: this field adds a new payment to the paid amount; it does not replace it.',
    'هل تريد المتابعة؟': 'Do you want to continue?', 'مساحة التخزين ممتلئة.': 'Storage is full.'
  };

  // عبارات تُستبدل داخل نص أطول (رسائل مركّبة، تسميات قبل بيانات المستخدم)
  var P = [
    ['لا يمكن تسجيل الدفعة', 'Cannot record the payment'], ['لا يمكن تسجيل تكلفة الأصباغ', 'Cannot record the paint cost'],
    ['لا يمكن تسجيل فاتورة الأصباغ', 'Cannot record the paint invoice'], ['لا يمكن تسجيل الدفعة المقدّمة', 'Cannot record the deposit'],
    ['لا يمكن حفظ المصروف', 'Cannot save the expense'], ['لا يمكن حذف المصروف', 'Cannot delete the expense'], ['لا يمكن حذف السيارة', 'Cannot delete the car'],
    ['لا يمكن حفظ التعديل المالي', 'Cannot save the financial change'], ['لا يمكن تسليم السيارة', 'Cannot deliver the car'],
    ['لا يمكن إرجاع السيارة (حذف فاتورتها)', 'Cannot return the car (deletes its invoice)'],
    ['سيُسجَّل تصحيح بالسالب', 'A negative correction will be recorded:'], ['في سجل الدفعات (استرجاع للعميل أو تصحيح خطأ إدخال).', 'in the payments log (customer refund or entry correction).'],
    ['سبب إعادة فتح شهر', 'Reason for reopening'], ['(يُحفظ في سجل الإغلاق):', '(saved in the closing log):'],
    ['المبلغ المُدخل', 'Entered amount'], ['أكبر من المتبقي', 'is larger than the remaining'], ['المدفوع سيصبح', 'Paid will become'],
    ['سُجِّلت فاتورة الأصباغ:', 'Paint invoice recorded:'], ['مجموع نسب الشركاء', 'Partners shares total'], ['يجب أن يكون 100%', 'must be 100%'],
    ['مجموع النسب', 'Shares total'], ['(يجب أن يكون 100%)', '(must be 100%)'],
    ['صافي الربح النقدي لـ', 'Net cash profit for'], ['سيارة دهان بانتظار فاتورة الأصباغ — الربح مؤقّت حتى توزيعها', 'paint car(s) awaiting the paint invoice — profit is provisional until distributed'],
    ['سيارة دهان بانتظار فاتورة الأصباغ', 'paint car(s) awaiting the paint invoice'], ['سيارة بلا تكاليف مسجّلة — ربحها مبالغ فيه', 'car(s) without recorded costs — profit is overstated'],
    ['أعاد فتحه', 'Reopened by'], ['— السبب:', '— reason:'], ['إعادة حساب إغلاق', 'Recalculate closing'], ['سيتم تحديث جميع الأرقام من البيانات الحالية.', 'All figures will be updated from current data.'],
    ['إعادة هذه السيارة إلى قسم "السيارات في الورشة"؟', 'Return this car to "Cars in Workshop"?'], ['سيتم حذف الفاتورة المرتبطة بها.', 'Its linked invoice will be deleted.'],
    ['الحالة الحالية:', 'Current status:'], ['تابع سيارتك مباشرة:', 'Track your car live:'], ['ورشة اللمسة الأخيرة', 'The Final Touch workshop'],
    ['فاتورة أصباغ', 'Paint invoice'], ['غير موزَّع', 'undistributed'], ['جزء من فاتورة بإجمالي', 'part of an invoice totaling'],
    ['أصباغ —', 'Paints —'], ['سيارة +', 'car(s) +'], [' عام', ' general'],
    ['لا يمكن ', 'Cannot '], [': شهر ', ': month '], [' مُغلق.', ' is closed.'],
    ['تاريخ الإغلاق:', 'Closed at:'], ['أغلق بواسطة:', 'Closed by:'],
    ['ر.ع', 'OMR']
  ];
  // أنماط رقمية شائعة (تُطابَق كاملة، فلا تمسّ ملاحظات المستخدم)
  var NUMD = {
    '# مستلمة': '# received', '# مُسلَّمة': '# delivered', '# معلقة': '# pending', '# سيارة': '# cars', '# عميل': '# customers',
    '# ر.ع': '# OMR', '-# ر.ع': '-# OMR', '# ر.ع (#)': '# OMR (#)', '# يوم ⚠️': '# days ⚠️', 'منذ # يوم': '# days ago',
    'تاريخ الإغلاق: # # # • أغلق بواسطة:': 'Closed at: # # # • Closed by:', '# سيارة دهان بانتظار فاتورة الأصباغ': '# paint car(s) awaiting the paint invoice'
  };
  for (var nk in NUMD) if (!D.hasOwnProperty(nk)) D[nk] = NUMD[nk];
  P.sort(function (a, b) { return b[0].length - a[0].length; });

  var MONTHS = { 'يناير': 'January', 'فبراير': 'February', 'مارس': 'March', 'أبريل': 'April', 'مايو': 'May', 'يونيو': 'June', 'يوليو': 'July',
    'أغسطس': 'August', 'سبتمبر': 'September', 'أكتوبر': 'October', 'نوفمبر': 'November', 'ديسمبر': 'December' };
  var DAYS = { 'السبت': 'Saturday', 'الأحد': 'Sunday', 'الاثنين': 'Monday', 'الثلاثاء': 'Tuesday', 'الأربعاء': 'Wednesday', 'الخميس': 'Thursday', 'الجمعة': 'Friday' };

  var AR = /[؀-ۿ]/;
  var NUM = /[0-9٠-٩][0-9٠-٩.,:\/٫٬-]*/g;
  var EDGE = /^[^؀-ۿA-Za-z(«"]+|[^؀-ۿA-Za-z)»"!؟?.:]+$/g;

  function digits(s) { return s.replace(/[٠-٩]/g, function (c) { return String(c.charCodeAt(0) - 0x0660); }).replace(/٫/g, '.').replace(/٬/g, ','); }
  function lookup(core) {
    if (D.hasOwnProperty(core)) return D[core];
    var nums = [];
    var key = core.replace(NUM, function (m) { nums.push(m); return '#'; });
    if (nums.length && D.hasOwnProperty(key)) {
      var i = 0;
      return D[key].replace(/#/g, function () { return nums[i] != null ? digits(nums[i++]) : '#'; });
    }
    return null;
  }
  // نص كامل أو بعد نزع الرموز من طرفيه
  function seg(t) {
    var hit = lookup(t);
    if (hit != null) return hit;
    var pre = (t.match(/^[^؀-ۿA-Za-z(«"0-9٠-٩]+/) || [''])[0];
    var post = (t.match(/[^؀-ۿA-Za-z)»"!؟?.:0-9٠-٩%]+$/) || [''])[0];
    var core = t.slice(pre.length, t.length - post.length).trim();
    if (!core) return null;
    var h = lookup(core);
    if (h == null && /:$/.test(core)) { h = lookup(core.slice(0, -1).trim()); if (h != null) h += ':'; }
    return h == null ? null : pre + h + post;
  }
  // استبدال كلمة/عبارة كاملة فقط: لا يمسّ «العامري» حين نستبدل «عام».
  function isArLetter(c) { return !!c && /[ء-ي٠-٩ٱ-ۓ]/.test(c); }
  function replaceWord(s, from, to) {
    var out = '', i = 0, j;
    while ((j = s.indexOf(from, i)) !== -1) {
      var before = s.charAt(j - 1), after = s.charAt(j + from.length);
      var okB = !isArLetter(from.charAt(0)) || !isArLetter(before);
      var okA = !isArLetter(from.charAt(from.length - 1)) || !isArLetter(after);
      out += s.slice(i, j) + (okB && okA ? to : from);
      i = j + from.length;
    }
    return out + s.slice(i);
  }
  function translateLine(s) {
    if (!AR.test(s)) return s;
    var t = s.trim();
    if (!t) return s;
    var lead = s.slice(0, s.indexOf(t)), trail = s.slice(s.indexOf(t) + t.length);
    var hit = seg(t);
    if (hit == null) {
      // نص مركّب: «دفعة · بطاقة · admin» أو «التسمية: قيمة»
      hit = t.split(/(\s[·•|—–]\s|:\s|،\s|\s\|\s)/).map(function (part, idx) {
        if (idx % 2 === 1 || !AR.test(part)) return part;
        var h = seg(part.trim());
        return h == null ? part : part.replace(part.trim(), h);
      }).join('');
      Object.keys(DAYS).forEach(function (k) { hit = replaceWord(hit, k, DAYS[k]); });
      Object.keys(MONTHS).forEach(function (k) { hit = replaceWord(hit, k, MONTHS[k]); });
      for (var i = 0; i < P.length; i++) if (hit.indexOf(P[i][0]) !== -1) hit = replaceWord(hit, P[i][0], P[i][1]);
      // تواريخ مثل «٣ October ٢٠٢٦» و«السبت، ...»
      hit = digits(hit).replace(/،/g, ',').replace(/؟/g, '?');
    }
    return lead + hit + trail;
  }
  function tr(s) { return String(s).split('\n').map(translateLine).join('\n'); }
  window.i18nTranslate = tr;

  var ORIG = (typeof WeakMap !== 'undefined') ? new WeakMap() : null;
  var SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, NOSCRIPT: 1 };
  function isEn() { return typeof currentLang !== 'undefined' && currentLang === 'en'; }
  function skipNode(el) {
    for (var e = el; e && e !== document.body; e = e.parentElement) {
      if (SKIP[e.tagName] || (e.classList && e.classList.contains('no-i18n')) || e.isContentEditable) return true;
    }
    return false;
  }
  function doText(n) {
    var v = n.nodeValue;
    if (!v || !AR.test(v) || !n.parentElement || skipNode(n.parentElement)) return;
    var out = tr(v);
    if (out !== v) { if (ORIG && !ORIG.has(n)) ORIG.set(n, v); n.nodeValue = out; }
  }
  var ATTRS = ['placeholder', 'title'];
  function doAttrs(el) {
    for (var i = 0; i < ATTRS.length; i++) {
      var a = ATTRS[i], v = el.getAttribute(a);
      if (v && AR.test(v)) {
        var out = tr(v);
        if (out !== v) { if (!el.hasAttribute('data-ar-' + a)) el.setAttribute('data-ar-' + a, v); el.setAttribute(a, out); }
      }
    }
  }
  function walk(root) {
    if (!root) return;
    if (root.nodeType === 3) { doText(root); return; }
    if (root.nodeType !== 1 || SKIP[root.tagName]) return;
    doAttrs(root);
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false), n;
    while ((n = w.nextNode())) doText(n);
    var els = root.querySelectorAll('[placeholder],[title]');
    for (var i = 0; i < els.length; i++) doAttrs(els[i]);
  }
  function restore() {
    var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false), n;
    while ((n = w.nextNode())) if (ORIG && ORIG.has(n)) { n.nodeValue = ORIG.get(n); ORIG.delete(n); }
    ATTRS.forEach(function (a) {
      var els = document.querySelectorAll('[data-ar-' + a + ']');
      for (var i = 0; i < els.length; i++) { els[i].setAttribute(a, els[i].getAttribute('data-ar-' + a)); els[i].removeAttribute('data-ar-' + a); }
    });
  }
  window.domI18nApply = function (lang) { if (lang === 'en') walk(document.body); else restore(); };

  var queue = [], pending = false;
  function flush() {
    pending = false;
    var q = queue; queue = [];
    if (!isEn()) return;
    for (var i = 0; i < q.length; i++) walk(q[i]);
  }
  function start() {
    if (window.MutationObserver) {
      new MutationObserver(function (muts) {
        if (!isEn()) return;
        for (var i = 0; i < muts.length; i++) {
          var m = muts[i];
          if (m.type === 'characterData') queue.push(m.target);
          else if (m.type === 'attributes') queue.push(m.target);
          else for (var j = 0; j < m.addedNodes.length; j++) queue.push(m.addedNodes[j]);
        }
        if (!pending) { pending = true; (window.requestAnimationFrame || setTimeout)(flush); }
      }).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
    }
    if (isEn()) walk(document.body);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();

  // رسائل التنبيه والتأكيد
  ['alert', 'confirm', 'prompt'].forEach(function (k) {
    var orig = window[k];
    if (!orig) return;
    window[k] = function (msg) {
      var args = [].slice.call(arguments);
      if (isEn() && msg != null) args[0] = tr(msg);
      return orig.apply(window, args);
    };
  });
})();
