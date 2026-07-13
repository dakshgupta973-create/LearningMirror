/* LearningMirror — ALL TEXT & QUESTIONS
   UI labels (Hindi/English), the 6 common-core questions,
   the four 8-question sets (A=reading, B=writing, C=maths, D=attention),
   the interactive task content, and the help resources. */

/* All 22 scheduled languages of India + English.
   hi and en are fully hand-written below. Any other language is translated
   automatically by the AI the first time a parent selects it, then cached
   on the phone. */
const LANGS = [
  {code:"hi", name:"Hindi", native:"हिंदी"},
  {code:"en", name:"English", native:"English"},
  {code:"bn", name:"Bengali", native:"বাংলা"},
  {code:"mr", name:"Marathi", native:"मराठी"},
  {code:"te", name:"Telugu", native:"తెలుగు"},
  {code:"ta", name:"Tamil", native:"தமிழ்"},
  {code:"gu", name:"Gujarati", native:"ગુજરાતી"},
  {code:"ur", name:"Urdu", native:"اردو", rtl:true},
  {code:"kn", name:"Kannada", native:"ಕನ್ನಡ"},
  {code:"or", name:"Odia", native:"ଓଡ଼ିଆ"},
  {code:"ml", name:"Malayalam", native:"മലയാളം"},
  {code:"pa", name:"Punjabi", native:"ਪੰਜਾਬੀ"},
  {code:"as", name:"Assamese", native:"অসমীয়া"},
  {code:"mai", name:"Maithili", native:"मैथिली"},
  {code:"sat", name:"Santali", native:"ᱥᱟᱱᱛᱟᱲᱤ"},
  {code:"ks", name:"Kashmiri", native:"کٲشُر", rtl:true},
  {code:"ne", name:"Nepali", native:"नेपाली"},
  {code:"kok", name:"Konkani", native:"कोंकणी"},
  {code:"sd", name:"Sindhi", native:"سنڌي", rtl:true},
  {code:"doi", name:"Dogri", native:"डोगरी"},
  {code:"mni", name:"Manipuri", native:"ꯃꯤꯇꯩꯂꯣꯟ"},
  {code:"brx", name:"Bodo", native:"बड़ो"}
];

