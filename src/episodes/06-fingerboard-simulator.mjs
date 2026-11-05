// الحلقة 6: محاكي لوحة الأصابع.
export const meta = { id: "06-fingerboard-simulator", title: "محاكي لوحة الأصابع", goals: ["اختيار الآلة", "إضاءة النغمات", "اختبار السلم", "التحكم بالعرض"] };
export const steps = [
  { id: "intro", card: "intro",
    speech: "أهلًا بكم. في هذه الحلقة نتعرّف على محاكي لوحة الأصابع، لنتدرّب على مواضع النغمات قبل أن نمسك بالآلة." },

  { id: "open",
    pre: async h => { await h.goto("/ar/tools/simulator"); await h.focus("h1:visible", { zoom: 1.6 }); },
    speech: "هذا «محاكي لوحة الأصابع التفاعلي»، وهو يعرض لوحة الآلة، ونتدرّب عليها بالنقر على النغمات." },

  { id: "instrument",
    pre: async h => { await h.unfocus(); await h.focus("button:has-text('العود (33')", { zoom: 1.7 }); },
    speech: "في الأعلى نختار الآلة، وعدد النغمات الظاهرة على لوحتها." },

  { id: "board",
    pre: async h => { await h.unfocus(); await h.focus("text=لوحة أصابع العود", { up: 1, zoom: 1.0 }); },
    speech: "وهذه لوحة الأصابع. الأوتار أفقية، والخانات مرتّبة بالأصابع من اليمين، وأرباع الأصوات ظاهرة بين الخانات." },

  { id: "light",
    pre: async h => { await h.unfocus(); await h.focus("button:has-text('إضاءة كل النوتات')", { up: 1, zoom: 1.7 }); },
    speech: "زر «إضاءة كل النوتات» يُظهر كل المواضع، وزر «مسح LED» يُطفئها، لنبدأ من جديد." },

  { id: "scale",
    pre: async h => { await h.unfocus(); await h.focus("button:has-text('اختبار السلم')", { up: 1, zoom: 1.7 }); },
    speech: "و«اختبار السلم» يُضيء نغمات السلم واحدة تلو الأخرى، ونحدّد سرعته بأبطأ وأسرع." },

  { id: "view",
    pre: async h => { await h.unfocus(); await h.focus("button:has-text('إعادة تعيين')", { up: 1, zoom: 1.4 }); },
    speech: "وأدوات العرض: تكبير اللوحة وتصغيرها، وملء الشاشة، وإعادة التعيين." },

  { id: "outro", card: "outro",
    speech: "جرّب المحاكي كل يوم قبل التمرين. شكرًا لمتابعتكم." },
];
