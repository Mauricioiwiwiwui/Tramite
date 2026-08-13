const q = new URLSearchParams(location.search).get('tool');
const area = document.getElementById('toolArea');
const back = () => { location.href = 'index.html'; };
document.getElementById('backBtn').addEventListener('click', back);

function ui(title, html) {
  document.getElementById('toolTitle').textContent = title;
  area.innerHTML = `${html}<div class="tool-actions"><button class="primary" id="backTool">← Volver al inicio</button></div>`;
  document.getElementById('backTool').addEventListener('click', back);
}
function files(accept, multiple=false) {
  return `<label for="files">Selecciona ${multiple ? 'uno o varios archivos' : 'un archivo'}</label><input id="files" type="file" accept="${accept}" ${multiple?'multiple':''}><div id="fileList" class="file-list"></div>`;
}
function setStatus(text, ok=true){
  const out=document.getElementById('out');
  if(out){out.textContent=text;out.style.color=ok?'var(--green)':'var(--red)';}
}
function trackDownload(){
  try{
    const s=JSON.parse(localStorage.getItem('sm_stats')||'{"uses":0,"downloads":0,"external":0,"tools":0}');
    s.downloads=(s.downloads||0)+1; localStorage.setItem('sm_stats',JSON.stringify(s));
  }catch{}
}
function downloadBytes(bytes,name,type='application/pdf'){
  const url=URL.createObjectURL(new Blob([bytes],{type}));
  const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1500);trackDownload();
}
function fileNames(){
  const input=document.getElementById('files');
  if(!input)return;
  document.getElementById('fileList').textContent=Array.from(input.files).map(f=>f.name).join(' · ');
}

if(q==='combine'){
  ui('📑 Combinar PDF', `${files('application/pdf',true)}<button class="primary" id="run">Combinar y descargar</button><div id="out"></div>`);
}else if(q==='split'){
  ui('✂️ Dividir PDF', `${files('application/pdf')}<div class="row"><div><label>Página inicial</label><input id="from" type="number" min="1" value="1"></div><div><label>Página final</label><input id="to" type="number" min="1" value="1"></div></div><button class="primary" id="run">Extraer páginas y descargar</button><div id="out"></div>`);
}else if(q==='rotate'){
  ui('🔄 Rotar PDF', `${files('application/pdf')}<label for="deg">Rotación</label><select id="deg"><option value="90">90°</option><option value="180">180°</option><option value="270">270°</option></select><button class="primary" id="run">Rotar y descargar</button><div id="out"></div>`);
}else if(q==='imagespdf'){
  ui('🖼️ Imágenes → PDF', `${files('image/png,image/jpeg',true)}<button class="primary" id="run">Crear PDF</button><div id="out"></div>`);
}else if(q==='pdfimages'){
  ui('🖼️ PDF → Imágenes', `${files('application/pdf')}<label for="scale">Calidad</label><select id="scale"><option value="1.5">Normal</option><option value="2">Alta</option><option value="2.5">Muy alta</option></select><button class="primary" id="run">Convertir y descargar imágenes</button><div id="out"></div>`);
}else if(q==='compress'){
  ui('📦 Optimizar PDF', `${files('application/pdf')}<p class="card-sub">La optimización reempaqueta el PDF. La reducción real depende de cómo fue creado el archivo.</p><button class="primary" id="run">Optimizar y descargar</button><div id="out"></div>`);
}else if(q==='comprobantes'){
  ui('🧾 Comprobantes', `<label>Nombre o concepto</label><input id="concepto" placeholder="Ej. Servicio solicitado"><label>Detalle</label><textarea id="detalle" rows="5" placeholder="Escribe el detalle del comprobante..."></textarea><label>Folio</label><input id="folio" placeholder="SM-000001"><button class="primary" id="run">Generar comprobante PDF</button><div id="out"></div>`);
}else if(q==='tickets'){
  ui('🎫 Tickets', `<label>Cliente</label><input id="cliente" placeholder="Nombre del cliente"><label>Asunto</label><input id="asunto" placeholder="Servicio o solicitud"><label>Descripción</label><textarea id="descripcion" rows="5" placeholder="Describe la solicitud..."></textarea><label>Folio</label><input id="folio" placeholder="SM-000001"><button class="primary" id="run">Generar ticket PDF</button><div id="out"></div>`);
}else if(q==='gastos'){
  ui('💰 Gastos', `<label>Concepto</label><input id="concepto" placeholder="Ej. Papelería"><label>Monto</label><input id="monto" type="number" min="0" step="0.01" placeholder="0.00"><button class="primary" id="add">Agregar gasto</button><button class="danger" id="clear">Borrar lista</button><div id="gastosList" class="list"></div><h3>Total: <span id="total">$0.00</span></h3>`);
}else{
  ui('🛠️ Herramienta', `<p>Esta herramienta no está disponible todavía.</p>`);
}

const input=document.getElementById('files');
if(input){input.addEventListener('change',fileNames);}