/* ---------- UI STRINGS ---------- */
const UI = {
  hi:{
    brandSub:"हर बच्चा अलग तरह से सीखता है",
    homeTitle:"अपने बच्चे को थोड़ा और समझें",
    homeLead:"अपने बच्चे के बारे में 14 आसान सवालों के जवाब दीजिए। हम बताएँगे कि आपका बच्चा किन चीज़ों में अच्छा है और किनमें उसे थोड़ी मदद चाहिए। 10 मिनट से कम लगेगा।",
    agePill:"बच्चे की उम्र चुनिए",
    start:"शुरू करें",
    homeNote:"कोई लॉगिन नहीं। कोई जानकारी सेव नहीं होती। पूरी तरह निजी।",
    phaseCore:"शुरुआती सवाल",
    phaseSet:"आपके बच्चे के लिए चुने गए सवाल",
    opts:["हमेशा","अक्सर","कभी-कभी","कभी नहीं"],
    of:"में से",
    next:"आगे",
    finish:"नतीजा देखें",
    quizNote:"वही चुनिए जो आपके बच्चे पर ज़्यादातर सही बैठता है।",
    routeText:"आपके जवाब देखे जा रहे हैं…",
    routeSub:"अगले सवाल आपके बच्चे के हिसाब से चुने जा रहे हैं",
    loadText:"आपके जवाब देखे जा रहे हैं…",
    loadSub:"कुछ ही पल में नतीजा तैयार है",
    seeResources:"मदद और संपर्क देखें",
    restart:"फिर से शुरू करें",
    resTitle:"कम खर्च में मदद",
    resLead:"नीचे दिए गए संसाधन आपकी मदद कर सकते हैं। ये सुझाव हैं, सलाह नहीं।",
    resBack:"नतीजे पर वापस जाएँ",
    foot:"LearningMirror • एक स्क्रीनिंग साधन, इलाज नहीं",
    errTitle:"अभी नतीजा नहीं बन पाया",
    errBody:"इंटरनेट या API key में दिक्कत हो सकती है। कृपया थोड़ी देर बाद फिर कोशिश करें।",
    tryAgain:"फिर कोशिश करें",
    needKey:"API key अभी नहीं डाली गई है। फ़ाइल में ANTHROPIC_API_KEY में अपनी key डालिए।",
    meaning:"इसका मतलब क्या है",
    strengths:"आपका बच्चा इनमें अच्छा हो सकता है",
    steps:"आज घर पर आप क्या कर सकते हैं",
    summary:"संक्षेप में",
    disc:"यह सिर्फ़ एक स्क्रीनिंग साधन है, कोई चिकित्सकीय निदान नहीं। अगर आपको चिंता है, तो कृपया किसी योग्य शैक्षिक मनोवैज्ञानिक से बात करें।",
    badgeFlag:"ध्यान देने योग्य",
    badgeClear:"मोटे तौर पर ठीक",
    adviceTitle:"घर पर ये बातें मदद करती हैं",
    advice:[
      "रोज़ थोड़ा-थोड़ा साथ बैठकर ज़ोर से पढ़ें — हर गलती पर न टोकें।",
      "बड़े काम को छोटे-छोटे हिस्सों में बाँट दें।",
      "बच्चा जिसमें अच्छा है (खेल, कला, बातचीत) उसकी खुलकर तारीफ़ करें।",
      "लिखने की जगह कभी बोलकर जवाब देने या चित्र बनाने का मौका दें।",
      "स्कूल के शिक्षक से बच्चे की मदद के बारे में खुलकर बात करें।"
    ],
    helplinesTitle:"फ़ोन हेल्पलाइन (मुफ़्त)",
    placesTitle:"जहाँ आप जाँच करा सकते हैं",
    callLabel:"कॉल करें"
  },
  en:{
    brandSub:"Every child learns differently",
    homeTitle:"See your child a little more clearly",
    homeLead:"Answer 14 simple questions about your child. We'll show what your child is likely good at, and where they may need a little support. Takes under 10 minutes.",
    agePill:"Choose your child's age",
    start:"Start",
    homeNote:"No login. Nothing is saved. Completely private.",
    phaseCore:"Getting started",
    phaseSet:"Questions chosen for your child",
    opts:["Always","Often","Sometimes","Never"],
    of:"of",
    next:"Next",
    finish:"See result",
    quizNote:"Pick what is true for your child most of the time.",
    routeText:"Looking at your answers…",
    routeSub:"Choosing the next questions for your child",
    loadText:"Looking at your answers…",
    loadSub:"Your result is ready in a moment",
    seeResources:"See help & contacts",
    restart:"Start again",
    resTitle:"Low-cost help",
    resLead:"These resources may help you. They are suggestions, not advice.",
    resBack:"Back to result",
    foot:"LearningMirror • a screening tool, not treatment",
    errTitle:"Could not get a result yet",
    errBody:"There may be an internet or API key problem. Please try again in a little while.",
    tryAgain:"Try again",
    needKey:"No API key added yet. Put your key in ANTHROPIC_API_KEY in the file.",
    meaning:"What this means",
    strengths:"Your child may be good at",
    steps:"What you can do at home today",
    summary:"In short",
    disc:"This is a screening tool, not a clinical diagnosis. If you are concerned, please speak to a qualified educational psychologist.",
    badgeFlag:"Worth noticing",
    badgeClear:"Broadly on track",
    adviceTitle:"Things that help at home",
    advice:[
      "Read aloud together a little every day — don't correct every mistake.",
      "Break big tasks into small steps.",
      "Praise what your child is good at (sport, art, talking).",
      "Let them answer out loud or draw instead of always writing.",
      "Talk openly with the school teacher about supporting your child."
    ],
    helplinesTitle:"Phone helplines (free)",
    placesTitle:"Where you can get a check",
    callLabel:"Call"
  }
};

/* ---------- QUESTIONS ----------
   Common core: 6 questions, one signal per area.
   Sets (never named in the UI): A=reading(dyslexia), B=writing(dysgraphia),
   C=maths(dyscalculia), D=attention(ADHD-linked).
   Answers: Always=3, Often=2, Sometimes=1, Never=0.
   Grounding: SLD-SQ, BCSLD, DALI, CLDQ, Shaywitz, DSM-5 (see question bank doc). */
