// ===== AUTH =====
let authMode = "signin"; // "signin" | "signup"
let currentUser = null;

function getUsers(){ return JSON.parse(localStorage.getItem("auth_users"))||{}; }
function saveUsers(u){ localStorage.setItem("auth_users", JSON.stringify(u)); }

function toggleAuthMode(){
  authMode = authMode==="signin" ? "signup" : "signin";
  const isSignup = authMode==="signup";
  document.getElementById("authTitle").textContent = isSignup ? "Sign Up" : "Sign In";
  document.getElementById("authPassword2").style.display = isSignup ? "block" : "none";
  document.querySelector(".auth-submit").textContent = isSignup ? "Sign Up" : "Sign In";
  document.getElementById("authSwitchText").textContent = isSignup ? "Already have an account?" : "Don't have an account?";
  document.querySelector(".auth-switch a").textContent = isSignup ? "Sign In" : "Sign Up";
  document.getElementById("authError").textContent = "";
}

function authSubmit(){
  const email = document.getElementById("authEmail").value.trim().toLowerCase();
  const pass  = document.getElementById("authPassword").value;
  const pass2 = document.getElementById("authPassword2").value;
  const errEl = document.getElementById("authError");
  errEl.textContent = "";

  if(!email || !pass){ errEl.textContent = t("errFill"); return; }
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){ errEl.textContent = t("errEmail"); return; }

  const users = getUsers();

  if(authMode==="signup"){
    if(pass.length < 6){ errEl.textContent = t("errShort"); return; }
    if(pass !== pass2){ errEl.textContent = t("errMatch"); return; }
    if(users[email]){ errEl.textContent = t("errExists"); return; }
    users[email] = { password: pass };
    saveUsers(users);
  } else {
    if(!users[email] || users[email].password !== pass){
      errEl.textContent = t("errCreds"); return;
    }
  }

  currentUser = email;
  localStorage.setItem("auth_session", email);
  document.getElementById("authOverlay").classList.remove("show");
  document.getElementById("userBar").classList.add("show");
  showBottomNav(email);
  requestNotifPermission();
  renderTasks(getTasks());
}

function signOut(){
  currentUser = null;
  localStorage.removeItem("auth_session");
  document.getElementById("authOverlay").classList.add("show");
  document.getElementById("userBar").classList.remove("show");
  document.getElementById("bottomNav").classList.remove("show");
  document.getElementById("menuBtn").classList.remove("show");
  document.getElementById("liveClock").classList.remove("show");
  closeDrawer();
  document.getElementById("profilePage").classList.remove("show");
  document.querySelector(".container").style.display = "block";
  document.getElementById("authEmail").value = "";
  document.getElementById("authPassword").value = "";
  document.getElementById("authPassword2").value = "";
  document.getElementById("authError").textContent = "";
  if(authMode !== "signin") toggleAuthMode();
}

// restore session
(function(){
  const saved = localStorage.getItem("auth_session");
  if(saved && getUsers()[saved]){
    currentUser = saved;
    document.getElementById("authOverlay").classList.remove("show");
    document.getElementById("userBar").classList.add("show");
    showBottomNav(saved);
  }
})();

// ===== LIVE CLOCK =====
let _clockInterval = null;

function startLiveClock(){
  document.getElementById("liveClock").classList.add("show");
}

function _tickClock(){
  const now = new Date();
  const hh = now.getHours().toString().padStart(2,"0");
  const mm = now.getMinutes().toString().padStart(2,"0");
  const ss = now.getSeconds().toString().padStart(2,"0");
  const days   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const timeEl = document.getElementById("liveClockTime");
  const dateEl = document.getElementById("liveClockDate");
  if(timeEl) timeEl.textContent = hh+":"+mm+":"+ss;
  if(dateEl) dateEl.textContent = days[now.getDay()]+", "+now.getDate()+" "+months[now.getMonth()]+" "+now.getFullYear();
}
// Tick immediately and every second — always on, visibility controlled by CSS
_tickClock();
_clockInterval = setInterval(_tickClock, 1000);

// ===== DRAWER =====
function toggleDrawer(){
  document.getElementById("navDrawer").classList.toggle("open");
  document.getElementById("drawerOverlay").classList.toggle("open");
}
function closeDrawer(){
  document.getElementById("navDrawer").classList.remove("open");
  document.getElementById("drawerOverlay").classList.remove("open");
}

// ===== NAV =====
function showBottomNav(email){
  const letter = email.charAt(0).toUpperCase();
  document.getElementById("navAvatarLetter").textContent = letter;
  document.getElementById("bottomNav").classList.add("show");
  document.getElementById("menuBtn").classList.add("show");
  document.getElementById("drawerUserEmail").textContent = email;
  updateNotifBadge();
  updateNavAvatar();
  updateDrawerName();
  startLiveClock();
  showPage("home");
}

function showPage(page){
  const pages = {
    home: document.querySelector(".container"),
    profile: document.getElementById("profilePage"),
    notifications: document.getElementById("notificationsPage"),
    zikr: document.getElementById("zikrPage"),
    rate: document.getElementById("ratePage"),
    feedback: document.getElementById("feedbackPage"),
    about: document.getElementById("aboutPage"),
    settings: document.getElementById("settingsPage")
  };
  Object.keys(pages).forEach(k => {
    if(k === "home") pages[k].style.display = page==="home" ? "block" : "none";
    else pages[k].classList.toggle("show", k === page);
  });
  document.getElementById("navHome").classList.toggle("active", page==="home");
  document.getElementById("navProfile").classList.toggle("active", page==="profile");

  if(page==="profile"){
    const letter = currentUser.charAt(0).toUpperCase();
    const avatarEl = document.getElementById("profileAvatarBig");
    const savedPhoto = localStorage.getItem("avatar_"+currentUser);
    if(savedPhoto){
      avatarEl.innerHTML = `<img src="${savedPhoto}" alt="avatar">`;
    } else {
      avatarEl.textContent = letter;
    }
    // display name
    const name = getDisplayName(currentUser);
    document.getElementById("profileDisplayName").textContent = name;
    document.getElementById("profNewName").value = name;
    document.getElementById("profileEmailText").textContent = currentUser;
    const tasks = getTasks();
    const done = tasks.filter(t=>t.done).length;
    document.getElementById("statTotal").textContent = tasks.length;
    document.getElementById("statDone").textContent = done;
    document.getElementById("statPending").textContent = tasks.length - done;
    ["profCurrentPass","profNewPass","profConfirmPass"].forEach(id=>{ document.getElementById(id).value=""; });
    document.getElementById("profMsg").textContent="";
    document.getElementById("profMsg").className="profile-msg";
    document.getElementById("profNameMsg").textContent="";
    document.getElementById("profNameMsg").className="profile-msg";
  }
  if(page==="notifications") renderNotifications();
  if(page==="zikr") renderZikr();
  if(page==="settings") syncSettingsPage();
}

// ===== PROFILE =====
function handleAvatarUpload(e){
  const file = e.target.files[0];
  if(!file) return;
  if(file.size > 2 * 1024 * 1024){ alert("Image must be under 2MB."); return; }
  const reader = new FileReader();
  reader.onload = function(ev){
    const dataUrl = ev.target.result;
    localStorage.setItem("avatar_"+currentUser, dataUrl);
    // update avatar display
    const avatarEl = document.getElementById("profileAvatarBig");
    avatarEl.innerHTML = `<img src="${dataUrl}" alt="avatar">`;
    // update bottom nav avatar
    updateNavAvatar();
  };
  reader.readAsDataURL(file);
}

function updateNavAvatar(){
  const saved = localStorage.getItem("avatar_"+currentUser);
  const navAvatar = document.getElementById("navAvatarLetter");
  if(saved){
    navAvatar.innerHTML = `<img src="${saved}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" alt="">`;
  } else {
    navAvatar.textContent = currentUser.charAt(0).toUpperCase();
  }
}

function getDisplayName(email){
  return localStorage.getItem("displayName_"+email) || "";
}
function saveDisplayName(email, name){
  localStorage.setItem("displayName_"+email, name);
}

function changeName(){
  const nameVal = document.getElementById("profNewName").value.trim();
  const msgEl   = document.getElementById("profNameMsg");
  msgEl.className = "profile-msg";
  if(!nameVal){ msgEl.className="profile-msg err"; msgEl.textContent="Please enter a name."; return; }
  saveDisplayName(currentUser, nameVal);
  // update display
  document.getElementById("profileDisplayName").textContent = nameVal;
  updateDrawerName();
  document.getElementById("profNewName").value = "";
  msgEl.className = "profile-msg ok";
  msgEl.textContent = "✅ Name updated!";
  setTimeout(()=>{ msgEl.textContent=""; }, 3000);
}

function updateDrawerName(){
  const name = getDisplayName(currentUser);
  const emailEl = document.getElementById("drawerUserEmail");
  if(name){
    emailEl.innerHTML = "<strong style='display:block;font-size:0.95rem;opacity:0.85;'>"+name+"</strong><span>"+currentUser+"</span>";
  } else {
    emailEl.textContent = currentUser;
  }
}

function changePassword(){
  const current = document.getElementById("profCurrentPass").value;
  const newPass  = document.getElementById("profNewPass").value;
  const confirm  = document.getElementById("profConfirmPass").value;
  const msgEl    = document.getElementById("profMsg");
  msgEl.className = "profile-msg";

  const users = getUsers();
  if(!users[currentUser] || users[currentUser].password !== current){
    msgEl.className = "profile-msg err";
    msgEl.textContent = "Current password is incorrect."; return;
  }
  if(newPass.length < 6){
    msgEl.className = "profile-msg err";
    msgEl.textContent = "New password must be at least 6 characters."; return;
  }
  if(newPass !== confirm){
    msgEl.className = "profile-msg err";
    msgEl.textContent = "Passwords do not match."; return;
  }
  users[currentUser].password = newPass;
  saveUsers(users);
  ["profCurrentPass","profNewPass","profConfirmPass"].forEach(id=>{ document.getElementById(id).value=""; });
  msgEl.className = "profile-msg ok";
  msgEl.textContent = "✅ Password changed successfully!";
  setTimeout(()=>{ msgEl.textContent=""; }, 3000);
}

// ===== NOTIFICATIONS =====
function getNotifs(){ return JSON.parse(localStorage.getItem("notifs_"+currentUser))||[]; }
function saveNotifs(n){ localStorage.setItem("notifs_"+currentUser, JSON.stringify(n)); }

function addNotif(msg){
  const notifs = getNotifs();
  notifs.unshift({ msg, time: new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}), read: false });
  saveNotifs(notifs);
  updateNotifBadge();
}

function updateNotifBadge(){
  const unread = getNotifs().filter(n=>!n.read).length;
  let badge = document.getElementById("notifBadge");
  if(unread > 0){
    if(!badge){
      badge = document.createElement("span");
      badge.id = "notifBadge";
      badge.className = "drawer-badge";
      document.getElementById("notifDrawerBtn").appendChild(badge);
    }
    badge.textContent = unread;
  } else if(badge){ badge.remove(); }
}

function renderNotifications(){
  const notifs = getNotifs();
  const list = document.getElementById("notifList");
  // mark all read
  notifs.forEach(n=>n.read=true);
  saveNotifs(notifs);
  updateNotifBadge();
  if(!notifs.length){ list.innerHTML='<p class="notif-empty">'+t("notifEmpty")+'</p>'; return; }
  list.innerHTML = notifs.map(n=>`
    <div class="notif-item">
      <div class="notif-icon"><svg viewBox="0 0 24 24"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg></div>
      <div class="notif-text"><strong>${n.msg}</strong><span>${n.time}</span></div>
    </div>`).join("");
}

function clearNotifications(){
  if(!confirm("Clear all notifications?")) return;
  saveNotifs([]);
  updateNotifBadge();
  document.getElementById("notifList").innerHTML = '<p class="notif-empty">'+t("notifEmpty")+'</p>';
}

