"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ChevronRight,
  Briefcase,
  Star,
  Compass,
  Map,
  BotMessageSquare,
  CheckCircle2,
  Cpu,
  Bot,
  Code,
  Gamepad,
  Stethoscope,
  Leaf,
  Sun,
  Mic,
  BookOpen,
  LineChart
} from "lucide-react";

// ==========================================
// MOCK CAREER DATABASE (Rich & Verbose)
// ==========================================
const careerDatabase: Record<string, any> = {
  // --- 1. Robotics Lab (ورشة الروبوتات) ---
  "robotics-engineer": {
    title: "مهندس ومطور روبوتات",
    icon: Bot,
    color: "from-blue-500 to-indigo-600",
    shadow: "shadow-blue-200",
    shortDesc: "العبقري الذي يعطي الحياة للآلات! يصمم ويبني روبوتات تساعد البشر في المصانع، المستشفيات، وحتى في الفضاء.",
    whatTheyDo: "مهندس الروبوتات يجمع بين الميكانيكا (الهيكل)، والإلكترونيات (الأعصاب)، والبرمجة (العقل). تخيل أنك تصمم ذراعاً آلية تجري عمليات جراحية دقيقة، أو مركبة (Rover) تستكشف سطح المريخ. عملك هو حل المشكلات المعقدة وجعل الآلات تفهم بيئتها وتتفاعل معها.",
    requirements: [
      "شغف بفك وتركيب الأشياء (مثل قطع الليجو أو الأجهزة القديمة).",
      "حب الرياضيات والفيزياء لفهم كيف تتحرك الأشياء وتتوازن.",
      "الصبر والخيال الواسع، لأن الروبوت قد يفشل 100 مرة قبل أن ينجح في المرة 101!"
    ],
    roadmap: [
      { stage: "المرحلة الإعدادية", text: "ركز في دروس الرياضيات والعلوم. جرب اللعب بأطقم (Lego Mindstorms) أو لوحات (Micro:bit) لتفهم كيف تتحرك المحركات بالأوامر." },
      { stage: "المرحلة الثانوية", text: "انضم لنادي الروبوتات في مدرستك. تعلم لغة برمجة مثل Python أو C++، وابدأ ببرمجة لوحات (Arduino) أو (Raspberry Pi)." },
      { stage: "الجامعة", text: "ادرس هندسة الميكاترونكس، أو علوم الحاسوب، أو الهندسة الكهربائية. ستتعلم تصميم الذكاء الاصطناعي والتحكم الآلي." },
      { stage: "الاحتراف", text: "انضم لشركات التكنولوجيا الكبرى أو وكالات الفضاء لتصميم الجيل القادم من الروبوتات!" }
    ],
    botPrompt: "مرحباً حلمان أفندي! أنا مهتم جداً بأن أصبح 'مهندس روبوتات'. هل يمكنك أن تشرح لي كيف أبدأ بتعلم برمجة الروبوتات وأنا في المدرسة؟ وما هي الأدوات البسيطة التي يمكنني شرائها للبدء؟"
  },
  "mechanical-engineer": {
    title: "مهندس ميكانيكي",
    icon: Cpu,
    color: "from-emerald-400 to-emerald-600",
    shadow: "shadow-emerald-200",
    shortDesc: "صانع الحركة! من محركات السيارات الرياضية إلى توربينات الطائرات العملاقة.",
    whatTheyDo: "المهندس الميكانيكي يستخدم قوانين الفيزياء لتصميم أي شيء يتحرك. سواء كان ذلك قطاراً مغناطيسياً فائق السرعة، أو نظام تبريد لجهاز كمبيوتر، أو حتى المفاصل الصناعية للإنسان. أنت من يجعل العالم يدور!",
    requirements: [
      "فضول شديد لمعرفة 'كيف تعمل الأشياء من الداخل'.",
      "قوة في التفكير المنطقي والقدرة على تخيل الأشكال ثلاثية الأبعاد (3D) في عقلك.",
      "مهارة في حل الألغاز المعقدة."
    ],
    roadmap: [
      { stage: "المرحلة الإعدادية", text: "العب بألعاب البناء والمجسمات. حاول إصلاح ألعابك المكسورة بدلاً من رميها لتفهم التروس والزنبركات." },
      { stage: "المرحلة الثانوية", text: "تعلم استخدام برامج الرسم الهندسي المجانية مثل (Tinkercad) أو (Fusion 360) لتصميم قطع يمكنك طباعتها بطابعة 3D." },
      { stage: "الجامعة", text: "ادرس الهندسة الميكانيكية. ستغوص في علوم الديناميكا الحرارية، وعلم المواد، وميكانيكا الموائع." },
      { stage: "الاحتراف", text: "صمم آلات تخدم البشرية، سواء في مصانع السيارات، أو الطيران، أو الطاقة المتجددة." }
    ],
    botPrompt: "أهلاً حلمان! أريد أن أصبح مهندساً ميكانيكياً وأصمم محركات سريعة. ما هي أهم دروس الفيزياء التي يجب أن أركز عليها الآن؟ وهل يمكنك إعطائي تجربة بسيطة أعملها في المنزل لفهم التروس؟"
  },

  // --- 2. CS Lab (مختبر الحاسوب) ---
  "software-engineer": {
    title: "مهندس برمجيات",
    icon: Code,
    color: "from-indigo-500 to-purple-600",
    shadow: "shadow-indigo-200",
    shortDesc: "الساحر الرقمي! يكتب السطور البرمجية التي تشغل التطبيقات، المواقع، والبرامج التي نستخدمها يومياً.",
    whatTheyDo: "مهندس البرمجيات هو البناء في العالم الرقمي. بدلاً من الطوب والإسمنت، يستخدم لغات البرمجة لبناء تطبيقات مثل يوتيوب، أو أنظمة تشغيل الهواتف. عملك هو تحويل الأفكار إلى برامج تعمل بسلاسة وبدون أخطاء (Bugs).",
    requirements: [
      "قدرة عالية على حل المشكلات وتقسيم المهام الكبيرة إلى خطوات صغيرة منطقية.",
      "الاهتمام بالتفاصيل (فاصلة منقوطة مفقودة قد توقف البرنامج بالكامل!).",
      "حب التعلم المستمر، لأن التكنولوجيا تتغير كل يوم."
    ],
    roadmap: [
      { stage: "المرحلة الإعدادية", text: "ابدأ بتعلم البرمجة المرئية عبر (Scratch)، ثم انتقل لتعلم لغة (Python) لأنها سهلة وقوية وممتعة." },
      { stage: "المرحلة الثانوية", text: "شارك في مسابقات البرمجة (Hackathons) وتحديات (LeetCode). حاول بناء موقعك الإلكتروني الأول باستخدام HTML و CSS." },
      { stage: "الجامعة", text: "تخصص في هندسة البرمجيات أو علوم الحاسوب. ستتعلم الخوارزميات المعقدة، وهياكل البيانات، وكيفية بناء أنظمة ضخمة." },
      { stage: "الاحتراف", text: "العمل كـ (Full-Stack Developer) في شركة تقنية كبرى، أو حتى تأسيس تطبيقك الخاص الذي يغير العالم!" }
    ],
    botPrompt: "حلمان أفندي، أحلم بأن أكون مهندس برمجيات وأصنع تطبيقات مفيدة. هل تنصحني بالبدء بلغة Python أم JavaScript؟ وكيف أكتب أول كود لي اليوم؟"
  },
  "game-developer": {
    title: "مطور ألعاب فيديو",
    icon: Gamepad,
    color: "from-rose-500 to-orange-500",
    shadow: "shadow-rose-200",
    shortDesc: "صانع العوالم الافتراضية! يدمج بين الفن، القصة، والبرمجة ليخلق ألعاباً نعيش بداخلها.",
    whatTheyDo: "مطور الألعاب هو الشخص الذي يكتب الكود الذي يحدد كيف تتحرك الشخصية، وماذا يحدث عندما تضغط على الزر، وكيف تتفاعل الوحوش بذكاء. أنت تجمع بين الرياضيات (لحساب مسار رصاصة أو قفزة) والخيال الواسع لصنع تجربة لا تُنسى.",
    requirements: [
      "خيال إبداعي وقدرة على سرد القصص الممتعة.",
      "فهم جيد للرياضيات والفيزياء (لحركة الشخصيات والجاذبية داخل اللعبة).",
      "الصبر على تجربة اللعبة (Playtesting) مئات المرات لاكتشاف الأخطاء."
    ],
    roadmap: [
      { stage: "المرحلة الإعدادية", text: "استخدم منصة (Roblox) أو (Scratch) لصنع ألعاب بسيطة. ركز على فهم مفهوم الشروط (If-Then) والمتغيرات (Variables)." },
      { stage: "المرحلة الثانوية", text: "حمل محرك ألعاب حقيقي مثل (Unity) أو (Godot). تعلم أساسيات لغة C# واصنع لعبتك ثنائية الأبعاد (2D) الأولى." },
      { stage: "الجامعة", text: "ادرس علوم الحاسوب مع التركيز على رسوميات الحاسوب (Computer Graphics) والذكاء الاصطناعي." },
      { stage: "الاحتراف", text: "العمل في استوديو تطوير ألعاب (AAA) أو أن تصبح مطوراً مستقلاً (Indie Developer) تنشر ألعابك بنفسك." }
    ],
    botPrompt: "أهلاً حلمان! أريد أن أصبح مطور ألعاب فيديو. ما هو محرك الألعاب (Game Engine) المناسب لعمري لأبدأ به؟ وهل يمكنك إعطائي فكرة لعبة بسيطة أبرمجها كبداية؟"
  },

  // --- 3. Chem-Bio Lab (مختبر الكيمياء والأحياء) ---
  "medical-doctor": {
    title: "طبيب بشري",
    icon: Stethoscope,
    color: "from-sky-400 to-blue-500",
    shadow: "shadow-sky-200",
    shortDesc: "المنقذ والمداوي! يستخدم العلم لفهم جسم الإنسان وعلاج الأمراض لتخفيف ألم الآخرين.",
    whatTheyDo: "الطبيب هو محقق علمي يبحث عن أسباب الأعراض التي يشعر بها المريض، ويستخدم معرفته العميقة بعلم الأحياء والأدوية ليصف العلاج المناسب أو يجري عملية جراحية تنقذ حياة إنسان.",
    requirements: [
      "التعاطف الكبير وحب مساعدة الآخرين وقت ضعفهم.",
      "ذاكرة قوية وقدرة على ربط المعلومات (الأعراض ببعضها لتشخيص المرض).",
      "القدرة على اتخاذ قرارات سريعة وصحيحة تحت الضغط."
    ],
    roadmap: [
      { stage: "المرحلة الإعدادية", text: "تفوق في مادة العلوم، وخاصة قسم الأحياء. اقرأ كتباً مبسطة عن كيف يعمل جسم الإنسان (القلب، الدماغ، الخلايا)." },
      { stage: "المرحلة الثانوية", text: "اختر المسار العلمي. تطوع في الهلال الأحمر أو المبادرات الصحية المدرسية لتتعلم الإسعافات الأولية وتختبر بيئة مساعدة الناس." },
      { stage: "الجامعة", text: "كلية الطب البشري! رحلة طويلة وممتعة ستتعلم فيها التشريح، وعلم الأمراض، وكيفية فحص المرضى." },
      { stage: "الاحتراف", text: "الاختصاص في مجال محدد (جراحة، أطفال، أعصاب) والبدء في إنقاذ الأرواح في المستشفيات." }
    ],
    botPrompt: "مرحباً حلمان! حلمي أن أصبح طبيباً في المستقبل. ما هي أهم عادات المذاكرة التي يجب أن أمتلكها لأنجح في دراسة الأحياء والعلوم؟"
  },

  // --- 4. Podcast Studio (استوديو البودكاست) ---
  "podcast-host": {
    title: "صانع بودكاست ومقدم برامج",
    icon: Mic,
    color: "from-pink-500 to-rose-500",
    shadow: "shadow-pink-200",
    shortDesc: "صوت المعرفة والقصص! ينقل الأفكار، يجري المقابلات، ويصنع محتوى مسموعاً يلهم الآلاف.",
    whatTheyDo: "مقدم البودكاست يقوم بالبحث عن مواضيع شيقة، يكتب النصوص (السكريبت)، ويحاور الضيوف بذكاء. هدفه هو إبقاء المستمع مندمجاً ومستمتعاً، سواء كان يتحدث عن التاريخ، التكنولوجيا، أو حتى قصص الرعب!",
    requirements: [
      "مهارة التحدث بوضوح وثقة، ونبرة صوت معبرة.",
      "فضول شديد ومهارة في طرح الأسئلة الصحيحة (المحاور الجيد مستمع جيد!).",
      "قدرة على الكتابة الإبداعية وترتيب الأفكار بسلاسة."
    ],
    roadmap: [
      { stage: "المرحلة الإعدادية", text: "اقرأ الكتب بصوت عالٍ لتتدرب على مخارج الحروف. ابدأ بتسجيل صوتك على هاتفك وأنت تلخص قصة قرأتها أو فيلم شاهدته." },
      { stage: "المرحلة الثانوية", text: "انضم للإذاعة المدرسية. ابدأ بودكاست حقيقي عبر تطبيقات مجانية مثل (Anchor) وانشره لأصدقائك عن موضوع تحبه بشغف." },
      { stage: "الجامعة", text: "دراسة الإعلام والصحافة، أو حتى أي تخصص تحبه وتريد التحدث عنه (تاريخ، اقتصاد). المهم هو الاستمرار في صنع المحتوى وتطوير مهارات الهندسة الصوتية." },
      { stage: "الاحتراف", text: "إدارة قناة بودكاست ناجحة تجذب الرعاة والمستمعين من جميع أنحاء العالم." }
    ],
    botPrompt: "مرحباً حلمان أفندي! أريد أن أبدأ البودكاست الخاص بي لكنني أشعر بالخجل من صوتي. كيف يمكنني تدريب صوتي لأصبح متحدثاً واثقاً؟"
  },

  // --- 5. Greenhouse (البيت الأخضر) ---
  "agricultural-engineer": {
    title: "مهندس زراعي حديث (AgriTech)",
    icon: Leaf,
    color: "from-emerald-500 to-green-600",
    shadow: "shadow-green-200",
    shortDesc: "حارس الأمن الغذائي! يستخدم التكنولوجيا والبيولوجيا لزراعة محاصيل أكثر وأفضل لإنقاذ الكوكب.",
    whatTheyDo: "الزراعة اليوم ليست مجرد فأس وتراب! المهندس الزراعي الحديث يستخدم الطائرات المسيرة (Drones) لفحص المحاصيل، ويصمم أنظمة (الزراعة المائية Hydroponics) لزراعة النباتات بدون تربة، ويطور أسمدة صديقة للبيئة لزيادة الإنتاج.",
    requirements: [
      "حب الطبيعة والاهتمام بالبيئة والنباتات.",
      "مهارة في حل المشكلات ومزج التكنولوجيا (الحساسات) مع الطبيعة.",
      "حب العمل الميداني والتجارب العلمية."
    ],
    roadmap: [
      { stage: "المرحلة الإعدادية", text: "ازرع نباتات في غرفتك (مثل النعناع أو الفاصولياء) وراقب تأثير الضوء والماء عليها. اصنع سمادك العضوي (الكومبوست) من بقايا الطعام." },
      { stage: "المرحلة الثانوية", text: "تعلم عن الزراعة المائية. حاول بناء نظام زراعة صغير في المنزل يعتمد على أنابيب المياه والمضخات الصغيرة بدلاً من التراب." },
      { stage: "الجامعة", text: "ادرس الهندسة الزراعية أو التقنيات الحيوية النباتية. ستدرس الجينات، التربة، والزراعة المستدامة." },
      { stage: "الاحتراف", text: "إدارة مزارع ذكية ضخمة أو تطوير نباتات تتحمل التغير المناخي وقادرة على إطعام الملايين." }
    ],
    botPrompt: "أهلاً حلمان! أنا مهتم جداً بإنقاذ الكوكب والزراعة الذكية. كيف يمكنني بناء نظام زراعة مائية (Hydroponics) بسيط جداً في غرفتي كتجربة؟"
  },

  // --- 6. Library (المكتبة الذكية) ---
  "financial-analyst": {
    title: "محلل مالي",
    icon: LineChart,
    color: "from-amber-400 to-orange-500",
    shadow: "shadow-amber-200",
    shortDesc: "عالم الأرقام والأعمال! يقرأ البيانات الاقتصادية كأنها قصة ليتخذ قرارات ذكية.",
    whatTheyDo: "المحلل المالي ينظر إلى أرباح الشركات، الأسواق، والأرقام، ويستطيع التنبؤ بالمستقبل الاقتصادي. هو من ينصح الشركات: 'استثمروا في هذا المشروع'، أو 'احذروا من تلك الخطوة'. يعتمدون بشكل كبير على برامج البيانات لتحويل الأرقام الجافة إلى خطط عمل.",
    requirements: [
      "مهارة استثنائية في الرياضيات والتعامل مع الأرقام بمتعة.",
      "تفكير نقدي قوي لاستنتاج المعاني المخفية خلف البيانات.",
      "تنظيم عالي والقدرة على التعامل مع برامج الجداول مثل (Excel)."
    ],
    roadmap: [
      { stage: "المرحلة الإعدادية", text: "تعلم كيف تدير مصروفك الشخصي. ابدأ بلعب ألعاب تعتمد على الاستراتيجية وإدارة الموارد والتجارة الافتراضية." },
      { stage: "المرحلة الثانوية", text: "تعلم برنامج (Excel) أو (Google Sheets) وصمم جدولاً لترتيب بياناتك أو ميزانية لرحلة مدرسية. اقرأ أساسيات الاقتصاد المبسطة." },
      { stage: "الجامعة", text: "ادرس المالية، المحاسبة، أو الاقتصاد. ستتعلم تحليل الأسواق، إدارة المخاطر، وقوانين التجارة العالمية." },
      { stage: "الاحتراف", text: "العمل في بنوك كبرى، أو شركات استثمارية، أو كمستشار مالي للشركات التكنولوجية الضخمة." }
    ],
    botPrompt: "مرحباً حلمان أفندي! الأرقام والمال والأعمال تثير اهتمامي. كيف يمكنني كطالب أن أتعلم إدارة الأموال والميزانية بطريقة ذكية من الآن؟"
  },
};