const CORE = [
  {area:"A", hi:"अपनी उम्र के बच्चों की तुलना में, क्या आपके बच्चे को पढ़ना मुश्किल लगता है (अक्षर पहचानना या आसान शब्द पढ़ना)?", en:"Compared with children the same age, does your child find reading hard (recognising letters, or reading simple words)?"},
  {area:"B", hi:"क्या आपके बच्चे की लिखावट पढ़ने में मुश्किल है, या किताब/बोर्ड से उतारने पर भी बहुत गलतियाँ होती हैं?", en:"Is your child's writing hard to read, or full of mistakes even when copying from a book or the board?"},
  {area:"C", hi:"क्या आपका बच्चा गिनती या आसान हिसाब में अपनी उम्र के हिसाब से बहुत गलतियाँ करता है?", en:"Does your child make many mistakes in counting or simple maths for their age?"},
  {area:"D", hi:"क्या आपके बच्चे के लिए बैठकर होमवर्क या कोई 10 मिनट का काम पूरा करना मुश्किल है?", en:"Does your child find it hard to sit and finish homework or any 10-minute task?"},
  {area:"X", hi:"क्या आपका बच्चा अभी सिखाई गई बात भूल जाता है, या 2–3 कामों वाली बात का बीच का हिस्सा भूल जाता है (जैसे 'हाथ धोकर खाना खाने आओ')?", en:"Does your child forget what was just taught, or forget the middle of a 2–3 step instruction (\"wash hands, then come eat\")?"},
  {area:"X", hi:"क्या किसी शिक्षक ने कहा है कि बच्चा कक्षा के स्तर से पीछे है, जबकि बाकी चीज़ों में वह होशियार लगता है?", en:"Has a teacher said your child's performance is below the class level, even though the child seems bright in other ways?"}
];