// ===== ZIKR =====
const ZIKR_CATS = [
  { emoji:"🤲", key:"salah",
    names:{ en:"Duas after Salah", ar:"أدعية بعد الصلاة", om:"Kadhannaa Booda Salaataa" },
    items:[
      { arabic:"اللّٰهُ أَكْبَرُ", trans:"Allahu Akbar", note:"Immediately after Tasleem", target:1 },
      { arabic:"أَسْتَغْفِرُ اللّٰهَ", trans:"Astaghfirullah", note:"After every Fard Salah", target:3 },
      { arabic:"اللّٰهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ", trans:"Allahumma antas-salam — O Allah, You are As-Salam and from You is all peace, blessed are You O Possessor of majesty and honour", note:"After every Fard Salah", target:1 },
      { arabic:"اللّٰهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ", trans:"Allahumma aa'inni ala dhik-rika — O Allah, help me to remember You, to be grateful to You, and to worship You in an excellent manner", note:"After every Fard Salah", target:1 },
      { arabic:"لَا إِلٰهَ إِلَّا اللّٰهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ", trans:"La ilaha illallahu wahdahu la sharee kalah — None has the right to be worshipped except Allah, alone, without partner. To Him belongs all sovereignty and praise, and He is over all things omnipotent", note:"After every Fard Salah", target:1 },
      { arabic:"سُبْحَانَ اللّٰهِ (٣٣) الْحَمْدُ لِلّٰهِ (٣٣) اللّٰهُ أَكْبَرُ (٣٣)", trans:"Subhan Allah, Alhamdulillah, Allahu Akbar — Glory be to Allah, All praise is due to Allah, Allah is the Greatest", note:"33 times each followed by once", target:33 },
      { arabic:"لَا إِلٰهَ إِلَّا اللّٰهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ", trans:"La ilaha illallahu wahdahu la sharee kalah — None has the right to be worshipped except Allah alone", note:"After Fajr and Maghrib only", target:10 },
      { arabic:"آيَةُ الْكُرْسِيِّ — اللّٰهُ لَا إِلٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَنْ ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ", trans:"Ayatul Kursi — Allah! There is no god but He, the Living, the Self-subsisting, Eternal. No slumber can seize Him nor sleep. His are all things in the heavens and on earth.", note:"After every Fard Salah", target:1 },
    ]
  },
  { emoji:"🌅", key:"morning",
    names:{ en:"Morning Adhkar", ar:"أذكار الصباح", om:"Zikrii Ganama" },
    items:[
      { arabic:"بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيمِ ۝ الْحَمْدُ لِلّٰهِ رَبِّ الْعَالَمِينَ ۝ الرَّحْمٰنِ الرَّحِيمِ ۝ مَالِكِ يَوْمِ الدِّينِ ۝ إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ ۝ اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ ۝ صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ", trans:"Al Fateha: Alhamdu lillaahi rabbil — In the name of Allah, the Most Gracious, the Most Merciful. All praise is due to Allah, Lord of all the worlds...", note:"Between Subhe-Sadik to Sunrise", target:1 },
      { arabic:"الٓمٓ ۝ ذٰلِكَ الْكِتَابُ لَا رَيْبَ فِيهِ هُدًى لِّلْمُتَّقِينَ", trans:"Alif Laam Meem — This is the Book about which there is no doubt, a guidance for those conscious of Allah", note:"Between Subhe-Sadik to Sunrise", target:1 },
      { arabic:"اللّٰهُ لَا إِلٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَنْ ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ", trans:"Ayatul Kursi: Allahu laa ilaaha — Allah! There is no god but He, the Living, the Self-subsisting, Eternal...", note:"Between Subhe-Sadik to Sunrise", target:1 },
      { arabic:"لَا إِكْرَاهَ فِي الدِّينِ ۖ قَد تَّبَيَّنَ الرُّشْدُ مِنَ الْغَيِّ ۚ فَمَن يَكْفُرْ بِالطَّاغُوتِ وَيُؤْمِن بِاللّٰهِ فَقَدِ اسْتَمْسَكَ بِالْعُرْوَةِ الْوُثْقَىٰ لَا انفِصَامَ لَهَا ۗ وَاللّٰهُ سَمِيعٌ عَلِيمٌ", trans:"Laa ik'raaha fid-deen — There is no compulsion in religion. The right course has become clear from the wrong...", note:"Between Subhe-Sadik to Sunrise", target:1 },
      { arabic:"اللّٰهُ وَلِيُّ الَّذِينَ آمَنُوا يُخْرِجُهُم مِّنَ الظُّلُمَاتِ إِلَى النُّورِ ۖ وَالَّذِينَ كَفَرُوا أَوْلِيَاؤُهُمُ الطَّاغُوتُ يُخْرِجُونَهُم مِّنَ النُّورِ إِلَى الظُّلُمَاتِ ۗ أُولَٰئِكَ أَصْحَابُ النَّارِ ۖ هُمْ فِيهَا خَالِدُونَ", trans:"Allahu wali-yyul ladhina aa'manu — Allah is the ally of those who believe. He brings them out from darknesses into the light...", note:"Between Subhe-Sadik to Sunrise", target:1 },
      { arabic:"لِلّٰهِ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ وَإِن تُبْدُوا مَا فِي أَنفُسِكُمْ أَوْ تُخْفُوهُ يُحَاسِبْكُم بِهِ اللّٰهُ ۖ فَيَغْفِرُ لِمَن يَشَاءُ وَيُعَذِّبُ مَن يَشَاءُ ۗ وَاللّٰهُ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ", trans:"Lillaahi maa fis-samaawaati — To Allah belongs whatever is in the heavens and whatever is in the earth...", note:"Between Subhe-Sadik to Sunrise", target:1 },
      { arabic:"آمَنَ الرَّسُولُ بِمَا أُنزِلَ إِلَيْهِ مِن رَّبِّهِ وَالْمُؤْمِنُونَ ۚ كُلٌّ آمَنَ بِاللّٰهِ وَمَلَائِكَتِهِ وَكُتُبِهِ وَرُسُلِهِ لَا نُفَرِّقُ بَيْنَ أَحَدٍ مِّن رُّسُلِهِ ۚ وَقَالُوا سَمِعْنَا وَأَطَعْنَا ۖ غُفْرَانَكَ رَبَّنَا وَإِلَيْكَ الْمَصِيرُ", trans:"Aa-manar rasulu bimaa un'zila — The Messenger has believed in what was revealed to him from his Lord, and so have the believers...", note:"Between Subhe-Sadik to Sunrise", target:1 },
      { arabic:"لَا يُكَلِّفُ اللّٰهُ نَفْسًا إِلَّا وُسْعَهَا ۚ لَهَا مَا كَسَبَتْ وَعَلَيْهَا مَا اكْتَسَبَتْ ۗ رَبَّنَا لَا تُؤَاخِذْنَا إِن نَّسِينَا أَوْ أَخْطَأْنَا ۚ رَبَّنَا وَلَا تَحْمِلْ عَلَيْنَا إِصْرًا كَمَا حَمَلْتَهُ عَلَى الَّذِينَ مِن قَبْلِنَا ۚ رَبَّنَا وَلَا تُحَمِّلْنَا مَا لَا طَاقَةَ لَنَا بِهِ ۖ وَاعْفُ عَنَّا وَاغْفِرْ لَنَا وَارْحَمْنَا ۚ أَنتَ مَوْلَانَا فَانصُرْنَا عَلَى الْقَوْمِ الْكَافِرِينَ", trans:"Laa yukalliful-laahu nafsan illaa — Allah does not burden a soul beyond that it can bear...", note:"Between Subhe-Sadik to Sunrise", target:1 },
      { arabic:"بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيمِ ۝ قُلْ هُوَ اللّٰهُ أَحَدٌ ۝ اللّٰهُ الصَّمَدُ ۝ لَمْ يَلِدْ وَلَمْ يُولَدْ ۝ وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ", trans:"Sura Ikhlas: Qul hu'wallaa-hu ahad — Say: He is Allah, the One. Allah, the Eternal Refuge. He neither begets nor is born, nor is there to Him any equivalent", note:"Between Subhe-Sadik to Sunrise", target:3 },
      { arabic:"بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيمِ ۝ قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ ۝ مِن شَرِّ مَا خَلَقَ ۝ وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ ۝ وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ ۝ وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ", trans:"Sura Falaq: Qul a'udhubi rabbil falaq — Say: I seek refuge in the Lord of daybreak, from the evil of that which He created...", note:"Between Subhe-Sadik to Sunrise", target:3 },
      { arabic:"بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيمِ ۝ قُلْ أَعُوذُ بِرَبِّ النَّاسِ ۝ مَلِكِ النَّاسِ ۝ إِلٰهِ النَّاسِ ۝ مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ ۝ الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ ۝ مِنَ الْجِنَّةِ وَالنَّاسِ", trans:"Sura Nas: Qul a'udhubi rabbin naas — Say: I seek refuge in the Lord of mankind, the Sovereign of mankind, the God of mankind...", note:"Between Subhe-Sadik to Sunrise", target:3 },
    ]
  },
  { emoji:"🌇", key:"evening",
    names:{ en:"Evening Adhkar", ar:"أذكار المساء", om:"Zikrii Galgalaa" },
    items:[
      { arabic:"بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيمِ ۝ الْحَمْدُ لِلّٰهِ رَبِّ الْعَالَمِينَ ۝ الرَّحْمٰنِ الرَّحِيمِ ۝ مَالِكِ يَوْمِ الدِّينِ ۝ إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ ۝ اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ ۝ صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ", trans:"Al Fateha: Alhamdu lillaahi rabbil — In the name of Allah, the Most Gracious, the Most Merciful. All praise is due to Allah, Lord of all the worlds...", note:"Between Asr to Maghrib", target:1 },
      { arabic:"الٓمٓ ۝ ذٰلِكَ الْكِتَابُ لَا رَيْبَ فِيهِ هُدًى لِّلْمُتَّقِينَ ۝ الَّذِينَ يُؤْمِنُونَ بِالْغَيْبِ وَيُقِيمُونَ الصَّلَوٰةَ وَمِمَّا رَزَقْنَاهُمْ يُنفِقُونَ ۝ وَالَّذِينَ يُؤْمِنُونَ بِمَا أُنزِلَ إِلَيْكَ وَمَا أُنزِلَ مِن قَبْلِكَ وَبِالْآخِرَةِ هُمْ يُوقِنُونَ ۝ أُولَٰئِكَ عَلَىٰ هُدًى مِّن رَّبِّهِمْ ۖ وَأُولَٰئِكَ هُمُ الْمُفْلِحُونَ", trans:"Alif Laam Meem — This is the Book about which there is no doubt, a guidance for those conscious of Allah...", note:"Between Asr to Maghrib", target:1 },
      { arabic:"اللّٰهُ لَا إِلٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَنْ ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ", trans:"Ayatul Kursi: Allahu laa ilaaha — Allah! There is no god but He, the Living, the Self-subsisting, Eternal...", note:"Between Asr to Maghrib", target:1 },
      { arabic:"لَا إِكْرَاهَ فِي الدِّينِ ۖ قَد تَّبَيَّنَ الرُّشْدُ مِنَ الْغَيِّ ۚ فَمَن يَكْفُرْ بِالطَّاغُوتِ وَيُؤْمِن بِاللّٰهِ فَقَدِ اسْتَمْسَكَ بِالْعُرْوَةِ الْوُثْقَىٰ لَا انفِصَامَ لَهَا ۗ وَاللّٰهُ سَمِيعٌ عَلِيمٌ", trans:"Laa ik'raaha fid-deen — There is no compulsion in religion. The right course has become clear from the wrong...", note:"Between Asr to Maghrib", target:1 },
      { arabic:"اللّٰهُ وَلِيُّ الَّذِينَ آمَنُوا يُخْرِجُهُم مِّنَ الظُّلُمَاتِ إِلَى النُّورِ ۖ وَالَّذِينَ كَفَرُوا أَوْلِيَاؤُهُمُ الطَّاغُوتُ يُخْرِجُونَهُم مِّنَ النُّورِ إِلَى الظُّلُمَاتِ ۗ أُولَٰئِكَ أَصْحَابُ النَّارِ ۖ هُمْ فِيهَا خَالِدُونَ", trans:"Allahu wali-yyul ladhina aa'manu — Allah is the ally of those who believe. He brings them out from darknesses into the light...", note:"Between Asr to Maghrib", target:1 },
      { arabic:"لِلّٰهِ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ وَإِن تُبْدُوا مَا فِي أَنفُسِكُمْ أَوْ تُخْفُوهُ يُحَاسِبْكُم بِهِ اللّٰهُ ۖ فَيَغْفِرُ لِمَن يَشَاءُ وَيُعَذِّبُ مَن يَشَاءُ ۗ وَاللّٰهُ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ", trans:"Lillaahi maa fis-samaawaati — To Allah belongs whatever is in the heavens and whatever is in the earth...", note:"Between Asr to Maghrib", target:1 },
      { arabic:"آمَنَ الرَّسُولُ بِمَا أُنزِلَ إِلَيْهِ مِن رَّبِّهِ وَالْمُؤْمِنُونَ ۚ كُلٌّ آمَنَ بِاللّٰهِ وَمَلَائِكَتِهِ وَكُتُبِهِ وَرُسُلِهِ لَا نُفَرِّقُ بَيْنَ أَحَدٍ مِّن رُّسُلِهِ ۚ وَقَالُوا سَمِعْنَا وَأَطَعْنَا ۖ غُفْرَانَكَ رَبَّنَا وَإِلَيْكَ الْمَصِيرُ", trans:"Aa-manar rasulu bimaa un'zila — The Messenger has believed in what was revealed to him from his Lord, and so have the believers...", note:"Between Asr to Maghrib", target:1 },
      { arabic:"لَا يُكَلِّفُ اللّٰهُ نَفْسًا إِلَّا وُسْعَهَا ۚ لَهَا مَا كَسَبَتْ وَعَلَيْهَا مَا اكْتَسَبَتْ ۗ رَبَّنَا لَا تُؤَاخِذْنَا إِن نَّسِينَا أَوْ أَخْطَأْنَا ۚ رَبَّنَا وَلَا تَحْمِلْ عَلَيْنَا إِصْرًا كَمَا حَمَلْتَهُ عَلَى الَّذِينَ مِن قَبْلِنَا ۚ رَبَّنَا وَلَا تُحَمِّلْنَا مَا لَا طَاقَةَ لَنَا بِهِ ۖ وَاعْفُ عَنَّا وَاغْفِرْ لَنَا وَارْحَمْنَا ۚ أَنتَ مَوْلَانَا فَانصُرْنَا عَلَى الْقَوْمِ الْكَافِرِينَ", trans:"Laa yukalliful-laahu nafsan illaa — Allah does not burden a soul beyond that it can bear...", note:"Between Asr to Maghrib", target:1 },
      { arabic:"بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيمِ ۝ قُلْ هُوَ اللّٰهُ أَحَدٌ ۝ اللّٰهُ الصَّمَدُ ۝ لَمْ يَلِدْ وَلَمْ يُولَدْ ۝ وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ", trans:"Sura Ikhlas: Qul hu'wallaa-hu ahad — Say: He is Allah, the One. Allah, the Eternal Refuge...", note:"Between Asr to Maghrib", target:3 },
      { arabic:"بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيمِ ۝ قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ ۝ مِن شَرِّ مَا خَلَقَ ۝ وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ ۝ وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ ۝ وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ", trans:"Sura Falaq: Qul a'udhubi rabbil falaq — Say: I seek refuge in the Lord of daybreak...", note:"Between Asr to Maghrib", target:3 },
      { arabic:"بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيمِ ۝ قُلْ أَعُوذُ بِرَبِّ النَّاسِ ۝ مَلِكِ النَّاسِ ۝ إِلٰهِ النَّاسِ ۝ مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ ۝ الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ ۝ مِنَ الْجِنَّةِ وَالنَّاسِ", trans:"Sura Nas: Qul a'udhubi rabbin naas — Say: I seek refuge in the Lord of mankind...", note:"Between Asr to Maghrib", target:3 },
    ]
  },
  { emoji:"🌙", key:"sleep",
    names:{ en:"Duas before Sleep", ar:"أدعية قبل النوم", om:"Kadhannaa Dura Hirriba" },
    items:[
      { arabic:"سُبْحَانَ اللّٰهِ (٣٣) الْحَمْدُ لِلّٰهِ (٣٣) اللّٰهُ أَكْبَرُ (٣٤)", trans:"Subhan Allah, Alhamdulillah, Allahu Akbar — Glory be to Allah (33), All praise to Allah (33), Allah is the Greatest (34)", note:"Dhikr before Sleeping", target:33 },
      { arabic:"بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيمِ ۝ قُلْ هُوَ اللّٰهُ أَحَدٌ ۝ اللّٰهُ الصَّمَدُ ۝ لَمْ يَلِدْ وَلَمْ يُولَدْ ۝ وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ", trans:"Qul hu'wallaa-hu ahad — Say: He is Allah, the One. Allah, the Eternal Refuge. He neither begets nor is born, nor is there to Him any equivalent", note:"Blowing into the palms 1", target:3 },
      { arabic:"بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيمِ ۝ قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ ۝ مِن شَرِّ مَا خَلَقَ ۝ وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ ۝ وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ ۝ وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ", trans:"Qul a'udhubi rabbil falaq — Say: I seek refuge in the Lord of daybreak, from the evil of that which He created...", note:"Blowing into the palms 2", target:3 },
      { arabic:"بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيمِ ۝ قُلْ أَعُوذُ بِرَبِّ النَّاسِ ۝ مَلِكِ النَّاسِ ۝ إِلٰهِ النَّاسِ ۝ مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ ۝ الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ ۝ مِنَ الْجِنَّةِ وَالنَّاسِ", trans:"Qul a'udhubi rab'binn naas — Say: I seek refuge in the Lord of mankind, the Sovereign of mankind, the God of mankind...", note:"Blowing into the palms 3", target:3 },
      { arabic:"اللّٰهُ لَا إِلٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَنْ ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ", trans:"Ayatul Kursi: Allahu laa ilaaha — Allah! There is no god but He, the Living, the Self-subsisting, Eternal...", note:"Ayatul Kursi", target:1 },
      { arabic:"آمَنَ الرَّسُولُ بِمَا أُنزِلَ إِلَيْهِ مِن رَّبِّهِ وَالْمُؤْمِنُونَ ۚ كُلٌّ آمَنَ بِاللّٰهِ وَمَلَائِكَتِهِ وَكُتُبِهِ وَرُسُلِهِ لَا نُفَرِّقُ بَيْنَ أَحَدٍ مِّن رُّسُلِهِ ۚ وَقَالُوا سَمِعْنَا وَأَطَعْنَا ۖ غُفْرَانَكَ رَبَّنَا وَإِلَيْكَ الْمَصِيرُ", trans:"Aa-manar rasulu bimaa un'zila — The Messenger has believed in what was revealed to him from his Lord, and so have the believers...", note:"Al Baqarah 285", target:1 },
      { arabic:"لَا يُكَلِّفُ اللّٰهُ نَفْسًا إِلَّا وُسْعَهَا ۚ لَهَا مَا كَسَبَتْ وَعَلَيْهَا مَا اكْتَسَبَتْ ۗ رَبَّنَا لَا تُؤَاخِذْنَا إِن نَّسِينَا أَوْ أَخْطَأْنَا ۚ رَبَّنَا وَلَا تَحْمِلْ عَلَيْنَا إِصْرًا كَمَا حَمَلْتَهُ عَلَى الَّذِينَ مِن قَبْلِنَا ۚ رَبَّنَا وَلَا تُحَمِّلْنَا مَا لَا طَاقَةَ لَنَا بِهِ ۖ وَاعْفُ عَنَّا وَاغْفِرْ لَنَا وَارْحَمْنَا ۚ أَنتَ مَوْلَانَا فَانصُرْنَا عَلَى الْقَوْمِ الْكَافِرِينَ", trans:"Laa yukalliful-laahu nafsan illaa — Allah does not burden a soul beyond that it can bear...", note:"Al Baqarah 286", target:1 },
      { arabic:"بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيمِ ۝ قُلْ يَا أَيُّهَا الْكَافِرُونَ ۝ لَا أَعْبُدُ مَا تَعْبُدُونَ ۝ وَلَا أَنتُمْ عَابِدُونَ مَا أَعْبُدُ ۝ وَلَا أَنَا عَابِدٌ مَّا عَبَدتُّمْ ۝ وَلَا أَنتُمْ عَابِدُونَ مَا أَعْبُدُ ۝ لَكُمْ دِينُكُمْ وَلِيَ دِينِ", trans:"Qul yaaa-ayyuhal kaafiroon — Say: O disbelievers, I do not worship what you worship, nor are you worshippers of what I worship...", note:"Surah al-Kafirun", target:1 },
    ]
  },
  { emoji:"📿", key:"daily",
    names:{ en:"Daily Duas", ar:"الأدعية اليومية", om:"Kadhannaa Guyyaa Guyyaa" },
    items:[
      { arabic:"اللّٰهُمَّ بِاسْمِكَ أَمُوتُ وَأَحْيَا", trans:"Upon Going to Sleep — Allahumma bis'mika amuu'tu — O Allah, in Your name I die and I live", note:"Upon Going to Sleep", target:1 },
      { arabic:"الْحَمْدُ لِلّٰهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ", trans:"Wake up from Sleep — Alhamdulillah hil'ladhi ah'yaana — All praise is due to Allah who gave us life after death and to Him is the resurrection", note:"Wake up from Sleep", target:1 },
      { arabic:"بِسْمِ اللّٰهِ تَوَكَّلْتُ عَلَى اللّٰهِ وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللّٰهِ", trans:"When Leaving Home — Bismillah, Tawakkaltu alal'lah — In the name of Allah, I place my trust in Allah, and there is no might nor power except with Allah", note:"When Leaving Home", target:1 },
      { arabic:"بِسْمِ اللّٰهِ وَلَجْنَا وَبِسْمِ اللّٰهِ خَرَجْنَا وَعَلَى اللّٰهِ رَبِّنَا تَوَكَّلْنَا", trans:"When Entering Home — Bismillahi walajnaa, Wa-bismillahi — In the name of Allah we enter, in the name of Allah we leave, and upon our Lord we place our trust", note:"When Entering Home", target:1 },
      { arabic:"اللّٰهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْخُبُثِ وَالْخَبَائِثِ", trans:"Entering the Toilet — Allahumma innee A'oodhu-bika minal — O Allah, I seek refuge in You from the male and female evil ones", note:"Entering the Toilet", target:1 },
      { arabic:"غُفْرَانَكَ", trans:"Leaving the Toilet — Ghufranak — I seek Your forgiveness", note:"Leaving the Toilet", target:1 },
      { arabic:"بِسْمِ اللّٰهِ", trans:"Before the Meals — Bismillah — In the name of Allah", note:"Before the Meals", target:1 },
      { arabic:"بِسْمِ اللّٰهِ فِي أَوَّلِهِ وَآخِرِهِ", trans:"Forgetting to recite Bismillah — Bismillahi fe aw'wa-lihee wa aa'khirih — In the name of Allah at its beginning and at its end", note:"Forgetting to recite Bismillah", target:1 },
      { arabic:"الْحَمْدُ لِلّٰهِ الَّذِي أَطْعَمَنِي هَذَا وَرَزَقَنِيهِ مِنْ غَيْرِ حَوْلٍ مِنِّي وَلَا قُوَّةٍ", trans:"After meals (Dua 1) — Alhamdulillah hil-ladhee at'amanee — All praise is due to Allah who fed me this and provided it for me without any might or power on my part", note:"After meals", target:1 },
      { arabic:"الْحَمْدُ لِلّٰهِ الَّذِي أَطْعَمَنَا وَسَقَانَا وَجَعَلَنَا مُسْلِمِينَ", trans:"After meals (Dua 2) — All praise is due to Allah who fed us, gave us drink, and made us Muslims", note:"After meals", target:1 },
      { arabic:"اللّٰهُمَّ بَارِكْ لَنَا فِيهِ وَأَطْعِمْنَا خَيْرًا مِنْهُ", trans:"After meals (Dua 3) — Allahumma baarik lana feehi — O Allah, bless it for us and feed us better than it", note:"After meals", target:1 },
      { arabic:"بِسْمِ اللّٰهِ وَعَلَى بَرَكَةِ اللّٰهِ", trans:"Start of Wudu — Bismillaahir Rahmaa-nir Raheem — In the name of Allah and with the blessings of Allah", note:"Start of Wudu", target:1 },
      { arabic:"أَشْهَدُ أَنْ لَا إِلٰهَ إِلَّا اللّٰهُ وَحْدَهُ لَا شَرِيكَ لَهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ", trans:"Completion of Wudu — Ash'hadu al'laa ilaaha illallahu — I bear witness that there is no god but Allah alone, with no partner, and I bear witness that Muhammad is His servant and messenger", note:"Completion of Wudu", target:1 },
      { arabic:"بِسْمِ اللّٰهِ وَالصَّلَاةُ وَالسَّلَامُ عَلَى رَسُولِ اللّٰهِ، اللّٰهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ", trans:"Entering the Masjid — Bismillah, Was'salaatu was'salamu — In the name of Allah, and peace and blessings upon the Messenger of Allah. O Allah, open for me the doors of Your mercy", note:"Entering the Masjid", target:1 },
      { arabic:"بِسْمِ اللّٰهِ وَالصَّلَاةُ وَالسَّلَامُ عَلَى رَسُولِ اللّٰهِ، اللّٰهُمَّ إِنِّي أَسْأَلُكَ مِنْ فَضْلِكَ", trans:"Leaving the Masjid — Bismillah, Was'salaatu was'salamu ala — In the name of Allah, and peace and blessings upon the Messenger of Allah. O Allah, I ask You of Your bounty", note:"Leaving the Masjid", target:1 },
      { arabic:"اللّٰهُ أَكْبَرُ اللّٰهُ أَكْبَرُ، أَشْهَدُ أَنْ لَا إِلٰهَ إِلَّا اللّٰهُ", trans:"Answering the Adhan — Allahu Akbar Allahu Akbar — Repeat after the muadhdhin what he says", note:"Answering the Adhan", target:1 },
      { arabic:"اللّٰهُمَّ رَبَّ هَذِهِ الدَّعْوَةِ التَّامَّةِ وَالصَّلَاةِ الْقَائِمَةِ آتِ مُحَمَّدًا الْوَسِيلَةَ وَالْفَضِيلَةَ", trans:"Dua after Adhaan — Allahumma rabba hadhi'hid — O Allah, Lord of this perfect call and the prayer to be offered, grant Muhammad the privilege and the eminence", note:"Dua after Adhaan", target:1 },
      { arabic:"اللّٰهُمَّ اهْدِنَا فِيمَنْ هَدَيْتَ وَعَافِنَا فِيمَنْ عَافَيْتَ وَتَوَلَّنَا فِيمَنْ تَوَلَّيْتَ وَبَارِكْ لَنَا فِيمَا أَعْطَيْتَ وَقِنَا شَرَّ مَا قَضَيْتَ", trans:"Dua Qunoot — O Allah, guide us among those You have guided, pardon us among those You have pardoned, befriend us among those You have befriended, bless us in what You have given us, and protect us from the evil of what You have decreed", note:"Dua Qunoot", target:1 },
      { arabic:"اللّٰهُمَّ اغْفِرْ لِحَيِّنَا وَمَيِّتِنَا وَشَاهِدِنَا وَغَائِبِنَا وَصَغِيرِنَا وَكَبِيرِنَا وَذَكَرِنَا وَأُنْثَانَا، اللّٰهُمَّ مَنْ أَحْيَيْتَهُ مِنَّا فَأَحْيِهِ عَلَى الْإِسْلَامِ، وَمَنْ تَوَفَّيْتَهُ مِنَّا فَتَوَفَّهُ عَلَى الْإِيمَانِ، اللّٰهُمَّ لَا تَحْرِمْنَا أَجْرَهُ وَلَا تُضِلَّنَا بَعْدَهُ", trans:"Janaza Prayer — Allahummagh fir'li hay'yinaa — O Allah, forgive our living and our dead, those present and those absent, our young and our old, our males and our females...", note:"Janaza Prayer", target:1 },
      { arabic:"السَّلَامُ عَلَيْكُمْ أَهْلَ الدِّيَارِ مِنَ الْمُؤْمِنِينَ وَالْمُسْلِمِينَ وَإِنَّا إِنْ شَاءَ اللّٰهُ بِكُمْ لَاحِقُونَ", trans:"Visiting the Graves — As'salamu alaykum ah'lad diyaari — Peace be upon you, O people of the dwellings, from among the believers and Muslims, and we will, if Allah wills, join you", note:"Visiting the Graves", target:1 },
      { arabic:"سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ وَإِنَّا إِلَى رَبِّنَا لَمُنْقَلِبُونَ", trans:"On Journey — Subhanal-ladhee sakh'kha ra'lanaa — Glory be to Him who has subjected this to us, and we could not have done it ourselves, and to our Lord we shall return", note:"On Journey", target:1 },
      { arabic:"سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ وَإِنَّا إِلَى رَبِّنَا لَمُنْقَلِبُونَ، اللّٰهُمَّ إِنَّا نَسْأَلُكَ فِي سَفَرِنَا هَذَا الْبِرَّ وَالتَّقْوَى", trans:"Return From Journey — Subhanal-ladhee sakh'kha ra'lanaa — Glory be to Him who subjected this to us... O Allah, we ask You in this journey for righteousness and piety", note:"Return From Journey", target:1 },
      { arabic:"الْحَمْدُ لِلّٰهِ", trans:"When Sneezing — Alhamdulillah — All praise is due to Allah", note:"When Sneezing", target:1 },
      { arabic:"يَرْحَمُكَ اللّٰهُ", trans:"When Hearing Someone Sneeze — Yaarha'muka Allah — May Allah have mercy on you", note:"When Hearing Someone Sneeze", target:1 },
      { arabic:"يَهْدِيكُمُ اللّٰهُ وَيُصْلِحُ بَالَكُمْ", trans:"Sneezers Replies Back — Yah'deeku-mullaahu wa yuslihu — May Allah guide you and set your affairs in order", note:"Sneezers Replies Back", target:1 },
    ]
  },
  { emoji:"📖", key:"rabbana",
    names:{ en:"40 Rabbana Duas", ar:"٤٠ دعاء ربنا", om:"Kadhannaa Rabbana 40" },
    items:[
      { arabic:"رَبَّنَا تَقَبَّلْ مِنَّا إِنَّكَ أَنتَ السَّمِيعُ الْعَلِيمُ", trans:"Rabbana taqabbal minna innaka — Our Lord, accept from us. Indeed You are the Hearing, the Knowing", note:"Rabanna Quranic Dua 1", target:1 },
      { arabic:"رَبَّنَا وَاجْعَلْنَا مُسْلِمَيْنِ لَكَ وَمِن ذُرِّيَّتِنَا أُمَّةً مُّسْلِمَةً لَّكَ", trans:"Rabbana wa-j'alna Muslimayni laka — Our Lord, make us Muslims submitting to You, and from our descendants a Muslim nation submitting to You", note:"Rabanna Quranic Dua 2", target:1 },
      { arabic:"رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ", trans:"Rabbana atina fid-dunya hasanatan — Our Lord, give us good in this world and good in the Hereafter and protect us from the punishment of the Fire", note:"Rabanna Quranic Dua 3", target:1 },
      { arabic:"رَبَّنَا أَفْرِغْ عَلَيْنَا صَبْرًا وَثَبِّتْ أَقْدَامَنَا وَانصُرْنَا عَلَى الْقَوْمِ الْكَافِرِينَ", trans:"Rabbana afrigh alayna sabran — Our Lord, pour upon us patience and plant firmly our feet and give us victory over the disbelieving people", note:"Rabanna Quranic Dua 4", target:1 },
      { arabic:"رَبَّنَا لَا تُؤَاخِذْنَا إِن نَّسِينَا أَوْ أَخْطَأْنَا", trans:"Rabbana la tu'akhidhna in-nasina — Our Lord, do not impose blame upon us if we forget or make an error", note:"Rabanna Quranic Dua 5", target:1 },
      { arabic:"رَبَّنَا وَلَا تَحْمِلْ عَلَيْنَا إِصْرًا كَمَا حَمَلْتَهُ عَلَى الَّذِينَ مِن قَبْلِنَا", trans:"Rabbana wala tahmil alayna isran — Our Lord, do not burden us as You burdened those before us", note:"Rabanna Quranic Dua 6", target:1 },
      { arabic:"رَبَّنَا وَلَا تُحَمِّلْنَا مَا لَا طَاقَةَ لَنَا بِهِ وَاعْفُ عَنَّا وَاغْفِرْ لَنَا وَارْحَمْنَا", trans:"Rabbana wala tuhammilna ma la taqata — Our Lord, do not burden us with that which we have no ability to bear. Pardon us, forgive us, and have mercy upon us", note:"Rabanna Quranic Dua 7", target:1 },
      { arabic:"رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا وَهَبْ لَنَا مِن لَّدُنكَ رَحْمَةً", trans:"Rabbana la tuzigh quloobana ba'da idh — Our Lord, do not let our hearts deviate after You have guided us and grant us from Yourself mercy", note:"Rabanna Quranic Dua 8", target:1 },
      { arabic:"رَبَّنَا إِنَّكَ جَامِعُ النَّاسِ لِيَوْمٍ لَّا رَيْبَ فِيهِ إِنَّ اللّٰهَ لَا يُخْلِفُ الْمِيعَادَ", trans:"Rabbana innaka jami'unnasi li-Yawmil — Our Lord, surely You will gather the people for a Day about which there is no doubt. Indeed, Allah does not fail in His promise", note:"Rabanna Quranic Dua 9", target:1 },
      { arabic:"رَبَّنَا إِنَّنَا آمَنَّا فَاغْفِرْ لَنَا ذُنُوبَنَا وَقِنَا عَذَابَ النَّارِ", trans:"Rabbana innana amanna faghfir lana — Our Lord, indeed we have believed, so forgive us our sins and protect us from the punishment of the Fire", note:"Rabanna Quranic Dua 10", target:1 },
      { arabic:"رَبَّنَا آمَنَّا بِمَا أَنزَلْتَ وَاتَّبَعْنَا الرَّسُولَ فَاكْتُبْنَا مَعَ الشَّاهِدِينَ", trans:"Rabbana amanna bima anzalta wattaba — Our Lord, we have believed in what You revealed and have followed the messenger, so register us among the witnesses", note:"Rabanna Quranic Dua 11", target:1 },
      { arabic:"رَبَّنَا اغْفِرْ لَنَا ذُنُوبَنَا وَإِسْرَافَنَا فِي أَمْرِنَا وَثَبِّتْ أَقْدَامَنَا وَانصُرْنَا عَلَى الْقَوْمِ الْكَافِرِينَ", trans:"Rabba-nag fir-lana dhunoo-bana — Our Lord, forgive us our sins and the excess in our affairs and plant firmly our feet and give us victory over the disbelieving people", note:"Rabanna Quranic Dua 12", target:1 },
      { arabic:"رَبَّنَا مَا خَلَقْتَ هَذَا بَاطِلًا سُبْحَانَكَ فَقِنَا عَذَابَ النَّارِ", trans:"Rabbana ma khalaqta hazha batila — Our Lord, You did not create this without purpose; exalted are You, so protect us from the punishment of the Fire", note:"Rabanna Quranic Dua 13", target:1 },
      { arabic:"رَبَّنَا إِنَّكَ مَن تُدْخِلِ النَّارَ فَقَدْ أَخْزَيْتَهُ وَمَا لِلظَّالِمِينَ مِنْ أَنصَارٍ", trans:"Rabbana innaka man tudkhilin nara — Our Lord, indeed whoever You admit to the Fire, You have disgraced him, and for the wrongdoers there are no helpers", note:"Rabanna Quranic Dua 14", target:1 },
      { arabic:"رَبَّنَا إِنَّنَا سَمِعْنَا مُنَادِيًا يُنَادِي لِلْإِيمَانِ أَنْ آمِنُوا بِرَبِّكُمْ فَآمَنَّا", trans:"Rabbana innana sami'na munadiyany — Our Lord, indeed we have heard a caller calling to faith, saying: Believe in your Lord, and we have believed", note:"Rabanna Quranic Dua 15", target:1 },
      { arabic:"رَبَّنَا فَاغْفِرْ لَنَا ذُنُوبَنَا وَكَفِّرْ عَنَّا سَيِّئَاتِنَا وَتَوَفَّنَا مَعَ الْأَبْرَارِ", trans:"Rabbana faghfir lana dhunoo-bana — Our Lord, so forgive us our sins and remove from us our misdeeds and cause us to die among the righteous", note:"Rabanna Quranic Dua 16", target:1 },
      { arabic:"رَبَّنَا وَآتِنَا مَا وَعَدتَّنَا عَلَى رُسُلِكَ وَلَا تُخْزِنَا يَوْمَ الْقِيَامَةِ", trans:"Rabbana wa atina ma wa'adtana ala — Our Lord, grant us what You promised us through Your messengers and do not disgrace us on the Day of Resurrection", note:"Rabanna Quranic Dua 17", target:1 },
      { arabic:"رَبَّنَا آمَنَّا فَاكْتُبْنَا مَعَ الشَّاهِدِينَ", trans:"Rabbana aamana faktubna — Our Lord, we have believed, so register us among the witnesses", note:"Rabanna Quranic Dua 18", target:1 },
      { arabic:"رَبَّنَا أَنزِلْ عَلَيْنَا مَائِدَةً مِّنَ السَّمَاءِ تَكُونُ لَنَا عِيدًا", trans:"Rabbana anzil alayna ma'idatam minas — Our Lord, send down to us a table spread from the heaven to be for us a festival", note:"Rabanna Quranic Dua 19", target:1 },
      { arabic:"رَبَّنَا ظَلَمْنَا أَنفُسَنَا وَإِن لَّمْ تَغْفِرْ لَنَا وَتَرْحَمْنَا لَنَكُونَنَّ مِنَ الْخَاسِرِينَ", trans:"Rabbana zalamna anfusina wa il lam taghfir — Our Lord, we have wronged ourselves, and if You do not forgive us and have mercy upon us, we will surely be among the losers", note:"Rabanna Quranic Dua 20", target:1 },
      { arabic:"رَبَّنَا لَا تَجْعَلْنَا مَعَ الْقَوْمِ الظَّالِمِينَ", trans:"Rabbana la taj'alna ma'al — Our Lord, do not place us with the wrongdoing people", note:"Rabanna Quranic Dua 21", target:1 },
      { arabic:"رَبَّنَا افْتَحْ بَيْنَنَا وَبَيْنَ قَوْمِنَا بِالْحَقِّ وَأَنتَ خَيْرُ الْفَاتِحِينَ", trans:"Rabbanaf-tah baynana wa bayna qawmina — Our Lord, decide between us and our people in truth, and You are the best of those who give decision", note:"Rabanna Quranic Dua 22", target:1 },
      { arabic:"رَبَّنَا أَفْرِغْ عَلَيْنَا صَبْرًا وَتَوَفَّنَا مُسْلِمِينَ", trans:"Rabbana afrigh alayna sabraw wa — Our Lord, pour upon us patience and let us die as Muslims", note:"Rabanna Quranic Dua 23", target:1 },
      { arabic:"رَبَّنَا لَا تَجْعَلْنَا فِتْنَةً لِّلْقَوْمِ الظَّالِمِينَ", trans:"Rabbana la taj'alna fitnatal lil-qawmidh — Our Lord, do not make us a trial for the wrongdoing people", note:"Rabanna Quranic Dua 24", target:1 },
      { arabic:"رَبَّنَا إِنَّكَ تَعْلَمُ مَا نُخْفِي وَمَا نُعْلِنُ", trans:"Rabbana innaka ta'lamu ma nukhfi wa ma — Our Lord, indeed You know what we conceal and what we declare", note:"Rabanna Quranic Dua 25", target:1 },
      { arabic:"رَبَّنَا وَتَقَبَّلْ دُعَاءِ", trans:"Rabbana wa taqabbal Dua — Our Lord, accept my supplication", note:"Rabanna Quranic Dua 26", target:1 },
      { arabic:"رَبَّنَا اغْفِرْ لِي وَلِوَالِدَيَّ وَلِلْمُؤْمِنِينَ يَوْمَ يَقُومُ الْحِسَابُ", trans:"Rabbana ghfir li wa li wallidayya — Our Lord, forgive me and my parents and the believers the Day the account is established", note:"Rabanna Quranic Dua 27", target:1 },
      { arabic:"رَبَّنَا آتِنَا مِن لَّدُنكَ رَحْمَةً وَهَيِّئْ لَنَا مِنْ أَمْرِنَا رَشَدًا", trans:"Rabbana atina mil-ladunka Rahmataw — Our Lord, grant us from Yourself mercy and prepare for us from our affair right guidance", note:"Rabanna Quranic Dua 28", target:1 },
      { arabic:"رَبَّنَا إِنَّنَا نَخَافُ أَن يَفْرُطَ عَلَيْنَا أَوْ أَن يَطْغَى", trans:"Rabbana innana nakhafu any-yafruta — Our Lord, indeed we are afraid that he will hasten against us or that he will transgress", note:"Rabanna Quranic Dua 29", target:1 },
      { arabic:"رَبَّنَا آمَنَّا فَاغْفِرْ لَنَا وَارْحَمْنَا وَأَنتَ خَيْرُ الرَّاحِمِينَ", trans:"Rabbana amanna faghfir lana warhamna — Our Lord, we have believed, so forgive us and have mercy upon us, and You are the best of the merciful", note:"Rabanna Quranic Dua 30", target:1 },
      { arabic:"رَبَّنَا اصْرِفْ عَنَّا عَذَابَ جَهَنَّمَ إِنَّ عَذَابَهَا كَانَ غَرَامًا", trans:"Rabbanas-rif anna azhaba jahannama — Our Lord, avert from us the punishment of Hell. Indeed, its punishment is ever adhering", note:"Rabanna Quranic Dua 31", target:1 },
      { arabic:"رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ وَاجْعَلْنَا لِلْمُتَّقِينَ إِمَامًا", trans:"Rabbana Hablana min azwaajina — Our Lord, grant us from among our wives and offspring comfort to our eyes and make us a leader for the righteous", note:"Rabanna Quranic Dua 32", target:1 },
      { arabic:"رَبَّنَا لَا غَافِرٌ شَكُورٌ", trans:"Rabbana la Ghafurun shakur — Our Lord is indeed Forgiving and Appreciative", note:"Rabanna Quranic Dua 33", target:1 },
      { arabic:"رَبَّنَا وَسِعْتَ كُلَّ شَيْءٍ رَّحْمَةً وَعِلْمًا", trans:"Rabbana wasi'ta kulla sha'ir Rahmatanw — Our Lord, You have encompassed all things in mercy and knowledge", note:"Rabanna Quranic Dua 34", target:1 },
      { arabic:"رَبَّنَا وَأَدْخِلْهُمْ جَنَّاتِ عَدْنٍ الَّتِي وَعَدتَّهُمْ", trans:"Rabbana wa adhkhilhum Jannati — Our Lord, and admit them to gardens of perpetual residence which You have promised them", note:"Rabanna Quranic Dua 35", target:1 },
      { arabic:"رَبَّنَا اغْفِرْ لَنَا وَلِإِخْوَانِنَا الَّذِينَ سَبَقُونَا بِالْإِيمَانِ", trans:"Rabbana-ghfir lana wa li ikhwani nalladhina — Our Lord, forgive us and our brothers who preceded us in faith", note:"Rabanna Quranic Dua 36", target:1 },
      { arabic:"رَبَّنَا إِنَّكَ رَءُوفٌ رَّحِيمٌ", trans:"Rabbana innaka Ra'ufur Rahim — Our Lord, indeed You are Kind and Merciful", note:"Rabanna Quranic Dua 37", target:1 },
      { arabic:"رَبَّنَا عَلَيْكَ تَوَكَّلْنَا وَإِلَيْكَ أَنَبْنَا وَإِلَيْكَ الْمَصِيرُ", trans:"Rabbana alayka tawakkalna wa-ilayka — Our Lord, upon You we have relied, and to You we have returned, and to You is the destination", note:"Rabanna Quranic Dua 38", target:1 },
      { arabic:"رَبَّنَا لَا تَجْعَلْنَا فِتْنَةً لِّلَّذِينَ كَفَرُوا وَاغْفِرْ لَنَا رَبَّنَا", trans:"Rabbana la taj'alna fitnatal lilladhina — Our Lord, do not make us a trial for those who disbelieve, and forgive us, our Lord", note:"Rabanna Quranic Dua 39", target:1 },
      { arabic:"رَبَّنَا أَتْمِمْ لَنَا نُورَنَا وَاغْفِرْ لَنَا إِنَّكَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ", trans:"Rabbana atmim lana nurana waighfir lana — Our Lord, perfect for us our light and forgive us. Indeed, You are over all things competent", note:"Rabanna Quranic Dua 40", target:1 },
    ]
  },
  { emoji:"🔥", key:"ruqyah",
    names:{ en:"Ruqyah", ar:"الرقية الشرعية", om:"Ruqyaa" },
    items:[
      { arabic:"بِسْمِ اللّٰهِ أَرْقِيكَ مِنْ كُلِّ شَيْءٍ يُؤْذِيكَ", trans:"In the name of Allah I perform ruqyah for you from everything that harms you", target:3 },
      { arabic:"أَعُوذُ بِكَلِمَاتِ اللّٰهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ", trans:"I seek refuge in the perfect words of Allah from the evil of what He has created", target:3 },
    ]
  },
  { emoji:"🕌", key:"missed",
    names:{ en:"Missed Raka'ah", ar:"الصلاة الفائتة", om:"Raka'aa Dhabe" },
    items:[
      { arabic:"سُبْحَانَ رَبِّيَ الْأَعْلَى", trans:"Glory be to my Lord, the Most High", target:3 },
      { arabic:"سُبْحَانَ رَبِّيَ الْعَظِيمِ", trans:"Glory be to my Lord, the Most Great", target:3 },
    ]
  },
  { emoji:"🕋", key:"hajj",
    names:{ en:"Hajj & Umrah", ar:"الحج والعمرة", om:"Hajjii fi Umraa" },
    items:[
      { arabic:"لَبَّيْكَ اللّٰهُمَّ لَبَّيْكَ", trans:"Here I am, O Allah, here I am", target:1 },
      { arabic:"رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً", trans:"Our Lord, give us good in this world", target:1 },
    ]
  },
];