// ==========================================
// SMART GENERIC TEMPLATE
// ==========================================
// Handles ANY career ID gracefully by turning the ID into a formatted Arabic Title.
const genericCareerTemplate = (id: string) => {
  // Format the ID from "some-career-name" to "Some Career Name"
  const formattedName = id
    .split("-")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return {
    title: `مسار: ${formattedName}`,
    icon: Briefcase,
    color: "from-slate-600 to-slate-800",
    shadow: "shadow-slate-300",
    shortDesc: "مجال احترافي رائع يجمع بين الشغف، المهارة، وصناعة الأثر في المستقبل.",
    whatTheyDo: "في هذا المجال، يستخدم المحترفون مهاراتهم المتقدمة لحل المشكلات وابتكار طرق جديدة تسهل حياة الناس. إنهم يعملون ضمن فرق إبداعية لتحويل التحديات إلى فرص، ويعتمدون على التعلم المستمر للنجاح.",
    requirements: [
      "الرغبة المستمرة في التعلم واكتشاف كل ما هو جديد.",
      "القدرة على العمل ضمن فريق والتواصل بفعالية مع الآخرين.",
      "التفكير النقدي، الصبر، وعدم الاستسلام عند مواجهة العقبات."
    ],
    roadmap: [
      { stage: "المرحلة المدرسية (اليوم)", text: "اقرأ وابحث أكثر عن هذا المجال عبر الإنترنت. ابدأ بتطوير مهاراتك الأساسية كالتفكير المنطقي واللغة الإنجليزية." },
      { stage: "المرحلة الثانوية", text: "شارك في الأنشطة المدرسية والأندية التي تتعلق بهذا المسار. ابحث عن دورات تمهيدية مجانية على يوتيوب." },
      { stage: "المرحلة الجامعية", text: "اختر التخصص الجامعي الأقرب لهذا المسار وركز على التطبيق العملي وبناء مشاريع حقيقية (Portfolio)." },
      { stage: "بداية المسيرة", text: "ابحث عن فرص تدريب (Internships) للعمل مع المحترفين واكتساب خبرتك الحقيقية الأولى في السوق." }
    ],
    botPrompt: `مرحباً حلمان أفندي! أنا مهتم جداً بمسار (${formattedName}). هل يمكنك أن تشرح لي بالعربية وبشكل مبسط ماذا يفعلون بالضبط؟ وما هي أول خطوة يمكنني القيام بها اليوم كطالب مدرسة للبدء في هذا المجال؟`
  };
};

