// الحلقة 1: جولة في منصة نوى. speech = المنطوق (نطق صوتي)، text = المكتوب على الشاشة.
export const meta = {
  id: "01-platform-tour",
  title: "جولة في منصة نوى",
  goals: ["الدروس واختيار الآلة", "مكتبة الأغاني والبحث", "الأدوات: التيونر والمترونوم", "الباقات والاشتراك"],
};
const nav = t => `header a:has-text("${t}")`;
export const steps = [
  { id: "intro", card: "intro",
    speech: "أهلًا بكم في نوى، منصة تعلّم الموسيقى باللوحة المضيئة. في هذه الحلقة نتعرّف على أقسامها الأربعة: الدروس، والمكتبة، والأدوات، والباقات." },

  { id: "home",
    pre: async h => { await h.focus("h1:has-text('NawaLED')", { zoom: 1.0, contains: "iframe" }); },
    speech: "هذه الصفحة الرئيسية، وفيها فيديو تعريفي بلوحة نوى ليد، وهي لوحة أصابع مضيئة تُضيء مكان الأصابع على الآلة، فتعرف أين تضع إصبعك دون تخمين.",
    text: "هذه الصفحة الرئيسية، وفيها فيديو تعريفي بلوحة NawaLED، وهي لوحة أصابع مضيئة تُضيء مكان الأصابع على الآلة، فتعرف أين تضع إصبعك دون تخمين." },

  { id: "menu",
    pre: async h => { await h.focusLinks(["الدروس", "مكتبة الأغاني", "الأدوات", "من نحن"], { zoom: 1.0 }); },
    speech: "ومن القائمة العلوية نصل إلى كل الأقسام: الدروس، ومكتبة الأغاني، والأدوات." },

  { id: "lessons",
    pre: async h => { await h.unfocus(); await h.click(nav("الدروس")); await h.wait(1500); },
    speech: "نبدأ بالدروس، ونختار الآلة التي نريد تعلّمها.",
    post: async h => { await h.focus("text=اختر آلتك", { up: 0, zoom: 1.8 }); } },

  { id: "continue",
    pre: async h => { await h.unfocus(); await h.focus("text=تابع من حيث توقفت", { up: 2, zoom: 1.7 }); },
    speech: "وإذا بدأنا درسًا من قبل، نكمل من حيث توقفنا بضغطة واحدة على «متابعة»." },

  { id: "library",
    pre: async h => { await h.unfocus(); await h.click(nav("مكتبة الأغاني")); await h.wait(1500); await h.focus("input[placeholder*='ابحث عن أغنية']", { zoom: 1.9 }); },
    speech: "في «مكتبة الأغاني» مقطوعات لكل آلة. نكتب في خانة البحث اسم الأغنية أو الآلة، فتظهر النتائج مباشرة، مع المقام ومدة المقطوعة.",
    post: async h => { await h.type("input[placeholder*='ابحث عن أغنية']", "العود"); } },

  { id: "filters",
    pre: async h => { await h.unfocus(); await h.clear("input[placeholder*='ابحث عن أغنية']"); await h.focus("button:has-text('كل الآلات')", { up: 1, zoom: 1.9 }); },
    speech: "ولتضييق البحث نستخدم الفلاتر: الآلة، والمقام، والنوع، والمدة. وبنجمة المفضّلة نحفظ ما نحب." },

  { id: "tools",
    pre: async h => { await h.unfocus(); await h.click(nav("الأدوات")); await h.wait(1500); await h.focus("text=التيونر", { up: 2, zoom: 1.8, exact: true }); },
    speech: "في «الأدوات» نجد التيونر لضبط الآلة بدقة، ويدعم ربع الصوت المهم في المقامات الشرقية." },

  { id: "metronome",
    pre: async h => { await h.unfocus(); await h.focus("text=المترونوم", { up: 2, zoom: 1.8, exact: true }); },
    speech: "ثم المترونوم لضبط الإيقاع أثناء التمرين، مع تغيير السرعة ونمط الوقت." },

  { id: "simulator",
    pre: async h => { await h.unfocus(); await h.scroll(300); await h.focus("text=محاكي لوحة الأصابع", { up: 2, zoom: 1.7, exact: true }); },
    speech: "ومحاكي لوحة الأصابع، لنتدرّب على مواضع النغمات قبل أن نمسك بالآلة." },

  { id: "plans",
    pre: async h => { await h.unfocus(); await h.goto("/ar/subscription"); await h.focus("text=شهري", { up: 2, zoom: 1.8, exact: true }); },
    speech: "وأخيرًا «الباقات». نختار الدفع الشهري أو السنوي، والسنوي يوفّر عشرين بالمئة." },

  { id: "plans2",
    pre: async h => { await h.unfocus(); await h.scroll(80); await h.focus("text=جميع الآلات", { up: 3, zoom: 1.5, exact: true }); },
    speech: "باقة آلة واحدة بخمسة عشر دولارًا شهريًا، وباقة جميع الآلات بعشرين دولارًا، وفي الاثنتين تجربة مجانية ثلاثة أيام." },

  { id: "outro", card: "outro",
    speech: "هذه أقسام نوى الأربعة. نصيحتنا: ابدأ بالتيونر، ثم اختر درسًا من آلتك. شكرًا لمتابعتكم." },
];