let currentLang = localStorage.getItem("appLang") || "en";
let currentZikrCat = null;

function getLangName(cat){ return cat.names[currentLang] || cat.names.en; }

function renderZikr(){
  document.getElementById("zikrCatView").style.display = "block";
  document.getElementById("zikrDetailView").classList.remove("show");
  const grid = document.getElementById("zikrGrid");
  grid.innerHTML = ZIKR_CATS.map((cat,i)=>`
    <div class="zikr-card" onclick="openZikrCat(${i})">
      <div class="zikr-emoji">${cat.emoji}</div>
      <div class="zikr-name">${getLangName(cat)}</div>
    </div>`).join("");
}

function openZikrCat(i){
  currentZikrCat = i;
  const cat = ZIKR_CATS[i];
  document.getElementById("zikrCatView").style.display = "none";
  document.getElementById("zikrDetailView").classList.add("show");
  document.getElementById("zikrDetailTitle").textContent = cat.emoji + " " + getLangName(cat);
  renderZikrDetail();
}

function showZikrCats(){
  currentZikrCat = null;
  document.getElementById("zikrCatView").style.display = "block";
  document.getElementById("zikrDetailView").classList.remove("show");
}

function renderZikrDetail(){
  const cat = ZIKR_CATS[currentZikrCat];
  const counts = getZikrCounts();
  const key = cat.key;

  // header banner for salah and morning categories
  const banners = {
    salah: `
      <div style="text-align:center;padding:16px 0 20px;border-bottom:1px solid var(--border);margin-bottom:16px;">
        <div style="font-size:2.5rem;">🤲</div>
        <div style="font-size:0.85rem;opacity:0.55;margin-top:4px;">Authentic Duas</div>
        <div style="font-size:1.6rem;font-weight:700;margin:4px 0;">After Fard Salah</div>
        <div style="font-size:0.88rem;opacity:0.65;max-width:280px;margin:0 auto;line-height:1.5;">A collection of authentic and powerful duas to recite after each Fard Salah</div>
      </div>`,
    evening: `
      <div style="text-align:center;padding:16px 0 20px;border-bottom:1px solid var(--border);margin-bottom:16px;">
        <div style="font-size:2.5rem;">🌇</div>
        <div style="font-size:0.85rem;opacity:0.55;margin-top:4px;">Recite between Asr to Maghrib</div>
        <div style="font-size:1.6rem;font-weight:700;margin:4px 0;">Evening Adhkar</div>
        <div style="font-size:0.88rem;opacity:0.65;max-width:300px;margin:8px auto 0;line-height:1.6;text-align:left;">
          <div style="margin-bottom:6px;">And mention the name of your Lord (in prayer) morning and evening<br><span style="opacity:0.6;">Surah Al-Insan 76:25</span></div>
          <div>That you (people) may believe in Allah and His Messenger and honour him and respect the Prophet and exalt Allah morning and evening<br><span style="opacity:0.6;">Surah Al-Fath 48:9</span></div>
        </div>
      </div>`,
    morning: `
      <div style="text-align:center;padding:16px 0 20px;border-bottom:1px solid var(--border);margin-bottom:16px;">
        <div style="font-size:2.5rem;">🌅</div>
        <div style="font-size:0.85rem;opacity:0.55;margin-top:4px;">Recite between Subhe-Sadik to Sunrise</div>
        <div style="font-size:1.6rem;font-weight:700;margin:4px 0;">Morning Adhkar</div>
        <div style="font-size:0.88rem;opacity:0.65;max-width:300px;margin:8px auto 0;line-height:1.6;text-align:left;">
          <div style="margin-bottom:6px;">And mention the name of your Lord (in prayer) morning and evening<br><span style="opacity:0.6;">Surah Al-Insan 76:25</span></div>
          <div>That you (people) may believe in Allah and His Messenger and honour him and respect the Prophet and exalt Allah morning and evening<br><span style="opacity:0.6;">Surah Al-Fath 48:9</span></div>
        </div>
      </div>`,
    sleep: `
      <div style="text-align:center;padding:16px 0 20px;border-bottom:1px solid var(--border);margin-bottom:16px;">
        <div style="font-size:2.5rem;">🌙</div>
        <div style="font-size:0.85rem;opacity:0.55;margin-top:4px;">Daily Duas Before Bed</div>
        <div style="font-size:1.6rem;font-weight:700;margin:4px 0;">Duas before Sleeping</div>
        <div style="font-size:0.88rem;opacity:0.65;max-width:300px;margin:8px auto 0;line-height:1.6;text-align:left;">
          These powerful authentic duas offer protection from harm and evil, while deepening our connection with Allah and guiding us towards His mercy.
        </div>
      </div>`,
    daily: `
      <div style="text-align:center;padding:16px 0 20px;border-bottom:1px solid var(--border);margin-bottom:16px;">
        <div style="font-size:2.5rem;">📿</div>
        <div style="font-size:0.85rem;opacity:0.55;margin-top:4px;">Essential Duas for everyone</div>
        <div style="font-size:1.6rem;font-weight:700;margin:4px 0;">Daily Duas</div>
        <div style="font-size:0.88rem;opacity:0.65;max-width:300px;margin:8px auto 0;line-height:1.6;text-align:left;">
          A collection of authentic, easy-to-memorize duas for various occasions. Perfect for young children, new Muslims, and anyone building a daily dua routine.
        </div>
      </div>`,
    rabbana: `
      <div style="text-align:center;padding:16px 0 20px;border-bottom:1px solid var(--border);margin-bottom:16px;">
        <div style="font-size:2.5rem;">📖</div>
        <div style="font-size:0.85rem;opacity:0.55;margin-top:4px;">Quranic Supplications</div>
        <div style="font-size:1.6rem;font-weight:700;margin:4px 0;">40 Rabbana Duas</div>
        <div style="font-size:0.88rem;opacity:0.65;max-width:300px;margin:8px auto 0;line-height:1.6;text-align:left;">
          A complete collection of all 40 Rabbana duas from the Holy Quran — powerful supplications beginning with "Our Lord" (Rabbana) for every aspect of life.
        </div>
      </div>`
  };
  const banner = banners[key] || "";

  document.getElementById("zikrDetailList").innerHTML = banner + cat.items.map((item,j)=>{
    const c = (counts[key]||[])[j] || 0;
    const note = item.note ? `<div style="font-size:0.78rem;opacity:0.5;margin-top:2px;">${item.note}</div>` : "";
    return `<div class="zikr-item">
      <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:10px;">
        <div style="min-width:30px;height:30px;border-radius:50%;background:var(--border);display:flex;align-items:center;justify-content:center;font-size:0.85rem;font-weight:700;flex-shrink:0;">${j+1}</div>
        <div style="flex:1;">
          <div class="zikr-item-arabic">${item.arabic}</div>
          <div class="zikr-item-trans">${item.trans}</div>
          ${note}
        </div>
        <div style="min-width:36px;text-align:center;background:var(--border);border-radius:6px;padding:4px 6px;font-size:0.8rem;font-weight:700;flex-shrink:0;">${item.target}x</div>
      </div>
      <div class="zikr-item-bottom">
        <span class="zikr-item-count">${c} / ${item.target}</span>
        <button class="zikr-tap-btn" onclick="tapZikrItem(${currentZikrCat},${j})">${t("zikrCount")}</button>
      </div>
    </div>`;
  }).join("");
}

