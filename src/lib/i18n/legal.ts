// Plain-language privacy policy and terms for the pilot. Written to follow Egypt's
// Personal Data Protection Law (No. 151 of 2020); have a lawyer review before a wide launch.

type Section = { h: string; p: string[] };
type Legal = { privacyTitle: string; termsTitle: string; updated: string; privacy: Section[]; terms: Section[] };

export const legal: Record<"ar" | "en", Legal> = {
  en: {
    privacyTitle: "Privacy policy",
    termsTitle: "Terms of use",
    updated: "Last updated",
    privacy: [
      { h: "Who we are", p: ["M3akOrder is an ordering service that connects customers in Egypt with local stores and delivery drivers."] },
      {
        h: "What we collect",
        p: [
          "Account details: your name, email or phone number, and the account type you choose.",
          "Order details: what you ordered, from which store, your delivery address, the phone number for the driver, and any notes.",
          "Your monthly budget, if you set one.",
          "Your location, only if you allow it. It is saved on your phone to show nearby stores, and added to an order's address so the driver can find you. You can pick an area by hand instead.",
          "We do not collect card details. Payment is cash on delivery for now.",
        ],
      },
      {
        h: "Why we use it",
        p: [
          "To take your order to the store and the driver, show you your order status and history, and run the spending tracker and worth-it check.",
          "To keep the service safe and resolve disputes. Each order keeps a timeline of status changes.",
        ],
      },
      {
        h: "Who can see it",
        p: [
          "The store you order from and the driver who delivers it see your name, phone number and delivery address for that order only.",
          "We do not sell your data. Our service providers (Supabase for the database and Vercel for hosting) store it on our behalf.",
        ],
      },
      { h: "How long we keep it", p: ["We keep your account until you delete it. Past orders stay in the store's records without your name, phone number or full address."] },
      {
        h: "Your rights",
        p: [
          "You can see and correct your data in the app, and delete your account at any time from the Account page.",
          "You can ask us any question about your data through the support contact in the app.",
        ],
      },
      { h: "Consent", p: ["By creating an account you agree to this policy. We will tell you in the app if it changes."] },
    ],
    terms: [
      { h: "The service", p: ["M3akOrder lets you order from independent local stores. Each store is responsible for its products, prices, quality and hygiene."] },
      {
        h: "Orders and payment",
        p: [
          "Prices and the delivery fee are shown before you order. The total is confirmed when you place the order.",
          "Payment is cash on delivery. Please have the amount ready, or tell us which note you'll pay with so the driver brings change.",
          "You can cancel an order until the store accepts it. A store can reject an order, for example if an item has run out.",
        ],
      },
      {
        h: "Stores",
        p: [
          "Stores must be approved before they appear. They must keep menus, prices and stock accurate and accept or reject orders promptly.",
          "Commission and fees for stores are agreed separately with M3akOrder.",
        ],
      },
      { h: "Drivers", p: ["Drivers must be approved before they can take orders. They must deliver safely, hand over the order in good condition and collect the correct cash amount."] },
      { h: "Fair use", p: ["Do not place fake orders, abuse stores, drivers or customers, or try to interfere with the service. We may suspend accounts that do."] },
      { h: "Worth-it labels", p: ["Worth-it labels compare prices with similar items at other stores. They are guidance only, not a guarantee of quality."] },
      { h: "Contact", p: ["Questions or complaints: use the support contact in the app."] },
    ],
  },
  ar: {
    privacyTitle: "سياسة الخصوصية",
    termsTitle: "شروط الاستخدام",
    updated: "آخر تحديث",
    privacy: [
      { h: "إحنا مين", p: ["معاك أوردر خدمة طلبات بتوصّل العملاء في مصر بالمحلات القريبة ومندوبين التوصيل."] },
      {
        h: "بنجمع إيه",
        p: [
          "بيانات الحساب: اسمك، إيميلك أو رقم موبايلك، ونوع الحساب اللي اخترته.",
          "بيانات الطلب: طلبت إيه ومن أنهي محل، عنوان التوصيل، رقم الموبايل للمندوب، وأي ملاحظات.",
          "ميزانيتك الشهرية لو حددتها.",
          "موقعك، بس لو سمحت بده. بيتحفظ على موبايلك عشان نوريك المحلات القريبة، وبيتضاف لعنوان الطلب عشان المندوب يوصلك. وتقدر تختار منطقتك بإيدك بدل كده.",
          "مش بنجمع بيانات كروت. الدفع حاليًا كاش عند الاستلام.",
        ],
      },
      {
        h: "بنستخدمها في إيه",
        p: [
          "علشان نوصّل طلبك للمحل والمندوب، ونوريك حالة طلباتك وتاريخها، ونشغّل متابعة المصاريف و\"تستاهل ولا لأ\".",
          "علشان نحافظ على أمان الخدمة ونحل أي خلاف. كل طلب بيتسجل له مراحل.",
        ],
      },
      {
        h: "مين يقدر يشوفها",
        p: [
          "المحل اللي طلبت منه والمندوب اللي بيوصّل بيشوفوا اسمك ورقمك وعنوانك للطلب ده بس.",
          "مش بنبيع بياناتك. مقدمي الخدمة بتوعنا (Supabase لقاعدة البيانات وVercel للاستضافة) بيحفظوها بالنيابة عننا.",
        ],
      },
      { h: "بنحتفظ بيها قد إيه", p: ["بنحتفظ بحسابك لحد ما تمسحه. الطلبات القديمة بتفضل في سجلات المحل من غير اسمك أو رقمك أو عنوانك الكامل."] },
      {
        h: "حقوقك",
        p: ["تقدر تشوف بياناتك وتعدلها من التطبيق، وتمسح حسابك في أي وقت من صفحة حسابي.", "تقدر تسألنا أي سؤال عن بياناتك من خلال الدعم في التطبيق."],
      },
      { h: "الموافقة", p: ["لما تعمل حساب، إنت موافق على السياسة دي. لو اتغيرت هنعرّفك في التطبيق."] },
    ],
    terms: [
      { h: "الخدمة", p: ["معاك أوردر بيخليك تطلب من محلات محلية مستقلة. كل محل مسؤول عن منتجاته وأسعاره وجودتها ونظافتها."] },
      {
        h: "الطلبات والدفع",
        p: [
          "الأسعار ورسوم التوصيل بتظهر قبل ما تطلب، والإجمالي بيتأكد لما تبعت الطلب.",
          "الدفع كاش عند الاستلام. جهّز المبلغ، أو قولنا هتدفع بأنهي ورقة علشان المندوب يجيب الباقي.",
          "تقدر تلغي الطلب لحد ما المحل يقبله. المحل ممكن يرفض الطلب، مثلًا لو صنف خلص.",
        ],
      },
      { h: "المحلات", p: ["المحلات لازم يتوافق عليها قبل ما تظهر، ولازم تحافظ على المنيو والأسعار والكميات صح وترد على الطلبات بسرعة.", "العمولة والرسوم بتتفق مع كل محل لوحده."] },
      { h: "المندوبين", p: ["المندوب لازم يتوافق عليه قبل ما ياخد طلبات، ويوصّل بأمان، ويسلّم الطلب سليم، ويحصّل المبلغ الصح."] },
      { h: "الاستخدام العادل", p: ["ممنوع الطلبات الوهمية أو الإساءة للمحلات أو المندوبين أو العملاء أو محاولة تعطيل الخدمة. ممكن نوقف أي حساب بيعمل كده."] },
      { h: "علامات \"تستاهل ولا لأ\"", p: ["العلامات دي بتقارن الأسعار بمنتجات مشابهة في محلات تانية. هي للإرشاد بس ومش ضمان للجودة."] },
      { h: "التواصل", p: ["للأسئلة أو الشكاوى: استخدم الدعم في التطبيق."] },
    ],
  },
};
