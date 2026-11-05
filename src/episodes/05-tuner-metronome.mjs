// الحلقة 5: التيونر والمترونوم. لا نضغط «ابدأ الضبط» لأنه يطلب الميكروفون.
export const meta = { id: "05-tuner-metronome", title: "المُوالِف والمترونوم", goals: ["صفحة المُوالِف وجداول ترددات الأوتار", "المترونوم: السرعة والميزان", "السرعات الجاهزة"] };
export const steps = [
  { id: "intro", card: "intro",
    speech: "أهلًا بكم. في هذه الحلقة نتعرّف على أداتين لا غنى عنهما في التدريب: المُوالِف، والمترونوم." },

  { id: "tuner",
    pre: async h => { await h.goto("/ar/tools/tuner"); await h.focus("text=ابدأ الضبط", { up: 1, zoom: 1.6 }); },
    speech: "هذا «مُوالِف نوى»، وهو يدعم أرباع الأصوات المستعملة في المقامات العربية. نضغط «ابدأ الضبط» ونسمح للموقع باستعمال الميكروفون، ثم نعزف النغمة." },

  { id: "tables",
    pre: async h => { await h.unfocus(); await h.focus("text=ترددات دوزان الأوتار", { up: 1, zoom: 1.4 }); },
    speech: "وتحته جداول ترددات الأوتار المعتادة للعود والتشيلو والكمان، لنعرف النغمة المطلوبة لكل وتر." },

  { id: "metro",
    pre: async h => { await h.goto("/ar/tools/metronome"); await h.focus("text=BPM", { up: 2, zoom: 1.8, exact: true }); },
    speech: "وهذا «المترونوم». الرقم الكبير هو السرعة بالنبضات في الدقيقة، ونغيّرها بالأزرار أو بالمؤشر." },

  { id: "signature",
    pre: async h => { await h.unfocus(); await h.focus("text=الميزان الزمني", { up: 1, zoom: 1.7 }); },
    speech: "ونختار الميزان الزمني، مثل أربعة على أربعة، وتقسيم النبضة، ومستوى الصوت." },

  { id: "presets",
    pre: async h => { await h.unfocus(); await h.focus("text=أندانتي", { up: 2, zoom: 1.5 }); },
    speech: "وتحتها سرعات جاهزة: لارغو للبطيء، وأندانتي، وأليغرو، وفيفاتشي للسريع." },

  { id: "play",
    pre: async h => { await h.unfocus(); await h.focus("button:has-text('تشغيل')", { zoom: 1.6 }); },
    speech: "ثم نضغط «تشغيل» لنبدأ، ونصيحتنا أن تبدأ ببطء، وترفع السرعة تدريجيًا كلما أتقنت المقطع." },

  { id: "outro", card: "outro",
    speech: "المُوالِف قبل العزف، والمترونوم أثناء التمرين. شكرًا لمتابعتكم." },
];