function tapZikrItem(catIdx, itemIdx){
  const cat = ZIKR_CATS[catIdx];
  const counts = getZikrCounts();
  if(!counts[cat.key]) counts[cat.key] = [];
  counts[cat.key][itemIdx] = (counts[cat.key][itemIdx] || 0) + 1;
  if(counts[cat.key][itemIdx] === cat.items[itemIdx].target){
    addNotif("✅ Completed: " + cat.items[itemIdx].arabic);
  }
  saveZikrCounts(counts);
  renderZikrDetail();
}

function resetCatZikr(){
  if(!confirm(t("zikrResetConfirm"))) return;
  const counts = getZikrCounts();
  delete counts[ZIKR_CATS[currentZikrCat].key];
  saveZikrCounts(counts);
  renderZikrDetail();
}

function getZikrCounts(){ return JSON.parse(localStorage.getItem("zikr_"+currentUser))||{}; }
function saveZikrCounts(c){ localStorage.setItem("zikr_"+currentUser, JSON.stringify(c)); }

// ===== RATE =====
let currentRating = 0;
const rateLabels = ["","Poor 😞","Fair 😐","Good 🙂","Great 😊","Excellent 🤩"];
function setRating(n){
  currentRating = n;
  document.querySelectorAll(".star-btn").forEach((b,i)=>{
    b.classList.toggle("lit", i < n);
  });
  document.getElementById("rateLabel").textContent = t("rateLabels")[n]||n;
}
function submitRating(){
  if(!currentRating){ alert(t("rateErr")); return; }
  localStorage.setItem("userRating", currentRating);
  addNotif("⭐ You rated the app " + currentRating + " star" + (currentRating>1?"s":""));
  alert("Thank you for your " + currentRating + "-star rating! 🙏");
  showPage("home");
}

