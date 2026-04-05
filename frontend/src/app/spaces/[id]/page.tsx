"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import type { ComponentType } from "react";
import {
  ChevronRight,
  ChevronDown,
  Wrench,
  Laptop,
  FlaskConical,
  Mic2,
  Leaf,
  Library,
  ArrowLeft,
  Lightbulb,
  GraduationCap,
  Target,
  Info
} from "lucide-react";

// ==========================================
// EXPANDED TYPES
// ==========================================
interface DIYProject {
  title: string;
  background: string;
  achievement: string;
  steps: string[];
}

interface CareerRole {
  id: string;
  title: string;
}

interface CareerCategory {
  field: string;
  roles: CareerRole[];
}

interface SpaceInfo {
  id: string;
  name: string;
  icon: ComponentType<{ className?: string }>;
  color: string;
  shadow: string;
  description: string;
  careerCategories: CareerCategory[];
  projects: DIYProject[];
}

// ==========================================
// THE FULL MOCK DATABASE (All 6 Spaces)
// ==========================================
const spaceData: Record<string, SpaceInfo> = {
  // 1. Robotics Lab
  "robotics": {
    id: "robotics",
    name: "ورشة الروبوتات",
    icon: Wrench,
    color: "from-blue-500 to-blue-700",
    shadow: "shadow-blue-200",
    description: "عالم التروس والمحركات! هنا ندمج بين الكهرباء والبرمجة لنصنع آلات ذكية تتحرك وتنفذ الأوامر.",
    careerCategories: [
      {
        field: "هندسة الروبوتات والآلات",
        roles: [
          { id: "robotics-engineer", title: "مهندس ومطور روبوتات" },
          { id: "mechatronics-engineer", title: "مهندس ميكاترونكس" },
          { id: "mechanical-engineer", title: "مهندس ميكانيكي" }
        ]
      },
      {
        field: "الإلكترونيات والدوائر الذكية",
        roles: [
          { id: "electronics-engineer", title: "مهندس إلكترونيات" },
          { id: "embedded-systems-engineer", title: "مهندس أنظمة مدمجة" }
        ]
      },
      {
        field: "التصنيع والطباعة ثلاثية الأبعاد",
        roles: [
          { id: "3d-printing-specialist", title: "خبير طباعة 3D" },
          { id: "industrial-designer", title: "مصمم منتجات صناعية" }
        ]
      },
      {
        field: "الطيران والفضاء",
        roles: [
          { id: "aerospace-engineer", title: "مهندس طيران وفضاء" },
          { id: "drone-pilot", title: "مُشغل ومبرمج طائرات مسيرة (Drones)" }
        ]
      },
      {
        field: "الذكاء الاصطناعي الحركي",
        roles: [
          { id: "computer-vision-engineer", title: "مهندس رؤية حاسوبية للروبوتات" },
          { id: "automation-expert", title: "خبير أتمتة وتحكم" }
        ]
      }
    ],
    projects: [
      {
        title: "الفرشاة الآلية المجنونة (BrushBot)",
        background: "يعمل هذا الروبوت البسيط عن طريق الاهتزاز. المحرك الصغير غير المتزن يولد اهتزازات سريعة تنتقل إلى شعيرات الفرشاة، مما يجعلها تنزلق وتتحرك على الأسطح الناعمة.",
        achievement: "ستفهم كيف تصنع دائرة كهربائية بسيطة (بطارية + محرك)، وكيف تحول الاهتزاز إلى حركة فعلية.",
        steps: [
          "أحضر رأس فرشاة أسنان قديمة (اقطع المقبض)، ومحرك اهتزاز صغير (من هاتف قديم أو لعبة)، وبطارية صغيرة 3 فولت (Coin cell).",
          "استخدم شريطاً لاصقاً مزدوجاً (Double-sided tape) لتثبيت المحرك والبطارية على ظهر فرشاة الأسنان.",
          "قم بتوصيل سلك واحد من المحرك بأسفل البطارية، وثبته باللاصق.",
          "عندما تلامس السلك الثاني بأعلى البطارية، ستبدأ الدائرة بالعمل وسيهتز المحرك.",
          "ضع الفرشاة الآلية على طاولة ملساء وشاهدها ترقص وتنظف السطح في نفس الوقت!"
        ]
      },
      {
        title: "ذراع هيدروليكية من الكرتون",
        background: "الأنظمة الهيدروليكية تستخدم السوائل (مثل الماء أو الزيت) لنقل القوة عبر الأنابيب. السوائل لا تنضغط بسهولة، لذا عند دفع الماء من جهة، يجب أن يتحرك من الجهة الأخرى.",
        achievement: "بناء نموذج يحاكي ذراع الحفارات الكبيرة، وفهم مبدأ ضغط السوائل لنقل القوة الحركية.",
        steps: [
          "قص قطعاً من الكرتون المقوى لتشكيل ذراع من 3 وصلات.",
          "اربط الوصلات ببعضها باستخدام دبابيس ورق قابلة للطي أو أعواد خشبية لتكوين مفاصل مرنة.",
          "أحضر حقنتين بلاستيكيتين نظيفتين (بدون إبر)، وصل بينهما بأنبوب بلاستيكي شفاف (أنبوب حوض أسماك).",
          "املأ النظام بالماء لتفريغ الهواء، ثم ثبت إحدى الحقنتين على مفصل الذراع الكرتونية.",
          "عندما تدفع مكبس الحقنة الأولى (التي بيدك)، سيندفع الماء ويحرك الحقنة الثانية، مما يجعل الذراع ترتفع أو تنخفض بقوة مذهلة!"
        ]
      }
    ]
  },

  // 2. Computer Science Lab
  "cs-lab": {
    id: "cs-lab",
    name: "مختبر الحاسوب",
    icon: Laptop,
    color: "from-indigo-500 to-indigo-700",
    shadow: "shadow-indigo-200",
    description: "لغة العصر! هنا نتعلم كيف نتحدث مع الحواسيب لنصنع الألعاب، المواقع، ونحل المشكلات المعقدة بخوارزميات ذكية.",
    careerCategories: [
      {
        field: "تطوير البرمجيات والألعاب",
        roles: [
          { id: "software-engineer", title: "مهندس برمجيات" },
          { id: "game-developer", title: "مطور ألعاب فيديو" },
          { id: "mobile-app-developer", title: "مبرمج تطبيقات هواتف" }
        ]
      },
      {
        field: "الذكاء الاصطناعي والبيانات",
        roles: [
          { id: "ai-engineer", title: "مهندس ذكاء اصطناعي" },
          { id: "data-scientist", title: "عالم بيانات" }
        ]
      },
      {
        field: "أمن المعلومات",
        roles: [
          { id: "cybersecurity-analyst", title: "محلل أمن سيبراني" },
          { id: "ethical-hacker", title: "مخترق أخلاقي (Ethical Hacker)" }
        ]
      },
      {
        field: "تصميم واجهات المستخدم",
        roles: [
          { id: "ux-ui-designer", title: "مصمم واجهات وتجربة المستخدم (UI/UX)" },
          { id: "frontend-developer", title: "مطور واجهات مواقع (Front-end)" }
        ]
      },
      {
        field: "إدارة الأنظمة والشبكات",
        roles: [
          { id: "network-engineer", title: "مهندس شبكات" },
          { id: "cloud-architect", title: "خبير حوسبة سحابية (Cloud)" }
        ]
      }
    ],
    projects: [
      {
        title: "برمجة أول لعبة لك (صائد التفاح)",
        background: "البرمجة هي إعطاء الحاسوب تعليمات خطوة بخطوة. لغة Scratch هي لغة مرئية تستخدم المكعبات (Blocks) بدلاً من كتابة الكلمات المعقدة، وهي مثالية لتعلم المنطق.",
        achievement: "تطوير لعبة كاملة يمكنك مشاركتها مع أصدقائك، وفهم مفاهيم برمجية مثل المتغيرات (Variables) والحلقات التكرارية (Loops).",
        steps: [
          "افتح موقع Scratch (scratch.mit.edu) وأنشئ مشروعاً جديداً.",
          "احذف القط الافتراضي، وأضف شخصية (سلة) وشخصية أخرى (تفاحة) من مكتبة الكائنات.",
          "برمج السلة لتتحرك يميناً ويساراً باستخدام مفاتيح الأسهم (اليمين واليسار) في لوحة المفاتيح.",
          "برمج التفاحة لتسقط من الأعلى إلى الأسفل باستمرار باستخدام حلقة تكرارية (Forever loop).",
          "أضف شرطاً (If Statement): إذا لامست التفاحة السلة، أضف نقطة إلى متغير النتيجة (Score) وأعد التفاحة للأعلى مجدداً!"
        ]
      },
      {
        title: "صنع تطبيق جوال بدون كود",
        background: "تطبيقات الهواتف ليست سحراً! يمكن بناء واجهاتها وبرمجتها باستخدام أدوات السحب والإفلات مثل Thunkable، والتي تترجم أفكارك إلى تطبيق حقيقي.",
        achievement: "بناء تطبيق لآلة حاسبة بسيطة أو مترجم نصوص يعمل على هاتفك مباشرة.",
        steps: [
          "اذهب إلى موقع Thunkable وافتح حساباً مجانياً.",
          "ابدأ مشروعاً جديداً واسحب مكونين إلى الشاشة: (مربع إدخال نص - Text Input) و(زر - Button) و(ملصق - Label) لإظهار النتيجة.",
          "انتقل إلى شاشة الـ (Blocks) المسؤولة عن الأوامر.",
          "ابحث عن أداة الترجمة (Translator Component) واسحبها للمشروع.",
          "أعطِ أمراً: عندما يتم الضغط على الزر، خذ النص من المربع، ترجمه إلى اللغة الإنجليزية، واعرضه في الملصق. ثم حمل التطبيق على هاتفك وجربه!"
        ]
      }
    ]
  },

  // 3. Chemistry and Biology Lab
  "chem-bio": {
    id: "chem-bio",
    name: "مختبر الكيمياء والأحياء",
    icon: FlaskConical,
    color: "from-purple-500 to-purple-700",
    shadow: "shadow-purple-200",
    description: "مكان استكشاف أسرار الحياة والمادة! هنا ننظر عبر المجهر ونجري تفاعلات آمنة لنفهم كيف يعمل جسمنا والعالم من حولنا.",
    careerCategories: [
      {
        field: "الطب والرعاية الصحية",
        roles: [
          { id: "medical-doctor", title: "طبيب بشري" },
          { id: "pharmacist", title: "صيدلاني" },
          { id: "biomedical-engineer", title: "مهندس أجهزة طبية" }
        ]
      },
      {
        field: "الأبحاث البيولوجية والجينية",
        roles: [
          { id: "biologist", title: "عالم أحياء" },
          { id: "geneticist", title: "عالم وراثة وجينات" }
        ]
      },
      {
        field: "الكيمياء والمواد",
        roles: [
          { id: "chemist", title: "عالم كيمياء" },
          { id: "chemical-engineer", title: "مهندس كيميائي" }
        ]
      },
      {
        field: "الأدلة الجنائية والعلوم الجنائية",
        roles: [
          { id: "forensic-scientist", title: "خبير أدلة جنائية (Forensics)" },
          { id: "toxicologist", title: "عالم سموم" }
        ]
      },
      {
        field: "علوم الغذاء والتغذية",
        roles: [
          { id: "food-scientist", title: "عالم تكنولوجيا الأغذية" },
          { id: "nutritionist", title: "أخصائي تغذية علاجية" }
        ]
      }
    ],
    projects: [
      {
        title: "استخراج الحمض النووي (DNA) من الفراولة",
        background: "كل كائن حي يحتوي على DNA وهو يشبه كتاب التعليمات لبناء الجسم. الخلايا محاطة بغشاء دهني، والصابون يساعد في تكسير هذا الغشاء لإخراج الـ DNA.",
        achievement: "رؤية الحمض النووي (DNA) بالعين المجردة، وفهم كيف يدرس العلماء الجينات.",
        steps: [
          "ضع حبة فراولة في كيس بلاستيكي قابل للإغلاق واهرسها جيداً بأصابعك لتكسير الخلايا.",
          "في كوب، اخلط ملعقتين من الماء، قطرة من صابون غسيل الأطباق السائل، ورشة ملح. (هذا هو سائل الاستخراج).",
          "أضف سائل الاستخراج إلى كيس الفراولة المهروسة واخلط بلطف دون صنع رغوة كثيرة.",
          "قم بتصفية الخليط عبر مصفاة أو ورق ترشيح القهوة للحصول على سائل أحمر صافٍ في كوب شفاف.",
          "ببطء شديد، اسكب القليل من الكحول الطبي البارد (من الفريزر) على جدار الكوب. ستلاحظ ظهور خيوط بيضاء رفيعة تطفو بين السائل والكحول.. هذا هو الـ DNA!"
        ]
      },
      {
        title: "صناعة بلاستيك حيوي من الحليب",
        background: "الحليب يحتوي على بروتين يسمى (الكازين). عند إضافة حمض (مثل الخل) إلى الحليب الساخن، تتغير تركيبة البروتين ويتجمع مشكلاً مادة صلبة تشبه البلاستيك.",
        achievement: "صنع مادة جديدة كلياً من مواد منزلية، وفهم كيف تحدث التفاعلات الكيميائية وتغير خواص المواد.",
        steps: [
          "سخن كوباً من الحليب في الميكروويف أو على الموقد حتى يصبح دافئاً (ليس مغلياً).",
          "أضف 4 ملاعق كبيرة من الخل الأبيض إلى الحليب الدافئ وابدأ بالتحريك المستمر.",
          "ستلاحظ فوراً انفصال الحليب وتكون كتل بيضاء صلبة (تسمى الخثارة).",
          "قم بتصفية الخليط باستخدام مصفاة واغسل الكتل الناتجة بالماء البارد.",
          "اعصر الكتل جيداً باستخدام مناديل ورقية لتجفيفها، ثم شكلها بيدك كالعجين لتصنع ميدالية أو شكلاً صغيراً، واتركها لتجف لمدة يومين لتصبح صلبة كالبلاستيك!"
        ]
      }
    ]
  },

  // 4. Podcast Studio
  "podcast": {
    id: "podcast",
    name: "استوديو البودكاست",
    icon: Mic2,
    color: "from-pink-500 to-pink-700",
    shadow: "shadow-pink-200",
    description: "منبر الأصوات والأفكار! مساحة الإبداع الصوتي والإعلامي حيث نتعلم كيف نحكي القصص، نحاور الآخرين، ونصنع محتوى مسموعاً ومؤثراً.",
    careerCategories: [
      {
        field: "الإعلام والتقديم",
        roles: [
          { id: "broadcaster", title: "مذيع ومقدم برامج" },
          { id: "podcast-host", title: "صانع بودكاست (Podcaster)" },
          { id: "journalist", title: "صحفي استقصائي" }
        ]
      },
      {
        field: "الهندسة الصوتية والإنتاج",
        roles: [
          { id: "audio-engineer", title: "مهندس صوت" },
          { id: "producer", title: "منتج إعلامي" }
        ]
      },
      {
        field: "كتابة السيناريو والقصص",
        roles: [
          { id: "script-writer", title: "كاتب سيناريو وحوار" },
          { id: "copywriter", title: "كاتب محتوى إبداعي" }
        ]
      },
      {
        field: "التسويق والإخراج الفني",
        roles: [
          { id: "digital-marketer", title: "مسوق رقمي" },
          { id: "art-director", title: "مخرج فني" }
        ]
      },
      {
        field: "التعليق الصوتي والتمثيل",
        roles: [
          { id: "voice-actor", title: "معلق صوتي (Voice Over)" },
          { id: "actor", title: "ممثل ومؤدي أدوار" }
        ]
      }
    ],
    projects: [
      {
        title: "تسجيل أول حلقة بودكاست قصيرة",
        background: "البودكاست الناجح يحتاج إلى تخطيط مسبق، وهيكل واضح (مقدمة، صلب الموضوع، خاتمة)، وصوت نقي خالي من التشويش.",
        achievement: "إتقان مهارات التحدث بوضوح، وتعلم استخدام البرامج الأساسية لتسجيل وتحرير الصوت.",
        steps: [
          "اختر موضوعاً تحبه (مثلاً: لماذا الفضاء مذهل؟ أو مراجعة للكتاب الذي تقرأه حالياً).",
          "اكتب نصاً (سكربت) صغيراً يتضمن ترحيباً بالمستمعين، 3 نقاط رئيسية تريد التحدث عنها، وتوديعاً في النهاية.",
          "اذهب إلى مكان هادئ في المنزل (الخزائن المليئة بالملابس تمتص صدى الصوت بشكل ممتاز!).",
          "استخدم تطبيق تسجيل الصوت في هاتفك، أو حمّل برنامج Audacity المجاني على الحاسوب لتسجيل صوتك وأنت تقرأ النص بحماس.",
          "استمع للتسجيل، احذف الأخطاء إذا لزم الأمر، ثم أسمع حلقتك الأولى لعائلتك وأصدقائك!"
        ]
      },
      {
        title: "صنع عوازل صوتية منزلية (Acoustic Panels)",
        background: "الصوت ينتقل عبر موجات تصطدم بالجدران الصلبة وترتد مسببة (الصدى). الأسطح الإسفنجية المتعرجة تكسر هذه الموجات وتمتصها لتعطي صوتاً دافئاً واحترافياً.",
        achievement: "تطبيق مبادئ فيزياء الصوت عملياً لتحسين جودة التسجيل في غرفتك.",
        steps: [
          "اجمع 4 إلى 6 كراتين بيض فارغة (فهي تمتلك شكلاً متعرجاً مثالياً لكسر موجات الصوت).",
          "قم برش الكراتين بالطلاء (اختياري) لجعل شكلها جميلاً ومناسباً لغرفتك.",
          "أحضر لوحاً من الكرتون المسطح أو الفلين، وألصق عليه كراتين البيض بجوار بعضها البعض باستخدام الغراء الساخن.",
          "ضع هذه الألواح خلف الميكروفون الذي تسجل به، أو على الجدار المواجه لك أثناء التحدث.",
          "سجّل صوتك قبل وبعد وضع العوازل، ولاحظ الفرق الكبير في اختفاء الصدى وجودة التسجيل المذهلة!"
        ]
      }
    ]
  },

  // 5. Greenhouse
  "greenhouse": {
    id: "greenhouse",
    name: "البيت الأخضر",
    icon: Leaf,
    color: "from-emerald-400 to-emerald-600",
    shadow: "shadow-emerald-200",
    description: "قلب الطبيعة النابض! نتعلم هنا كيف نزرع الغذاء، ونحافظ على البيئة، وندرس كيف تنمو النباتات باستخدام التكنولوجيا.",
    careerCategories: [
      {
        field: "الزراعة والبيئة",
        roles: [
          { id: "agricultural-engineer", title: "مهندس زراعي" },
          { id: "environmentalist", title: "عالم بيئة" },
          { id: "botanist", title: "عالم نباتات" }
        ]
      },
      {
        field: "الاستدامة والطاقة المتجددة",
        roles: [
          { id: "sustainability-specialist", title: "أخصائي استدامة بيئية" },
          { id: "renewable-energy-engineer", title: "مهندس طاقة شمسية ومتجددة" }
        ]
      },
      {
        field: "التكنولوجيا الزراعية الحيوية",
        roles: [
          { id: "agritech-specialist", title: "متخصص تكنولوجيا زراعية (AgriTech)" },
          { id: "hydroponics-expert", title: "خبير زراعة مائية (Hydroponics)" }
        ]
      },
      {
        field: "التخطيط الحضري وتنسيق الحدائق",
        roles: [
          { id: "landscape-architect", title: "مصمم ومندنس حدائق" },
          { id: "urban-planner", title: "مخطط مدن مستدامة" }
        ]
      },
      {
        field: "الطب البيطري والحيواني",
        roles: [
          { id: "veterinarian", title: "طبيب بيطري" },
          { id: "wildlife-biologist", title: "عالم حياة برية" }
        ]
      }
    ],
    projects: [
      {
        title: "نظام الري الذاتي من زجاجة",
        background: "النباتات تحتاج إلى رطوبة مستمرة. خاصية (الخاصية الشعرية) تسمح للماء بالتسلق عكس الجاذبية عبر الخيوط القطنية للوصول إلى جذور النبات ببطء.",
        achievement: "بناء نظام زراعي مستدام يحافظ على نبتتك حية حتى لو نسيت سقيها لأيام.",
        steps: [
          "أحضر زجاجة بلاستيكية فارغة واقطعها من المنتصف بحيث تحصل على جزأين: قمع علوي، وكوب سفلي.",
          "اصنع ثقباً صغيراً في غطاء الزجاجة ومرر من خلاله خيطاً قطنياً سميكاً (مثل رباط حذاء طويل).",
          "أغلق الزجاجة بالغطاء، ثم اقلب الجزء العلوي (القمع) وضعه داخل الجزء السفلي (الكوب). يجب أن يتدلى الخيط للأسفل.",
          "ضع بعض التربة والبذور (أو نبتة صغيرة) في الجزء العلوي، وتأكد أن الخيط مدفون داخل التربة.",
          "املأ الجزء السفلي بالماء. سيسحب الخيط الماء ببطء لترطيب التربة حسب حاجة النبتة دون إغراقها!"
        ]
      },
      {
        title: "مصنع السماد العضوي المصغر (الكومبوست)",
        background: "الطبيعة لا ترمي النفايات! البكتيريا والكائنات الدقيقة تقوم بتفكيك بقايا الطعام وتحويلها إلى سماد غني بالعناصر الغذائية (سماد عضوي) يقوي النباتات.",
        achievement: "المساهمة في تقليل النفايات المنزلية، وإنتاج غذاء طبيعي رائع لنباتاتك.",
        steps: [
          "أحضر وعاءً بلاستيكياً كبيراً (مثل علبة زبادي فارغة كبيرة) واصنع ثقوباً صغيرة في قاعه وأطرافه للتهوية.",
          "ضع طبقة من أوراق الشجر الجافة أو قطع الكرتون الممزق في القاع (مواد كربونية بنية).",
          "أضف طبقة من بقايا الخضروات وقشور الفواكه وتفل القهوة (مواد نيتروجينية خضراء). *تجنب اللحوم والزيوت*.",
          "غطِّ الطبقة الخضراء بالقليل من تراب الحديقة العادي لإدخال بكتيريا التحلل السليمة.",
          "رش القليل من الماء لترطيب المكونات (كالإسفنجة المعصورة)، وضع الغطاء. قلب الخليط كل بضعة أيام لتوفير الأكسجين، وبعد عدة أسابيع سيتحول إلى تربة سوداء غنية ومفيدة!"
        ]
      }
    ]
  },

  // 6. Library
  "library": {
    id: "library",
    name: "المكتبة الذكية",
    icon: Library,
    color: "from-amber-500 to-amber-700",
    shadow: "shadow-amber-200",
    description: "بوابة العقول والمستقبل! هنا نجمع المعلومات، ننظم البيانات، ونتعلم كيف نكتب وندير الأنظمة بكفاءة عالية.",
    careerCategories: [
      {
        field: "التحليل والإدارة المالية",
        roles: [
          { id: "financial-analyst", title: "محلل مالي" },
          { id: "accountant", title: "محاسب ومراجع" },
          { id: "project-manager", title: "مدير مشاريع" }
        ]
      },
      {
        field: "البحث العلمي والتأليف",
        roles: [
          { id: "researcher", title: "باحث علمي وأكاديمي" },
          { id: "author", title: "مؤلف وكاتب مطبوعات" }
        ]
      },
      {
        field: "إدارة البيانات والأنظمة",
        roles: [
          { id: "database-administrator", title: "مدير قواعد بيانات (DBA)" },
          { id: "archivist", title: "أمين مكتبة رقمية وأرشيف" }
        ]
      },
      {
        field: "الترجمة واللغويات",
        roles: [
          { id: "translator", title: "مترجم محترف" },
          { id: "computational-linguist", title: "خبير لغويات حاسوبية" }
        ]
      },
      {
        field: "القانون والاستشارات",
        roles: [
          { id: "lawyer", title: "محامي أو مستشار قانوني" },
          { id: "consultant", title: "مستشار أعمال" }
        ]
      }
    ],
    projects: [
      {
        title: "برمجة نظام لإدارة كتبك",
        background: "البيانات غير المنظمة لا فائدة منها. قواعد البيانات (Databases) تساعدنا في تخزين المعلومات، ترتيبها، والبحث فيها بسرعة هائلة.",
        achievement: "تعلم أساسيات ترتيب البيانات وبناء نظام رقمي بسيط يسهل حياتك.",
        steps: [
          "افتح برنامج جداول البيانات مثل (Excel) أو (Google Sheets).",
          "في الصف الأول (العناوين)، اكتب: اسم الكتاب، اسم الكاتب، التصنيف (خيال، علوم، تاريخ)، وحالة القراءة (منتهي، أقرأه الآن).",
          "اجمع 5 أو 10 من كتبك المفضلة وأدخل بياناتها في الجدول.",
          "استخدم خاصية (الفرز والفلترة - Sort & Filter) لتجربة ترتيب الكتب أبجدياً، أو إظهار الكتب العلمية فقط.",
          "تهانينا! لقد قمت للتو ببناء أول قاعدة بيانات مبسطة خاصة بك كالمحترفين."
        ]
      },
      {
        title: "صناعة كتاب صغير (Zine) من ورقة واحدة",
        background: "النشر والتأليف يبدأ بفكرة بسيطة يتم ترتيبها على الورق. الـ Zines هي كتيبات صغيرة صنعها الهواة للتعبير عن أفكارهم ونشرها بسهولة.",
        achievement: "تحويل فكرة سريعة إلى منتج ملموس قابل للقراءة والمشاركة، وتطوير مهارة التلخيص.",
        steps: [
          "أحضر ورقة A4 بيضاء عادية.",
          "اطوِ الورقة من المنتصف بالطول، ثم افتحها. اطوها من المنتصف بالعرض، ثم افتحها. الآن اطوِ الحواف الخارجية نحو المنتصف. (سيكون لديك 8 مستطيلات متساوية).",
          "بمقص، قم بعمل شق صغير في الخط الأوسط من طية العرض (في المركز فقط).",
          "اسحب الأطراف معاً حتى تنثني الورقة وتتشكل على هيئة كتيب صغير مكون من 8 صفحات.",
          "اكتب في الصفحة الأولى عنوان الكتاب (مثلاً: 5 حقائق مذهلة عن الفضاء)، واكتب حقيقة مع رسمة صغيرة في كل صفحة داخلية. لقد أصبحت مؤلفاً الآن!"
        ]
      }
    ]
  },
};