if(document.getElementById('run')) document.getElementById('run').addEventListener('click', async()=>{
  try{
    const fs=Array.from(document.getElementById('files')?.files||[]);
    if(q==='comprobantes'||q==='tickets') return generateSimplePdf(q);
    if(!fs.length) return setStatus('Selecciona al menos un archivo.',false);
    const out=document.getElementById('out');
    if(q==='combine'){
      const doc=await PDFLib.PDFDocument.create();
      for(const file of fs){const src=await PDFLib.PDFDocument.load(await file.arrayBuffer());const pages=await doc.copyPages(src,src.getPageIndices());pages.forEach(p=>doc.addPage(p));}
      downloadBytes(await doc.save(),'Santana-combinado.pdf');setStatus('PDF combinado correctamente.');
    }else if(q==='split'){
      const src=await PDFLib.PDFDocument.load(await fs[0].arrayBuffer());
      let a=Math.max(1,Number(document.getElementById('from').value))-1;
      let b=Math.min(src.getPageCount(),Number(document.getElementById('to').value));
      if(a>=b) return setStatus('El rango de páginas no es válido.',false);
      const doc=await PDFLib.PDFDocument.create();const pages=await doc.copyPages(src,Array.from({length:b-a},(_,i)=>a+i));pages.forEach(p=>doc.addPage(p));
      downloadBytes(await doc.save(),'Santana-dividido.pdf');setStatus(`Se extrajeron las páginas ${a+1} a ${b}.`);
    }else if(q==='rotate'){
      const src=await PDFLib.PDFDocument.load(await fs[0].arrayBuffer());const deg=Number(document.getElementById('deg').value);src.getPages().forEach(p=>p.setRotation(PDFLib.degrees(p.getRotation().angle+deg)));
      downloadBytes(await src.save(),'Santana-rotado.pdf');setStatus('PDF rotado correctamente.');
    }else if(q==='imagespdf'){
      const doc=await PDFLib.PDFDocument.create();
      for(const file of fs){const bytes=await file.arrayBuffer();const img=file.type==='image/png'?await doc.embedPng(bytes):await doc.embedJpg(bytes);const page=doc.addPage([img.width,img.height]);page.drawImage(img,{x:0,y:0,width:img.width,height:img.height});}
      downloadBytes(await doc.save(),'Santana-imagenes.pdf');setStatus('PDF creado correctamente.');
    }else if(q==='pdfimages'){
      const data=await fs[0].arrayBuffer();
      if(!window.pdfjsLib) throw new Error('El visor PDF no está disponible.');
      pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      const pdf=await pdfjsLib.getDocument({data}).promise;const scale=Number(document.getElementById('scale').value);
      for(let i=1;i<=pdf.numPages;i++){const page=await pdf.getPage(i);const viewport=page.getViewport({scale});const canvas=document.createElement('canvas');canvas.width=viewport.width;canvas.height=viewport.height;await page.render({canvasContext:canvas.getContext('2d'),viewport}).promise;const blob=await new Promise(r=>canvas.toBlob(r,'image/png'));downloadBytes(await blob.arrayBuffer(),`Santana-pagina-${i}.png`,'image/png');}
      setStatus(`Se generaron ${pdf.numPages} imagen(es).`);
    }else if(q==='compress'){
      const src=await PDFLib.PDFDocument.load(await fs[0].arrayBuffer());downloadBytes(await src.save({useObjectStreams:true}),'Santana-optimizado.pdf');setStatus('PDF optimizado.');
    }
  }catch(err){console.error(err);setStatus('No se pudo procesar el archivo. Verifica que sea válido.',false);}
});

function generateSimplePdf(kind){
  const title=kind==='comprobantes'?'COMPROBANTE':'TICKET DE SERVICIO';
  const concept=document.getElementById('concepto')?.value.trim()||document.getElementById('asunto')?.value.trim()||'Sin concepto';
  const detail=document.getElementById('detalle')?.value.trim()||document.getElementById('descripcion')?.value.trim()||'';
  const folio=document.getElementById('folio')?.value.trim()||`SM-${Date.now().toString().slice(-8)}`;
  const date=new Date().toLocaleString('es-MX');
  const lines=[title,'SANTANA MANAGEMENT','',`Folio: ${folio}`,`Fecha: ${date}`,`Concepto: ${concept}`, '', detail];
  const doc=PDFLib.PDFDocument.create();doc.then(async d=>{const page=d.addPage([595,842]);let y=760;for(const line of lines){page.drawText(line,{x:50,y,size:line===title?20:11});y-=28;}downloadBytes(await d.save(),`${folio}.pdf`,'application/pdf');setStatus('Documento generado correctamente.');});
}

if(q==='gastos'){
  let gastos=[];
  const draw=()=>{document.getElementById('gastosList').innerHTML=gastos.map((g,i)=>`<div class="list-item"><span>${g.concepto}</span><b>$${g.monto.toFixed(2)}</b><button class="danger" data-i="${i}">×</button></div>`).join('')||'<div class="list-item">Aún no hay gastos.</div>';document.getElementById('total').textContent='$'+gastos.reduce((a,g)=>a+g.monto,0).toFixed(2)};
  draw();document.getElementById('add').addEventListener('click',()=>{const concepto=document.getElementById('concepto').value.trim();const monto=Number(document.getElementById('monto').value);if(!concepto||!(monto>=0))return;gastos.unshift({concepto,monto});document.getElementById('concepto').value='';document.getElementById('monto').value='';draw()});document.getElementById('clear').addEventListener('click',()=>{gastos=[];draw()});document.getElementById('gastosList').addEventListener('click',e=>{if(e.target.dataset.i!==undefined){gastos.splice(Number(e.target.dataset.i),1);draw()}});
}