// ==========================================
// COMPONENT
// ==========================================
export default function CareerDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const careerId = params.id as string;
  
  const career = careerDatabase[careerId] || genericCareerTemplate(careerId);
  const Icon = career.icon;

  return (
    <div className="flex min-h-[100dvh] w-full flex-col bg-slate-50/30 pb-24" dir="rtl">
      
      {/* Navigation */}
      <div className="sticky top-0 z-20 flex items-center justify-between bg-slate-50/90 p-4 backdrop-blur-xl border-b border-slate-200/50">
        <button onClick={() => router.back()} className="rounded-full border border-slate-200 bg-white p-2 shadow-sm transition-all hover:bg-slate-100 active:scale-95">
          <ChevronRight className="h-6 w-6 text-slate-700" />
        </button>
        <div className="rounded-full border border-slate-200 bg-white px-5 py-1.5 text-sm font-black text-slate-700 shadow-sm">
          دليل المهنة
        </div>
        <div className="w-10" />
      </div>

      <div className="mx-auto w-full max-w-2xl space-y-5 px-4 md:px-6 mt-4">
        
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${career.color} p-6 text-white shadow-xl ${career.shadow} md:p-8`}
        >
          <div className="pointer-events-none absolute -bottom-6 -left-6 opacity-10">
            <Icon className="h-48 w-48" />
          </div>
          <div className="relative z-10">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/30 bg-white/20 shadow-inner backdrop-blur-md">
              <Icon className="h-7 w-7 text-white drop-shadow-md" />
            </div>
            <h1 className="mb-2 text-3xl font-black drop-shadow-md md:text-4xl">{career.title}</h1>
            <p className="text-sm font-medium leading-loose text-white/95 md:text-base">
              {career.shortDesc}
            </p>
          </div>
        </motion.div>

        {/* AI Chat Hook - Magic Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Link 
            href={`/assistant?prompt=${encodeURIComponent(career.botPrompt)}`}
            className="group flex items-center justify-between rounded-3xl border-2 border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 p-5 shadow-sm transition-all hover:scale-[1.02] hover:shadow-md active:scale-95"
          >
            <div className="pl-4">
              <h3 className="text-sm md:text-base font-black text-orange-800 flex items-center gap-2 mb-1.5">
                <BotMessageSquare className="w-5 h-5" /> اسأل حلمان عن هذا المجال!
              </h3>
              <p className="text-xs md:text-sm text-orange-700 font-bold leading-relaxed">
                اضغط هنا لبدء دردشة مع الذكاء الاصطناعي.. مجهزة لتعطيك خطة تناسبك أنت شخصياً!
              </p>
            </div>
            <div className="flex shrink-0 items-center justify-center h-12 w-12 bg-orange-500 text-white rounded-2xl shadow-md transition-transform group-hover:-translate-x-1">
              <ChevronRight className="w-6 h-6 rotate-180" />
            </div>
          </Link>
        </motion.div>

        {/* What They Do */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm"
        >
          <h2 className="mb-4 flex items-center gap-2 text-lg font-black text-slate-800">
            <Star className="h-5 w-5 text-sky-500" />
            ماذا يفعلون بالضبط؟
          </h2>
          <div className="rounded-2xl border border-sky-100 bg-sky-50/50 p-4">
            <p className="text-sm font-medium leading-loose text-slate-700">
              {career.whatTheyDo}
            </p>
          </div>
        </motion.div>

        {/* Requirements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm"
        >
          <h2 className="mb-5 flex items-center gap-2 text-lg font-black text-slate-800">
            <Compass className="h-5 w-5 text-emerald-500" />
            كيف تعرف أن هذا المجال يناسبك؟
          </h2>
          <ul className="space-y-4">
            {career.requirements.map((req: string, idx: number) => (
              <li key={idx} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <span className="text-sm font-bold text-slate-600 leading-relaxed">{req}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Roadmap */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm mb-8"
        >
          <h2 className="mb-6 flex items-center gap-2 text-lg font-black text-slate-800">
            <Map className="h-5 w-5 text-purple-500" />
            خريطة الطريق للوصول للهدف
          </h2>
          
          <div className="relative border-r-2 border-slate-100 pr-6 ml-2 space-y-8 pb-2">
            {career.roadmap.map((step: any, idx: number) => (
              <div key={idx} className="relative">
                {/* Timeline Dot */}
                <div className="absolute -right-[33px] top-1 h-4 w-4 rounded-full border-4 border-white bg-purple-500 shadow-sm" />
                
                <h3 className="text-sm font-black text-purple-700 mb-1.5 bg-purple-50 inline-block px-2 py-0.5 rounded-md border border-purple-100">
                  {step.stage}
                </h3>
                <p className="text-sm text-slate-600 font-bold leading-loose">{step.text}</p>
              </div>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  );
}