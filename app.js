const $=s=>document.querySelector(s);
const fileInput=$("#fileInput"),chooseBtn=$("#chooseBtn"),dropzone=$("#dropzone"),workspace=$("#workspace");
const sourceVideo=$("#sourceVideo"),fileName=$("#fileName"),fileMeta=$("#fileMeta"),changeBtn=$("#changeBtn");
const generateBtn=$("#generateBtn"),progressWrap=$("#progressWrap"),progressBar=$("#progressBar"),progressLabel=$("#progressLabel"),progressPct=$("#progressPct");
const resultsSection=$("#resultsSection"),clipGrid=$("#clipGrid"),downloadAllBtn=$("#downloadAllBtn");
let sourceFile=null, sourceUrl=null, clipSeconds=30, clips=[];

document.querySelectorAll("#durationGroup button").forEach(b=>b.onclick=()=>{document.querySelectorAll("#durationGroup button").forEach(x=>x.classList.remove("active"));b.classList.add("active");clipSeconds=+b.dataset.value});

chooseBtn.onclick=()=>fileInput.click();
changeBtn.onclick=()=>fileInput.click();
fileInput.onchange=e=>e.target.files[0]&&loadVideo(e.target.files[0]);

["dragenter","dragover"].forEach(ev=>dropzone.addEventListener(ev,e=>{e.preventDefault();dropzone.classList.add("drag")}));
["dragleave","drop"].forEach(ev=>dropzone.addEventListener(ev,e=>{e.preventDefault();dropzone.classList.remove("drag")}));
dropzone.addEventListener("drop",e=>{const f=e.dataTransfer.files[0];if(f&&f.type.startsWith("video/"))loadVideo(f);else alert("Pilih file video yang valid.")});

function fmtBytes(n){const u=["B","KB","MB","GB"];let i=0;while(n>=1024&&i<3){n/=1024;i++}return `${n.toFixed(i?1:0)} ${u[i]}`}
function fmtTime(s){s=Math.max(0,s);let h=Math.floor(s/3600),m=Math.floor(s%3600/60),sec=Math.floor(s%60);return h?`${h}:${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`:`${m}:${String(sec).padStart(2,"0")}`}
function setProgress(p,label){progressBar.style.width=p+"%";progressPct.textContent=Math.round(p)+"%";progressLabel.textContent=label}

function loadVideo(file){
  if(!file.type.startsWith("video/")) return;
  sourceFile=file;if(sourceUrl)URL.revokeObjectURL(sourceUrl);sourceUrl=URL.createObjectURL(file);
  sourceVideo.src=sourceUrl;fileName.textContent=file.name;
  sourceVideo.onloadedmetadata=()=>{fileMeta.textContent=`${fmtTime(sourceVideo.duration)} · ${fmtBytes(file.size)} · ${sourceVideo.videoWidth}×${sourceVideo.videoHeight}`};
  dropzone.classList.add("hidden");workspace.classList.remove("hidden");resultsSection.classList.add("hidden");clipGrid.innerHTML="";
}

function buildStarts(duration,count,len,mode){
  const max=Math.max(0,duration-len);
  if(max===0)return [0];
  count=Math.min(count,30);
  if(mode==="start"){return Array.from({length:count},(_,i)=>Math.min(i*len,max))}
  if(mode==="random"){const arr=[];for(let i=0;i<count;i++)arr.push(Math.random()*max);return arr.sort((a,b)=>a-b)}
  if(count===1)return [max/2];
  return Array.from({length:count},(_,i)=>max*i/(count-1));
}

async function getFFmpeg(){
  if(!window.FFmpeg) throw new Error("FFmpeg library gagal dimuat. Pastikan koneksi internet aktif saat membuka website pertama kali.");
  const {createFFmpeg,fetchFile}=FFmpeg;
  const ffmpeg=createFFmpeg({log:false,corePath:"https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js"});
  await ffmpeg.load();
  return {ffmpeg,fetchFile};
}

generateBtn.onclick=async()=>{
  if(!sourceFile||!sourceVideo.duration)return;
  generateBtn.disabled=true;progressWrap.classList.remove("hidden");resultsSection.classList.add("hidden");clipGrid.innerHTML="";clips.forEach(c=>URL.revokeObjectURL(c.url));clips=[];
  try{
    const count=Math.max(1,Math.min(30,+$("#countInput").value||8));
    const mode=$("#modeSelect").value;
    const len=Math.min(clipSeconds,sourceVideo.duration);
    const starts=buildStarts(sourceVideo.duration,count,len,mode);
    setProgress(2,"Memuat video engine…");
    const {ffmpeg,fetchFile}=await getFFmpeg();
    setProgress(8,"Membaca video…");
    ffmpeg.FS("writeFile","input.mp4",await fetchFile(sourceFile));
    for(let i=0;i<starts.length;i++){
      const start=starts[i], out=`clip_${String(i+1).padStart(2,"0")}.mp4`;
      setProgress(10+(i/starts.length)*85,`Membuat clip ${i+1} dari ${starts.length}…`);
      await ffmpeg.run("-ss",String(start),"-i","input.mp4","-t",String(len),"-c","copy","-avoid_negative_ts","make_zero",out);
      const data=ffmpeg.FS("readFile",out);
      const blob=new Blob([data.buffer],{type:"video/mp4"});
      clips.push({blob,url:URL.createObjectURL(blob),name:out,start,len});
      ffmpeg.FS("unlink",out);
      renderClip(clips[clips.length-1],i);
      setProgress(10+((i+1)/starts.length)*85,`Clip ${i+1} selesai`);
    }
    try{ffmpeg.FS("unlink","input.mp4")}catch(e){}
    setProgress(100,"Selesai — semua clip siap.");
    resultsSection.classList.remove("hidden");
    $("#resultsTitle").textContent=`${clips.length} clips ready`;
    resultsSection.scrollIntoView({behavior:"smooth",block:"start"});
  }catch(err){
    console.error(err);alert("Gagal memproses video. Coba MP4/H.264, kurangi jumlah clip, atau gunakan perangkat dengan RAM lebih besar.\n\n"+err.message);
    setProgress(0,"Gagal");
  }finally{generateBtn.disabled=false}
};

function renderClip(c,i){
  const card=document.createElement("article");card.className="clip-card done";
  card.innerHTML=`<video controls playsinline preload="metadata"></video><div class="clip-info"><b>CLIP ${String(i+1).padStart(2,"0")}</b><small>${fmtTime(c.start)} → ${fmtTime(c.start+c.len)}</small><button class="btn">DOWNLOAD MP4</button></div>`;
  card.querySelector("video").src=c.url;
  card.querySelector("button").onclick=()=>downloadBlob(c.blob,c.name);
  clipGrid.appendChild(card);
}
function downloadBlob(blob,name){const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
downloadAllBtn.onclick=()=>clips.forEach((c,i)=>setTimeout(()=>downloadBlob(c.blob,c.name),i*250));