const SETS = {
  A:[ /* reading / dyslexia-linked */
    {hi:"दूसरे बच्चों से कहीं ज़्यादा समय लगा अक्षर और उनकी आवाज़ें सीखने में।", en:"Took much longer than other children to learn letter names and their sounds."},
    {hi:"पढ़ते समय मिलते-जुलते अक्षरों में उलझ जाता है (जैसे b/d या प/फ)।", en:"Mixes up letters that look similar when reading — like b/d or प/फ."},
    {hi:"आवाज़ें जोड़कर नया शब्द पढ़ नहीं पाता (जैसे क-म-ल → कमल, c-a-t → cat)।", en:"Cannot join sounds together to read a simple new word (like c-a-t → cat)."},
    {hi:"पढ़ते समय शब्द या पूरी लाइन छोड़ देता है, या एक ही लाइन दोबारा पढ़ता है।", en:"Skips words or whole lines, or reads the same line twice, while reading aloud."},
    {hi:"सहपाठियों से बहुत धीरे और बहुत मेहनत से पढ़ता है।", en:"Reads much more slowly and with much more effort than classmates."},
    {hi:"कहानी पढ़ने के तुरंत बाद बता नहीं पाता कि उसमें क्या था।", en:"Cannot tell you what a story was about right after reading it."},
    {hi:"तुकबंदी पकड़ना या मिलते-जुलते आवाज़ वाले शब्द अलग करना मुश्किल लगता है।", en:"Finds rhymes hard, or confuses words that sound alike."},
    {hi:"पढ़ने का समय आने पर रोता है, छिपता है या बहाने बनाता है।", en:"Cries, hides, or makes excuses when it is time to read."}
  ],
  B:[ /* writing / dysgraphia-linked */
    {hi:"पेंसिल बहुत कसकर या अजीब तरह पकड़ता है, थोड़ा लिखते ही हाथ थक जाता है या दुखता है।", en:"Holds the pencil very tightly or awkwardly, and the hand tires or hurts after a little writing."},
    {hi:"अक्षर बहुत बेमेल होते हैं — अलग-अलग आकार, लाइन के ऊपर-नीचे, शब्दों के बीच अजीब दूरी।", en:"Letters are very uneven — different sizes, floating above or below the line, odd spacing."},
    {hi:"अब भी कुछ अक्षर या अंक उल्टे (दर्पण जैसे) लिखता है।", en:"Still writes some letters or numbers back-to-front (mirror writing)."},
    {hi:"किताब या बोर्ड से सीधे उतारने पर भी वर्तनी की गलतियाँ करता है।", en:"Makes spelling mistakes even when copying directly from a book or the board."},
    {hi:"इतना धीरे लिखता है कि क्लास का काम समय पर पूरा नहीं होता।", en:"Writes so slowly that classwork is never finished on time."},
    {hi:"शिक्षक के मिटाने से पहले बोर्ड से उतार नहीं पाता।", en:"Cannot copy from the board before the teacher rubs it off."},
    {hi:"मुँह से जवाब अच्छे देता है पर उतना लिख नहीं पाता।", en:"Gives good answers out loud, but writes far less than they can say."},
    {hi:"कुछ लाइनें लिखने को कहने पर भी परेशान हो जाता है या टालता है।", en:"Gets upset or avoids it whenever asked to write even a few lines."}
  ],
  C:[ /* maths / dyscalculia-linked */
    {hi:"असली चीज़ें (खिलौने, टॉफ़ियाँ) गिनते समय छोड़ देता है या दोहराता है।", en:"Skips or repeats numbers when counting real objects (toys, sweets)."},
    {hi:"बिना एक-एक गिने नहीं बता पाता कि किस ढेर में ज़्यादा है।", en:"Cannot say which of two piles has more without counting one by one."},
    {hi:"अंक उल्टे पढ़ता या लिखता है — 9 को 6, 21 को 12।", en:"Reads or writes numbers reversed or swapped — 6 for 9, 12 for 21."},
    {hi:"जो छोटे सवाल सहपाठी मन में कर लेते हैं, उनके लिए भी उँगलियों या चीज़ों की ज़रूरत पड़ती है।", en:"Still needs fingers or objects for small sums that classmates do in their head."},
    {hi:"कितना भी अभ्यास करे, पहाड़े या अंकों के तथ्य याद नहीं रहते।", en:"Cannot remember number facts or tables no matter how much they practise."},
    {hi:"शब्दों वाले सवाल में तय नहीं कर पाता कि जोड़ना है, घटाना, गुणा या भाग।", en:"In a word problem, cannot decide whether to add, subtract, multiply or divide."},
    {hi:"घड़ी, समय और हफ़्ते के दिन सीखना बहुत मुश्किल लगता है।", en:"Finds clocks, time, and days of the week unusually hard to learn."},
    {hi:"गणित के होमवर्क पर अक्सर रोना, गुस्सा या टालमटोल होती है।", en:"Maths homework regularly ends in tears, anger, or avoidance."}
  ],
  D:[ /* attention / ADHD-linked */
    {hi:"10 मिनट का काम भी बैठकर पूरा नहीं कर पाता — बार-बार उठ जाता है, पसंद के काम में भी।", en:"Cannot sit through a 10-minute task — keeps getting up, even for things they enjoy."},
    {hi:"पढ़ते समय हर आवाज़ या हलचल से ध्यान भटक जाता है।", en:"Is pulled away by every sound or movement while studying."},
    {hi:"रोज़ की चीज़ें — पेंसिल, बोतल, कॉपियाँ — बार-बार खो देता है।", en:"Loses everyday things — pencils, bottles, notebooks — again and again."},
    {hi:"काम जोश से शुरू करता है पर लगभग कभी पूरा नहीं करता।", en:"Starts tasks with energy but almost never finishes them."},
    {hi:"किसी बात पर अमल करने से पहले उसे कई बार दोहराना पड़ता है।", en:"Needs instructions repeated several times before acting on them."},
    {hi:"बीच में टोकता है, बिना सोचे जवाब या काम कर देता है।", en:"Interrupts, blurts out answers, or acts without thinking."},
    {hi:"स्थिर रहने की कोशिश में भी हाथ-पैर हिलते रहते हैं।", en:"Fidgets constantly — hands, feet, chair — even when trying to be still."},
    {hi:"याद दिलाने पर भी रोज़ की चीज़ें (होमवर्क, बस्ता, टिफ़िन) भूल जाता है।", en:"Forgets daily routines (homework, bag, tiffin) even with reminders."}
  ]
};