// ===== FEEDBACK =====
function submitFeedback(){
  const txt = document.getElementById("feedbackText").value.trim();
  if(!txt){ alert(t("feedErr")); return; }
  localStorage.setItem("userFeedback_"+currentUser, txt);
  addNotif("💬 "+t("feedH"));
  document.getElementById("feedbackText").value = "";
  alert(t("feedThanks"));
  showPage("home");
}

// ===== SHARE =====
function shareApp(){
  closeDrawer();
  const data = { title:"UMSR Smart Routine", text:"Organize your day with UMSR Smart Routine!", url: window.location.href };
  if(navigator.share){ navigator.share(data).catch(()=>{}); }
  else {
    navigator.clipboard.writeText(window.location.href).then(()=>{
      alert(t("linkCopied"));
    }).catch(()=>{ alert(t("linkCopied")); });
  }
}

// ===== SETTINGS SYNC =====
function syncSettingsPage(){
  document.getElementById("settingTime").checked = use12Hour;
  document.getElementById("settingDark").checked = document.body.classList.contains("dark");
  document.getElementById("settingSound").checked = localStorage.getItem("soundPref") !== "off";
  ["EN","AR","OM"].forEach(l => {
    document.getElementById("lang"+l).classList.toggle("active", currentLang === l.toLowerCase());
  });
}

