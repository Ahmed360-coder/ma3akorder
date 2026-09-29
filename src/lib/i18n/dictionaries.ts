import { arApp, enApp, type AppStrings } from "./app-strings";

export const locales = ["en", "ar"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

const en = {
  brand: "M3akOrder",
  tagline: "Order from the shops near you, and always know if it's worth it.",
  heroNote: "Coming soon to your neighbourhood.",
  getStarted: "Get started",
  myAccount: "My account",
  switchLanguage: "العربية",
  features: {
    budget: { title: "Spending tracker", body: "Set a monthly budget and see where your money goes." },
    worth: { title: "Worth-it check", body: "Know if an item is good value before you buy it." },
    local: { title: "Fair to local shops", body: "Small businesses keep more of every order." },
  },
  login: {
    title: "Sign in or create an account",
    phoneTab: "Phone",
    emailTab: "Email",
    phoneLabel: "Mobile number",
    phonePlaceholder: "01xxxxxxxxx",
    sendCode: "Send code",
    codeLabel: "Code from SMS",
    verify: "Verify",
    codeSent: "We sent a code to",
    emailLabel: "Email",
    passwordLabel: "Password",
    signIn: "Sign in",
    signUp: "Create account",
    noAccount: "New here? Create an account",
    haveAccount: "Already have an account? Sign in",
    checkEmail: "Check your email to confirm your account, then sign in.",
    google: "Continue with Google",
    or: "or",
    working: "Please wait…",
  },
  onboarding: {
    title: "Welcome! How will you use M3akOrder?",
    nameLabel: "Your name",
    customer: { title: "I want to order", body: "Order food and essentials from nearby shops." },
    business_owner: { title: "I own a business", body: "Sell your menu or products. We review new stores first." },
    driver: { title: "I want to deliver", body: "Earn by delivering orders. We review new drivers first." },
    continue: "Continue",
  },
  account: {
    title: "My account",
    role: "Account type",
    status: "Status",
    signOut: "Sign out",
    roles: {
      customer: "Customer",
      business_owner: "Business owner",
      business_staff: "Business staff",
      driver: "Driver",
      admin: "Admin",
    },
    statuses: {
      pending: "Waiting for approval",
      approved: "Approved",
      rejected: "Not approved",
      suspended: "Suspended",
    },
    pendingNote: "We'll review your account soon. You'll be able to start once it's approved.",
    nextUp: "Your dashboard arrives in the next milestone.",
  },
};

type BaseDictionary = typeof en;

const ar: BaseDictionary = {
  brand: "معاك أوردر",
  tagline: "اطلب من المحلات اللي جنبك، واعرف دايمًا إذا كانت الحاجة تستاهل.",
  heroNote: "قريبًا في منطقتك.",
  getStarted: "ابدأ",
  myAccount: "حسابي",
  switchLanguage: "English",
  features: {
    budget: { title: "متابعة المصاريف", body: "حدد ميزانية شهرية واعرف فلوسك بتروح فين." },
    worth: { title: "تستاهل ولا لأ؟", body: "اعرف إذا كان المنتج سعره كويس قبل ما تشتري." },
    local: { title: "عادل مع المحلات", body: "المحلات الصغيرة بتكسب أكتر من كل طلب." },
  },
  login: {
    title: "سجّل الدخول أو اعمل حساب",
    phoneTab: "الموبايل",
    emailTab: "الإيميل",
    phoneLabel: "رقم الموبايل",
    phonePlaceholder: "01xxxxxxxxx",
    sendCode: "ابعت الكود",
    codeLabel: "الكود اللي وصلك في رسالة",
    verify: "تأكيد",
    codeSent: "بعتنا كود على",
    emailLabel: "الإيميل",
    passwordLabel: "كلمة السر",
    signIn: "دخول",
    signUp: "إنشاء حساب",
    noAccount: "جديد هنا؟ اعمل حساب",
    haveAccount: "عندك حساب؟ سجّل دخول",
    checkEmail: "افتح الإيميل وأكّد حسابك، وبعدين سجّل دخول.",
    google: "المتابعة بحساب جوجل",
    or: "أو",
    working: "لحظة…",
  },
  onboarding: {
    title: "أهلًا بيك! هتستخدم معاك أوردر إزاي؟",
    nameLabel: "اسمك",
    customer: { title: "عايز أطلب", body: "اطلب أكل وطلبات البيت من المحلات القريبة." },
    business_owner: { title: "عندي محل", body: "اعرض المنيو أو المنتجات. بنراجع المحلات الجديدة الأول." },
    driver: { title: "عايز أوصّل طلبات", body: "اكسب من توصيل الطلبات. بنراجع المندوبين الجداد الأول." },
    continue: "متابعة",
  },
  account: {
    title: "حسابي",
    role: "نوع الحساب",
    status: "الحالة",
    signOut: "تسجيل خروج",
    roles: {
      customer: "عميل",
      business_owner: "صاحب محل",
      business_staff: "موظف محل",
      driver: "مندوب توصيل",
      admin: "مدير",
    },
    statuses: {
      pending: "مستني الموافقة",
      approved: "متوافق عليه",
      rejected: "مرفوض",
      suspended: "موقوف",
    },
    pendingNote: "هنراجع حسابك قريب، وتقدر تبدأ أول ما يتوافق عليه.",
    nextUp: "لوحة التحكم الخاصة بيك جاية في المرحلة الجاية.",
  },
};

export type Dictionary = BaseDictionary & AppStrings;

export const dictionaries: Record<Locale, Dictionary> = {
  ar: { ...ar, ...arApp },
  en: { ...en, ...enApp },
};