/* ---------- RESOURCES ---------- */
const RESOURCES = {
  hi:{
    helplines:[
      {t:"टेली मानस (सरकारी)", s:"मन और सीखने से जुड़ी बातों के लिए मुफ़्त, 24×7 फ़ोन सहायता।", tel:"14416", disp:"14416"},
      {t:"KIRAN हेल्पलाइन (सरकारी)", s:"मानसिक स्वास्थ्य के लिए मुफ़्त, 24×7, कई भाषाओं में।", tel:"18005990019", disp:"1800-599-0019"},
      {t:"चाइल्डलाइन", s:"बच्चों से जुड़ी किसी भी मदद के लिए मुफ़्त राष्ट्रीय हेल्पलाइन।", tel:"1098", disp:"1098"},
      {t:"महाराष्ट्र डिस्लेक्सिया एसोसिएशन", s:"सीखने की कठिनाइयों के लिए मुफ़्त हेल्पलाइन — कॉल या WhatsApp।", tel:"8448448996", disp:"844-844-8996"}
    ],
    places:[
      {t:"मद्रास डिस्लेक्सिया एसोसिएशन (चेन्नई)", s:"बच्चों के लिए उपचारात्मक मदद और माता-पिता का मार्गदर्शन। वेबसाइट: mdachennai.com"},
      {t:"सरकारी ज़िला अस्पताल (बाल विभाग)", s:"कई ज़िला अस्पतालों में सीखने से जुड़ी जाँच मुफ़्त या बहुत कम खर्च में होती है।"},
      {t:"स्कूल के काउंसलर या प्रिंसिपल से बात", s:"पहला कदम अक्सर बच्चे के स्कूल से बात करना होता है।"},
      {t:"ज़िला शिक्षा अधिकारी (समावेशी शिक्षा)", s:"सरकारी स्कूलों में 'समावेशी शिक्षा' के तहत विशेष शिक्षक मदद करते हैं।"},
      {t:"नज़दीकी सरकारी मेडिकल कॉलेज", s:"मनोचिकित्सा या बाल विकास विभाग में कम खर्च में आकलन हो सकता है।"}
    ]
  },
  en:{
    helplines:[
      {t:"Tele MANAS (government)", s:"Free, 24×7 phone support for mind and learning concerns.", tel:"14416", disp:"14416"},
      {t:"KIRAN helpline (government)", s:"Free, 24×7 mental-health support in many languages.", tel:"18005990019", disp:"1800-599-0019"},
      {t:"Childline", s:"Free national helpline for any concern about a child.", tel:"1098", disp:"1098"},
      {t:"Maharashtra Dyslexia Association", s:"Free helpline for learning difficulties — call or WhatsApp.", tel:"8448448996", disp:"844-844-8996"}
    ],
    places:[
      {t:"Madras Dyslexia Association (Chennai)", s:"Remedial help for children and guidance for parents. Website: mdachennai.com"},
      {t:"Government district hospital (child unit)", s:"Many district hospitals offer learning checks free or very low cost."},
      {t:"Talk to the school counsellor or principal", s:"A good first step is often the child's school."},
      {t:"District Education Officer (Inclusive Education)", s:"Government schools have special educators under 'Inclusive Education'."},
      {t:"Nearest government medical college", s:"Psychiatry or child-development departments can assess at low cost."}
    ]
  }
};

/* ---------- INTERACTIVE TASKS (one per SLD set) ----------
   A: timed read-aloud → fluency (words/min, struggles)
   B: handwriting photo → vision-model analysis (reversals, spacing, legibility)
   C: timed number game → response times + error pattern
   D: tap game (go/no-go) → reaction time + wrong taps
   These give each SLD one objective, machine-measured signal.
   The handwriting task is the input for the Kaggle-trained CNN (Boston build). */
const TASKTEXT = {
  hi:{
    pill:"बच्चे के साथ एक छोटा खेल",
    skip:"इसे छोड़ें",
    cont:"आगे बढ़ें",
    A_title:"पढ़ने का छोटा खेल",
    A_lead:"नीचे की कहानी अपने बच्चे को दिखाइए। जब बच्चा ज़ोर से पढ़ना शुरू करे, 'शुरू' दबाइए। पढ़ना ख़त्म होते ही 'हो गया' दबाइए।",
    A_start:"शुरू ▶", A_done:"हो गया ✓",
    A_strug:"कितने शब्दों पर बच्चा अटका?",
    A_strugOpts:["0–2 शब्द","3–5 शब्द","6 या ज़्यादा"],
    B_title:"लिखावट की छोटी जाँच",
    B_lead:"नीचे का वाक्य अपने बच्चे से काग़ज़ पर लिखवाइए। फिर उस काग़ज़ की फ़ोटो खींचकर यहाँ डालिए।",
    B_upload:"📷 फ़ोटो लीजिए / चुनिए",
    B_ready:"फ़ोटो तैयार है — आगे बढ़िए",
    C_title:"गिनती का छोटा खेल",
    C_lead:"अब फ़ोन बच्चे को दीजिए। बच्चा खुद जवाब चुनेगा। जल्दी की ज़रूरत नहीं — बस जो सही लगे वही चुनना है।",
    C_which:"किस तरफ़ ज़्यादा हैं?",
    C_left:"बाएँ", C_right:"दाएँ",
    C_go:"खेल शुरू करें",
    D_title:"ध्यान का छोटा खेल",
    D_lead:"फ़ोन बच्चे को दीजिए। नियम आसान है: हरा गोला दिखे तो तुरंत दबाओ, लाल गोला दिखे तो मत दबाओ। खेल 30 सेकंड चलेगा।",
    D_go:"खेल शुरू करें",
    D_running:"हरा दबाओ • लाल मत दबाओ"
  },
  en:{
    pill:"A little game with your child",
    skip:"Skip this",
    cont:"Continue",
    A_title:"A short reading game",
    A_lead:"Show the story below to your child. Tap 'Start' the moment they begin reading aloud, and 'Done' the moment they finish.",
    A_start:"Start ▶", A_done:"Done ✓",
    A_strug:"How many words did your child get stuck on?",
    A_strugOpts:["0–2 words","3–5 words","6 or more"],
    B_title:"A short handwriting check",
    B_lead:"Ask your child to copy the sentence below on paper. Then take a photo of the page and add it here.",
    B_upload:"📷 Take / choose photo",
    B_ready:"Photo ready — continue",
    C_title:"A short number game",
    C_lead:"Now hand the phone to your child. They answer by themselves. No rush — just pick what looks right.",
    C_which:"Which side has more?",
    C_left:"Left", C_right:"Right",
    C_go:"Start the game",
    D_title:"A short attention game",
    D_lead:"Hand the phone to your child. The rule is simple: tap the circle when it turns GREEN, don't tap when it is RED. The game lasts 30 seconds.",
    D_go:"Start the game",
    D_running:"Tap green • Don't tap red"
  }
};