function setLang(lang){
  currentLang = lang;
  localStorage.setItem("appLang", lang);
  syncSettingsPage();
  applyLang();
}

// ===== TRANSLATIONS =====
const T = {
  en:{
    dir:"ltr",
    headerTitle:"UMSR Smart Routine",
    dark:"Dark", logout:"Log Out",
    drawerHome:"Home", drawerNotif:"Notifications", drawerZikr:"Zikr",
    drawerRate:"Rate Us", drawerFeedback:"Feedback", drawerAbout:"About Us",
    drawerShare:"Share App", drawerSettings:"Settings", drawerLogout:"Log Out",
    authSignIn:"Sign In", authSignUp:"Sign Up",
    authEmail:"Email address", authPass:"Password", authPass2:"Confirm password",
    authNoAcc:"Don't have an account?", authHaveAcc:"Already have an account?",
    errFill:"Please fill in all fields.", errEmail:"Enter a valid email.",
    errShort:"Password must be at least 6 characters.", errMatch:"Passwords do not match.",
    errExists:"Email already registered.", errCreds:"Invalid email or password.",
    taskPlaceholder:"Task name", addBtn:"➕ Add",
    scheduleH:"Today's Schedule", noTasks:"No tasks yet. Add one above!",
    done:"Done", undo:"Undo", edit:"Edit", del:"Delete",
    delConfirm:"Delete this task?", editNamePrompt:"Edit task name:",
    editTimePrompt:"Edit time (HH:MM 24h):", invalidInput:"Invalid input",
    progressH:"📊 Progress", pctDone:"% completed", testBtn:"🔔 Test Reminder",
    navHome:"Home", navProfile:"Profile",
    profTotal:"Total Tasks", profDone:"Completed", profPending:"Pending", profSignout:"Sign Out",
    notifH:"🔔 Notifications", notifEmpty:"No notifications yet.",
    zikrTitle:"Dua & Adhkar", zikrReset:"↺ Reset Counts",
    zikrResetConfirm:"Reset counts for this category?", zikrCount:"+ Count",
    rateH:"⭐ Rate Us", rateDesc:"How would you rate UMSR Smart Routine?",
    rateTap:"Tap a star", rateSubmit:"Submit Rating",
    rateErr:"Please select a star first.",
    rateLabels:["","Poor 😞","Fair 😐","Good 🙂","Great 😊","Excellent 🤩"],
    feedH:"💬 Feedback", feedDesc:"We'd love to hear your thoughts.",
    feedPlaceholder:"Write your feedback here...", feedSubmit:"Send Feedback",
    feedErr:"Please write something first.", feedThanks:"Thank you for your feedback! 🙏",
    aboutH:"UMSR Smart Routine", aboutSub:"Version 1.0.0",
    aboutBody:"UMSR Smart Routine helps you organize your daily schedule, track your tasks, and stay consistent with your Zikr and worship goals.\n\nBuilt with simplicity and focus in mind — for a more productive and mindful day.",
    aboutCopy:"© 2026 UMSR. All rights reserved.",
    settH:"⚙️ Settings", settTime:"12-Hour Time Format", settDark:"Dark Mode",
    settSound:"Sound Reminders", settLang:"Language / Afaan / لغة",
    clockClear:"CLEAR", clockCancel:"CANCEL", clockSet:"SET",
    signInFirst:"Please sign in first.", enterTaskTime:"Enter task name and pick a time",
    linkCopied:"Link copied to clipboard! Share it with your friends 🔗",
  },
  ar:{
    dir:"rtl",
    headerTitle:"روتين UMSR الذكي",
    dark:"وضع", logout:"خروج",
    drawerHome:"الرئيسية", drawerNotif:"الإشعارات", drawerZikr:"الذكر",
    drawerRate:"قيّمنا", drawerFeedback:"ملاحظات", drawerAbout:"من نحن",
    drawerShare:"شارك التطبيق", drawerSettings:"الإعدادات", drawerLogout:"تسجيل الخروج",
    authSignIn:"تسجيل الدخول", authSignUp:"إنشاء حساب",
    authEmail:"البريد الإلكتروني", authPass:"كلمة المرور", authPass2:"تأكيد كلمة المرور",
    authNoAcc:"ليس لديك حساب؟", authHaveAcc:"لديك حساب بالفعل؟",
    errFill:"يرجى ملء جميع الحقول.", errEmail:"أدخل بريدًا إلكترونيًا صحيحًا.",
    errShort:"يجب أن تكون كلمة المرور 6 أحرف على الأقل.", errMatch:"كلمتا المرور غير متطابقتين.",
    errExists:"البريد الإلكتروني مسجل مسبقًا.", errCreds:"البريد أو كلمة المرور غير صحيحة.",
    taskPlaceholder:"اسم المهمة", addBtn:"➕ إضافة",
    scheduleH:"جدول اليوم", noTasks:"لا توجد مهام بعد. أضف واحدة أعلاه!",
    done:"تم", undo:"تراجع", edit:"تعديل", del:"حذف",
    delConfirm:"هل تريد حذف هذه المهمة؟", editNamePrompt:"تعديل اسم المهمة:",
    editTimePrompt:"تعديل الوقت (HH:MM):", invalidInput:"مدخل غير صحيح",
    progressH:"📊 التقدم", pctDone:"% مكتمل", testBtn:"🔔 اختبار التذكير",
    navHome:"الرئيسية", navProfile:"الملف الشخصي",
    profTotal:"إجمالي المهام", profDone:"مكتملة", profPending:"معلقة", profSignout:"تسجيل الخروج",
    notifH:"🔔 الإشعارات", notifEmpty:"لا توجد إشعارات بعد.",
    zikrTitle:"الدعاء والأذكار", zikrReset:"↺ إعادة تعيين",
    zikrResetConfirm:"إعادة تعيين عدادات هذه الفئة؟", zikrCount:"+ عدّ",
    rateH:"⭐ قيّمنا", rateDesc:"كيف تقيّم تطبيق UMSR؟",
    rateTap:"اختر نجمة", rateSubmit:"إرسال التقييم",
    rateErr:"يرجى اختيار نجمة أولاً.",
    rateLabels:["","ضعيف 😞","مقبول 😐","جيد 🙂","جيد جداً 😊","ممتاز 🤩"],
    feedH:"💬 ملاحظات", feedDesc:"نود سماع رأيك.",
    feedPlaceholder:"اكتب ملاحظاتك هنا...", feedSubmit:"إرسال الملاحظات",
    feedErr:"يرجى كتابة شيء أولاً.", feedThanks:"شكراً على ملاحظاتك! 🙏",
    aboutH:"روتين UMSR الذكي", aboutSub:"الإصدار 1.0.0",
    aboutBody:"يساعدك تطبيق UMSR على تنظيم جدولك اليومي وتتبع مهامك والمداومة على الذكر والعبادة.\n\nمبني بالبساطة والتركيز — لحياة أكثر إنتاجية وروحانية.",
    aboutCopy:"© 2026 UMSR. جميع الحقوق محفوظة.",
    settH:"⚙️ الإعدادات", settTime:"تنسيق 12 ساعة", settDark:"الوضع الداكن",
    settSound:"تذكيرات صوتية", settLang:"اللغة / Afaan / Language",
    clockClear:"مسح", clockCancel:"إلغاء", clockSet:"تعيين",
    signInFirst:"يرجى تسجيل الدخول أولاً.", enterTaskTime:"أدخل اسم المهمة واختر وقتاً",
    linkCopied:"تم نسخ الرابط! شاركه مع أصدقائك 🔗",
  },
  om:{
    dir:"ltr",
    headerTitle:"UMSR Smart Routine",
    dark:"Dukkana", logout:"Ba'i",
    drawerHome:"Mana", drawerNotif:"Beeksisa", drawerZikr:"Zikrii",
    drawerRate:"Nu Madaali", drawerFeedback:"Yaada", drawerAbout:"Waa'ee Keenya",
    drawerShare:"App Qoodi", drawerSettings:"Qindaa'ina", drawerLogout:"Ba'i",
    authSignIn:"Seeni", authSignUp:"Galmaa'i",
    authEmail:"Imeelii", authPass:"Jecha Darbii", authPass2:"Jecha Darbii Mirkaneessi",
    authNoAcc:"Herrega hin qabduu?", authHaveAcc:"Herrega qabdaa?",
    errFill:"Dirreewwan hunda guuti.", errEmail:"Imeelii sirrii galchi.",
    errShort:"Jecha darbii xiqqaate qubee 6 ta'uu qaba.", errMatch:"Jecha darbii wal hin simne.",
    errExists:"Imeelii kun duraan galmaa'eera.", errCreds:"Imeelii ykn jecha darbii dogoggora.",
    taskPlaceholder:"Maqaa hojii", addBtn:"➕ Dabaluu",
    scheduleH:"Sagantaa Har'aa", noTasks:"Hojiin hin jiru. Tokko olitti dabaluu!",
    done:"Xumurame", undo:"Deebi'i", edit:"Gulaali", del:"Haqi",
    delConfirm:"Hojii kana haqi?", editNamePrompt:"Maqaa hojii gulaali:",
    editTimePrompt:"Sa'aatii gulaali (HH:MM):", invalidInput:"Galchi dogoggoraa",
    progressH:"📊 Guddina", pctDone:"% xumurame", testBtn:"🔔 Yaali Beeksisa",
    navHome:"Mana", navProfile:"Profaayilii",
    profTotal:"Hojii Waliigalaa", profDone:"Xumurame", profPending:"Eeggachaa jira", profSignout:"Ba'i",
    notifH:"🔔 Beeksisa", notifEmpty:"Beeksisni hin jiru.",
    zikrTitle:"Du'aa fi Zikrii", zikrReset:"↺ Lakkoofsa Haaromsi",
    zikrResetConfirm:"Lakkoofsa kutaa kanaa haaromsi?", zikrCount:"+ Lakkaa'i",
    rateH:"⭐ Nu Madaali", rateDesc:"UMSR akkamitti madaaltu?",
    rateTap:"Urjii filadhu", rateSubmit:"Madaala Ergi",
    rateErr:"Urjii tokko filadhu.",
    rateLabels:["","Gadhee 😞","Giddu-galeessa 😐","Gaarii 🙂","Baay'ee Gaarii 😊","Ol'aanaa 🤩"],
    feedH:"💬 Yaada", feedDesc:"Yaada kee dhaggeeffanna.",
    feedPlaceholder:"Yaada kee asitti barreessi...", feedSubmit:"Yaada Ergi",
    feedErr:"Waa tokko barreessi.", feedThanks:"Yaada keetif galatoomi! 🙏",
    aboutH:"UMSR Smart Routine", aboutSub:"Versiyoonii 1.0.0",
    aboutBody:"UMSR Smart Routine sagantaa guyyaa kee qindeessuuf, hojii kee hordofuuf, fi Zikrii kee itti fufsiisuuf si gargaara.\n\nSadarkaafi xiyyeeffannaan ijaarame — guyyaa bu'a qabeessa fi amantii cimaa dhaaf.",
    aboutCopy:"© 2026 UMSR. Mirgi Waliigalaa Eegama.",
    settH:"⚙️ Qindaa'ina", settTime:"Sa'aatii 12 Fomaat", settDark:"Haala Dukkana",
    settSound:"Yaadachiisa Sagalee", settLang:"Afaan / Language / لغة",
    clockClear:"HAQI", clockCancel:"DHIISI", clockSet:"QINDEESSI",
    signInFirst:"Mee duraan seeni.", enterTaskTime:"Maqaa hojii fi sa'aatii galchi",
    linkCopied:"Liinkiin garagalfame! Hiriyoota keetiif qoodi 🔗",
  }
};