// ==========================================
// COMPONENT
// ==========================================
export default function SpacePage() {
  const params = useParams();
  const spaceId = params.id as string;
  const space = spaceData[spaceId] || spaceData.robotics; // Fallback to robotics
  const Icon = space.icon;

  const [expandedProject, setExpandedProject] = useState<number | null>(null);
  const [expandedCareerIndex, setExpandedCareerIndex] = useState<number | null>(0); // First one open by default

  return (
    <div className="flex min-h-[100dvh] w-full flex-col pb-24" dir="rtl">
      
      {/* Navigation */}
      <div className="sticky top-0 z-20 flex items-center justify-between bg-slate-50/80 p-4 backdrop-blur-md">
        <Link href="/" className="rounded-full border border-slate-200 bg-white p-2 shadow-sm transition-colors hover:bg-slate-100">
          <ChevronRight className="h-6 w-6 text-slate-700" />
        </Link>
        <div className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm font-bold text-slate-700 shadow-sm">
          مساحة {space.name}
        </div>
        <div className="w-10" />
      </div>

      <div className="mx-auto w-full max-w-2xl space-y-6 px-4 md:px-6 mt-2">
        
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${space.color} p-6 text-white shadow-xl ${space.shadow} md:p-8`}
        >
          <div className="pointer-events-none absolute -bottom-4 -right-4 opacity-10">
            <Icon className="h-48 w-48" />
          </div>
          <div className="relative z-10">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/30 bg-white/20 shadow-inner backdrop-blur-md">
              <Icon className="h-8 w-8 text-white drop-shadow-md" />
            </div>
            <h1 className="mb-2 text-3xl font-black drop-shadow-md md:text-4xl">{space.name}</h1>
            <p className="text-sm font-medium leading-relaxed text-white/90 opacity-95 md:text-base">
              {space.description}
            </p>
          </div>
        </motion.div>

        {/* DIY Projects (Detailed) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm"
        >
          <h2 className="mb-4 flex items-center gap-2 text-lg font-black text-slate-800">
            <Lightbulb className="h-5 w-5 text-sky-500" />
            مشاريع يمكنك تنفيذها بنفسك
          </h2>
          <div className="space-y-3">
            {space.projects.map((project, index) => {
              const isExpanded = expandedProject === index;
              return (
                <div key={index} className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 transition-colors hover:border-sky-200">
                  <button
                    onClick={() => setExpandedProject(isExpanded ? null : index)}
                    className="flex w-full items-center justify-between p-4 text-right focus:outline-none"
                  >
                    <span className="text-sm font-bold text-slate-800">{project.title}</span>
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full bg-white text-sky-500 shadow-sm transition-transform ${isExpanded ? 'rotate-180 bg-sky-500 text-white' : ''}`}>
                      <ChevronDown className="h-4 w-4" />
                    </div>
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-slate-100 bg-white"
                      >
                        <div className="p-4 space-y-4">
                          <div className="rounded-xl bg-sky-50 p-3 border border-sky-100">
                            <h4 className="flex items-center gap-1.5 text-xs font-black text-sky-700 mb-1">
                              <Info className="w-4 h-4" /> فكرة المشروع
                            </h4>
                            <p className="text-xs leading-6 text-sky-900 font-medium">{project.background}</p>
                          </div>
                          
                          <div className="rounded-xl bg-emerald-50 p-3 border border-emerald-100">
                            <h4 className="flex items-center gap-1.5 text-xs font-black text-emerald-700 mb-1">
                              <Target className="w-4 h-4" /> ماذا سنتعلم؟
                            </h4>
                            <p className="text-xs leading-6 text-emerald-900 font-medium">{project.achievement}</p>
                          </div>

                          <div>
                            <h4 className="text-sm font-black text-slate-800 mb-3">خطوات التنفيذ الممتعة:</h4>
                            <ul className="space-y-3">
                              {project.steps.map((step, stepIdx) => (
                                <li key={stepIdx} className="flex items-start gap-3 text-sm text-slate-600 font-medium">
                                  <span className="flex shrink-0 w-6 h-6 items-center justify-center rounded-full bg-orange-100 text-xs font-black text-orange-600 mt-0.5 shadow-sm">
                                    {stepIdx + 1}
                                  </span>
                                  <span className="leading-7">{step}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Career Paths (Dropdowns) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm"
        >
          <div className="mb-4">
            <h2 className="flex items-center gap-2 text-lg font-black text-slate-800">
              <GraduationCap className="h-5 w-5 text-emerald-500" />
              مسارات مهنية للمستقبل
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-1 leading-5">المجالات التي ندرسها اليوم قد تصبح مهنة مذهلة غداً. اكتشف المجالات الرئيسية أدناه، واضغط على أي مهنة لتعرف كيف تبدأ رحلتك فيها.</p>
          </div>

          <div className="space-y-3">
            {space.careerCategories.map((category, index) => {
              const isExpanded = expandedCareerIndex === index;
              return (
                <div key={index} className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 transition-colors">
                  <button
                    onClick={() => setExpandedCareerIndex(isExpanded ? null : index)}
                    className="flex w-full items-center justify-between p-3.5 text-right focus:outline-none"
                  >
                    <span className="text-sm font-bold text-slate-800">{category.field}</span>
                    <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180 text-emerald-500' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                      >
                        <div className="p-3 pt-0 grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {category.roles.map((role) => (
                            <Link
                              href={`/careers/${role.id}`}
                              key={role.id}
                              className="group flex cursor-pointer items-center justify-between rounded-xl border border-slate-100 bg-white p-3 transition-all hover:border-emerald-200 hover:shadow-sm"
                            >
                              <span className="text-xs font-bold text-slate-700 group-hover:text-emerald-700">
                                {role.title}
                              </span>
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition-colors group-hover:bg-emerald-100 group-hover:text-emerald-600">
                                <ArrowLeft className="h-3 w-3" />
                              </div>
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </motion.div>

      </div>
    </div>
  );
}