const TASKCONTENT = {
  /* hi/en have 3 variants each (picked at random so retests differ).
     Other languages get one AI-translated variant. */
  passages:{
    0:{hi:["एक बिल्ली चटाई पर बैठी थी। उसने एक लाल गेंद देखी। बिल्ली दौड़ी और दिन भर गेंद से खेली।",
           "एक छोटी चिड़िया पेड़ पर बैठी थी। उसने एक बड़ा आम देखा। चिड़िया नीचे उड़ी और मज़े से खा गई।",
           "रिया के पास एक छोटा कुत्ता है। कुत्ते को उछलना और दौड़ना पसंद है। रिया और कुत्ता धूप में खेलते हैं।"],
       en:["The cat sat on a mat. It saw a red ball. The cat ran fast and played with the ball all day.",
           "A little bird sat on a tree. It saw a big sweet mango. The bird flew down and ate it happily.",
           "Ria has a small dog. The dog likes to jump and run. Ria and the dog play in the sun."]},
    1:{hi:["रवि अपनी माँ के साथ बाज़ार गया। उसे एक नीली पतंग चाहिए थी। दुकान में हर रंग की पतंगें थीं। रवि ने सबसे अच्छी पतंग चुनी और शाम तक पार्क में उड़ाई।",
           "मीरा को समुद्र की किताबें पढ़ना पसंद है। एक दिन उसे किनारे पर एक सीप मिली। उसने उसे बस्ते में रखा और अपनी पक्की सहेली को दिखाया।",
           "अर्जुन ने बग़ीचे में एक छोटा बीज बोया। वह रोज़ सुबह स्कूल से पहले उसे पानी देता था। कई हफ़्तों बाद एक पीला फूल खिला और अर्जुन को बहुत गर्व हुआ।"],
       en:["Ravi went to the market with his mother. He wanted a blue kite. The shop had kites of every colour. Ravi chose the best one and flew it in the park till the sun went down.",
           "Meera loves to read books about the sea. One day she found a shell on the beach. She kept it in her school bag and showed it to her best friend.",
           "Arjun planted a small seed in the garden. He watered it every morning before school. After many weeks a yellow flower opened, and Arjun felt very proud."]}
  },
  copySentence:{
    0:{hi:["बड़ा कुत्ता तेज़ दौड़ा।","मेरी बिल्ली को दूध पसंद है।","हम पार्क में खेलते हैं।"],
       en:["The big dog ran fast.","My cat likes warm milk.","We play in the park."]},
    1:{hi:["मैं रोज़ सुबह पाठशाला जाता हूँ।","जयपुर की गाड़ी सुबह नौ बजे छूटती है।","दादी बारिश की रातों में कहानियाँ सुनाती हैं।"],
       en:["My friend plays cricket every Sunday evening.","The train to Jaipur leaves at nine in the morning.","Grandmother tells us stories on rainy nights."]}
  }
};