function t(key){ return (T[currentLang]||T.en)[key] || T.en[key] || key; }

function applyLang(){
  const lang = currentLang;
  document.body.style.direction = T[lang]?.dir || "ltr";
  document.documentElement.lang = lang;

  // Header
  document.querySelector("header h1").textContent = t("headerTitle");
  const darkBtn = document.getElementById("darkModeBtn");
  if(darkBtn){ const spans = darkBtn.querySelectorAll("span,text"); darkBtn.lastChild.textContent = " "+t("dark"); }
  const logoutBtns = document.querySelectorAll("#userBar button");
  if(logoutBtns[0]) logoutBtns[0].childNodes[logoutBtns[0].childNodes.length-1].textContent = " "+t("dark");
  if(logoutBtns[1]) logoutBtns[1].childNodes[logoutBtns[1].childNodes.length-1].textContent = " "+t("logout");

  // Drawer items (by data-key)
  document.querySelectorAll(".drawer-item[data-key]").forEach(btn=>{
    const key = btn.getAttribute("data-key");
    const txt = t(key);
    // replace last text node
    const nodes = btn.childNodes;
    for(let i=nodes.length-1;i>=0;i--){
      if(nodes[i].nodeType===3){ nodes[i].textContent="\n    "+txt+"\n  "; break; }
    }
  });

  // Auth
  document.getElementById("authTitle").textContent = authMode==="signup" ? t("authSignUp") : t("authSignIn");
  document.getElementById("authEmail").placeholder = t("authEmail");
  document.getElementById("authPassword").placeholder = t("authPass");
  document.getElementById("authPassword2").placeholder = t("authPass2");
  document.querySelector(".auth-submit").textContent = authMode==="signup" ? t("authSignUp") : t("authSignIn");
  document.getElementById("authSwitchText").textContent = authMode==="signup" ? t("authHaveAcc") : t("authNoAcc");
  document.querySelector(".auth-switch a").textContent = authMode==="signup" ? t("authSignIn") : t("authSignUp");

  // Task area
  const taskInput = document.getElementById("taskName");
  if(taskInput) taskInput.placeholder = t("taskPlaceholder");
  const addBtn = document.querySelector(".add-btn");
  if(addBtn) addBtn.textContent = t("addBtn");
  const schedH = document.querySelector(".container h2");
  if(schedH) schedH.textContent = t("scheduleH");
  const statsH3 = document.querySelector(".stats h3");
  if(statsH3) statsH3.textContent = t("progressH");
  const testBtn = document.querySelector(".stats button");
  if(testBtn) testBtn.textContent = t("testBtn");

  // Bottom nav
  const navHomeEl = document.getElementById("navHome");
  if(navHomeEl){ const nodes=navHomeEl.childNodes; for(let i=nodes.length-1;i>=0;i--){ if(nodes[i].nodeType===3){nodes[i].textContent="\n    "+t("navHome")+"\n  ";break;} } }
  const navProfEl = document.getElementById("navProfile");
  if(navProfEl){ const nodes=navProfEl.childNodes; for(let i=nodes.length-1;i>=0;i--){ if(nodes[i].nodeType===3){nodes[i].textContent="\n    "+t("navProfile")+"\n  ";break;} } }

  // Profile page
  const profStats = document.querySelectorAll(".profile-stat span:first-child");
  if(profStats[0]) profStats[0].textContent = t("profTotal");
  if(profStats[1]) profStats[1].textContent = t("profDone");
  if(profStats[2]) profStats[2].textContent = t("profPending");
  const profSignout = document.querySelector(".profile-signout");
  if(profSignout) profSignout.textContent = t("profSignout");

  // Notifications page
  const notifH = document.querySelector("#notificationsPage h2");
  if(notifH) notifH.textContent = t("notifH");
  const notifEmpty = document.querySelector(".notif-empty");
  if(notifEmpty) notifEmpty.textContent = t("notifEmpty");

  // Zikr page
  const zikrTitle = document.querySelector(".zikr-page-title");
  if(zikrTitle) zikrTitle.textContent = t("zikrTitle");

  // Rate page
  const rateH = document.querySelector("#ratePage h2");
  if(rateH) rateH.textContent = t("rateH");
  const rateDesc = document.querySelector("#ratePage > p");
  if(rateDesc) rateDesc.textContent = t("rateDesc");
  const rateLabel = document.getElementById("rateLabel");
  if(rateLabel && rateLabel.textContent === T.en.rateTap || rateLabel?.textContent === T.ar.rateTap || rateLabel?.textContent === T.om.rateTap) rateLabel.textContent = t("rateTap");
  const rateSubmit = document.querySelector(".rate-submit");
  if(rateSubmit) rateSubmit.textContent = t("rateSubmit");

  // Feedback page
  const feedH = document.querySelector("#feedbackPage h2");
  if(feedH) feedH.textContent = t("feedH");
  const feedDesc = document.querySelector("#feedbackPage > p");
  if(feedDesc) feedDesc.textContent = t("feedDesc");
  const feedTxt = document.getElementById("feedbackText");
  if(feedTxt) feedTxt.placeholder = t("feedPlaceholder");
  const feedSubmit = document.querySelector(".feedback-submit");
  if(feedSubmit) feedSubmit.textContent = t("feedSubmit");

  // About page
  const aboutH = document.querySelector("#aboutPage h2");
  if(aboutH) aboutH.textContent = t("aboutH");
  const aboutVer = document.querySelector(".about-version");
  if(aboutVer) aboutVer.textContent = t("aboutSub");
  const aboutBody = document.querySelector(".about-body");
  if(aboutBody) aboutBody.innerHTML = t("aboutBody").replace(/\n/g,"<br>");
  const aboutCopy = document.querySelector("#aboutPage p:last-of-type");
  if(aboutCopy) aboutCopy.textContent = t("aboutCopy");

  // Settings page
  const settH = document.querySelector("#settingsPage h2");
  if(settH) settH.textContent = t("settH");
  const settRows = document.querySelectorAll(".setting-row > span");
  if(settRows[0]) settRows[0].textContent = t("settTime");
  if(settRows[1]) settRows[1].textContent = t("settDark");
  if(settRows[2]) settRows[2].textContent = t("settSound");
  if(settRows[3]) settRows[3].textContent = t("settLang");

  // Clock modal
  const cb1 = document.getElementById("clockBtnClear");
  const cb2 = document.getElementById("clockBtnCancel");
  const cb3 = document.getElementById("clockBtnSet");
  if(cb1) cb1.textContent = t("clockClear");
  if(cb2) cb2.textContent = t("clockCancel");
  if(cb3) cb3.textContent = t("clockSet");

  // Re-render tasks to update Done/Edit/Delete buttons
  if(currentUser) renderTasks(getTasks());
  // Re-render zikr if open
  if(document.getElementById("zikrPage").classList.contains("show")) renderZikr();
}
function saveSoundPref(val){
  localStorage.setItem("soundPref", val ? "on" : "off");
}

