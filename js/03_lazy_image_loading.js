/* ===========================
 * LAZY IMAGE LOADING
 * =========================== */
let io;
let rawImageList = null;
function initLazyImages(){
  if(io) io.disconnect();
  io = new IntersectionObserver(es=>{
    for(const e of es){
      if(!e.isIntersecting && !document.body.classList.contains("modal-open")) continue;
      const img = e.target;
      const url = img.getAttribute("data-src") || img.dataset.src;
      const hasSrcAttr = img.hasAttribute("src") && (img.getAttribute("src") || "").trim() !== "";
      if(url && !hasSrcAttr){
        img.setAttribute("src", url);
        img.classList.remove("lazy");
        img.removeAttribute("data-src");
      }
      io.unobserve(img);
    }
  },{root:null,rootMargin:"400px 0px",threshold:0.01});
  document.querySelectorAll('img.lazy').forEach(img=>{
    const url = img.getAttribute("data-src") || img.dataset.src;
    const hasSrcAttr = img.hasAttribute("src") && (img.getAttribute("src") || "").trim() !== "";
    if(url && !hasSrcAttr) io.observe(img);
 });
}