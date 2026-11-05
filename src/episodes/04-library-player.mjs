// الحلقة 4: مكتبة الأغاني ومشغّل الأغنية (أوضاع التعلّم، التحكم بالسرعة، النوتة، لوحة LED).
export const meta = { id: "04-library-player", title: "مكتبة الأغاني والمشغّل", goals: ["تصفّح المكتبة", "فتح أغنية", "أوضاع التعلّم", "التحكم بالسرعة والنوتة ولوحة LED"] };
export const steps = [
  { id: "intro", card: "intro",
    speech: "أهلًا بكم. في هذه الحلقة نفتح مكتبة الأغاني، ونتعرّف على مشغّل الأغنية وأوضاع التعلّم." },

  { id: "library",
    pre: async h => { await h.goto("/ar/library"); await h.focus("h1:has-text('مكتبة الأغاني')", { zoom: 1.6 }); },
    speech: "هذه «مكتبة الأغاني»، فيها مقطوعات لكل آلة. نستطيع التصفّح حسب الآلة، أو البحث، أو الفلترة بالمقام والنوع والمدة." },

  { id: "cards",
    pre: async h => { await h.unfocus(); await h.focus("text=سألوني الناس", { up: 3, zoom: 1.9 }); },
    speech: "كل مقطوعة لها بطاقة تعرض الاسم والآلة والمقام والمدة، ونجمة لإضافتها إلى المفضّلة. نضغط على البطاقة لفتحها." },

  { id: "open",
    pre: async h => { await h.unfocus(); await h.click("button[aria-label^='سألوني']"); await h.wait(9000); await h.focus("h1", { zoom: 1.6 }); },
    speech: "هذا مشغّل الأغنية. في الأعلى اسم المقطوعة والآلة والمقام والمستوى." },

  { id: "modes",
    pre: async h => { await h.unfocus(); await h.focus("button:has-text('اعزف مع اللحن')", { up: 1, zoom: 1.5 }); },
    speech: "وفوقه أوضاع التعلّم: اعزف مع اللحن، وتعلّم، وتمرّن، وأداء، وعزف حر. نختار الوضع الذي يناسب مرحلتنا." },

  { id: "controls",
    pre: async h => { await h.unfocus(); await h.focus("text=تكرار", { up: 2, zoom: 1.5, exact: true }); },
    speech: "وهنا أزرار التحكم: التشغيل، والتكرار، وسرعة العزف بالنبضات في الدقيقة، ومستوى الصوت. نبدأ ببطء ثم نرفع السرعة." },

  { id: "now",
    pre: async h => { await h.unfocus(); await h.focus("text=افحص نغمتي", { up: 3, zoom: 1.3 }); },
    speech: "ولوحة «اعزف الآن» تخبرنا بالنغمة الحالية والتالية، وبالوتر والإصبع المناسبين." },

  { id: "outro", card: "outro",
    speech: "هذه مكتبة الأغاني ومشغّلها. اختر مقطوعة تناسبك، وابدأ ببطء. شكرًا لمتابعتكم." },
];