// ===== SETTINGS =====
let use12Hour = localStorage.getItem("timeFormat") === "12";
let notified = {};

// ===== DARK MODE =====
function toggleDark(){
  document.body.classList.toggle("dark");
  localStorage.setItem("dark", document.body.classList.contains("dark")?"on":"off");
}
if(localStorage.getItem("dark")==="on") document.body.classList.add("dark");

// ===== TIME FORMAT =====
function formatTo12(time){
  let [h,m]=time.split(":").map(Number);
  const ampm=h>=12?"PM":"AM";
  h=h%12||12;
  return `${h}:${m.toString().padStart(2,'0')} ${ampm}`;
}
function formatTime(t){ return use12Hour?formatTo12(t):t; }
function toggleTime(){
  use12Hour=!use12Hour;
  localStorage.setItem("timeFormat",use12Hour?"12":"24");
  renderTasks(getTasks());
}

// ===== STORAGE =====
function getTasks(){ return JSON.parse(localStorage.getItem("tasks_"+currentUser))||[]; }
function saveTasks(t){ localStorage.setItem("tasks_"+currentUser,JSON.stringify(t)); }

// ===== CLOCK STATE =====
let clockHour=12, clockMin=0, clockAMPM="AM", clockMode="hour";
let selectedTime=""; // stored as HH:MM (24h)
let manualMode=false;

function openClock(){
  // init to current time
  const now=new Date();
  let h=now.getHours(), m=now.getMinutes();
  clockAMPM=h>=12?"PM":"AM";
  clockHour=h%12||12;
  clockMin=m;
  clockMode="hour";
  manualMode=false;
  document.getElementById("manualWrap").classList.remove("show");
  document.getElementById("clockFaceWrap").style.display="flex";
  updateClockHeader();
  document.getElementById("clockOverlay").classList.add("open");
  drawClock();
}

function closeClock(){ document.getElementById("clockOverlay").classList.remove("open"); }

function overlayClick(e){
  if(e.target===document.getElementById("clockOverlay")) closeClock();
}

function clockSetMode(mode){
  clockMode=mode;
  document.getElementById("dispHour").classList.toggle("active", mode==="hour");
  document.getElementById("dispMin").classList.toggle("active", mode==="min");
  drawClock();
}

function setAMPM(val){
  clockAMPM=val;
  document.getElementById("btnAM").classList.toggle("active",val==="AM");
  document.getElementById("btnPM").classList.toggle("active",val==="PM");
  document.getElementById("manAM").classList.toggle("active",val==="AM");
  document.getElementById("manPM").classList.toggle("active",val==="PM");
  updateClockHeader();
}

function updateClockHeader(){
  document.getElementById("dispHour").textContent=clockHour.toString().padStart(2,'0');
  document.getElementById("dispMin").textContent=clockMin.toString().padStart(2,'0');
  document.getElementById("btnAM").classList.toggle("active",clockAMPM==="AM");
  document.getElementById("btnPM").classList.toggle("active",clockAMPM==="PM");
}

function clearTime(){
  selectedTime="";
  document.getElementById("timeDisplay").textContent="-- : --  ▾";
  closeClock();
}

function confirmTime(){
  // convert to 24h
  let h=clockHour;
  if(clockAMPM==="AM"&&h===12) h=0;
  else if(clockAMPM==="PM"&&h!==12) h+=12;
  selectedTime=h.toString().padStart(2,'0')+":"+clockMin.toString().padStart(2,'0');
  document.getElementById("timeDisplay").textContent=formatTo12(selectedTime);
  closeClock();
}

function toggleManual(){
  manualMode=!manualMode;
  document.getElementById("manualWrap").classList.toggle("show",manualMode);
  document.getElementById("clockFaceWrap").style.display=manualMode?"none":"flex";
  if(manualMode){
    document.getElementById("manHour").value=clockHour;
    document.getElementById("manMin").value=clockMin.toString().padStart(2,'0');
  }
}

function manualChange(){
  let h=parseInt(document.getElementById("manHour").value)||12;
  let m=parseInt(document.getElementById("manMin").value)||0;
  h=Math.min(12,Math.max(1,h));
  m=Math.min(59,Math.max(0,m));
  clockHour=h; clockMin=m;
  updateClockHeader();
}

// ===== DRAW ANALOG CLOCK =====
function drawClock(){
  const canvas = document.getElementById("clockCanvas");
  const face   = document.getElementById("clockFace");
  const size   = face.offsetWidth || 260;
  canvas.width  = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const cx = size/2, cy = size/2, R = size/2 - 4;
  ctx.clearRect(0,0,size,size);

  // face circle
  ctx.beginPath(); ctx.arc(cx,cy,R,0,2*Math.PI);
  ctx.fillStyle="#eeeeee"; ctx.fill();

  // numbers
  const nums = clockMode==="hour"
    ? [12,1,2,3,4,5,6,7,8,9,10,11]
    : [0,5,10,15,20,25,30,35,40,45,50,55];

  const numR   = R * 0.75;   // radius for number positions
  const dotR   = R * 0.155;  // selected circle radius
  const fSize  = Math.round(size * 0.075);
  ctx.font = "bold "+fSize+"px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  nums.forEach((n,i)=>{
    const angle = (i/12)*2*Math.PI - Math.PI/2;
    const x = cx + Math.cos(angle)*numR;
    const y = cy + Math.sin(angle)*numR;
    const isSelected = clockMode==="hour" ? n===clockHour : n===clockMin;
    if(isSelected){
      ctx.beginPath(); ctx.arc(x,y,dotR,0,2*Math.PI);
      ctx.fillStyle="#00897b"; ctx.fill();
      ctx.fillStyle="#fff";
    } else {
      ctx.fillStyle="#333";
    }
    ctx.fillText(n,x,y);
  });

  // hand — line from center to selected number
  const val   = clockMode==="hour" ? clockHour%12 : clockMin;
  const total = clockMode==="hour" ? 12 : 60;
  const angle = (val/total)*2*Math.PI - Math.PI/2;
  const selX  = cx + Math.cos(angle)*numR;
  const selY  = cy + Math.sin(angle)*numR;

  ctx.beginPath(); ctx.moveTo(cx,cy);
  ctx.lineTo(selX, selY);
  ctx.strokeStyle="#00897b"; ctx.lineWidth=Math.max(2,size*0.008); ctx.stroke();

  // center dot
  ctx.beginPath(); ctx.arc(cx,cy,size*0.022,0,2*Math.PI);
  ctx.fillStyle="#00897b"; ctx.fill();
}

// ===== CLOCK CLICK =====
document.getElementById("clockFace").addEventListener("click",function(e){
  const rect = this.getBoundingClientRect();
  const size = rect.width;
  const cx = size/2, cy = size/2;
  const x = e.clientX - rect.left - cx;
  const y = e.clientY - rect.top  - cy;
  let angle = Math.atan2(y,x) + Math.PI/2;
  if(angle < 0) angle += 2*Math.PI;

  if(clockMode==="hour"){
    let h = Math.round(angle/(2*Math.PI)*12);
    if(h===0) h=12;
    clockHour = h;
    setTimeout(()=>clockSetMode("min"),200);
  } else {
    let m = Math.round(angle/(2*Math.PI)*60);
    if(m===60) m=0;
    clockMin = m;
  }
  updateClockHeader();
  drawClock();
});

// ===== ADD TASK =====
function addTask(){
  if(!currentUser){ alert(t("signInFirst")); return; }
  const name=document.getElementById("taskName").value.trim();
  if(!name||!selectedTime){ alert(t("enterTaskTime")); return; }
  const tasks=getTasks();
  tasks.push({name,time:selectedTime,done:false});
  saveTasks(tasks);
  renderTasks(tasks);
  document.getElementById("taskName").value="";
  selectedTime="";
  document.getElementById("timeDisplay").textContent="-- : --  ▾";
}

// ===== EDIT TASK =====
function editTask(tasks,index){
  const newName=prompt(t("editNamePrompt"),tasks[index].name);
  if(newName===null) return;
  const newTime=prompt(t("editTimePrompt"),tasks[index].time);
  if(newTime===null) return;
  if(!newName||!newTime.includes(":")){ alert(t("invalidInput")); return; }
  tasks[index].name=newName; tasks[index].time=newTime;
  saveTasks(tasks); renderTasks(tasks);
}

// ===== DELETE TASK =====
function deleteTask(tasks,index){
  if(confirm(t("delConfirm"))){
    tasks.splice(index,1); saveTasks(tasks); renderTasks(tasks);
  }
}

// ===== TIME CHECK =====
function isTaskPassed(time){
  const now=new Date();
  const nowMin=now.getHours()*60+now.getMinutes();
  let [h,m]=time.split(":").map(Number);
  return nowMin>h*60+m;
}

// ===== PROGRESS =====
function updateProgress(tasks){
  const now=new Date();
  const nowMin=now.getHours()*60+now.getMinutes();
  let count=0;
  tasks.forEach(t=>{
    let [h,m]=t.time.split(":").map(Number);
    if(t.done||nowMin>h*60+m) count++;
  });
  const pct=tasks.length?Math.round((count/tasks.length)*100):0;
  document.getElementById("progressText").textContent=pct+t("pctDone");
}

// ===== RENDER =====
function renderTasks(tasks){
  const list=document.getElementById("taskList");
  list.innerHTML="";
  if(tasks.length===0){ list.textContent=t("noTasks"); updateProgress(tasks); return; }
  tasks.forEach((task,index)=>{
    const div=document.createElement("div");
    div.className="task";
    if(isTaskPassed(task.time)&&!task.done) div.classList.add("passed");

    const info=document.createElement("div");
    info.className="task-info";
    info.innerHTML=`<span class="task-name">${task.name}</span><span class="task-time">(${formatTime(task.time)})</span>`;
    if(task.done) info.classList.add("done-info");

    const actions=document.createElement("div");
    actions.className="task-actions";

    const doneBtn=document.createElement("button");
    doneBtn.textContent=task.done?t("undo"):t("done");
    doneBtn.onclick=()=>{ task.done=!task.done; saveTasks(tasks); renderTasks(tasks); };

    const editBtn=document.createElement("button");
    editBtn.textContent=t("edit");
    editBtn.onclick=()=>editTask(tasks,index);

    const delBtn=document.createElement("button");
    delBtn.textContent=t("del");
    delBtn.classList.add("delete");
    delBtn.onclick=()=>deleteTask(tasks,index);

    actions.appendChild(doneBtn);
    actions.appendChild(editBtn);
    actions.appendChild(delBtn);
    div.appendChild(info);
    div.appendChild(actions);
    list.appendChild(div);
  });
  updateProgress(tasks);
}

// ===== REMINDERS =====
// Request notification permission on login
function requestNotifPermission(){
  if("Notification" in window && Notification.permission === "default"){
    Notification.requestPermission();
  }
}

function fireReminder(taskName){
  // 1. Sound
  if(localStorage.getItem("soundPref") !== "off"){
    const audio = document.getElementById("adhanAudio");
    audio.currentTime = 0;
    audio.play().catch(()=>{});
  }

  // 2. Vibration (mobile)
  if("vibrate" in navigator) navigator.vibrate([400, 200, 400, 200, 400]);

  // 3. Web Notification (if permitted)
  if("Notification" in window && Notification.permission === "granted"){
    new Notification("⏰ UMSR Reminder", {
      body: taskName,
      icon: "https://cdn-icons-png.flaticon.com/512/2693/2693507.png",
      badge: "https://cdn-icons-png.flaticon.com/512/2693/2693507.png",
      vibrate: [400, 200, 400]
    });
  } else {
    // 4. Fallback: in-app toast
    const toast = document.getElementById("reminderToast");
    document.getElementById("reminderToastText").textContent = taskName;
    toast.style.display = "block";
    setTimeout(() => toast.style.display = "none", 5000);
  }

  // 5. In-app notification log
  addNotif("⏰ Task reminder: " + taskName);
}

function checkReminders(tasks){
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  tasks.forEach(t => {
    let [h, m] = t.time.split(":").map(Number);
    if(nowMin === h * 60 + m && !notified[t.name]){
      fireReminder(t.name);
      notified[t.name] = true;
    }
  });
}

setInterval(()=>{ if(!currentUser) return; const t=getTasks(); renderTasks(t); checkReminders(t); }, 60000);
if(currentUser){ requestNotifPermission(); renderTasks(getTasks()); }
applyLang();

// ===== TEST REMINDER (remove after testing) =====
function testReminder(){ fireReminder("🧪 Test Task — Reminder works!"); }