import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged,
  RecaptchaVerifier, signInWithPhoneNumber, linkWithCredential, PhoneAuthProvider
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import {
  getFirestore, collection, addDoc, doc, getDoc, setDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, getDocs, onSnapshot, serverTimestamp,
  increment, runTransaction, arrayUnion, arrayRemove
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import {
  getStorage, ref, uploadBytesResumable, getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyCKAys3VwHucKOFsmxOehNHfTz9FRypHzQ",
  authDomain: "my-video-pletform.firebaseapp.com",
  projectId: "my-video-pletform",
  storageBucket: "my-video-pletform.firebasestorage.app",
  messagingSenderId: "233187911992",
  appId: "1:233187911992:web:4717894d0cf317a4e239cd",
  measurementId: "G-B6W2L3WDLY"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const google = new GoogleAuthProvider();

const $ = id => document.getElementById(id);
let currentUser = null;
let currentChannel = null;
let currentVideo = null;
let pendingCommentVideo = null;
let confirmationResult = null;
let recaptcha = null;
let activeCategory = "All";

function toast(msg){ $("toast").textContent=msg; $("toast").classList.remove("hidden"); setTimeout(()=>$("toast").classList.add("hidden"),3000); }
function show(view){ ["homeView","watchView","channelView","uploadView"].forEach(id=>$(id).classList.add("hidden")); $(view).classList.remove("hidden"); }
function esc(s=""){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}
function authRequired(){ if(!currentUser){$("authDialog").showModal();return false} return true; }

async function getChannel(uid=currentUser?.uid){
  if(!uid) return null;
  const s=await getDoc(doc(db,"channels",uid));
  return s.exists()?s.data():null;
}

async function signIn(){
  try{await signInWithPopup(auth,google);toast("Signed in successfully");$("authDialog").close();}
  catch(e){console.error(e);toast(e.message||"Google sign-in failed");}
}
async function createChannel(){
  if(!authRequired())return;
  const name=$("channelName").value.trim(), handle=$("channelHandle").value.trim().replace(/^@/,"").toLowerCase();
  if(name.length<2||handle.length<3)return toast("Enter a valid channel name and handle.");
  await setDoc(doc(db,"channels",currentUser.uid),{
    uid:currentUser.uid,name,handle:"@"+handle,photoURL:currentUser.photoURL||"",
    subscribers:0,createdAt:serverTimestamp()
  });
  currentChannel=await getChannel();
  $("channelDialog").close(); toast("Channel created"); renderHome();
}
async function ensureChannel(){
  if(!authRequired())return false;
  currentChannel=await getChannel();
  if(!currentChannel){$("channelDialog").showModal();return false}
  return true;
}
async function ensurePhoneVerified(){
  if(currentUser?.phoneNumber)return true;
  $("phoneDialog").showModal();
  return false;
}

function renderAuth(){
  $("signInBtn").classList.toggle("hidden",!!currentUser);
  $("userMenu").classList.toggle("hidden",!currentUser);
  if(currentUser){$("avatar").src=currentUser.photoURL||"https://ui-avatars.com/api/?name=User"; $("joinCard").classList.add("hidden");}
  else $("joinCard").classList.remove("hidden");
}

async function loadVideos(){
  let q;
  try{
    q=query(collection(db,"videos"),where("visibility","==","public"),orderBy("createdAt","desc"),limit(40));
  }catch(e){q=query(collection(db,"videos"),where("visibility","==","public"),limit(40))}
  const snap=await getDocs(q);
  let items=snap.docs.map(d=>({id:d.id,...d.data()}));
  if(activeCategory!=="All")items=items.filter(v=>v.category===activeCategory);
  const term=$("searchInput").value.trim().toLowerCase();
  if(term)items=items.filter(v=>(v.title+" "+(v.description||"")+" "+(v.channelName||"")).toLowerCase().includes(term));
  $("videoGrid").innerHTML=items.map(videoCard).join("");
  $("emptyState").classList.toggle("hidden",items.length>0);
  $("trendingList").innerHTML=items.slice(0,5).map((v,i)=>`<div class="trending"><span>${i+1}</span><img src="${esc(v.thumbnailURL||"https://picsum.photos/seed/video/200/120")}"><div><b>${esc(v.title)}</b><div class="muted">${Number(v.views||0).toLocaleString()} views</div></div></div>`).join("");
}
function videoCard(v){
  return `<article class="video-card" data-id="${v.id}">
    <div class="thumb"><img src="${esc(v.thumbnailURL||"https://picsum.photos/seed/"+v.id+"/640/360")}" alt=""><span class="duration">VIDEO</span></div>
    <div class="video-meta"><img class="avatar" src="${esc(v.channelPhotoURL||"https://ui-avatars.com/api/?name="+encodeURIComponent(v.channelName||"Creator"))}">
      <div><h3>${esc(v.title)}</h3><p>${esc(v.channelName||"Creator")}</p><p>${Number(v.views||0).toLocaleString()} views</p></div>
    </div></article>`;
}
async function openVideo(id){
  const s=await getDoc(doc(db,"videos",id)); if(!s.exists())return;
  currentVideo={id,...s.data()};
  await updateDoc(doc(db,"videos",id),{views:increment(1)});
  const liked=(currentVideo.likes||[]).includes(currentUser?.uid);
  const disliked=(currentVideo.dislikes||[]).includes(currentUser?.uid);
  $("watchView").innerHTML=`<div class="watch">
    <div class="player"><video controls playsinline poster="${esc(currentVideo.thumbnailURL||"")} src="${esc(currentVideo.videoURL)}"></video></div>
    <h1 class="watch-title">${esc(currentVideo.title)}</h1>
    <div class="muted">${Number(currentVideo.views||0)+1} views · ${esc(currentVideo.category||"Video")}</div>
    <div class="actions">
      <button class="action ${liked?"active":""}" id="likeBtn">👍 ${((currentVideo.likes||[]).length)}</button>
      <button class="action ${disliked?"active":""}" id="dislikeBtn">👎 ${((currentVideo.dislikes||[]).length)}</button>
      <button class="action" id="shareBtn">↗ Share</button>
      <button class="action" id="remixBtn">✂ Remix with your video</button>
    </div>
    <div class="channel-row">
      <img class="avatar" src="${esc(currentVideo.channelPhotoURL||"https://ui-avatars.com/api/?name=Creator")}">
      <div class="grow"><b>${esc(currentVideo.channelName||"Creator")}</b><div class="muted">${Number(currentVideo.subscribers||0).toLocaleString()} subscribers</div></div>
      <button class="primary-btn" id="subscribeBtn">Subscribe</button>
    </div>
    <p class="watch-description">${esc(currentVideo.description||"")}</p>
    <div class="comments"><div class="section-head"><h2>Comments</h2><button class="outline-btn" id="commentBtn">＋ Comment</button></div><div id="commentList">Loading...</div></div>
  </div>`;
  show("watchView");
  $("likeBtn").onclick=()=>toggleReaction("like");
  $("dislikeBtn").onclick=()=>toggleReaction("dislike");
  $("shareBtn").onclick=shareVideo;
  $("remixBtn").onclick=()=>openUpload(true);
  $("commentBtn").onclick=()=>{if(authRequired()){$("commentDialog").showModal();pendingCommentVideo=currentVideo.id;}};
  $("subscribeBtn").onclick=toggleSubscribe;
  loadComments(currentVideo.id);
}
async function toggleReaction(type){
  if(!authRequired())return;
  const refv=doc(db,"videos",currentVideo.id);
  await runTransaction(db,async t=>{
    const s=await t.get(refv); const d=s.data()||{}; let likes=d.likes||[], dislikes=d.dislikes||[];
    if(type==="like"){likes=likes.includes(currentUser.uid)?likes.filter(x=>x!==currentUser.uid):[...likes,currentUser.uid];dislikes=dislikes.filter(x=>x!==currentUser.uid);}
    else{dislikes=dislikes.includes(currentUser.uid)?dislikes.filter(x=>x!==currentUser.uid):[...dislikes,currentUser.uid];likes=likes.filter(x=>x!==currentUser.uid);}
    t.update(refv,{likes,dislikes});
  });
  openVideo(currentVideo.id);
}
async function loadComments(videoId){
  const qy=query(collection(db,"videos",videoId,"comments"),orderBy("createdAt","desc"),limit(50));
  try{
    const snap=await getDocs(qy);
    $("commentList").innerHTML=snap.docs.map(d=>{const c=d.data();return `<div class="comment"><b>${esc(c.displayName||"User")}</b><div class="muted">${c.createdAt?.toDate?.().toLocaleString?.()||""}</div><div>${esc(c.text)}</div></div>`}).join("")||`<p class="muted">Be the first to comment.</p>`;
  }catch(e){$("commentList").textContent="Comments are temporarily unavailable."}
}
async function postComment(){
  if(!authRequired()||!pendingCommentVideo)return;
  const text=$("commentText").value.trim();if(!text)return;
  await addDoc(collection(db,"videos",pendingCommentVideo,"comments"),{uid:currentUser.uid,displayName:currentUser.displayName||"User",photoURL:currentUser.photoURL||"",text,createdAt:serverTimestamp()});
  $("commentText").value="";$("commentDialog").close();toast("Comment posted");loadComments(pendingCommentVideo);
}
async function toggleSubscribe(){
  if(!authRequired())return;
  const channelUid=currentVideo.ownerUid;if(channelUid===currentUser.uid)return toast("You cannot subscribe to your own channel.");
  const subRef=doc(db,"channels",channelUid,"subscribers",currentUser.uid);
  const s=await getDoc(subRef);
  if(s.exists()){await deleteDoc(subRef);await updateDoc(doc(db,"channels",channelUid),{subscribers:increment(-1)});toast("Unsubscribed");}
  else{await setDoc(subRef,{uid:currentUser.uid,createdAt:serverTimestamp()});await updateDoc(doc(db,"channels",channelUid),{subscribers:increment(1)});toast("Subscribed");}
}
async function shareVideo(){
  const url=location.origin+location.pathname+"#watch/"+currentVideo.id;
  try{await navigator.share({title:currentVideo.title,url});}catch{await navigator.clipboard.writeText(url);toast("Video link copied");}
}
async function openChannel(uid=currentUser?.uid){
  const c=await getChannel(uid);if(!c)return toast("This creator has not created a channel yet.");
  const snap=await getDocs(query(collection(db,"videos"),where("ownerUid","==",uid),orderBy("createdAt","desc"),limit(50)));
  $("channelView").innerHTML=`<div class="channel-cover"></div><div class="channel-head"><img class="avatar" src="${esc(c.photoURL||"https://ui-avatars.com/api/?name="+encodeURIComponent(c.name))}"><div><h1>${esc(c.name)}</h1><div class="muted">${esc(c.handle)} · ${Number(c.subscribers||0).toLocaleString()} subscribers</div></div></div><div class="section-head" style="margin-top:25px"><h2>Videos</h2></div><div class="video-grid">${snap.docs.map(d=>videoCard({id:d.id,...d.data()})).join("")}</div>`;
  show("channelView");
}
async function startPhoneVerification(){
  if(!authRequired())return;
  try{
    if(!recaptcha)recaptcha=new RecaptchaVerifier(auth,"recaptcha-container",{size:"normal"});
    confirmationResult=await signInWithPhoneNumber(auth,$("phoneNumber").value.trim(),recaptcha);
    $("verificationCode").classList.remove("hidden");$("verifyCodeBtn").classList.remove("hidden");toast("Code sent");
  }catch(e){console.error(e);toast(e.message||"Could not send code");}
}
async function verifyPhone(){
  try{
    const result=await confirmationResult.confirm($("verificationCode").value.trim());
    currentUser=result.user;
    $("phoneDialog").close();toast("Phone verified");
  }catch(e){toast(e.message||"Invalid verification code");}
}
async function openUpload(isRemix=false){
  if(!await ensureChannel())return;
  if(!currentUser.phoneNumber){if(!await ensurePhoneVerified())return;}
  $("uploadDialog").showModal();
  $("publishBtn").dataset.remix=isRemix?"true":"false";
}
async function publish(){
  if(!await ensureChannel())return;
  const vf=$("videoFile").files[0]; const tf=$("thumbnailFile").files[0];
  const title=$("uploadTitle").value.trim(); if(!vf||!title)return toast("Choose a video and enter a title.");
  if(tf && !currentUser.phoneNumber)return toast("Verify your phone before using a custom thumbnail.");
  $("uploadProgress").classList.remove("hidden");
  const base=`videos/${currentUser.uid}/${crypto.randomUUID()}`;
  const videoRef=ref(storage,base+"/"+vf.name);
  const task=uploadBytesResumable(videoRef,vf,{contentType:vf.type});
  task.on("state_changed",s=>{const p=Math.round(s.bytesTransferred/s.totalBytes*100);$("progressBar").style.width=p+"%";$("progressText").textContent=p+"%";},e=>toast(e.message),async()=>{
    const videoURL=await getDownloadURL(task.snapshot.ref);
    let thumbnailURL="";
    if(tf){
      const tr=ref(storage,base+"/thumbnail-"+tf.name);
      const ts=await uploadBytesResumable(tr,tf,{contentType:tf.type});
      thumbnailURL=await getDownloadURL(ts.ref);
    }
    await addDoc(collection(db,"videos"),{
      ownerUid:currentUser.uid,channelName:currentChannel.name,channelPhotoURL:currentChannel.photoURL||"",
      title,description:$("uploadDescription").value.trim(),category:$("uploadCategory").value,
      visibility:$("uploadVisibility").value,videoURL,thumbnailURL,views:0,likes:[],dislikes:[],
      subscribers:currentChannel.subscribers||0,createdAt:serverTimestamp(),
      remixOf:$("publishBtn").dataset.remix==="true"?(currentVideo?.id||null):null
    });
    $("uploadDialog").close(); $("uploadProgress").classList.add("hidden"); $("uploadTitle").value="";$("videoFile").value="";$("thumbnailFile").value="";toast("Video published");renderHome();
  });
}
async function renderHome(){show("homeView");await loadVideos();}

document.addEventListener("click",e=>{
  const card=e.target.closest(".video-card");if(card)openVideo(card.dataset.id);
});
$("menuBtn").onclick=()=>$("sidebar").classList.toggle("open");
$("signInBtn").onclick=signIn;$("joinGoogleBtn").onclick=signIn;$("dialogGoogleBtn").onclick=signIn;
$("signOutBtn").onclick=()=>signOut(auth);
$("createChannelBtn").onclick=()=>{if(authRequired()){$("channelDialog").showModal()}};
$("uploadTopBtn").onclick=()=>openUpload(false);$("uploadSideBtn").onclick=()=>openUpload(false);
$("saveChannelBtn").onclick=createChannel;$("sendCodeBtn").onclick=startPhoneVerification;$("verifyCodeBtn").onclick=verifyPhone;
$("publishBtn").onclick=publish;$("postCommentBtn").onclick=postComment;
$("heroBtn").onclick=()=>{if(currentUser)openUpload(false);else signIn()};
$("searchBtn").onclick=renderHome;$("searchInput").onkeydown=e=>{if(e.key==="Enter")renderHome()};
document.querySelectorAll(".chip").forEach(b=>b.onclick=()=>{document.querySelectorAll(".chip").forEach(x=>x.classList.remove("active"));b.classList.add("active");activeCategory=b.dataset.category;renderHome()});
document.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>$(b.dataset.close).close());
$("channelView").addEventListener("click",e=>{});
$("sidebar").querySelector('a[href="#channel"]').onclick=e=>{e.preventDefault();if(authRequired())openChannel()};
window.addEventListener("hashchange",async()=>{const h=location.hash;if(h.startsWith("#watch/"))openVideo(h.split("/")[1]);else if(h==="#channel"&&currentUser)openChannel();else renderHome()});

onAuthStateChanged(auth,async u=>{currentUser=u;renderAuth();currentChannel=await getChannel();});
renderHome();
