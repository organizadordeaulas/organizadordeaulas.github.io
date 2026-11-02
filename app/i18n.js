/* ===================================================================
   i18n — Organizador de Aulas Prometeu
   Idiomas: pt-BR (original), pt-PT, en, es, zh (chinês simplificado).

   Como funciona:
   - O app continua escrito em pt-BR. O dicionário I18N usa o TEXTO
     pt-BR como chave; o que não estiver no dicionário fica em pt-BR
     (fallback seguro — nunca quebra).
   - translateDOM() percorre os nós de texto e atributos (placeholder,
     aria-label, title) e troca os textos exatos. Conteúdo do usuário
     (títulos de aulas, nomes de vídeos…) nunca bate com as chaves,
     então não é tocado.
   - Strings compostas com números ("3 aulas · …") são tratadas pelas
     RULES (regex), aplicadas só dentro de contêineres da interface
     (RX_ZONES) para não alcançar dados do usuário.
   - Strings geradas por JS (alert/confirm/toast/textContent) usam
     tr('…') e trf('… {x} …',{x:…}) chamadas pelo app.js.
   - Trocar de idioma recarrega a página (dados já ficam salvos).
   =================================================================== */

const LANG_KEY='prometeu.lang.v1';
const LANG_META={
  'pt-BR':{label:'Português (Brasil)',tag:'pt-BR'},
  'pt-PT':{label:'Português (Portugal)',tag:'pt-PT'},
  'en':{label:'English',tag:'en'},
  'es':{label:'Español',tag:'es'},
  'zh':{label:'中文（简体）',tag:'zh-CN'}
};
let LANG=(function(){
  try{const s=localStorage.getItem(LANG_KEY);if(s&&LANG_META[s])return s;}catch(e){}
  const n=(navigator.language||'pt-BR');
  if(/^pt-PT/i.test(n))return 'pt-PT';
  if(/^pt/i.test(n))return 'pt-BR';
  if(/^es/i.test(n))return 'es';
  if(/^zh/i.test(n))return 'zh';
  if(/^en/i.test(n))return 'en';
  return 'pt-BR';
})();
function setLang(l){
  if(!LANG_META[l]||l===LANG)return;
  try{localStorage.setItem(LANG_KEY,l);}catch(e){}
  location.reload(); // caminho mais seguro: re-render completo no idioma novo
}
function tr(s){
  const d=I18N[LANG];if(!d)return s;
  const v=d[s];if(v==null)return s;
  return typeof v==='function'?v({}):v;
}
function trf(s,vars){
  const d=I18N[LANG];
  let v=d?d[s]:null;if(v==null)v=s;
  if(typeof v==='function')return v(vars||{});
  return String(v).replace(/\{(\w+)\}/g,(m,k)=>vars&&vars[k]!=null?vars[k]:m);
}

/* Contêineres onde as RULES (regex) podem atuar — só interface, nunca campos de usuário */
const RX_ZONES='.ds,.dc,.as,.ac,.cap-total,.ta-line,.tree-toggle,.tree-empty,.ta-pend,.pend-badge,.done-badge,.sb-sub,#aula-info-lbl';

/* Regras para textos compostos (número + palavra). $1 = número capturado. */
const RULES=[
  {re:/(\d+)\s+aulas?\b/g,
   en:(m,n)=>+n===1?'1 lesson':n+' lessons', es:(m,n)=>+n===1?'1 clase':n+' clases', zh:'$1 节课'},
  {re:/(\d+)\s+vídeos?\b/g,
   en:(m,n)=>+n===1?'1 video':n+' videos', zh:'$1 个视频'},
  {re:/(\d+)\s+séries?\/anos?\b/g,
   en:(m,n)=>+n===1?'1 grade/year':n+' grades/years', es:(m,n)=>+n===1?'1 curso/año':n+' cursos/años', zh:'$1 个年级', 'pt-PT':'$1 ano(s)'},
  {re:/(\d+)\s+matérias?\/séries?\b/g,
   en:(m,n)=>+n===1?'1 subject/grade':n+' subjects/grades', es:(m,n)=>+n===1?'1 asignatura/curso':n+' asignaturas/cursos', zh:'$1 个科目', 'pt-PT':'$1 disciplina(s)/ano(s)'},
  {re:/(\d+)\s+cap\./g, en:'$1 chap.', zh:'$1 章'},
  {re:/●\s*(\d+)\s+a ministrar/g,
   en:'● $1 to teach', es:'● $1 por impartir', zh:'● $1 待授课', 'pt-PT':'● $1 por lecionar'},
  {re:/●\s*A MINISTRAR/g,
   en:'● TO TEACH', es:'● POR IMPARTIR', zh:'● 待授课', 'pt-PT':'● POR LECIONAR'},
  {re:/✓\s*tudo ministrado/g,
   en:'✓ all taught', es:'✓ todo impartido', zh:'✓ 全部已授课', 'pt-PT':'✓ tudo lecionado'},
  {re:/✓\s*ministrado/g,
   en:'✓ taught', es:'✓ impartido', zh:'✓ 已授课', 'pt-PT':'✓ lecionado'},
  {re:/\bAula\s+(\d+)/g, en:'Lesson $1', es:'Clase $1', zh:'第 $1 课'},
  {re:/\bAno letivo\s+(\S+)/g, en:'School year $1', es:'Año lectivo $1', zh:'$1 学年'},
  {re:/·\s*toque para abrir/g, en:'· tap to open', es:'· toca para abrir', zh:'· 点击打开', 'pt-PT':'· carregue para abrir'}
];
function applyRules(s){
  let out=s,hit=false;
  for(const r of RULES){
    const sub=r[LANG];if(sub==null)continue;
    const nx=out.replace(r.re,sub);
    if(nx!==out){hit=true;out=nx;}
  }
  return hit?out:null;
}

function translateDOM(root){
  if(LANG==='pt-BR')return;
  const d=I18N[LANG];if(!d)return;
  root=root||document.body;if(!root)return;
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,null);
  const nodes=[];let n;
  while((n=walker.nextNode()))nodes.push(n);
  for(const tn of nodes){
    const p=tn.parentElement;if(!p)continue;
    const tag=p.tagName;
    if(tag==='SCRIPT'||tag==='STYLE'||tag==='TEXTAREA')continue;
    const raw=tn.nodeValue;if(!raw||!raw.trim())continue;
    const t=raw.trim();
    let out=d[t];
    if(typeof out==='function')out=out({});
    if(out==null&&p.closest&&p.closest(RX_ZONES))out=applyRules(t);
    if(out!=null&&out!==t)tn.nodeValue=raw.replace(t,out);
  }
  root.querySelectorAll('[placeholder],[aria-label],[title]').forEach(el=>{
    for(const a of ['placeholder','aria-label','title']){
      const v=el.getAttribute(a);if(!v)continue;
      let nv=d[v];if(typeof nv==='function')nv=nv({});
      if(nv!=null&&nv!==v)el.setAttribute(a,nv);
    }
  });
}
let _trT=null;
function scheduleTranslate(){
  if(LANG==='pt-BR')return;
  clearTimeout(_trT);_trT=setTimeout(()=>translateDOM(),30);
}
function i18nBoot(){ // chamado pelo app.js no fim da inicialização
  document.documentElement.lang=LANG_META[LANG].tag;
  document.title=tr('Organizador de Aulas Prometeu');
  translateDOM();
}

/* ===================== DICIONÁRIOS ===================== */
const I18N={

/* ---------- INGLÊS ---------- */
'en':{
'<b>Arquivo salvo!</b> “{a}” foi baixado neste aparelho — no iPhone/iPad, escolha <b>“Salvar em Arquivos”</b>.':'<b>File saved!</b> “{a}” was downloaded to this device — on iPhone/iPad, choose <b>“Save to Files”</b>.',
'Na janela que abrir, escolha <b>“Salvar como PDF”</b> e depois onde guardar o arquivo.':'In the window that opens, choose <b>“Save as PDF”</b> and then where to save the file.',
'Organizador de Aulas Prometeu':'Lesson Organizer Prometheus',
'Abrir menu':'Open menu','Voltar':'Back','Início':'Home','Fechar menu':'Close menu','Fechar':'Close',
'Mover para cima':'Move up','Mover para baixo':'Move down','Concluir':'Done',
'Cancelar':'Cancel','Salvar':'Save','Salvar vídeo':'Save video','Editar':'Edit','Remover':'Delete',
'Tutorial':'Tutorial','Atualização':'Updates','Versão':'Version','Arquivo':'File','Ajuda':'Help',
'Idioma':'Language','Privacidade':'Privacy','Termos de uso':'Terms of use','Modo demonstração':'Demo mode',
'Enviar críticas ou sugestões':'Send feedback or suggestions',
'Críticas e sugestões — Organizador de Aulas Prometeu':'Feedback and suggestions — Lesson Organizer Prometheus',
'Instalar aplicativo':'Install app',
'O app já está instalado neste aparelho.':'The app is already installed on this device.',
'INSTALL_HELP':'<p><b>On a computer (Windows) — Edge or Chrome:</b></p><ol><li>Open this site in <b>Microsoft Edge</b> or <b>Google Chrome</b>.</li><li>Check that the address starts with <b>https://</b> and is the app\'s official site.</li><li>Click the <b>install icon</b> (a monitor with an arrow ⤓) at the end of the address bar — or the <b>⋮</b> menu → <b>“Install Organizador de Aulas Prometeu”</b>.</li><li>Confirm with <b>“Install”</b>. The app gets an icon in the <b>Start menu</b> and opens in a window of its own from then on.</li></ol><p><b>On Android (phone/tablet):</b> open it in <b>Chrome</b> → <b>⋮</b> menu → <b>“Install app”</b> (or “Add to Home screen”). If the option does not show up, the browser may not support installing (Mi Browser, for instance) — use Chrome.</p><p class="fhint">Safety: always install from the official site and keep your browser up to date. The app works offline and keeps everything on this device only.</p>',
'INSTALL_HELP_IOS':'<p><b>On iPhone or iPad — using Safari:</b></p><ol><li>Open this site in <b>Safari</b> (it has to be Safari — other browsers on the iPhone do not install apps).</li><li>Check that the address starts with <b>https://</b> and is the app\'s official site.</li><li>Tap the <b>Share</b> button (the square with an arrow pointing up, in the bottom bar).</li><li>Scroll the list and tap <b>“Add to Home Screen”</b> → <b>“Add”</b>.</li></ol><p>The app gets an icon of its own and opens full screen, like a regular app.</p><p class="fhint">Safety: always install through Safari, from the official site. The app works offline and keeps everything on this device only.</p>',
'Projeto em uso':'Current project','Gerenciar projetos':'Manage projects','Criar novo projeto':'Create new project',
'Exportar backup (.json)':'Export backup (.json)','Importar backup (.json)':'Import backup (.json)',
'Nova matéria':'New subject','Nova série/ano':'New grade/year','Nova aula':'New lesson','Novo capítulo':'New chapter','Novo vídeo':'New video',
'Transferir aulas':'Transfer lessons','Transferir todas as aulas':'Transfer all lessons','Transferir':'Transfer',
'Levar {n} aula(s): toque no destino':'Move {n} lesson(s): tap the destination',
'Levar {n} aula(s) para <b>{d}</b>?':'Move {n} lesson(s) to <b>{d}</b>?',
'Toque na série/ano que vai receber as aulas.':'Tap the grade/year that will receive the lessons.',
'As aulas já estão nesta série/ano.':'The lessons are already in this grade/year.',
'Todas':'All','Nenhuma':'None',
'Nada para desfazer.':'Nothing to undo.',
'Última alteração desfeita.':'Last change undone.',
'Desfazer a última alteração':'Undo the last change',
'{n} selecionada(s)':'{n} selected',
'Crie outra série/ano para receber as aulas.':'Create another grade/year to receive the lessons.',
'Marque as aulas e toque em <b>Transferir</b>.':'Check the lessons and tap <b>Transfer</b>.',
'{n} aula(s) transferida(s) para <b>{d}</b>.':'{n} lesson(s) transferred to <b>{d}</b>.',
'Editar série/ano':'Edit grade/year','Editar aula':'Edit lesson','✓ ministrado':'✓ taught','● a ministrar':'● to teach',
'Projetos — anos letivos':'Projects — school years',
'Claro':'Light','Escuro':'Dark','Prometeu':'Prometheus','P. Vermelho':'P. Red','P. Azul':'P. Blue','Tema':'Theme',
'Nenhuma matéria.':'No subjects.','Toque em':'Tap','Nenhuma série/ano.':'No grade/year.',
'Nenhuma aula.':'No lessons.','Nenhum capítulo ainda.':'No chapters yet.','Sem aulas ainda':'No lessons yet',
'Sem conteúdo nos capítulos':'No content in the chapters',
'Renomear matéria':'Rename subject','Remover matéria':'Delete subject','Relatório da série':'Grade report',
'Editar capítulo':'Edit chapter','Remover capítulo':'Delete chapter','Editar vídeo':'Edit video','Remover vídeo':'Delete video',
'Abrir vídeo':'Open video','Buscar este vídeo no YouTube':'Search for this video on YouTube',
'Sem link — buscar no YouTube':'No link — search on YouTube','Adicionar vídeo neste capítulo':'Add a video to this chapter',
'Observações':'Notes','Editar projeto':'Edit project','Excluir projeto':'Delete project',
'Exportar arquivo deste projeto':'Export this project to a file',
'Marcar como a ministrar':'Mark as to teach','Marcar como ministrado':'Mark as taught',
'Marcado = a ministrar; vazio = já ministrado':'Checked = to teach; empty = already taught',
'Capítulos (CP) — acesos têm conteúdo':'Chapters (CP) — the lit ones have content',
'Série/Ano não definido':'Grade/Year not set','Sem capítulo':'No chapter','Toque para editar':'Tap to edit',
'Instituição não informada':'Institution not specified','EM USO':'IN USE',
'Anotações deste capítulo (lembretes, tarefas, páginas do livro…)':'Notes for this chapter (reminders, tasks, book pages…)',
'Nome do vídeo':'Video name','Link do vídeo (YouTube)':'Video link (YouTube)',
'Buscar este vídeo no YouTube (pelo nome)':'Search for this video on YouTube (by name)',
'Buscando título no YouTube…':'Fetching the title from YouTube…',
'Duração':'Duration','(MM:SS ou H:MM:SS)':'(MM:SS or H:MM:SS)','Ex: 23:30 ou 1:08:44':'E.g.: 23:30 or 1:08:44',
'Preencha manualmente caso não seja detectada automaticamente.':'Fill it in by hand if it is not detected automatically.',
'Resumo do vídeo ·':'Video summary ·','≈ 0 pág.':'≈ 0 pg.',
'Escreva ou cole aqui o resumo da aula (limite ≈ 3 páginas)':'Write or paste the lesson summary here (limit ≈ 3 pages)',
'Limite de ~3 páginas (9.000 caracteres). Exporte abaixo em Word ou PDF.':'Limit of about 3 pages (9,000 characters). Export it below as Word or PDF.',
'Word (.doc)':'Word (.doc)',
'Material didático e documentos':'Teaching materials and documents',
'Livros e links citados no vídeo':'Books and links mentioned in the video',
'Adicionar material':'Add material',
'Documentos anexados (PDF, imagem, Word ou áudio) ·':'Attached documents (PDF, image, Word or audio) ·',
'Importar PDF, imagem, Word ou áudio':'Import a PDF, image, Word file or audio',
'Tirar foto':'Take a photo',
'"{f}" não é um tipo aceito (PDF, imagem, Word ou áudio).':'"{f}" is not an accepted type (PDF, image, Word or audio).',
'Título (ex: Casa-Grande & Senzala)':'Title (e.g.: The Odyssey)','Autor, editora ou link':'Author, publisher or link',
'Título':'Title','Autor':'Author','Remover material':'Remove material','Abrir arquivo':'Open file','Remover arquivo':'Remove file',
'Título e duração obtidos.':'Title and duration fetched.',
'Duração obtida automaticamente.':'Duration fetched automatically.',
'Buscando título e duração no YouTube…':'Fetching the title and duration from YouTube…',
'Resumo do vídeo':'Video summary','Resumo do vídeo (≈ {p} pág.)':'Video summary (≈ {p} pg.)',
'Preencha o título do material primeiro.':'Fill in the material title first.',
'Buscar este material em PDF na internet':'Search the internet for this material as a PDF',
'Buscar PDF grátis na internet':'Search for a free PDF online',
'Compartilhar arquivo':'Share file','Compartilhar (WhatsApp, e-mail…)':'Share (WhatsApp, e-mail…)',
'A visualização não abriu (pop-up bloqueado). Baixar o arquivo em vez disso?':'The preview did not open (pop-up blocked). Download the file instead?',
'Não foi possível abrir este arquivo. Teste com outro documento — se o outro abrir, o problema é o arquivo em si, não o app.':'Could not open this file. Try another document — if the other one opens, the problem is the file itself, not the app.',
'Este navegador não tem a janela de compartilhamento — o arquivo será baixado para você enviar por WhatsApp Web, e-mail etc.':'This browser has no share dialog — the file will be downloaded so you can send it via WhatsApp Web, e-mail etc.',
'Não foi possível compartilhar o arquivo.':'Could not share the file.',
'Os documentos anexados somam {n} — o backup vai ficar pesado e pode demorar para gerar e importar. Continuar?':'Attached documents add up to {n} — the backup will be large and may take a while to create and import. Continue?',
'Você tinha um vídeo não salvo ("{n}"). Restaurar o rascunho?':'You had an unsaved video ("{n}"). Restore the draft?',
'Pagar agora (Pix ou cartão)':'Pay now (Pix or card)',
'Pagamento seguro pelo Mercado Pago. O código de ativação chega em poucos minutos no e-mail informado acima — cole-o no campo abaixo.':'Secure payment via Mercado Pago. The activation code arrives within minutes at the e-mail entered above — paste it in the field below.',
'Seu e-mail (para receber o código de ativação)':'Your e-mail (to receive the activation code)',
'Digite um e-mail válido para receber o código.':'Enter a valid e-mail to receive the code.',
'Problemas ou não recebeu o código? Escreva para {mail}.':'Problems or didn\'t get the code? Write to {mail}.',
'Aviso':'Notice','Saiba mais':'Learn more',
'Horas totais':'Total hours','Ministradas':'Taught','Não ministradas':'Not taught',
'sem nome':'unnamed','Tamanho do texto':'Text size',
'Diminuir letras':'Smaller text','Aumentar letras':'Bigger text',
'Ex: A Primeira Revolução Industrial':'E.g.: The First Industrial Revolution',
'Nome da matéria':'Subject name','Série/Ano':'Grade/Year','Capítulo / unidade':'Chapter / unit',
'Título da aula':'Lesson title','Número / identificador':'Number / identifier','Nome do capítulo':'Chapter name',
'Ano':'Year','Instituição':'Institution',
'Professor':'Teacher','Formação':'Education level','Ex: Nome do professor':'E.g.: Teacher\'s name',
'Não informado':'Not specified','Técnico':'Vocational/technical','Graduado':'Bachelor\'s degree',
'Pós-graduando':'Postgraduate (in progress)','Mestrado':'Master\'s degree','Doutorado':'Doctorate',
'Duplicar projeto':'Duplicate project',
'<b>Projeto duplicado.</b> Cópia de "{p}" criada.':'<b>Project duplicated.</b> Copy of "{p}" created.',
'Ex: HISTÓRIA':'E.g.: HISTORY','Ex: 6° ANO':'E.g.: 6th GRADE','Ex: Cap. 01 — Brasil Colônia':'E.g.: Chap. 01 — Colonial Brazil',
'Ex: A Sociedade Patriarcal':'E.g.: The Patriarchal Society','Ex: Cap. 01':'E.g.: Chap. 01',
'Ex: Ciclo do Pau Brasil':'E.g.: The Brazilwood Cycle','Ex: Escola Estadual …':'E.g.: Lincoln High School…',
'Baixar Word (.doc)':'Download Word (.doc)','Gerar PDF (imprimir / salvar)':'Generate PDF (print / save)',
'Informe o nome.':'Enter the name.','Informe a série/ano.':'Enter the grade/year.','Informe o título.':'Enter the title.',
'Informe o ano.':'Enter the year.','Informe o nome do vídeo.':'Enter the video name.',
'Preencha o nome do vídeo primeiro.':'Fill in the video name first.',
'Remover esta série/ano e todas as suas aulas?':'Delete this grade/year and all its lessons?',
'Remover esta aula?':'Delete this lesson?','Remover este capítulo e todos os seus vídeos?':'Delete this chapter and all its videos?',
'Remover este vídeo?':'Delete this video?',
'Remover a matéria "{m}" e sua(s) {n} série(s)?':'Delete subject "{m}" and its {n} grade(s)?',
/* Desfazer exclusão */
'Desfazer':'Undo','Restaurado.':'Restored.','O prazo para desfazer já passou.':'The undo window has expired.',
'Matéria <b>{m}</b> excluída.':'Subject <b>{m}</b> deleted.',
'Série <b>{s}</b> excluída.':'Grade <b>{s}</b> deleted.',
'Aula <b>{t}</b> excluída.':'Lesson <b>{t}</b> deleted.',
'Capítulo <b>{c}</b> excluído.':'Chapter <b>{c}</b> deleted.',
'Vídeo <b>{v}</b> excluído.':'Video <b>{v}</b> deleted.',
'Ano letivo <b>{p}</b> excluído.':'School year <b>{p}</b> deleted.',
/* Lixeira (recuperar exclusões) */
'Lixeira':'Recycle bin',
'Lixeira — recuperar o que foi apagado':'Recycle bin — restore what was deleted',
'Lixeira — {n} item(ns) para recuperar':'Recycle bin — {n} item(s) to restore',
'A lixeira está vazia.':'The recycle bin is empty.',
'Guarda as <b>{n} últimas</b> exclusões. Fechar o app esvazia a lixeira.':'Keeps the <b>last {n}</b> deletions. Closing the app empties the bin.',
'Recuperar':'Restore',
'Este item saiu do <b>{p}</b>. Abra esse ano letivo para recuperá-lo.':'This item came from <b>{p}</b>. Open that school year to restore it.',
'do {p} — abra esse ano para recuperar':'from {p} — open that year to restore',
'outro ano letivo':'another school year','outro ano':'another year',
/* Copiar e colar série */
'Copiar série':'Copy grade','Colar série':'Paste grade','Colar {s}':'Paste {s}','série':'grade',
'Nada foi copiado ainda.':'Nothing has been copied yet.',
'Apagar cópia em espera':'Delete pending copy',
'Apagar a cópia em espera, sem colar? Nada que já existe no app é apagado.':'Delete the pending copy without pasting? Nothing that already exists in the app is deleted.',
'Cópia em espera apagada.':'Pending copy deleted.',
'Apagar':'Delete',
'Não foi possível copiar: a memória do navegador está cheia.':'Could not copy: the browser storage is full.',
'Série <b>{s}</b> copiada. Abra a matéria de destino e toque em <b>Colar</b>.':'Grade <b>{s}</b> copied. Open the target subject and tap <b>Paste</b>.',
'Série <b>{s}</b> colada em {m}.':'Grade <b>{s}</b> pasted into {m}.',
'Copiar aula':'Copy lesson','Colar aula':'Paste lesson','aula':'lesson',
'Aula <b>{a}</b> copiada. Abra a série de destino e toque em <b>Colar aula</b>.':'Lesson <b>{a}</b> copied. Open the target grade and tap <b>Paste lesson</b>.',
'Aula <b>{a}</b> colada.':'Lesson <b>{a}</b> pasted.',
'Copiar matéria para outro ano letivo':'Copy subject to another school year',
'Colar matéria':'Paste subject','matéria':'subject','(cópia)':'(copy)',
'Matéria <b>{m}</b> copiada com {n} série(s). Troque de ano letivo e toque em <b>Colar matéria</b>.':'Subject <b>{m}</b> copied with {n} grade(s). Switch school year and tap <b>Paste subject</b>.',
'Matéria <b>{m}</b> colada com {n} série(s).':'Subject <b>{m}</b> pasted with {n} grade(s).',
'Limite de {n} documentos por vídeo.':'Limit of {n} documents per video.',
'Limite de {n} documentos por vídeo — os demais não foram importados.':'Limit of {n} documents per video — the rest were not imported.',
'"{f}" passa de {n} MB e não foi importado.':'"{f}" exceeds {n} MB and was not imported.',
'Não foi possível guardar o arquivo neste navegador.':'Could not store the file in this browser.',
'Arquivo não encontrado no armazenamento deste navegador.':'File not found in this browser\'s storage.',
'Permita pop-ups para visualizar o arquivo.':'Allow pop-ups to view the file.',
'Não foi possível abrir o arquivo.':'Could not open the file.',
'Permita pop-ups para exportar em PDF.':'Allow pop-ups to export as PDF.',
'Permita pop-ups para gerar o PDF.':'Allow pop-ups to generate the PDF.',
'Link do YouTube reconhecido — buscando título…':'YouTube link recognized — fetching title…',
'Link detectado.':'Link detected.','Link cadastrado':'Link saved',
'Título obtido. Preencha a duração se necessário.':'Title fetched. Fill in the duration if needed.',
'{n}/9000 caracteres':'{n}/9,000 characters',
'Material didático e documentos ({n})':'Teaching materials and documents ({n})',
'Vídeo sem nome':'Untitled video','(Sem resumo preenchido)':'(No summary written)',
'Material didático':'Teaching materials','Documentos anexados':'Attached documents',
'Matéria':'Subject','Serie':'Grade','Aula':'Lesson','Cap.':'Chap.','Título do vídeo':'Video Title','Link':'Link',
'Sem capítulos.':'No chapters.','Sem vídeos.':'No videos.',
'Resumo disponível ({n} caracteres)':'Summary available ({n} characters)','Obs.:':'Note:',
'Relatório — {d}':'Report — {d}','Série única':'Single grade','duração total':'total duration','gerado em':'generated on',
'Aula {n}':'Lesson {n}','Novo vídeo — {c}':'New video — {c}','Editar V{v} — {c}':'Edit V{v} — {c}',
'Nova série/ano — {m}':'New grade/year — {m}',
'{n} aulas':v=>+v.n===1?'1 lesson':v.n+' lessons','{n} capítulos':v=>+v.n===1?'1 chapter':v.n+' chapters',
'{n} vídeos':v=>+v.n===1?'1 video':v.n+' videos',
'Criar novo projeto (ano letivo)':'Create new project (school year)',
'Excluir o projeto "{p}" com TODAS as matérias, aulas e documentos dele? Você terá alguns segundos para desfazer.':'Delete project "{p}" with ALL its subjects, lessons and documents? You will have a few seconds to undo.',
'Tem certeza? Se quiser guardar uma cópia, cancele e use antes o botão de exportar (seta para baixo).':'Are you sure? To keep a copy, cancel and use the export button (down arrow) first.',
'Este é o único projeto. Crie outro antes de excluir este.':'This is the only project. Create another before deleting this one.',
'Sem espaço no navegador para criar o projeto.':'No storage space in the browser to create the project.',
'Sem espaço no navegador para importar este projeto.':'No storage space in the browser to import this project.',
'Arquivo inválido.':'Invalid file.',
'Este arquivo não é um backup do Organizador de Aulas Prometeu.':'This file is not a backup from Lesson Organizer Prometheus.',
'Ano letivo {a}':'School year {a}',
'<b>Projeto ativo:</b> {p}.':'<b>Active project:</b> {p}.',
'<b>Projeto {a} criado e em uso.</b> O anterior ficou arquivado — troque quando quiser em ☰ → Gerenciar projetos.':'<b>Project {a} created and in use.</b> The previous one is archived — switch anytime via ☰ → Manage projects.',
'<b>Backup exportado!</b> “{a}” foi baixado neste aparelho — no iPhone/iPad, escolha <b>“Salvar em Arquivos”</b>. Guarde uma cópia em local seguro (Drive, pen-drive…).':'<b>Backup exported!</b> “{a}” was downloaded to this device — on iPhone/iPad, choose <b>“Save to Files”</b>. Keep a copy somewhere safe (Drive, USB stick…).',
'<b>Projeto importado</b> e colocado em uso.':'<b>Project imported</b> and set as current.',
'<b>Vídeo duplicado nesta série:</b> mesmo nome e link já existem na <b>Aula {a}</b> · {c}.':'<b>Duplicate video in this grade:</b> same name and link already exist in <b>Lesson {a}</b> · {c}.',
'Esta cópia roda como arquivo único: para atualizar, substitua o prometeu.html por uma versão mais nova. Seus dados não se perdem.':'This copy runs as a single file: to update, replace prometeu.html with a newer version. Your data is not lost.',
'Verificação concluída. Se houver versão nova, feche e reabra o app para aplicar.':'Check complete. If there is a new version, close and reopen the app to apply it.',
'O app ainda não está instalado como PWA neste navegador.':'The app is not yet installed as a PWA in this browser.',
'Não foi possível verificar agora (sem internet?).':'Could not check right now (no internet?).',
'Verificar atualização agora':'Check for updates now',
'Versão {v} · {d}':'Version {v} · {d}','julho de 2026':'July 2026','agosto de 2026':'August 2026',
'App 100% offline: os dados ficam guardados neste navegador/aparelho — nada é enviado para a internet.':'100% offline app: data is stored in this browser/device — nothing is sent to the internet.',
'Projetos guardados:':'Stored projects:','Matérias no projeto atual:':'Subjects in the current project:',
'O app funciona sem internet; uma atualização só chega quando você recebe uma <b>versão nova</b> do arquivo ou do site.':'The app works without internet; an update only arrives when you receive a <b>new version</b> of the file or of the site.',
'<b>Versão instalada como app (PWA):</b> toque em “Verificar atualização agora”. Se houver versão nova no site, ela é baixada e aplicada ao fechar e reabrir o app.':'<b>Installed as an app (PWA):</b> tap “Check for updates now”. If there is a new version on the site, it is downloaded and applied when you close and reopen the app.',
'<b>Versão em arquivo único (prometeu.html):</b> basta substituir o arquivo antigo pelo novo. Os dados <b>não se perdem</b> — eles ficam no navegador, não dentro do arquivo.':'<b>Single-file version (prometeu.html):</b> just replace the old file with the new one. Your data is <b>not lost</b> — it lives in the browser, not inside the file.',
'<b>Dica:</b> antes de atualizar, exporte um backup (☰ → Arquivo → Exportar backup).':'<b>Tip:</b> before updating, export a backup (☰ → File → Export backup).',
/* Consentimento / legal / idioma / demo */
'Leia antes de começar':'Read this before you start',
'Leia a Política de Privacidade e os Termos de Uso antes de usar o app. Toque nos botões abaixo para abrir cada documento.':'Read the Privacy Policy and the Terms of Use before using the app. Tap the buttons below to open each document.',
'Em resumo: seus dados ficam somente neste aparelho — o app não coleta, não envia e não compartilha nada pela internet.':'In short: your data stays on this device only — the app does not collect, send or share anything over the internet.',
'Ler a Política de Privacidade':'Read the Privacy Policy','Ler os Termos de Uso':'Read the Terms of Use',
'Li e aceito':'I have read and accept','Recusar':'Decline',
'Sem o aceite não dá para continuar':'You cannot continue without accepting',
'Você recusou os Termos de Uso e a Política de Privacidade. Sem essa concordância o app não pode ser usado. Nada foi gravado neste aparelho.':'You declined the Terms of Use and the Privacy Policy. Without that agreement the app cannot be used. Nothing was saved on this device.',
'Se quiser reler antes de decidir, use “Voltar e ler de novo”.':'If you want to read them again before deciding, use “Go back and read again”.',
'Voltar e ler de novo':'Go back and read again','Sair do app':'Exit the app',
'Se a janela não fechar sozinha, feche o app pelo botão do aparelho ou feche esta aba do navegador.':'If the window does not close by itself, close the app with your device button or close this browser tab.',
'Tutorial rápido?':'Quick tutorial?',
'Quer ver uma demonstração rápida de como o app funciona? O app navega sozinho mostrando cada função.':'Want a quick demo of how the app works? The app walks through it by itself, showing each feature.',
'Você pode revê-la quando quiser em ☰ → Modo demonstração.':'You can replay it anytime via ☰ → Demo mode.',
'Agora não':'Not now','Ver tutorial':'Watch tutorial',
'Termos de Uso':'Terms of Use','Política de Privacidade':'Privacy Policy',
'Ver documento completo (online)':'View full document (online)',
'Escolha o idioma':'Choose language',
'Ativação':'Activation','Ativar / Comprar':'Activate / Buy','Ativar':'Activate',
'Versão completa ativada':'Full version activated',
'Período gratuito: {n} dia(s) restante(s)':v=>+v.n===1?'Free period: 1 day left':'Free period: '+v.n+' days left',
'Você usa tudo livremente. Depois do período, criar conteúdo novo pede ativação — ver e exportar seus dados continua sempre liberado.':'You use everything freely. After the period, creating new content requires activation — viewing and exporting your data stays available at all times.',
'Período gratuito encerrado':'Free period ended',
'Ative para criar novos conteúdos. Seus dados e as exportações continuam acessíveis.':'Activate to create new content. Your data and exports remain accessible.',
'Como ativar':'How to activate',
'Atenção antes de pagar':'Important before you pay',
'Escolha sempre Pix ou cartão comum':'Always choose Pix or a regular card',
'Ver as duas telas do Mercado Pago':'See both Mercado Pago screens',
'Esconder as telas':'Hide the screens',
'Assim NÃO — cobra juros':'NOT like this — it charges interest',
'Assim SIM — valor certo':'Like THIS — the right amount',
'Sua compra':'Your purchase',
'Juros e IOF':'Interest and IOF tax',
'Total':'Total',
'Use agora e pague depois':'Use now, pay later',
'LINHA DE CRÉDITO':'CREDIT LINE',
'Pagar':'Pay',
'Cartão de crédito · à vista':'Credit card · single payment',
'Aqui você pagaria R$ 6,14 a mais, só de juros e IOF.':'Here you would pay R$ 6.14 extra, just in interest and IOF tax.',
'Valor certo, sem juros. Se perguntarem, dá para continuar sem entrar na conta.':'The right amount, no interest. If you are asked, you can carry on without signing in.',
'Se o seu aparelho já tem conta do Mercado Pago, a tela pode vir com a “Linha de Crédito” pré-escolhida — ela cobra juros e IOF, e o total fica maior que o anunciado. {b} — dá para continuar como convidado, sem entrar na conta. Essa tela é do Mercado Pago; não temos como removê-la.':'If your device already has a Mercado Pago account, the payment screen may come with the “Credit Line” pre-selected — it charges interest and IOF tax, and the total ends up higher than the advertised price. {b} — you can carry on as a guest, without signing in. That screen belongs to Mercado Pago; we have no way to remove it.',
'Código de ativação (recebido por e-mail)':'Activation code (received by e-mail)',
'Cole aqui o código de ativação':'Paste the activation code here',
'Código inválido. Confira se copiou o código completo do e-mail.':'Invalid code. Check that you copied the complete code from the e-mail.',
'Cole aqui o código que chegou por e-mail.':'Paste the code that arrived by e-mail here.',
'Parece que veio texto junto com o código. Copie só a linha do código.':'It looks like some text came along with the code. Copy only the code line.',
'Esse código está incompleto: falta o ponto que separa as duas partes dele.':'This code is incomplete: the dot that separates its two parts is missing.',
'O código parece cortado. Copie do começo ao fim, sem deixar nada de fora.':'The code looks cut off. Copy it from beginning to end, leaving nothing out.',
'O código não confere. Ele vale só para o e-mail usado na compra.':'The code does not match. It works only with the e-mail used in the purchase.',
'<b>Ativado!</b> Obrigado. Licença registrada para {e}.':'<b>Activated!</b> Thank you. License registered to {e}.',
'Este navegador não suporta a verificação de licença.':'This browser does not support license verification.',
'LEGAL_PRIV':'<p><b>Summary:</b></p><ul><li>The app works 100% offline. Everything you create is kept only in this device\'s browser (localStorage/IndexedDB).</li><li>No personal data is collected, transmitted or sold. There are no ads, trackers or analytics.</li><li>Optional online features: fetching a video title from YouTube (only the video link is sent to YouTube) and loading fonts from Google Fonts. Both are optional — the app works without them.</li><li>Backups (.json) are created by you and stay wherever you save them.</li><li>To erase everything: delete the projects in the app, or clear the site/app data in your device settings.</li><li>Contact: organizadordeaulas.prometeu@gmail.com</li></ul>',
'LEGAL_TERMS':'<p><b>Summary:</b></p><ul><li>A personal, non-transferable license, for use by whoever purchased the app.</li><li>Resale, redistribution or commercial exploitation by third parties is prohibited without the author\'s prior written authorization.</li><li>The app is provided "as is"; keep backups of your data (☰ → File → Export backup).</li><li>The content you enter (lessons, links, files) is yours and is your responsibility.</li><li>Contact: organizadordeaulas.prometeu@gmail.com</li></ul>',
'Iniciar demonstração':'Start demo','Parar demonstração':'Stop demo','Toque para parar a demonstração':'Tap to stop the demo',
'DEMO_1':'This is Lesson Organizer Prometheus: the subjects sit on the home screen, grouped automatically.',
'DEMO_2':'Inside a subject are the grades/years. The arrow button opens the lesson tree.',
'DEMO_3':'Each grade gathers numbered lessons, with the total duration and counters of what is still pending.',
'DEMO_4':'Inside a lesson: the chapters. The little box marks what is still left to teach.',
'DEMO_5':'Each chapter keeps videos, with links, summaries, materials and attached documents.',
'DEMO_6':'The video form fetches the title from YouTube and exports summaries as Word/PDF.',
'DEMO_7':'Six visual themes, including the Prometheus sci-fi HUD.',
'DEMO_8':'Projects archive entire school years — switch whenever you like, with a backup to a file.',
'DEMO_9':'The grade reports export the whole structure as Word or PDF.',
'DEMO_10':'All of it 100% offline: your data never leaves the device. Lesson Organizer Prometheus.',
'DEMO_MENU':'It all starts in the ☰ menu: projects, backup, language, help and activation of the full version.',
'Comece por aqui: toque no menu ☰':'Start here: tap the ☰ menu',
/* Figuras SVG do tutorial */
'MATÉRIA':'SUBJECT','SÉRIE / ANO':'GRADE / YEAR','AULA':'LESSON','CAPÍTULO':'CHAPTER','VÍDEO':'VIDEO',
'ARQUIVADO':'ARCHIVED','EM USO ●':'IN USE ●','ORGANIZADOR':'LESSON','DE AULAS':'ORGANIZER','YOUTUBE /':'YOUTUBE /','ANOTAÇÕES':'NOTES',
'Cap. 01 — caixinha marcada = ● A MINISTRAR':'Chap. 01 — checked box = ● TO TEACH',
'Cap. 02 — caixinha vazia = ✓ já ministrado':'Chap. 02 — empty box = ✓ already taught'
},

/* ---------- PORTUGUÊS DE PORTUGAL (só o que difere do pt-BR) ---------- */
'pt-PT':{
'<b>Arquivo salvo!</b> “{a}” foi baixado neste aparelho — no iPhone/iPad, escolha <b>“Salvar em Arquivos”</b>.':'<b>Ficheiro guardado!</b> “{a}” foi transferido para este aparelho — no iPhone/iPad, escolha <b>“Guardar em Ficheiros”</b>.',
'Na janela que abrir, escolha <b>“Salvar como PDF”</b> e depois onde guardar o arquivo.':'Na janela que abrir, escolha <b>“Guardar como PDF”</b> e depois onde guardar o ficheiro.',
'Arquivo':'Ficheiro','✓ ministrado':'✓ lecionado','● a ministrar':'● por lecionar',
'Exportar backup (.json)':'Exportar cópia de segurança (.json)',
'Importar backup (.json)':'Importar cópia de segurança (.json)',
'Salvar':'Guardar','Salvar vídeo':'Guardar vídeo',
'Nova matéria':'Nova disciplina','Nome da matéria':'Nome da disciplina',
'Nenhuma matéria.':'Nenhuma disciplina.','Renomear matéria':'Mudar o nome da disciplina','Remover matéria':'Remover disciplina',
'Ex: HISTÓRIA':'Ex: HISTÓRIA','Ex: 6° ANO':'Ex: 6.º ANO',
'Matérias no projeto atual:':'Disciplinas no projeto atual:',
'Matéria':'Disciplina',
'Marcar como a ministrar':'Marcar como por lecionar','Marcar como ministrado':'Marcar como lecionado',
'Marcado = a ministrar; vazio = já ministrado':'Marcado = por lecionar; vazio = já lecionado',
'Anotações deste capítulo (lembretes, tarefas, páginas do livro…)':'Anotações deste capítulo (lembretes, tarefas, páginas do livro…)',
'Toque em':'Carregue em','Toque para editar':'Carregue para editar',
'Escreva ou cole aqui o resumo da aula (limite ≈ 3 páginas)':'Escreva ou cole aqui o resumo da aula (limite ≈ 3 páginas)',
'Remover a matéria "{m}" e sua(s) {n} série(s)?':'Remover a disciplina "{m}" e o(s) seu(s) {n} ano(s)?',
'Matéria <b>{m}</b> excluída.':'Disciplina <b>{m}</b> eliminada.',
'Série <b>{s}</b> excluída.':'Ano <b>{s}</b> eliminado.',
'Copiar série':'Copiar ano','Colar série':'Colar ano','série':'ano',
/* Lixeira e copiar disciplina (em pt-PT o termo corrente é "reciclagem") */
'Lixeira':'Reciclagem',
'Lixeira — recuperar o que foi apagado':'Reciclagem — recuperar o que foi apagado',
'Lixeira — {n} item(ns) para recuperar':'Reciclagem — {n} item(ns) para recuperar',
'A lixeira está vazia.':'A reciclagem está vazia.',
'Guarda as <b>{n} últimas</b> exclusões. Fechar o app esvazia a lixeira.':'Guarda as <b>{n} últimas</b> eliminações. Fechar a aplicação esvazia a reciclagem.',
'Este item saiu do <b>{p}</b>. Abra esse ano letivo para recuperá-lo.':'Este item saiu do <b>{p}</b>. Abra esse ano letivo para o recuperar.',
'Copiar matéria para outro ano letivo':'Copiar disciplina para outro ano letivo',
'Colar matéria':'Colar disciplina','matéria':'disciplina',
'Matéria <b>{m}</b> copiada com {n} série(s). Troque de ano letivo e toque em <b>Colar matéria</b>.':'Disciplina <b>{m}</b> copiada com {n} ano(s). Mude de ano letivo e carregue em <b>Colar disciplina</b>.',
'Matéria <b>{m}</b> colada com {n} série(s).':'Disciplina <b>{m}</b> colada com {n} ano(s).',
'Série <b>{s}</b> copiada. Abra a matéria de destino e toque em <b>Colar</b>.':'Ano <b>{s}</b> copiado. Abra a disciplina de destino e carregue em <b>Colar</b>.',
'Série <b>{s}</b> colada em {m}.':'Ano <b>{s}</b> colado em {m}.',
'Aula <b>{a}</b> copiada. Abra a série de destino e toque em <b>Colar aula</b>.':'Aula <b>{a}</b> copiada. Abra o ano de destino e carregue em <b>Colar aula</b>.',
'Não foi possível copiar: a memória do navegador está cheia.':'Não foi possível copiar: a memória do navegador está cheia.',
'Não foi possível guardar o arquivo neste navegador.':'Não foi possível guardar o ficheiro neste navegador.',
'Arquivo não encontrado no armazenamento deste navegador.':'Ficheiro não encontrado no armazenamento deste navegador.',
'Não foi possível abrir o arquivo.':'Não foi possível abrir o ficheiro.',
'Abrir arquivo':'Abrir ficheiro','Remover arquivo':'Remover ficheiro','Arquivo inválido.':'Ficheiro inválido.',
'Compartilhar arquivo':'Partilhar ficheiro','Compartilhar (WhatsApp, e-mail…)':'Partilhar (WhatsApp, e-mail…)',
'Não foi possível compartilhar o arquivo.':'Não foi possível partilhar o ficheiro.',
'Este navegador não tem a janela de compartilhamento — o arquivo será baixado para você enviar por WhatsApp Web, e-mail etc.':'Este navegador não tem a janela de partilha — o ficheiro será transferido para o enviar por WhatsApp Web, e-mail etc.',
'Não foi possível abrir este arquivo. Teste com outro documento — se o outro abrir, o problema é o arquivo em si, não o app.':'Não foi possível abrir este ficheiro. Teste com outro documento — se o outro abrir, o problema é o próprio ficheiro, não a aplicação.',
'A visualização não abriu (pop-up bloqueado). Baixar o arquivo em vez disso?':'A pré-visualização não abriu (pop-up bloqueado). Transferir o ficheiro em vez disso?',
'Os documentos anexados somam {n} — o backup vai ficar pesado e pode demorar para gerar e importar. Continuar?':'Os documentos anexados somam {n} — a cópia de segurança vai ficar pesada e pode demorar a gerar e importar. Continuar?',
'Você tinha um vídeo não salvo ("{n}"). Restaurar o rascunho?':'Tinha um vídeo por guardar ("{n}"). Restaurar o rascunho?',
'Exportar arquivo deste projeto':'Exportar ficheiro deste projeto',
'Este arquivo não é um backup do Organizador de Aulas Prometeu.':'Este ficheiro não é uma cópia de segurança do Organizador de Aulas Prometeu.',
'<b>Backup exportado!</b> “{a}” foi baixado neste aparelho — no iPhone/iPad, escolha <b>“Salvar em Arquivos”</b>. Guarde uma cópia em local seguro (Drive, pen-drive…).':'<b>Cópia de segurança exportada!</b> “{a}” foi transferida para este aparelho — no iPhone/iPad, escolha <b>“Guardar em Ficheiros”</b>. Guarde uma cópia em local seguro (Drive, pen…).',
'Leia a Política de Privacidade e os Termos de Uso antes de usar o app. Toque nos botões abaixo para abrir cada documento.':'Leia a Política de Privacidade e os Termos de Utilização antes de usar a aplicação. Carregue nos botões abaixo para abrir cada documento.',
'Em resumo: seus dados ficam somente neste aparelho — o app não coleta, não envia e não compartilha nada pela internet.':'Em resumo: os seus dados ficam apenas neste aparelho — a aplicação não recolhe, não envia nem partilha nada pela internet.',
'Ler os Termos de Uso':'Ler os Termos de Utilização',
'Termos de uso':'Termos de utilização','Termos de Uso':'Termos de Utilização',
'Quer ver uma demonstração rápida de como o app funciona? O app navega sozinho mostrando cada função.':'Quer ver uma demonstração rápida de como a aplicação funciona? A aplicação navega sozinha mostrando cada função.',
'App 100% offline: os dados ficam guardados neste navegador/aparelho — nada é enviado para a internet.':'Aplicação 100% offline: os dados ficam guardados neste navegador/aparelho — nada é enviado para a internet.',
'<b>Dica:</b> antes de atualizar, exporte um backup (☰ → Arquivo → Exportar backup).':'<b>Dica:</b> antes de atualizar, exporte uma cópia de segurança (☰ → Ficheiro → Exportar cópia de segurança).',
'LEGAL_PRIV':'<p><b>Resumo:</b></p><ul><li>A aplicação funciona 100% offline. Todo o conteúdo fica guardado apenas no navegador deste aparelho (localStorage/IndexedDB).</li><li>Nenhum dado pessoal é recolhido, transmitido ou vendido. Não há anúncios, rastreadores nem estatísticas.</li><li>Funções online opcionais: obter o título de um vídeo do YouTube (envia apenas o link do vídeo ao YouTube) e carregar tipos de letra do Google Fonts. Ambas são opcionais — a aplicação funciona sem elas.</li><li>As cópias de segurança (.json) são criadas por si e ficam onde as guardar.</li><li>Para apagar tudo: elimine os projetos na aplicação, ou limpe os dados do site/aplicação nas definições do aparelho.</li><li>Contacto: organizadordeaulas.prometeu@gmail.com</li></ul>',
'LEGAL_TERMS':'<p><b>Resumo:</b></p><ul><li>Licença pessoal e intransmissível, para uso de quem a adquiriu.</li><li>É proibida a revenda, redistribuição ou exploração comercial por terceiros sem autorização prévia, por escrito, do autor.</li><li>A aplicação é fornecida "tal como está"; mantenha cópias de segurança dos seus dados (☰ → Ficheiro → Exportar cópia de segurança).</li><li>O conteúdo que registar (aulas, links, ficheiros) é seu e é da sua responsabilidade.</li><li>Contacto: organizadordeaulas.prometeu@gmail.com</li></ul>'
},

/* ---------- ESPANHOL ---------- */
'es':{
'<b>Arquivo salvo!</b> “{a}” foi baixado neste aparelho — no iPhone/iPad, escolha <b>“Salvar em Arquivos”</b>.':'<b>¡Archivo guardado!</b> “{a}” se descargó en este dispositivo — en iPhone/iPad, elige <b>“Guardar en Archivos”</b>.',
'Na janela que abrir, escolha <b>“Salvar como PDF”</b> e depois onde guardar o arquivo.':'En la ventana que se abra, elige <b>“Guardar como PDF”</b> y luego dónde guardar el archivo.',
'Organizador de Aulas Prometeu':'Organizador de Clases Prometeo',
'Abrir menu':'Abrir menú','Voltar':'Atrás','Início':'Inicio','Fechar menu':'Cerrar menú','Fechar':'Cerrar',
'Mover para cima':'Subir','Mover para baixo':'Bajar','Concluir':'Listo',
'Cancelar':'Cancelar','Salvar':'Guardar','Salvar vídeo':'Guardar vídeo','Editar':'Editar','Remover':'Eliminar',
'Tutorial':'Tutorial','Atualização':'Actualización','Versão':'Versión','Arquivo':'Archivo','Ajuda':'Ayuda',
'Idioma':'Idioma','Privacidade':'Privacidad','Termos de uso':'Términos de uso','Modo demonstração':'Modo demostración',
'Enviar críticas ou sugestões':'Enviar críticas o sugerencias',
'Críticas e sugestões — Organizador de Aulas Prometeu':'Críticas y sugerencias — Organizador de Clases Prometeo',
'Instalar aplicativo':'Instalar aplicación',
'O app já está instalado neste aparelho.':'La app ya está instalada en este dispositivo.',
'INSTALL_HELP':'<p><b>En el ordenador (Windows) — Edge o Chrome:</b></p><ol><li>Abre este sitio en <b>Microsoft Edge</b> o <b>Google Chrome</b>.</li><li>Comprueba que la dirección empieza por <b>https://</b> y es el sitio oficial de la app.</li><li>Haz clic en el <b>icono de instalar</b> (un monitor con una flecha ⤓) al final de la barra de direcciones — o menú <b>⋮</b> → <b>«Instalar Organizador de Aulas Prometeu»</b>.</li><li>Confirma con <b>«Instalar»</b>. La app obtiene un icono en el <b>menú Inicio</b> y, a partir de ese momento, se abre en su propia ventana.</li></ol><p><b>En Android (móvil/tablet):</b> ábrelo en <b>Chrome</b> → menú <b>⋮</b> → <b>«Instalar aplicación»</b> (o «Añadir a pantalla de inicio»). Si la opción no aparece, el navegador puede no admitir la instalación (Mi Browser, por ejemplo) — usa Chrome.</p><p class="fhint">Seguridad: instala siempre desde el sitio oficial y mantén el navegador actualizado. La app funciona sin conexión y guarda todo solo en este dispositivo.</p>',
'INSTALL_HELP_IOS':'<p><b>En iPhone o iPad — con Safari:</b></p><ol><li>Abre este sitio en <b>Safari</b> (debe ser Safari — los otros navegadores del iPhone no instalan apps).</li><li>Comprueba que la dirección empieza por <b>https://</b> y es el sitio oficial de la app.</li><li>Toca el botón <b>Compartir</b> (el cuadrado con una flecha hacia arriba, en la barra inferior).</li><li>Baja por la lista y toca <b>«Añadir a pantalla de inicio»</b> → <b>«Añadir»</b>.</li></ol><p>La app gana un icono propio y se abre a pantalla completa, como una aplicación normal.</p><p class="fhint">Seguridad: instala siempre a través de Safari, desde el sitio oficial. La app funciona sin conexión y guarda todo solo en este dispositivo.</p>',
'Projeto em uso':'Proyecto en uso','Gerenciar projetos':'Gestionar proyectos','Criar novo projeto':'Crear nuevo proyecto',
'Exportar backup (.json)':'Exportar copia de seguridad (.json)','Importar backup (.json)':'Importar copia de seguridad (.json)',
'Nova matéria':'Nueva asignatura','Nova série/ano':'Nuevo curso/año','Nova aula':'Nueva clase','Novo capítulo':'Nuevo capítulo','Novo vídeo':'Nuevo vídeo',
'Transferir aulas':'Transferir clases','Transferir todas as aulas':'Transferir todas las clases','Transferir':'Transferir',
'Levar {n} aula(s): toque no destino':'Llevar {n} clase(s): toca el destino',
'Levar {n} aula(s) para <b>{d}</b>?':'¿Llevar {n} clase(s) a <b>{d}</b>?',
'Toque na série/ano que vai receber as aulas.':'Toca el curso/año que recibirá las clases.',
'As aulas já estão nesta série/ano.':'Las clases ya están en este curso/año.',
'Todas':'Todas','Nenhuma':'Ninguna',
'Nada para desfazer.':'Nada que deshacer.',
'Última alteração desfeita.':'Última modificación deshecha.',
'Desfazer a última alteração':'Deshacer el último cambio',
'{n} selecionada(s)':'{n} seleccionada(s)',
'Crie outra série/ano para receber as aulas.':'Crea otro curso/año para recibir las clases.',
'Marque as aulas e toque em <b>Transferir</b>.':'Marca las clases y toca <b>Transferir</b>.',
'{n} aula(s) transferida(s) para <b>{d}</b>.':'{n} clase(s) transferida(s) a <b>{d}</b>.',
'Editar série/ano':'Editar curso/año','Editar aula':'Editar clase','✓ ministrado':'✓ impartido','● a ministrar':'● por impartir',
'Projetos — anos letivos':'Proyectos — años lectivos',
'Claro':'Claro','Escuro':'Oscuro','Prometeu':'Prometeo','P. Vermelho':'P. Rojo','P. Azul':'P. Azul','Tema':'Tema',
'Nenhuma matéria.':'Ninguna asignatura.','Toque em':'Toca','Nenhuma série/ano.':'Ningún curso/año.',
'Nenhuma aula.':'Ninguna clase.','Nenhum capítulo ainda.':'Ningún capítulo todavía.','Sem aulas ainda':'Sin clases todavía',
'Sem conteúdo nos capítulos':'Sin contenido en los capítulos',
'Renomear matéria':'Renombrar asignatura','Remover matéria':'Eliminar asignatura','Relatório da série':'Informe del curso',
'Editar capítulo':'Editar capítulo','Remover capítulo':'Eliminar capítulo','Editar vídeo':'Editar vídeo','Remover vídeo':'Eliminar vídeo',
'Abrir vídeo':'Abrir vídeo','Buscar este vídeo no YouTube':'Buscar este vídeo en YouTube',
'Sem link — buscar no YouTube':'Sin enlace — buscar en YouTube','Adicionar vídeo neste capítulo':'Añadir vídeo a este capítulo',
'Observações':'Notas','Editar projeto':'Editar proyecto','Excluir projeto':'Eliminar proyecto',
'Exportar arquivo deste projeto':'Exportar este proyecto a un archivo',
'Marcar como a ministrar':'Marcar como por impartir','Marcar como ministrado':'Marcar como impartido',
'Marcado = a ministrar; vazio = já ministrado':'Marcado = por impartir; vacío = ya impartido',
'Capítulos (CP) — acesos têm conteúdo':'Capítulos (CP) — los encendidos tienen contenido',
'Série/Ano não definido':'Curso/Año sin definir','Sem capítulo':'Sin capítulo','Toque para editar':'Toca para editar',
'Instituição não informada':'Institución sin indicar','EM USO':'EN USO',
'Anotações deste capítulo (lembretes, tarefas, páginas do livro…)':'Notas de este capítulo (recordatorios, tareas, páginas del libro…)',
'Nome do vídeo':'Nombre del vídeo','Link do vídeo (YouTube)':'Enlace del vídeo (YouTube)',
'Buscar este vídeo no YouTube (pelo nome)':'Buscar este vídeo en YouTube (por el nombre)',
'Buscando título no YouTube…':'Buscando el título en YouTube…',
'Duração':'Duración','(MM:SS ou H:MM:SS)':'(MM:SS o H:MM:SS)','Ex: 23:30 ou 1:08:44':'Ej.: 23:30 o 1:08:44',
'Preencha manualmente caso não seja detectada automaticamente.':'Rellénala manualmente si no se detecta automáticamente.',
'Resumo do vídeo ·':'Resumen del vídeo ·','≈ 0 pág.':'≈ 0 pág.',
'Escreva ou cole aqui o resumo da aula (limite ≈ 3 páginas)':'Escribe o pega aquí el resumen de la clase (límite ≈ 3 páginas)',
'Limite de ~3 páginas (9.000 caracteres). Exporte abaixo em Word ou PDF.':'Límite de unas 3 páginas (9.000 caracteres). Expórtalo abajo en Word o PDF.',
'Material didático e documentos':'Material didáctico y documentos',
'Livros e links citados no vídeo':'Libros y enlaces citados en el vídeo',
'Adicionar material':'Añadir material',
'Documentos anexados (PDF, imagem, Word ou áudio) ·':'Documentos adjuntos (PDF, imagen, Word o audio) ·',
'Importar PDF, imagem, Word ou áudio':'Importar PDF, imagen, Word o audio',
'Tirar foto':'Tomar foto',
'"{f}" não é um tipo aceito (PDF, imagem, Word ou áudio).':'"{f}" no es un tipo aceptado (PDF, imagen, Word o audio).',
'Título (ex: Casa-Grande & Senzala)':'Título (ej.: Cien años de soledad)','Autor, editora ou link':'Autor, editorial o enlace',
'Título':'Título','Autor':'Autor','Remover material':'Quitar material','Abrir arquivo':'Abrir archivo','Remover arquivo':'Quitar archivo',
'Título e duração obtidos.':'Título y duración obtenidos.',
'Duração obtida automaticamente.':'Duración obtenida automáticamente.',
'Buscando título e duração no YouTube…':'Buscando el título y la duración en YouTube…',
'Resumo do vídeo':'Resumen del vídeo','Resumo do vídeo (≈ {p} pág.)':'Resumen del vídeo (≈ {p} pág.)',
'Preencha o título do material primeiro.':'Rellena primero el título del material.',
'Buscar este material em PDF na internet':'Buscar en internet este material en PDF',
'Buscar PDF grátis na internet':'Buscar PDF gratis en internet',
'Compartilhar arquivo':'Compartir archivo','Compartilhar (WhatsApp, e-mail…)':'Compartir (WhatsApp, correo…)',
'A visualização não abriu (pop-up bloqueado). Baixar o arquivo em vez disso?':'La vista previa no se abrió (pop-up bloqueado). ¿Descargar el archivo en su lugar?',
'Não foi possível abrir este arquivo. Teste com outro documento — se o outro abrir, o problema é o arquivo em si, não o app.':'No se pudo abrir este archivo. Prueba con otro documento: si el otro se abre, el problema es el archivo, no la app.',
'Este navegador não tem a janela de compartilhamento — o arquivo será baixado para você enviar por WhatsApp Web, e-mail etc.':'Este navegador no tiene ventana de compartir: el archivo se descargará para que lo envíes por WhatsApp Web, correo, etc.',
'Não foi possível compartilhar o arquivo.':'No se pudo compartir el archivo.',
'Os documentos anexados somam {n} — o backup vai ficar pesado e pode demorar para gerar e importar. Continuar?':'Los documentos adjuntos suman {n}: la copia será pesada y puede tardar en generarse e importarse. ¿Continuar?',
'Você tinha um vídeo não salvo ("{n}"). Restaurar o rascunho?':'Tenías un vídeo sin guardar ("{n}"). ¿Restaurar el borrador?',
'Pagar agora (Pix ou cartão)':'Pagar ahora (Pix o tarjeta)',
'Pagamento seguro pelo Mercado Pago. O código de ativação chega em poucos minutos no e-mail informado acima — cole-o no campo abaixo.':'Pago seguro por Mercado Pago. El código de activación llega en pocos minutos al correo indicado arriba: pégalo en el campo de abajo.',
'Seu e-mail (para receber o código de ativação)':'Tu correo (para recibir el código de activación)',
'Digite um e-mail válido para receber o código.':'Escribe un correo válido para recibir el código.',
'Problemas ou não recebeu o código? Escreva para {mail}.':'¿Problemas o no recibiste el código? Escribe a {mail}.',
'Aviso':'Aviso','Saiba mais':'Más información',
'Horas totais':'Horas totales','Ministradas':'Impartidas','Não ministradas':'No impartidas',
'sem nome':'sin nombre','Tamanho do texto':'Tamaño del texto',
'Diminuir letras':'Reducir letras','Aumentar letras':'Agrandar letras',
'Ex: A Primeira Revolução Industrial':'Ej.: La Primera Revolución Industrial',
'Nome da matéria':'Nombre de la asignatura','Série/Ano':'Curso/Año','Capítulo / unidade':'Capítulo / unidad',
'Título da aula':'Título de la clase','Número / identificador':'Número / identificador','Nome do capítulo':'Nombre del capítulo',
'Ano':'Año','Instituição':'Institución',
'Professor':'Profesor','Formação':'Formación','Ex: Nome do professor':'Ej.: Nombre del profesor',
'Não informado':'Sin indicar','Técnico':'Técnico','Graduado':'Graduado',
'Pós-graduando':'Posgrado (en curso)','Mestrado':'Maestría','Doutorado':'Doctorado',
'Duplicar projeto':'Duplicar proyecto',
'<b>Projeto duplicado.</b> Cópia de "{p}" criada.':'<b>Proyecto duplicado.</b> Copia de "{p}" creada.',
'Ex: HISTÓRIA':'Ej.: HISTORIA','Ex: 6° ANO':'Ej.: 6.º CURSO','Ex: Cap. 01 — Brasil Colônia':'Ej.: Cap. 01 — Brasil Colonial',
'Ex: A Sociedade Patriarcal':'Ej.: La Sociedad Patriarcal','Ex: Cap. 01':'Ej.: Cap. 01',
'Ex: Ciclo do Pau Brasil':'Ej.: El Ciclo del Palo Brasil','Ex: Escola Estadual …':'Ej.: Escuela Estatal…',
'Baixar Word (.doc)':'Descargar Word (.doc)','Gerar PDF (imprimir / salvar)':'Generar PDF (imprimir / guardar)',
'Informe o nome.':'Indica el nombre.','Informe a série/ano.':'Indica el curso/año.','Informe o título.':'Indica el título.',
'Informe o ano.':'Indica el año.','Informe o nome do vídeo.':'Indica el nombre del vídeo.',
'Preencha o nome do vídeo primeiro.':'Rellena primero el nombre del vídeo.',
'Remover esta série/ano e todas as suas aulas?':'¿Eliminar este curso/año y todas sus clases?',
'Remover esta aula?':'¿Eliminar esta clase?','Remover este capítulo e todos os seus vídeos?':'¿Eliminar este capítulo y todos sus vídeos?',
'Remover este vídeo?':'¿Eliminar este vídeo?',
'Remover a matéria "{m}" e sua(s) {n} série(s)?':'¿Eliminar la asignatura "{m}" y su(s) {n} curso(s)?',
/* Deshacer eliminación */
'Desfazer':'Deshacer','Restaurado.':'Restaurado.','O prazo para desfazer já passou.':'El plazo para deshacer ya pasó.',
'Matéria <b>{m}</b> excluída.':'Asignatura <b>{m}</b> eliminada.',
'Série <b>{s}</b> excluída.':'Curso <b>{s}</b> eliminado.',
'Aula <b>{t}</b> excluída.':'Clase <b>{t}</b> eliminada.',
'Capítulo <b>{c}</b> excluído.':'Capítulo <b>{c}</b> eliminado.',
'Vídeo <b>{v}</b> excluído.':'Vídeo <b>{v}</b> eliminado.',
'Ano letivo <b>{p}</b> excluído.':'Año lectivo <b>{p}</b> eliminado.',
/* Papelera (recuperar eliminaciones) */
'Lixeira':'Papelera',
'Lixeira — recuperar o que foi apagado':'Papelera — recuperar lo que se eliminó',
'Lixeira — {n} item(ns) para recuperar':'Papelera — {n} elemento(s) para recuperar',
'A lixeira está vazia.':'La papelera está vacía.',
'Guarda as <b>{n} últimas</b> exclusões. Fechar o app esvazia a lixeira.':'Guarda las <b>{n} últimas</b> eliminaciones. Cerrar la app vacía la papelera.',
'Recuperar':'Recuperar',
'Este item saiu do <b>{p}</b>. Abra esse ano letivo para recuperá-lo.':'Este elemento salió de <b>{p}</b>. Abre ese año lectivo para recuperarlo.',
'do {p} — abra esse ano para recuperar':'de {p} — abre ese año para recuperar',
'outro ano letivo':'otro año lectivo','outro ano':'otro año',
/* Copiar y pegar curso */
'Copiar série':'Copiar curso','Colar série':'Pegar curso','Colar {s}':'Pegar {s}','série':'curso',
'Nada foi copiado ainda.':'Todavía no se ha copiado nada.',
'Apagar cópia em espera':'Borrar copia en espera',
'Apagar a cópia em espera, sem colar? Nada que já existe no app é apagado.':'¿Borrar la copia en espera sin pegarla? No se borra nada de lo que ya existe en la app.',
'Cópia em espera apagada.':'Copia en espera borrada.',
'Apagar':'Borrar',
'Não foi possível copiar: a memória do navegador está cheia.':'No se pudo copiar: la memoria del navegador está llena.',
'Série <b>{s}</b> copiada. Abra a matéria de destino e toque em <b>Colar</b>.':'Curso <b>{s}</b> copiado. Abre la asignatura de destino y toca <b>Pegar</b>.',
'Série <b>{s}</b> colada em {m}.':'Curso <b>{s}</b> pegado en {m}.',
'Copiar aula':'Copiar clase','Colar aula':'Pegar clase','aula':'clase',
'Aula <b>{a}</b> copiada. Abra a série de destino e toque em <b>Colar aula</b>.':'Clase <b>{a}</b> copiada. Abre el curso de destino y toca <b>Pegar clase</b>.',
'Aula <b>{a}</b> colada.':'Clase <b>{a}</b> pegada.',
'Copiar matéria para outro ano letivo':'Copiar asignatura a otro año lectivo',
'Colar matéria':'Pegar asignatura','matéria':'asignatura','(cópia)':'(copia)',
'Matéria <b>{m}</b> copiada com {n} série(s). Troque de ano letivo e toque em <b>Colar matéria</b>.':'Asignatura <b>{m}</b> copiada con {n} curso(s). Cambia de año lectivo y toca <b>Pegar asignatura</b>.',
'Matéria <b>{m}</b> colada com {n} série(s).':'Asignatura <b>{m}</b> pegada con {n} curso(s).',
'Limite de {n} documentos por vídeo.':'Límite de {n} documentos por vídeo.',
'Limite de {n} documentos por vídeo — os demais não foram importados.':'Límite de {n} documentos por vídeo — el resto no se importó.',
'"{f}" passa de {n} MB e não foi importado.':'"{f}" supera los {n} MB y no se importó.',
'Não foi possível guardar o arquivo neste navegador.':'No se pudo guardar el archivo en este navegador.',
'Arquivo não encontrado no armazenamento deste navegador.':'Archivo no encontrado en el almacenamiento de este navegador.',
'Permita pop-ups para visualizar o arquivo.':'Permite las ventanas emergentes para ver el archivo.',
'Não foi possível abrir o arquivo.':'No se pudo abrir el archivo.',
'Permita pop-ups para exportar em PDF.':'Permite las ventanas emergentes para exportar en PDF.',
'Permita pop-ups para gerar o PDF.':'Permite las ventanas emergentes para generar el PDF.',
'Link do YouTube reconhecido — buscando título…':'Enlace de YouTube reconocido — buscando el título…',
'Link detectado.':'Enlace detectado.','Link cadastrado':'Enlace guardado',
'Título obtido. Preencha a duração se necessário.':'Título obtenido. Rellena la duración si hace falta.',
'{n}/9000 caracteres':'{n}/9.000 caracteres',
'Material didático e documentos ({n})':'Material didáctico y documentos ({n})',
'Vídeo sem nome':'Vídeo sin nombre','(Sem resumo preenchido)':'(Sin resumen escrito)',
'Material didático':'Material didáctico','Documentos anexados':'Documentos adjuntos',
'Matéria':'Asignatura','Serie':'Curso','Aula':'Clase','Cap.':'Cap.','Título do vídeo':'Título del vídeo','Link':'Enlace',
'Sem capítulos.':'Sin capítulos.','Sem vídeos.':'Sin vídeos.',
'Resumo disponível ({n} caracteres)':'Resumen disponible ({n} caracteres)','Obs.:':'Nota:',
'Relatório — {d}':'Informe — {d}','Série única':'Curso único','duração total':'duración total','gerado em':'generado el',
'Aula {n}':'Clase {n}','Novo vídeo — {c}':'Nuevo vídeo — {c}','Editar V{v} — {c}':'Editar V{v} — {c}',
'Nova série/ano — {m}':'Nuevo curso/año — {m}',
'{n} aulas':v=>+v.n===1?'1 clase':v.n+' clases','{n} capítulos':v=>+v.n===1?'1 capítulo':v.n+' capítulos',
'{n} vídeos':v=>+v.n===1?'1 vídeo':v.n+' vídeos',
'Criar novo projeto (ano letivo)':'Crear nuevo proyecto (año lectivo)',
'Excluir o projeto "{p}" com TODAS as matérias, aulas e documentos dele? Você terá alguns segundos para desfazer.':'¿Eliminar el proyecto "{p}" con TODAS sus asignaturas, clases y documentos? Tendrás unos segundos para deshacer.',
'Tem certeza? Se quiser guardar uma cópia, cancele e use antes o botão de exportar (seta para baixo).':'¿Seguro? Si quieres conservar una copia, cancela y usa antes el botón de exportar (flecha hacia abajo).',
'Este é o único projeto. Crie outro antes de excluir este.':'Este es el único proyecto. Crea otro antes de eliminar este.',
'Sem espaço no navegador para criar o projeto.':'Sin espacio en el navegador para crear el proyecto.',
'Sem espaço no navegador para importar este projeto.':'Sin espacio en el navegador para importar este proyecto.',
'Arquivo inválido.':'Archivo no válido.',
'Este arquivo não é um backup do Organizador de Aulas Prometeu.':'Este archivo no es una copia de seguridad del Organizador de Clases Prometeo.',
'Ano letivo {a}':'Año lectivo {a}',
'<b>Projeto ativo:</b> {p}.':'<b>Proyecto activo:</b> {p}.',
'<b>Projeto {a} criado e em uso.</b> O anterior ficou arquivado — troque quando quiser em ☰ → Gerenciar projetos.':'<b>Proyecto {a} creado y en uso.</b> El anterior quedó archivado — cámbialo cuando quieras en ☰ → Gestionar proyectos.',
'<b>Backup exportado!</b> “{a}” foi baixado neste aparelho — no iPhone/iPad, escolha <b>“Salvar em Arquivos”</b>. Guarde uma cópia em local seguro (Drive, pen-drive…).':'<b>¡Copia exportada!</b> “{a}” se descargó en este dispositivo — en iPhone/iPad, elige <b>“Guardar en Archivos”</b>. Guarda una copia en un lugar seguro (Drive, USB…).',
'<b>Projeto importado</b> e colocado em uso.':'<b>Proyecto importado</b> y puesto en uso.',
'<b>Vídeo duplicado nesta série:</b> mesmo nome e link já existem na <b>Aula {a}</b> · {c}.':'<b>Vídeo duplicado en este curso:</b> el mismo nombre y enlace ya existen en la <b>Clase {a}</b> · {c}.',
'Esta cópia roda como arquivo único: para atualizar, substitua o prometeu.html por uma versão mais nova. Seus dados não se perdem.':'Esta copia funciona como archivo único: para actualizar, sustituye prometeu.html por una versión más nueva. Tus datos no se pierden.',
'Verificação concluída. Se houver versão nova, feche e reabra o app para aplicar.':'Comprobación terminada. Si hay una versión nueva, cierra y vuelve a abrir la app para aplicarla.',
'O app ainda não está instalado como PWA neste navegador.':'La app aún no está instalada como PWA en este navegador.',
'Não foi possível verificar agora (sem internet?).':'No se pudo comprobar ahora (¿sin internet?).',
'Verificar atualização agora':'Comprobar actualización ahora',
'Versão {v} · {d}':'Versión {v} · {d}','julho de 2026':'julio de 2026','agosto de 2026':'agosto de 2026',
'App 100% offline: os dados ficam guardados neste navegador/aparelho — nada é enviado para a internet.':'App 100% sin conexión: los datos se guardan en este navegador/dispositivo — nada se envía a internet.',
'Projetos guardados:':'Proyectos guardados:','Matérias no projeto atual:':'Asignaturas en el proyecto actual:',
'O app funciona sem internet; uma atualização só chega quando você recebe uma <b>versão nova</b> do arquivo ou do site.':'La app funciona sin internet; una actualización solo llega cuando recibes una <b>versión nueva</b> del archivo o del sitio.',
'<b>Versão instalada como app (PWA):</b> toque em “Verificar atualização agora”. Se houver versão nova no site, ela é baixada e aplicada ao fechar e reabrir o app.':'<b>Versión instalada como app (PWA):</b> toca “Comprobar actualización ahora”. Si hay versión nueva en el sitio, se descarga y se aplica al cerrar y reabrir la app.',
'<b>Versão em arquivo único (prometeu.html):</b> basta substituir o arquivo antigo pelo novo. Os dados <b>não se perdem</b> — eles ficam no navegador, não dentro do arquivo.':'<b>Versión en archivo único (prometeu.html):</b> basta con sustituir el archivo antiguo por el nuevo. Los datos <b>no se pierden</b> — viven en el navegador, no dentro del archivo.',
'<b>Dica:</b> antes de atualizar, exporte um backup (☰ → Arquivo → Exportar backup).':'<b>Consejo:</b> antes de actualizar, exporta una copia (☰ → Archivo → Exportar copia).',
'Leia antes de começar':'Lee antes de empezar',
'Leia a Política de Privacidade e os Termos de Uso antes de usar o app. Toque nos botões abaixo para abrir cada documento.':'Lee la Política de Privacidad y los Términos de Uso antes de usar la app. Toca los botones de abajo para abrir cada documento.',
'Em resumo: seus dados ficam somente neste aparelho — o app não coleta, não envia e não compartilha nada pela internet.':'En resumen: tus datos se quedan solo en este dispositivo — la app no recopila, no envía ni comparte nada por internet.',
'Ler a Política de Privacidade':'Leer la Política de Privacidad','Ler os Termos de Uso':'Leer los Términos de Uso',
'Li e aceito':'Lo he leído y acepto','Recusar':'Rechazar',
'Sem o aceite não dá para continuar':'Sin aceptar no se puede continuar',
'Você recusou os Termos de Uso e a Política de Privacidade. Sem essa concordância o app não pode ser usado. Nada foi gravado neste aparelho.':'Has rechazado los Términos de Uso y la Política de Privacidad. Sin esa aceptación la app no se puede usar. No se guardó nada en este dispositivo.',
'Se quiser reler antes de decidir, use “Voltar e ler de novo”.':'Si quieres leerlos otra vez antes de decidir, usa “Volver y leer de nuevo”.',
'Voltar e ler de novo':'Volver y leer de nuevo','Sair do app':'Salir de la app',
'Se a janela não fechar sozinha, feche o app pelo botão do aparelho ou feche esta aba do navegador.':'Si la ventana no se cierra sola, cierra la app con el botón del dispositivo o cierra esta pestaña del navegador.',
'Tutorial rápido?':'¿Tutorial rápido?',
'Quer ver uma demonstração rápida de como o app funciona? O app navega sozinho mostrando cada função.':'¿Quieres ver una demostración rápida de cómo funciona la app? La app navega sola mostrando cada función.',
'Você pode revê-la quando quiser em ☰ → Modo demonstração.':'Puedes volver a verla cuando quieras en ☰ → Modo demostración.',
'Agora não':'Ahora no','Ver tutorial':'Ver tutorial',
'Termos de Uso':'Términos de Uso','Política de Privacidade':'Política de Privacidad',
'Ver documento completo (online)':'Ver el documento completo (en línea)',
'Escolha o idioma':'Elige el idioma',
'Ativação':'Activación','Ativar / Comprar':'Activar / Comprar','Ativar':'Activar',
'Versão completa ativada':'Versión completa activada',
'Período gratuito: {n} dia(s) restante(s)':v=>+v.n===1?'Período gratuito: queda 1 día':'Período gratuito: quedan '+v.n+' días',
'Você usa tudo livremente. Depois do período, criar conteúdo novo pede ativação — ver e exportar seus dados continua sempre liberado.':'Usas todo libremente. Tras el período, crear contenido nuevo requiere activación — ver y exportar tus datos sigue siempre disponible.',
'Período gratuito encerrado':'Período gratuito finalizado',
'Ative para criar novos conteúdos. Seus dados e as exportações continuam acessíveis.':'Actívalo para crear contenido nuevo. Tus datos y las exportaciones siguen accesibles.',
'Como ativar':'Cómo activar',
'Atenção antes de pagar':'Atención antes de pagar',
'Escolha sempre Pix ou cartão comum':'Elige siempre Pix o tarjeta normal',
'Ver as duas telas do Mercado Pago':'Ver las dos pantallas de Mercado Pago',
'Esconder as telas':'Ocultar las pantallas',
'Assim NÃO — cobra juros':'Así NO — cobra intereses',
'Assim SIM — valor certo':'Así SÍ — importe correcto',
'Sua compra':'Tu compra',
'Juros e IOF':'Intereses e IOF',
'Total':'Total',
'Use agora e pague depois':'Usa ahora y paga después',
'LINHA DE CRÉDITO':'LÍNEA DE CRÉDITO',
'Pagar':'Pagar',
'Cartão de crédito · à vista':'Tarjeta de crédito · en un pago',
'Aqui você pagaria R$ 6,14 a mais, só de juros e IOF.':'Aquí pagarías R$ 6,14 de más, solo en intereses e IOF.',
'Valor certo, sem juros. Se perguntarem, dá para continuar sem entrar na conta.':'Importe correcto, sin intereses. Si te preguntan, puedes continuar sin iniciar sesión.',
'Se o seu aparelho já tem conta do Mercado Pago, a tela pode vir com a “Linha de Crédito” pré-escolhida — ela cobra juros e IOF, e o total fica maior que o anunciado. {b} — dá para continuar como convidado, sem entrar na conta. Essa tela é do Mercado Pago; não temos como removê-la.':'Si tu dispositivo ya tiene cuenta de Mercado Pago, la pantalla puede venir con la “Línea de Crédito” preseleccionada: cobra intereses e IOF, y el total queda más alto que el anunciado. {b} — puedes continuar como invitado, sin iniciar sesión. Esa pantalla es de Mercado Pago; no podemos quitarla.',
'Código de ativação (recebido por e-mail)':'Código de activación (recibido por correo)',
'Cole aqui o código de ativação':'Pega aquí el código de activación',
'Código inválido. Confira se copiou o código completo do e-mail.':'Código no válido. Comprueba que copiaste el código completo del correo.',
'Cole aqui o código que chegou por e-mail.':'Pega aquí el código que llegó por correo.',
'Parece que veio texto junto com o código. Copie só a linha do código.':'Parece que vino texto junto con el código. Copia solo la línea del código.',
'Esse código está incompleto: falta o ponto que separa as duas partes dele.':'Ese código está incompleto: falta el punto que separa sus dos partes.',
'O código parece cortado. Copie do começo ao fim, sem deixar nada de fora.':'El código parece cortado. Cópialo de principio a fin, sin dejar nada fuera.',
'O código não confere. Ele vale só para o e-mail usado na compra.':'El código no coincide. Solo vale para el correo usado en la compra.',
'<b>Ativado!</b> Obrigado. Licença registrada para {e}.':'<b>¡Activado!</b> Gracias. Licencia registrada para {e}.',
'Este navegador não suporta a verificação de licença.':'Este navegador no admite la verificación de licencia.',
'LEGAL_PRIV':'<p><b>Resumen:</b></p><ul><li>La app funciona 100% sin conexión. Todo lo que creas se guarda solo en el navegador de este dispositivo (localStorage/IndexedDB).</li><li>No se recopila, transmite ni vende ningún dato personal. No hay anuncios, rastreadores ni analíticas.</li><li>Funciones en línea opcionales: obtener el título de un vídeo de YouTube (solo se envía el enlace del vídeo a YouTube) y cargar fuentes de Google Fonts. Ambas son opcionales — la app funciona sin ellas.</li><li>Las copias de seguridad (.json) las creas tú y quedan donde las guardes.</li><li>Para borrarlo todo: elimina los proyectos en la app, o borra los datos del sitio/app en los ajustes del dispositivo.</li><li>Contacto: organizadordeaulas.prometeu@gmail.com</li></ul>',
'LEGAL_TERMS':'<p><b>Resumen:</b></p><ul><li>Licencia personal e intransferible, para uso de quien adquirió la app.</li><li>Queda prohibida la reventa, redistribución o explotación comercial por terceros sin autorización previa, por escrito, del autor.</li><li>La app se ofrece "tal cual"; mantén copias de seguridad de tus datos (☰ → Archivo → Exportar copia).</li><li>El contenido que registres (clases, enlaces, archivos) es tuyo y es tu responsabilidad.</li><li>Contacto: organizadordeaulas.prometeu@gmail.com</li></ul>',
'Iniciar demonstração':'Iniciar demostración','Parar demonstração':'Detener demostración','Toque para parar a demonstração':'Toca para detener la demostración',
'DEMO_1':'Este es el Organizador de Clases Prometeo: las asignaturas están en la pantalla inicial, agrupadas automáticamente.',
'DEMO_2':'Dentro de cada asignatura están los cursos/años. El botón de flecha abre el árbol de clases.',
'DEMO_3':'Cada curso reúne clases numeradas, con la duración total y contadores de lo que falta.',
'DEMO_4':'Dentro de una clase: los capítulos. La casilla marca lo que todavía falta por impartir.',
'DEMO_5':'Cada capítulo guarda vídeos, con enlaces, resúmenes, materiales y documentos adjuntos.',
'DEMO_6':'El formulario del vídeo busca el título en YouTube y exporta resúmenes en Word/PDF.',
'DEMO_7':'Seis temas visuales, incluido el HUD de ciencia ficción Prometeo.',
'DEMO_8':'Los proyectos archivan años lectivos completos — cambia cuando quieras, con copia de seguridad en un archivo.',
'DEMO_9':'El informe del curso exporta toda la estructura en Word o PDF.',
'DEMO_10':'Todo 100% sin conexión: tus datos nunca salen del dispositivo. Organizador de Clases Prometeo.',
'DEMO_MENU':'Todo empieza en el menú ☰: proyectos, copia de seguridad, idioma, ayuda y activación de la versión completa.',
'Comece por aqui: toque no menu ☰':'Empieza aquí: toca el menú ☰',
'MATÉRIA':'ASIGNATURA','SÉRIE / ANO':'CURSO / AÑO','AULA':'CLASE','CAPÍTULO':'CAPÍTULO','VÍDEO':'VÍDEO',
'ARQUIVADO':'ARCHIVADO','EM USO ●':'EN USO ●','ORGANIZADOR':'ORGANIZADOR','DE AULAS':'DE CLASES','ANOTAÇÕES':'NOTAS',
'Cap. 01 — caixinha marcada = ● A MINISTRAR':'Cap. 01 — casilla marcada = ● POR IMPARTIR',
'Cap. 02 — caixinha vazia = ✓ já ministrado':'Cap. 02 — casilla vacía = ✓ ya impartido'
},

/* ---------- CHINÊS SIMPLIFICADO ---------- */
'zh':{
'<b>Arquivo salvo!</b> “{a}” foi baixado neste aparelho — no iPhone/iPad, escolha <b>“Salvar em Arquivos”</b>.':'<b>文件已保存！</b>“{a}”已下载到本设备——在 iPhone/iPad 上，请选择<b>“存储到文件”</b>。',
'Na janela que abrir, escolha <b>“Salvar como PDF”</b> e depois onde guardar o arquivo.':'在弹出的窗口中选择<b>“另存为 PDF”</b>，然后选择文件的保存位置。',
'Organizador de Aulas Prometeu':'课程管理器 普罗米修斯',
'Abrir menu':'打开菜单','Voltar':'返回','Início':'首页','Fechar menu':'关闭菜单','Fechar':'关闭',
'Mover para cima':'上移','Mover para baixo':'下移','Concluir':'完成',
'Cancelar':'取消','Salvar':'保存','Salvar vídeo':'保存视频','Editar':'编辑','Remover':'删除',
'Tutorial':'使用教程','Atualização':'更新','Versão':'版本','Arquivo':'文件','Ajuda':'帮助',
'Idioma':'语言','Privacidade':'隐私','Termos de uso':'使用条款','Modo demonstração':'演示模式',
'Enviar críticas ou sugestões':'发送意见或建议',
'Críticas e sugestões — Organizador de Aulas Prometeu':'意见与建议 — 课程管理器 普罗米修斯',
'Instalar aplicativo':'安装应用',
'O app já está instalado neste aparelho.':'应用已安装在此设备上。',
'INSTALL_HELP':'<p><b>在电脑（Windows）上 — Edge 或 Chrome：</b></p><ol><li>用 <b>Microsoft Edge</b> 或 <b>Google Chrome</b> 打开本站。</li><li>确认网址以 <b>https://</b> 开头，且是应用的官方网站。</li><li>点击地址栏末尾的<b>安装图标</b>（带箭头的显示器 ⤓）——或 <b>⋮</b> 菜单 → <b>“安装 Organizador de Aulas Prometeu”</b>。</li><li>确认<b>“安装”</b>。应用会在<b>开始菜单</b>中获得图标，此后都在独立窗口中打开。</li></ol><p><b>在 Android（手机/平板）上：</b>用 <b>Chrome</b> 打开 → <b>⋮</b> 菜单 → <b>“安装应用”</b>（或“添加到主屏幕”）。如果没有该选项，说明浏览器可能不支持安装（例如 Mi Browser）——请用 Chrome。</p><p class="fhint">安全提示：请始终从官方网站安装，并保持浏览器为最新版本。应用可离线使用，所有数据仅保存在本设备。</p>',
'INSTALL_HELP_IOS':'<p><b>在 iPhone 或 iPad 上 — 使用 Safari：</b></p><ol><li>用 <b>Safari</b> 打开本站（必须是 Safari——iPhone 上其他浏览器无法安装应用）。</li><li>确认网址以 <b>https://</b> 开头，且是应用的官方网站。</li><li>点击<b>分享</b>按钮（底部栏中带向上箭头的方块）。</li><li>向下滚动列表，点击<b>“添加到主屏幕”</b> → <b>“添加”</b>。</li></ol><p>应用会获得自己的图标，并像普通应用一样全屏打开。</p><p class="fhint">安全提示：请始终通过 Safari 从官方网站安装。应用可离线使用，所有数据仅保存在本设备。</p>',
'Projeto em uso':'当前项目','Gerenciar projetos':'管理项目','Criar novo projeto':'新建项目',
'Exportar backup (.json)':'导出备份 (.json)','Importar backup (.json)':'导入备份 (.json)',
'Nova matéria':'新科目','Nova série/ano':'新年级','Nova aula':'新课','Novo capítulo':'新章节','Novo vídeo':'新视频',
'Transferir aulas':'转移课程','Transferir todas as aulas':'转移全部课程','Transferir':'转移',
'Levar {n} aula(s): toque no destino':'转移 {n} 节课：点击目标年级',
'Levar {n} aula(s) para <b>{d}</b>?':'将 {n} 节课转移到<b>{d}</b>吗？',
'Toque na série/ano que vai receber as aulas.':'点击要接收课程的年级。',
'As aulas já estão nesta série/ano.':'课程已在该年级中。',
'Todas':'全选','Nenhuma':'全不选',
'Nada para desfazer.':'没有可撤销的操作。',
'Última alteração desfeita.':'已撤销上一步操作。',
'Desfazer a última alteração':'撤销上一步操作',
'{n} selecionada(s)':'已选 {n} 节',
'Crie outra série/ano para receber as aulas.':'请先创建另一个年级来接收课程。',
'Marque as aulas e toque em <b>Transferir</b>.':'勾选课程后点击<b>转移</b>。',
'{n} aula(s) transferida(s) para <b>{d}</b>.':'已将 {n} 节课转移到 <b>{d}</b>。',
'Editar série/ano':'编辑年级','Editar aula':'编辑课程','✓ ministrado':'✓ 已授课','● a ministrar':'● 待授课',
'Projetos — anos letivos':'项目 — 学年',
'Claro':'浅色','Escuro':'深色','Prometeu':'普罗米修斯','P. Vermelho':'普罗米修斯·红','P. Azul':'普罗米修斯·蓝','Tema':'主题',
'Nenhuma matéria.':'暂无科目。','Toque em':'点击','Nenhuma série/ano.':'暂无年级。',
'Nenhuma aula.':'暂无课程。','Nenhum capítulo ainda.':'暂无章节。','Sem aulas ainda':'尚无课程',
'Sem conteúdo nos capítulos':'章节中暂无内容',
'Renomear matéria':'重命名科目','Remover matéria':'删除科目','Relatório da série':'年级报告',
'Editar capítulo':'编辑章节','Remover capítulo':'删除章节','Editar vídeo':'编辑视频','Remover vídeo':'删除视频',
'Abrir vídeo':'打开视频','Buscar este vídeo no YouTube':'在 YouTube 上搜索此视频',
'Sem link — buscar no YouTube':'无链接 — 在 YouTube 上搜索','Adicionar vídeo neste capítulo':'在此章节添加视频',
'Observações':'备注','Editar projeto':'编辑项目','Excluir projeto':'删除项目',
'Exportar arquivo deste projeto':'导出此项目文件',
'Marcar como a ministrar':'标记为待授课','Marcar como ministrado':'标记为已授课',
'Marcado = a ministrar; vazio = já ministrado':'勾选 = 待授课；空 = 已授课',
'Capítulos (CP) — acesos têm conteúdo':'章节 (CP) — 亮起表示有内容',
'Série/Ano não definido':'未设置年级','Sem capítulo':'无章节','Toque para editar':'点击编辑',
'Instituição não informada':'未填写学校','EM USO':'使用中',
'Anotações deste capítulo (lembretes, tarefas, páginas do livro…)':'本章节的笔记（提醒、任务、教材页码……）',
'Nome do vídeo':'视频名称','Link do vídeo (YouTube)':'视频链接 (YouTube)',
'Buscar este vídeo no YouTube (pelo nome)':'按名称在 YouTube 上搜索此视频',
'Buscando título no YouTube…':'正在从 YouTube 获取标题……',
'Duração':'时长','(MM:SS ou H:MM:SS)':'（MM:SS 或 H:MM:SS）','Ex: 23:30 ou 1:08:44':'例：23:30 或 1:08:44',
'Preencha manualmente caso não seja detectada automaticamente.':'如未自动识别，请手动填写。',
'Resumo do vídeo ·':'视频摘要 ·','≈ 0 pág.':'≈ 0 页',
'Escreva ou cole aqui o resumo da aula (limite ≈ 3 páginas)':'在此撰写或粘贴课程摘要（上限约 3 页）',
'Limite de ~3 páginas (9.000 caracteres). Exporte abaixo em Word ou PDF.':'上限约 3 页（9000 字符）。可在下方导出为 Word 或 PDF。',
'Material didático e documentos':'教学材料与文档',
'Livros e links citados no vídeo':'视频中提到的书籍和链接',
'Adicionar material':'添加材料',
'Documentos anexados (PDF, imagem, Word ou áudio) ·':'附件文档（PDF、图片、Word 或音频）·',
'Importar PDF, imagem, Word ou áudio':'导入 PDF、图片、Word 或音频',
'Tirar foto':'拍照',
'"{f}" não é um tipo aceito (PDF, imagem, Word ou áudio).':'“{f}” 不是可接受的类型（PDF、图片、Word 或音频）。',
'Título (ex: Casa-Grande & Senzala)':'标题（例：红楼梦）','Autor, editora ou link':'作者、出版社或链接',
'Título':'标题','Autor':'作者','Remover material':'移除材料','Abrir arquivo':'打开文件','Remover arquivo':'移除文件',
'Título e duração obtidos.':'已获取标题和时长。',
'Duração obtida automaticamente.':'已自动获取时长。',
'Buscando título e duração no YouTube…':'正在从 YouTube 获取标题和时长……',
'Resumo do vídeo':'视频摘要','Resumo do vídeo (≈ {p} pág.)':'视频摘要（约 {p} 页）',
'Preencha o título do material primeiro.':'请先填写材料的标题。',
'Buscar este material em PDF na internet':'在网上搜索该材料的 PDF 版本',
'Buscar PDF grátis na internet':'在网上搜索免费 PDF',
'Compartilhar arquivo':'分享文件','Compartilhar (WhatsApp, e-mail…)':'分享（WhatsApp、电子邮件……）',
'A visualização não abriu (pop-up bloqueado). Baixar o arquivo em vez disso?':'预览未能打开（弹窗被拦截）。改为下载文件？',
'Não foi possível abrir este arquivo. Teste com outro documento — se o outro abrir, o problema é o arquivo em si, não o app.':'无法打开此文件。请换一个文档试试——如果另一个能打开，问题出在文件本身，而不是应用。',
'Este navegador não tem a janela de compartilhamento — o arquivo será baixado para você enviar por WhatsApp Web, e-mail etc.':'此浏览器没有分享窗口——文件将被下载，您可通过 WhatsApp 网页版、电子邮件等发送。',
'Não foi possível compartilhar o arquivo.':'无法分享文件。',
'Os documentos anexados somam {n} — o backup vai ficar pesado e pode demorar para gerar e importar. Continuar?':'附件文档共 {n} —— 备份会很大，生成和导入可能较慢。继续？',
'Você tinha um vídeo não salvo ("{n}"). Restaurar o rascunho?':'您有一个未保存的视频（“{n}”）。要恢复草稿吗？',
'Pagar agora (Pix ou cartão)':'立即支付（Pix 或银行卡）',
'Pagamento seguro pelo Mercado Pago. O código de ativação chega em poucos minutos no e-mail informado acima — cole-o no campo abaixo.':'通过 Mercado Pago 安全支付。激活码将在几分钟内发送到上方填写的电子邮箱——请粘贴到下方输入框。',
'Seu e-mail (para receber o código de ativação)':'你的电子邮箱（用于接收激活码）',
'Digite um e-mail válido para receber o código.':'请输入有效的电子邮箱以接收激活码。',
'Problemas ou não recebeu o código? Escreva para {mail}.':'遇到问题或没收到激活码？请写信至 {mail}。',
'Aviso':'提示','Saiba mais':'了解更多',
'Horas totais':'总时长','Ministradas':'已授课','Não ministradas':'未授课',
'sem nome':'未命名','Tamanho do texto':'文字大小',
'Diminuir letras':'缩小文字','Aumentar letras':'放大文字',
'Ex: A Primeira Revolução Industrial':'例：第一次工业革命',
'Nome da matéria':'科目名称','Série/Ano':'年级','Capítulo / unidade':'章节 / 单元',
'Título da aula':'课程标题','Número / identificador':'编号 / 标识','Nome do capítulo':'章节名称',
'Ano':'年份','Instituição':'学校',
'Professor':'教师','Formação':'学历','Ex: Nome do professor':'例如：教师姓名',
'Não informado':'未填写','Técnico':'职业技术','Graduado':'本科',
'Pós-graduando':'研究生在读','Mestrado':'硕士','Doutorado':'博士',
'Duplicar projeto':'复制项目',
'<b>Projeto duplicado.</b> Cópia de "{p}" criada.':'<b>项目已复制。</b>已创建“{p}”的副本。',
'Ex: HISTÓRIA':'例：历史','Ex: 6° ANO':'例：六年级','Ex: Cap. 01 — Brasil Colônia':'例：第 1 章 — 殖民地时期',
'Ex: A Sociedade Patriarcal':'例：父权社会','Ex: Cap. 01':'例：第 1 章',
'Ex: Ciclo do Pau Brasil':'例：巴西红木周期','Ex: Escola Estadual …':'例：市第一中学……',
'Baixar Word (.doc)':'下载 Word (.doc)','Gerar PDF (imprimir / salvar)':'生成 PDF（打印 / 保存）',
'Informe o nome.':'请输入名称。','Informe a série/ano.':'请输入年级。','Informe o título.':'请输入标题。',
'Informe o ano.':'请输入年份。','Informe o nome do vídeo.':'请输入视频名称。',
'Preencha o nome do vídeo primeiro.':'请先填写视频名称。',
'Remover esta série/ano e todas as suas aulas?':'删除该年级及其全部课程？',
'Remover esta aula?':'删除这节课？','Remover este capítulo e todos os seus vídeos?':'删除该章节及其全部视频？',
'Remover este vídeo?':'删除这个视频？',
'Remover a matéria "{m}" e sua(s) {n} série(s)?':'删除科目“{m}”及其 {n} 个年级？',
/* 撤销删除 */
'Desfazer':'撤销','Restaurado.':'已恢复。','O prazo para desfazer já passou.':'撤销时间已过。',
'Matéria <b>{m}</b> excluída.':'已删除科目 <b>{m}</b>。',
'Série <b>{s}</b> excluída.':'已删除年级 <b>{s}</b>。',
'Aula <b>{t}</b> excluída.':'已删除课程 <b>{t}</b>。',
'Capítulo <b>{c}</b> excluído.':'已删除章节 <b>{c}</b>。',
'Vídeo <b>{v}</b> excluído.':'已删除视频 <b>{v}</b>。',
'Ano letivo <b>{p}</b> excluído.':'已删除学年 <b>{p}</b>。',
/* 回收站（恢复已删除的内容） */
'Lixeira':'回收站',
'Lixeira — recuperar o que foi apagado':'回收站 — 恢复已删除的内容',
'Lixeira — {n} item(ns) para recuperar':'回收站 — 有 {n} 项可恢复',
'A lixeira está vazia.':'回收站是空的。',
'Guarda as <b>{n} últimas</b> exclusões. Fechar o app esvazia a lixeira.':'保留<b>最近 {n} 次</b>删除。关闭应用后回收站会清空。',
'Recuperar':'恢复',
'Este item saiu do <b>{p}</b>. Abra esse ano letivo para recuperá-lo.':'该项来自 <b>{p}</b>。请打开那个学年才能恢复。',
'do {p} — abra esse ano para recuperar':'来自 {p} — 请打开该学年才能恢复',
'outro ano letivo':'另一个学年','outro ano':'另一个学年',
/* 复制和粘贴年级 */
'Copiar série':'复制年级','Colar série':'粘贴年级','Colar {s}':'粘贴 {s}','série':'年级',
'Nada foi copiado ainda.':'还没有复制任何内容。',
'Apagar cópia em espera':'删除待粘贴的副本',
'Apagar a cópia em espera, sem colar? Nada que já existe no app é apagado.':'不粘贴就删除待粘贴的副本？应用中已有的内容不会被删除。',
'Cópia em espera apagada.':'待粘贴的副本已删除。',
'Apagar':'删除',
'Não foi possível copiar: a memória do navegador está cheia.':'无法复制：浏览器存储空间已满。',
'Série <b>{s}</b> copiada. Abra a matéria de destino e toque em <b>Colar</b>.':'已复制年级 <b>{s}</b>。请打开目标科目并点击<b>粘贴</b>。',
'Série <b>{s}</b> colada em {m}.':'已将年级 <b>{s}</b> 粘贴到 {m}。',
'Copiar aula':'复制课程','Colar aula':'粘贴课程','aula':'课程',
'Aula <b>{a}</b> copiada. Abra a série de destino e toque em <b>Colar aula</b>.':'已复制课程 <b>{a}</b>。请打开目标年级并点击<b>粘贴课程</b>。',
'Aula <b>{a}</b> colada.':'已粘贴课程 <b>{a}</b>。',
'Copiar matéria para outro ano letivo':'把科目复制到另一个学年',
'Colar matéria':'粘贴科目','matéria':'科目','(cópia)':'（副本）',
'Matéria <b>{m}</b> copiada com {n} série(s). Troque de ano letivo e toque em <b>Colar matéria</b>.':'已复制科目 <b>{m}</b>（含 {n} 个年级）。请切换学年并点击<b>粘贴科目</b>。',
'Matéria <b>{m}</b> colada com {n} série(s).':'已粘贴科目 <b>{m}</b>（含 {n} 个年级）。',
'Limite de {n} documentos por vídeo.':'每个视频最多 {n} 个文档。',
'Limite de {n} documentos por vídeo — os demais não foram importados.':'每个视频最多 {n} 个文档 — 其余未导入。',
'"{f}" passa de {n} MB e não foi importado.':'“{f}” 超过 {n} MB，未导入。',
'Não foi possível guardar o arquivo neste navegador.':'无法在此浏览器中保存文件。',
'Arquivo não encontrado no armazenamento deste navegador.':'在此浏览器的存储中找不到该文件。',
'Permita pop-ups para visualizar o arquivo.':'请允许弹出窗口以查看文件。',
'Não foi possível abrir o arquivo.':'无法打开文件。',
'Permita pop-ups para exportar em PDF.':'请允许弹出窗口以导出 PDF。',
'Permita pop-ups para gerar o PDF.':'请允许弹出窗口以生成 PDF。',
'Link do YouTube reconhecido — buscando título…':'已识别 YouTube 链接 — 正在获取标题……',
'Link detectado.':'已检测到链接。','Link cadastrado':'链接已保存',
'Título obtido. Preencha a duração se necessário.':'已获取标题。如有需要请填写时长。',
'{n}/9000 caracteres':'{n}/9000 字符',
'Material didático e documentos ({n})':'教学材料与文档（{n}）',
'Vídeo sem nome':'未命名视频','(Sem resumo preenchido)':'（未填写摘要）',
'Material didático':'教学材料','Documentos anexados':'附件文档',
'Matéria':'科目','Serie':'年级','Aula':'课程','Cap.':'章节','Título do vídeo':'视频标题','Link':'链接',
'Sem capítulos.':'无章节。','Sem vídeos.':'无视频。',
'Resumo disponível ({n} caracteres)':'已有摘要（{n} 字符）','Obs.:':'备注：',
'Relatório — {d}':'报告 — {d}','Série única':'单一年级','duração total':'总时长','gerado em':'生成日期',
'Aula {n}':'第 {n} 课','Novo vídeo — {c}':'新视频 — {c}','Editar V{v} — {c}':'编辑 V{v} — {c}',
'Nova série/ano — {m}':'新年级 — {m}',
'{n} aulas':'{n} 节课','{n} capítulos':'{n} 章','{n} vídeos':'{n} 个视频',
'Criar novo projeto (ano letivo)':'新建项目（学年）',
'Excluir o projeto "{p}" com TODAS as matérias, aulas e documentos dele? Você terá alguns segundos para desfazer.':'删除项目“{p}”及其全部科目、课程和文档？删除后有几秒钟可以撤销。',
'Tem certeza? Se quiser guardar uma cópia, cancele e use antes o botão de exportar (seta para baixo).':'确定吗？如需保留副本，请先取消并使用导出按钮（向下箭头）。',
'Este é o único projeto. Crie outro antes de excluir este.':'这是唯一的项目。请先创建另一个项目，再删除这个。',
'Sem espaço no navegador para criar o projeto.':'浏览器存储空间不足，无法创建项目。',
'Sem espaço no navegador para importar este projeto.':'浏览器存储空间不足，无法导入此项目。',
'Arquivo inválido.':'文件无效。',
'Este arquivo não é um backup do Organizador de Aulas Prometeu.':'该文件不是“课程管理器 普罗米修斯”的备份。',
'Ano letivo {a}':'{a} 学年',
'<b>Projeto ativo:</b> {p}.':'<b>当前项目：</b>{p}。',
'<b>Projeto {a} criado e em uso.</b> O anterior ficou arquivado — troque quando quiser em ☰ → Gerenciar projetos.':'<b>项目 {a} 已创建并启用。</b>之前的项目已归档 — 可随时在 ☰ → 管理项目中切换。',
'<b>Backup exportado!</b> “{a}” foi baixado neste aparelho — no iPhone/iPad, escolha <b>“Salvar em Arquivos”</b>. Guarde uma cópia em local seguro (Drive, pen-drive…).':'<b>备份已导出！</b>“{a}”已下载到本设备——在 iPhone/iPad 上，请选择<b>“存储到文件”</b>。请另外保存一份在安全的地方（云盘、U 盘……）。',
'<b>Projeto importado</b> e colocado em uso.':'<b>项目已导入</b>并启用。',
'<b>Vídeo duplicado nesta série:</b> mesmo nome e link já existem na <b>Aula {a}</b> · {c}.':'<b>本年级中存在重复视频：</b>相同的名称和链接已存在于<b>第 {a} 课</b> · {c}。',
'Esta cópia roda como arquivo único: para atualizar, substitua o prometeu.html por uma versão mais nova. Seus dados não se perdem.':'此副本以单文件方式运行：更新时用新版本替换 prometeu.html 即可。数据不会丢失。',
'Verificação concluída. Se houver versão nova, feche e reabra o app para aplicar.':'检查完成。如有新版本，关闭并重新打开应用即可生效。',
'O app ainda não está instalado como PWA neste navegador.':'应用尚未在此浏览器中安装为 PWA。',
'Não foi possível verificar agora (sem internet?).':'目前无法检查（没有网络？）。',
'Verificar atualização agora':'立即检查更新',
'Versão {v} · {d}':'版本 {v} · {d}','julho de 2026':'2026 年 7 月','agosto de 2026':'2026 年 8 月',
'App 100% offline: os dados ficam guardados neste navegador/aparelho — nada é enviado para a internet.':'应用 100% 离线运行：数据仅保存在此浏览器/设备中 — 不会发送到互联网。',
'Projetos guardados:':'已保存的项目：','Matérias no projeto atual:':'当前项目中的科目：',
'O app funciona sem internet; uma atualização só chega quando você recebe uma <b>versão nova</b> do arquivo ou do site.':'应用无需网络即可使用；只有当你收到文件或网站的<b>新版本</b>时才会更新。',
'<b>Versão instalada como app (PWA):</b> toque em “Verificar atualização agora”. Se houver versão nova no site, ela é baixada e aplicada ao fechar e reabrir o app.':'<b>已安装为应用 (PWA)：</b>点击“立即检查更新”。如网站有新版本，将自动下载，关闭并重新打开应用后生效。',
'<b>Versão em arquivo único (prometeu.html):</b> basta substituir o arquivo antigo pelo novo. Os dados <b>não se perdem</b> — eles ficam no navegador, não dentro do arquivo.':'<b>单文件版本 (prometeu.html)：</b>用新文件替换旧文件即可。数据<b>不会丢失</b> — 它保存在浏览器中，而不在文件里。',
'<b>Dica:</b> antes de atualizar, exporte um backup (☰ → Arquivo → Exportar backup).':'<b>提示：</b>更新前请先导出备份（☰ → 文件 → 导出备份）。',
'Leia antes de começar':'开始前请先阅读',
'Leia a Política de Privacidade e os Termos de Uso antes de usar o app. Toque nos botões abaixo para abrir cada documento.':'使用本应用前，请阅读《隐私政策》和《使用条款》。点击下方按钮可打开各项文件。',
'Em resumo: seus dados ficam somente neste aparelho — o app não coleta, não envia e não compartilha nada pela internet.':'简而言之：你的数据仅保存在此设备上 — 本应用不收集、不发送，也不通过互联网分享任何内容。',
'Ler a Política de Privacidade':'阅读《隐私政策》','Ler os Termos de Uso':'阅读《使用条款》',
'Li e aceito':'我已阅读并接受','Recusar':'拒绝',
'Sem o aceite não dá para continuar':'未同意则无法继续',
'Você recusou os Termos de Uso e a Política de Privacidade. Sem essa concordância o app não pode ser usado. Nada foi gravado neste aparelho.':'你已拒绝《使用条款》和《隐私政策》。未表示同意就无法使用本应用。本设备上没有保存任何内容。',
'Se quiser reler antes de decidir, use “Voltar e ler de novo”.':'如果想在决定前再看一遍，请使用“返回重新阅读”。',
'Voltar e ler de novo':'返回重新阅读','Sair do app':'退出应用',
'Se a janela não fechar sozinha, feche o app pelo botão do aparelho ou feche esta aba do navegador.':'如果窗口没有自动关闭，请用设备的按键关闭应用，或关闭此浏览器标签页。',
'Tutorial rápido?':'快速教程？',
'Quer ver uma demonstração rápida de como o app funciona? O app navega sozinho mostrando cada função.':'想快速看看应用如何使用吗？应用会自动浏览并展示每个功能。',
'Você pode revê-la quando quiser em ☰ → Modo demonstração.':'你可以随时在 ☰ → 演示模式中重新观看。',
'Agora não':'暂不','Ver tutorial':'观看教程',
'Termos de Uso':'使用条款','Política de Privacidade':'隐私政策',
'Ver documento completo (online)':'查看完整文档（在线）',
'Escolha o idioma':'选择语言',
'Ativação':'激活','Ativar / Comprar':'激活 / 购买','Ativar':'激活',
'Versão completa ativada':'完整版已激活',
'Período gratuito: {n} dia(s) restante(s)':'免费期：剩余 {n} 天',
'Você usa tudo livremente. Depois do período, criar conteúdo novo pede ativação — ver e exportar seus dados continua sempre liberado.':'期间可自由使用全部功能。免费期结束后，创建新内容需激活 —— 查看和导出你的数据始终可用。',
'Período gratuito encerrado':'免费期已结束',
'Ative para criar novos conteúdos. Seus dados e as exportações continuam acessíveis.':'激活后即可创建新内容。你的数据和导出功能仍可访问。',
'Como ativar':'如何激活',
'Atenção antes de pagar':'付款前请注意',
'Escolha sempre Pix ou cartão comum':'请务必选择 Pix 或普通银行卡',
'Ver as duas telas do Mercado Pago':'查看 Mercado Pago 的两个页面',
'Esconder as telas':'隐藏页面',
'Assim NÃO — cobra juros':'不要这样——会收利息',
'Assim SIM — valor certo':'这样才对——金额正确',
'Sua compra':'你的订单',
'Juros e IOF':'利息和 IOF 税',
'Total':'合计',
'Use agora e pague depois':'先用后付',
'LINHA DE CRÉDITO':'信用额度',
'Pagar':'支付',
'Cartão de crédito · à vista':'信用卡 · 一次性付清',
'Aqui você pagaria R$ 6,14 a mais, só de juros e IOF.':'这样会多付 6.14 雷亚尔，全是利息和 IOF 税。',
'Valor certo, sem juros. Se perguntarem, dá para continuar sem entrar na conta.':'金额正确，没有利息。如果提示登录，可以选择不登录直接继续。',
'Se o seu aparelho já tem conta do Mercado Pago, a tela pode vir com a “Linha de Crédito” pré-escolhida — ela cobra juros e IOF, e o total fica maior que o anunciado. {b} — dá para continuar como convidado, sem entrar na conta. Essa tela é do Mercado Pago; não temos como removê-la.':'如果你的设备已登录 Mercado Pago，付款页面可能会预先勾选“信用额度”——它会收取利息和 IOF 税，总额高于标价。{b} —— 也可以以访客身份继续，无需登录。该页面属于 Mercado Pago，我们无法移除。',
'Código de ativação (recebido por e-mail)':'激活码（通过电子邮件收到）',
'Cole aqui o código de ativação':'在此粘贴激活码',
'Código inválido. Confira se copiou o código completo do e-mail.':'激活码无效。请确认已从邮件中复制完整的激活码。',
'Cole aqui o código que chegou por e-mail.':'请在此粘贴邮件中收到的激活码。',
'Parece que veio texto junto com o código. Copie só a linha do código.':'似乎连同激活码复制了其他文字。请只复制激活码所在的那一行。',
'Esse código está incompleto: falta o ponto que separa as duas partes dele.':'激活码不完整：缺少分隔两部分的英文句点。',
'O código parece cortado. Copie do começo ao fim, sem deixar nada de fora.':'激活码似乎被截断了。请从头到尾完整复制，不要遗漏。',
'O código não confere. Ele vale só para o e-mail usado na compra.':'激活码不匹配。它只对购买时使用的邮箱有效。',
'<b>Ativado!</b> Obrigado. Licença registrada para {e}.':'<b>已激活！</b>谢谢。许可证已登记给 {e}。',
'Este navegador não suporta a verificação de licença.':'此浏览器不支持许可证验证。',
'LEGAL_PRIV':'<p><b>摘要：</b></p><ul><li>应用 100% 离线运行。你创建的所有内容仅保存在此设备的浏览器中（localStorage/IndexedDB）。</li><li>不收集、不传输、不出售任何个人数据。没有广告、跟踪器或分析工具。</li><li>可选的联网功能：从 YouTube 获取视频标题（仅向 YouTube 发送视频链接）和加载 Google Fonts 字体。两者均为可选——没有它们应用也能正常使用。</li><li>备份文件 (.json) 由你自行创建，保存在你选择的位置。</li><li>要清除全部数据：在应用中删除项目，或在设备设置中清除该网站/应用的数据。</li><li>联系方式：organizadordeaulas.prometeu@gmail.com</li></ul>',
'LEGAL_TERMS':'<p><b>摘要：</b></p><ul><li>个人许可，不可转让，仅限购买者使用。</li><li>未经作者事先书面授权，禁止第三方转售、再分发或进行商业利用。</li><li>应用按“现状”提供；请保留数据备份（☰ → 文件 → 导出备份）。</li><li>你录入的内容（课程、链接、文件）归你所有，由你负责。</li><li>联系方式：organizadordeaulas.prometeu@gmail.com</li></ul>',
'Iniciar demonstração':'开始演示','Parar demonstração':'停止演示','Toque para parar a demonstração':'点击停止演示',
'DEMO_1':'这是课程管理器 普罗米修斯：主屏幕显示自动分组的科目。',
'DEMO_2':'每个科目下是年级。箭头按钮可展开课程树。',
'DEMO_3':'每个年级包含编号的课程，并显示总时长和待授课计数。',
'DEMO_4':'课程内是章节。勾选框标记尚待授课的内容。',
'DEMO_5':'每个章节保存视频，包含链接、摘要、材料和附件文档。',
'DEMO_6':'视频表单可从 YouTube 获取标题，并将摘要导出为 Word/PDF。',
'DEMO_7':'六种视觉主题，包括普罗米修斯科幻 HUD。',
'DEMO_8':'项目可归档整个学年 — 随时切换，并可备份到文件。',
'DEMO_9':'年级报告可将整个结构导出为 Word 或 PDF。',
'DEMO_10':'一切 100% 离线：你的数据绝不离开设备。课程管理器 普罗米修斯。',
'DEMO_MENU':'一切从 ☰ 菜单开始：项目、备份、语言、帮助和完整版激活。',
'Comece por aqui: toque no menu ☰':'从这里开始：点击 ☰ 菜单',
'MATÉRIA':'科目','SÉRIE / ANO':'年级','AULA':'课程','CAPÍTULO':'章节','VÍDEO':'视频',
'ARQUIVADO':'已归档','EM USO ●':'使用中 ●','ORGANIZADOR':'课程','DE AULAS':'管理器','ANOTAÇÕES':'笔记',
'Cap. 01 — caixinha marcada = ● A MINISTRAR':'第 1 章 — 勾选 = ● 待授课',
'Cap. 02 — caixinha vazia = ✓ já ministrado':'第 2 章 — 未勾选 = ✓ 已授课'
}
};

/* ===================== TUTORIAL MULTILÍNGUE =====================
   Os tokens %FIG0%…%FIG4% são substituídos pelas figuras SVG
   definidas em app.js (FIGS). pt-PT usa o tutorial pt-BR (fallback);
   os rótulos internos das figuras são traduzidos pelo translateDOM. */
const TUT_ML={
'en':[
{ic:'ti-book-2',t:'Overview',c:`
<p><b>Lesson Organizer Prometheus</b> sorts your video lessons into 5 levels, from the broadest to the most specific:</p>
%FIG0%
<p>For example: <b>HISTORY</b> → <b>11th grade</b> → <b>Lesson 12 (French Revolution)</b> → <b>Chap. 01</b> → <b>YouTube video</b>.</p>
<p>At the top of every screen, the <b>navigation trail</b> (Home › Subject › Grade › Lesson) tells you where you are — tap any level to go straight back to it.</p>
<p>Everything runs <b>with no internet</b> and is saved on the device by itself, at every change.</p>`},
{ic:'ti-menu-2',t:'The ☰ menu',c:`
<p>The <b>☰</b> button (top-left corner of the home screen) opens the <b>menu</b> — this is where you start using the app. Inside it you will find:</p>
<ul>
<li><b>Current project</b>, with the quick-switch list (up to 7 school years).</li>
<li><b>File:</b> creating and managing projects, and exporting or importing the <b>backup (.json)</b>.</li>
<li><b>Activate / Buy:</b> turning on the full version (in the copy bought from the website).</li>
<li><b>Help:</b> Tutorial, <b>Demo mode</b>, Language, Privacy, Terms of use, Updates and Version.</li>
</ul>
<p>To close the menu, tap the dark area next to it or the <b>✕</b>.</p>`},
{ic:'ti-archive',t:'Projects — school years',c:`
<p>A <b>project</b> holds one complete school year (Year + Institution), with every subject, lesson and document in it.</p>
%FIG1%
<ul>
<li><b>Create:</b> menu ☰ → <b>Create new project</b> → fill in <b>Year</b> and <b>Institution</b>. The new project opens empty and becomes the one in use.</li>
<li><b>Archive:</b> nothing is thrown away — last year's project stays in the list.</li>
<li><b>Switch:</b> tap the school-year bar on the home screen, or open the ☰ menu and tap a project in the list — it becomes the project in use and the <b>Manage projects</b> screen opens. The <b>Manage projects</b> button sits at the very top of the menu.</li>
<li><b>Manage projects:</b> in the list, every year carries four icons — <b>download</b> (exports the backup of that year alone), <b>pencil</b> (edit Year and Institution), <b>copy</b> (duplicates the whole year, with everything inside) and <b>trash</b> (delete).</li>
<li><b>Keep a copy away from the device:</b> use <b>Export backup</b> (Backup section, further down).</li>
</ul>`},
{ic:'ti-books',t:'Subjects and grades',c:`
<p>The home screen lists the <b>subjects</b>. Inside a subject sit the <b>grades/years</b> (e.g. 10th, 11th and 12th grade).</p>
<ul>
<li><b>New subject:</b> the large button at the foot of the home screen.</li>
<li><b>New grade:</b> open the subject and tap <b>New grade/year</b>.</li>
<li><b>Automatic suggestion:</b> when you create a grade, lesson, chapter or project, the app shows the next number in <b>light grey</b> inside the field (e.g. “12th grade” after “11th grade”). To take it, press the <b>→ arrow key</b>; for any other value, just type over it.</li>
<li><b>Copy and paste a grade:</b> the <b>copy</b> icon on the grade card takes the whole grade with it (lessons, chapters, videos and attachments). Open the subject where it should land — in <b>another year/project</b> too — and tap <b>Paste grade</b>.</li>
<li><b>Copy a subject:</b> the <b>copy</b> icon on the subject card takes the whole subject, with all its grades. Switch school year and tap <b>Paste subject</b>; to drop a copy that is waiting, tap the <b>✕</b> beside the Paste button.</li>
<li>On the grade, the button with the <b>little arrow (number of lessons)</b> opens the short tree of lessons.</li>
<li><b>Hours of each grade:</b> the card shows three figures — <b>Total hours</b> (the duration of every video added up), <b>Taught</b> (chapters already ticked off as given) and <b>Not taught</b> (what is still missing). They keep themselves up to date as you mark the chapters.</li>
<li>The <b>report</b> icon on the grade produces a Word/PDF document with the whole structure.</li>
<li>The <b>pencil</b> and <b>trash</b> icons edit and remove each item.</li>
</ul>`},
{ic:'ti-player-play',t:'Lessons and chapters',c:`
<p>Inside the grade are the <b>lessons</b> (numbered for you) and, inside each lesson, the <b>chapters</b>.</p>
%FIG2%
<ul>
<li><b>Copy and paste a lesson:</b> the <b>copy</b> icon on the lesson card takes the whole lesson (chapters, videos and attachments). Open the grade where it should land — it may be in <b>another year/project</b> — and tap the <b>Paste lesson</b> button that appears at the foot of the screen.</li>
<li><b>Move several lessons at once:</b> hold your finger on a lesson for <b>2 seconds</b>, without dragging — every lesson then shows a <b>checkbox</b>. Mark the ones you want and use the bar at the foot of the screen to copy them together into another grade.</li>
<li>The chapter's <b>checkbox</b> keeps track of what is pending: checked = this one still has to be given; empty = already taught. The “● to teach” counters add up to the lesson, the grade and the subject.</li>
<li>The <b>CP1…CP11 chips</b> light up when a chapter has something in it; tapping a lit chip scrolls down to that chapter.</li>
<li><b>Notes:</b> every chapter has a small “Notes” panel (folded by default) for anything you want to jot down — reminders, homework, pages of the book. The ● dot means there is text saved in it.</li>
</ul>`},
{ic:'ti-video-off',t:'Videos',c:`
<p>Inside the chapter, tap <b>Add video</b>. In the form you can fill in:</p>
<ul>
<li>The <b>name</b> of the video (required).</li>
<li><b>YouTube link:</b> as soon as you paste it, the app fills in the <b>name of the video</b> and the <b>duration</b> by itself (internet is needed only at that moment). With no link, the magnifier button looks the video up on YouTube by name.</li>
<li><b>Duration</b> in the small field beside the link (MM:SS or H:MM:SS) — if it is not picked up on its own, type it in; it feeds the totals of the lesson, the grade and the subject.</li>
<li><b>Summary</b> of up to ≈3 pages — it sits in a folded section under the search button; tap it to open. It exports as <b>Word (.doc)</b> or <b>PDF</b>.</li>
<li><b>Automatic draft:</b> whatever you type into this form is kept on its own; if the app closes before you save, it offers to restore everything the next time you open it.</li>
</ul>
<p>In the list, <b>▶</b> opens the video link, and the icons beside the time show whether there is a summary, materials or documents attached.</p>`},
{ic:'ti-paperclip',t:'Teaching materials and documents',c:`
<p>In the video form, the <b>“Teaching materials and documents”</b> section comes folded — tap it to open.</p>
%FIG3%
<ul>
<li><b>Cited materials:</b> a plain list with the <b>title</b> of the book quoted in the video. The <b>magnifier</b> beside each material searches the internet for a <b>free PDF</b> of that book.</li>
<li><b>Attached documents:</b> tap <b>Import a PDF, image, Word file or audio</b> to keep up to <b>10 files per video</b> (<b>100 MB</b> each — a whole book fits) inside the app itself.</li>
<li>Every document has a <b>Title</b> you can edit, plus a <b>thumbnail</b> (photos) or a <b>colored badge</b> (PDF, DOC, audio), so the type is recognizable from a distance.</li>
<li>The <b>eye</b> opens PDFs and images on the spot; Word files are downloaded to open in the device's own editor. If a PDF will not open, try another document — some files come damaged from the source.</li>
<li>The <b>share</b> button sends the document by <b>WhatsApp</b>, e-mail or any other app on the device.</li>
<li>Attachments go into the project's backup and come out in the reports.</li>
</ul>`},
{ic:'ti-undo',t:'Undo, Recycle bin and reordering',c:`
<p>Made a mistake, or deleted something you did not mean to? The app has three safety nets — and it still lets you drag everything around:</p>
<ul>
<li><b>Undo card:</b> when you delete any item (video, chapter, lesson, grade, subject or school year), a card shows up in the <b>top-right corner</b> for 10 seconds — tap <b>Undo</b> and the item comes straight back, with everything inside. If the card goes away, nothing is lost: the item is still in the recycle bin.</li>
<li><b>Recycle bin:</b> after the first deletion, a <b>recycle-bin button with a counter</b> appears in the top bar. It holds the <b>last 10 deletions</b>; tap it and use <b>Restore</b> on whatever you want back. Mind you: the recycle bin is temporary — <b>closing the app empties it</b>.</li>
<li><b>General undo (↩):</b> the <b>↩</b> button beside the recycle bin undoes the <b>last change</b>, whatever it was (an edit, a chapter checkbox, a deletion…), one step at a time, up to 30 times.</li>
<li><b>Reorder by dragging:</b> hold your finger (half a second) on any card — subject, grade, lesson, chapter, video or school year — and drag it up or down to change the order.</li>
</ul>`},
{ic:'ti-palette',t:'Themes',c:`
<p>The button in the top-right corner moves through the 6 themes — your choice is saved:</p>
<ol>
<li><b>Light</b> — beige background, terracotta red.</li>
<li><b>Dark</b> — OLED black with white neon.</li>
<li><b>Prometheus</b> — cyan sci-fi HUD (the app's own signature).</li>
<li><b>P. Red</b> and <b>P. Blue</b> — variations on Prometheus.</li>
<li><b>Sinal Noturno</b> (Night Signal) — night blue with cyan and amber.</li>
</ol>
<p>In the themes of the <b>Prometheus</b> family, every card turns into a <b>3D glass box</b>: touch it and it sways a little, then settles back by itself. (The effect honors the “reduce motion” setting of the device.)</p>`},
{ic:'ti-eye',t:'Text size and zoom',c:`
<p>For anyone who likes bigger letters:</p>
<ul>
<li><b>☰ → Text size:</b> tap <b>A+</b> to make the letters bigger and <b>A−</b> to make them smaller. There are <b>4 sizes</b>, from 100% to 145%, and the choice is saved. Buttons and icons stay where they are, so nothing slips out of place.</li>
<li><b>Pinch zoom:</b> on phones and tablets you can also magnify any screen by moving two fingers apart on it (a pinch).</li>
</ul>`},
{ic:'ti-report',t:'Reports and exports',c:`
<ul>
<li><b>Grade report:</b> the report icon on the grade card → Word or PDF with the lessons, chapters, videos, links, notes, pending items and documents.</li>
<li><b>Video summary:</b> inside the video form → Word or PDF with the text of the summary, the teaching materials and the attachments.</li>
<li>For PDF, the browser opens the print screen: choose <b>“Save as PDF”</b>.</li>
<li><b>On a tablet or phone:</b> save the PDF into <b>internal storage</b> (the Downloads folder). Saving straight onto the <b>memory card</b> can produce a “corrupted file” — that is a limit of Android, not of the app; move the file to the card afterwards, with the Files app.</li>
</ul>`},
{ic:'ti-shield',t:'Backup and data safety',c:`
<p><b>Saving happens on its own.</b> Everything you type is kept automatically, at every change, <b>in the browser of this device</b> — there is no “save” button, and nothing goes out to the internet. If the app is uninstalled, though, or the browser data is cleared, it all goes with it. So, to <b>move to another device</b> or to hold a safety copy, export a backup:</p>
<ul>
<li><b>Export:</b> ☰ → File → <b>Export backup (.json)</b> — produces one file with the whole project, attachments included.</li>
<li><b>Name of the file:</b> <code>prometeu-&lt;year&gt;.json</code> (for instance <b>prometeu-2026.json</b>; if the project has an institution, it goes into the name). This is the file you carry to another device.</li>
<li><b>Where it lands:</b> in the device's <b>Downloads folder</b> — on <b>Windows</b>, “Downloads”; on <b>Android</b>, “Download”; on <b>iPhone/iPad</b>, the <b>Files</b> app → “Downloads”. Copy it to Google Drive, to e-mail or to a USB stick so it is not lost.</li>
<li><b>Import:</b> ☰ → File → <b>Import backup (.json)</b> — on the new device, pick that file and the whole project is built again.</li>
<li>A suggestion: export at the end of every term, and before updating the app.</li>
</ul>`},
{ic:'ti-device-tablet',t:'On a Samsung tablet (Galaxy Tab S)',c:`
<p>The app was adjusted for tablets — full screen, <b>split screen</b> and One UI's <b>pop-up view</b>:</p>
%FIG4%
<ul>
<li><b>Install on an Android phone or tablet:</b> open the site in Chrome → ⋮ menu → <b>“Install app”</b> (or “Add to home screen”). From then on the app opens in a window of its own, with no browser bar.</li>
<li><b>Install on an iPhone or iPad:</b> open the site in <b>Safari</b> → the <b>Share</b> button (a square with an arrow) → <b>“Add to Home Screen”</b>.</li>
<li><b>Install on a computer (Windows):</b> open the site in <b>Edge or Chrome</b> and click the <b>install icon</b> that appears in the address bar — the app becomes a program with an icon in the Start menu.</li>
<li><b>Split screen:</b> tap <b>Recents</b> (the ▯|▯ button, or the gesture), tap the <b>app icon</b> at the top of the card → <b>“Open in split screen view”</b> → choose the second app (YouTube, for example). The divider in the middle sets the size.</li>
<li><b>Pop-up view:</b> in Recents, tap the app icon → <b>“Open in pop-up view”</b> — the app turns into a small floating window on top of another app.</li>
<li>The layout rearranges itself at any window size. In the Notes field, handwriting conversion from the stylus is turned off (use the keyboard), to avoid mistakes.</li>
</ul>`},
{ic:'ti-alert-triangle',t:'Common problems and solutions',c:`
<p>Before you conclude that something is broken, go through this list — most cases have a simple fix:</p>
<ul>
<li><b>“Corrupted file” when saving a PDF or a backup onto the memory card:</b> this is a limit of Android — apps can only write safely into the device's <b>internal storage</b>. Always save into the <b>Downloads</b> folder (internal storage) and then, if you want, move the file to the card with the Files app.</li>
<li><b>The data disappeared:</b> the data lives in the browser of this device. <b>Clearing the browser or site data</b>, or uninstalling the app, erases everything. To prevent it: export the <b>backup (.json)</b> often (☰ → File).</li>
<li><b>The duration of the video did not appear:</b> the automatic detection needs internet at the moment the link is pasted. With no internet, type the duration into the small field beside the link (MM:SS).</li>
<li><b>The app opens with the browser bar on top:</b> the installation did not finish as an app. Install it again from the site (Chrome → ⋮ → <b>“Install app”</b>), or download the up-to-date APK from the Buy page of the site.</li>
<li><b>I paid and the code did not arrive:</b> look in the <b>spam/junk</b> folder. If it is not there, write to the support e-mail (☰ → Activate) telling which e-mail was used in the purchase.</li>
<li><b>The payment screen shows more than the advertised price:</b> Mercado Pago sometimes suggests its “credit line” (with interest). Go back and choose <b>Pix</b> or a normal card — the right amount appears before you confirm.</li>
<li><b>An attached PDF will not open:</b> some files come damaged from the source. Try another document; if the others open, the trouble is in that file, not in the app.</li>
<li><b>The letters look different offline:</b> that is normal — with no network the app uses the system font. Nothing is lost.</li>
</ul>`},
{ic:'ti-help',t:'Updates and version',c:`
<ul>
<li><b>☰ → Help → Updates:</b> explains how to update each version (PWA or single file) and checks whether there is a newer one.</li>
<li><b>☰ → Help → Version:</b> shows the version installed and a summary of the data stored.</li>
</ul>`}
],
'es':[
{ic:'ti-book-2',t:'Visión general',c:`
<p>El <b>Organizador de Clases Prometeo</b> ordena tus clases en vídeo en 5 niveles, de lo más general a lo más concreto:</p>
%FIG0%
<p>Por ejemplo: <b>HISTORIA</b> → <b>2.º de bachillerato</b> → <b>Clase 12 (Revolución Francesa)</b> → <b>Cap. 01</b> → <b>vídeo de YouTube</b>.</p>
<p>Arriba, en cada pantalla, la <b>ruta de navegación</b> (Inicio › Asignatura › Curso › Clase) te dice dónde estás — toca cualquier nivel para volver directamente a él.</p>
<p>Todo funciona <b>sin internet</b> y se guarda solo en el dispositivo, con cada cambio.</p>`},
{ic:'ti-menu-2',t:'El menú ☰',c:`
<p>El botón <b>☰</b> (arriba a la izquierda de la pantalla inicial) abre el <b>menú</b> — es por ahí donde se empieza a usar la app. Dentro están:</p>
<ul>
<li><b>Proyecto en uso</b>, con la lista de cambio rápido (hasta 7 años lectivos).</li>
<li><b>Archivo:</b> crear y gestionar proyectos, y exportar o importar la <b>copia de seguridad (.json)</b>.</li>
<li><b>Activar / Comprar:</b> activar la versión completa (en la copia adquirida en el sitio web).</li>
<li><b>Ayuda:</b> Tutorial, <b>Modo demostración</b>, Idioma, Privacidad, Términos de uso, Actualización y Versión.</li>
</ul>
<p>Para cerrar el menú, toca la zona oscura de al lado o la <b>✕</b>.</p>`},
{ic:'ti-archive',t:'Proyectos — años lectivos',c:`
<p>Cada <b>proyecto</b> guarda un año lectivo completo (Año + Institución), con todas sus asignaturas, clases y documentos.</p>
%FIG1%
<ul>
<li><b>Crear:</b> menú ☰ → <b>Crear nuevo proyecto</b> → rellena <b>Año</b> e <b>Institución</b>. El proyecto nuevo nace vacío y pasa a ser el proyecto en uso.</li>
<li><b>Archivar:</b> no se pierde nada — el año anterior queda guardado en la lista de proyectos.</li>
<li><b>Cambiar:</b> toca la barra del año lectivo, en la pantalla inicial, o abre el menú ☰ y toca el proyecto en la lista — pasa a ser el proyecto en uso y se abre la pantalla <b>Gestionar proyectos</b>. El botón <b>Gestionar proyectos</b> está arriba del todo en el menú.</li>
<li><b>Gestionar proyectos:</b> en la lista, cada año lleva cuatro iconos — <b>descargar</b> (exporta la copia de ese año solo), <b>lápiz</b> (editar Año e Institución), <b>copiar</b> (duplica el año entero, con todo lo que tiene dentro) y <b>papelera</b> (eliminar).</li>
<li><b>Guardar fuera del dispositivo:</b> usa <b>Exportar copia de seguridad</b> (sección Copia de seguridad, más abajo).</li>
</ul>`},
{ic:'ti-books',t:'Asignaturas y cursos',c:`
<p>La pantalla inicial lista las <b>asignaturas</b>. Dentro de una asignatura están los <b>cursos/años</b> (p. ej. 1.º, 2.º y 3.º curso).</p>
<ul>
<li><b>Nueva asignatura:</b> el botón grande al pie de la pantalla inicial.</li>
<li><b>Nuevo curso:</b> abre la asignatura y toca <b>Nuevo curso/año</b>.</li>
<li><b>Sugerencia automática:</b> al crear un curso, una clase, un capítulo o un proyecto, la app muestra el número siguiente en <b>gris claro</b> dentro del campo (p. ej. “3.º curso” después de “2.º curso”). Para aceptarlo, pulsa la <b>tecla de flecha →</b>; para otro valor, escribe encima.</li>
<li><b>Copiar y pegar un curso:</b> el icono de <b>copiar</b> de la tarjeta del curso se lleva el curso entero (clases, capítulos, vídeos y adjuntos). Abre la asignatura donde ha de quedar — también de <b>otro año/proyecto</b> — y toca <b>Pegar curso</b>.</li>
<li><b>Copiar una asignatura:</b> el icono de <b>copiar</b> de la tarjeta de la asignatura se lleva la asignatura entera, con todos sus cursos. Cambia de año lectivo y toca <b>Pegar asignatura</b>; para renunciar a una copia que espera, toca la <b>✕</b> de al lado del botón Pegar.</li>
<li>En el curso, el botón con la <b>flecha pequeña (n.º de clases)</b> abre el árbol resumido de las clases.</li>
<li><b>Horas de cada curso:</b> la tarjeta muestra tres indicadores — <b>Horas totales</b> (la duración de todos los vídeos sumada), <b>Impartidas</b> (capítulos ya marcados como dados) y <b>No impartidas</b> (lo que todavía falta). Se van actualizando solos a medida que marcas los capítulos.</li>
<li>El icono de <b>informe</b> del curso genera un documento Word/PDF con toda la estructura.</li>
<li>Los iconos de <b>lápiz</b> y <b>papelera</b> editan y eliminan cada elemento.</li>
</ul>`},
{ic:'ti-player-play',t:'Clases y capítulos',c:`
<p>Dentro del curso están las <b>clases</b> (numeradas solas) y, dentro de cada clase, los <b>capítulos</b>.</p>
%FIG2%
<ul>
<li><b>Copiar y pegar una clase:</b> el icono de <b>copiar</b> de la tarjeta de la clase se lleva la clase entera (capítulos, vídeos y adjuntos). Abre el curso donde ha de quedar — puede ser de <b>otro año/proyecto</b> — y toca el botón <b>Pegar clase</b> que aparece al pie de la pantalla.</li>
<li><b>Llevar varias clases a la vez:</b> mantén el dedo sobre una clase <b>2 segundos</b>, sin arrastrar — cada clase muestra entonces una <b>casilla de selección</b>. Marca las que quieras y usa la barra que aparece al pie para copiarlas juntas a otro curso.</li>
<li>La <b>casilla</b> del capítulo lleva la cuenta de lo pendiente: marcada = aún falta impartirlo; vacía = ya impartido. Los contadores “● por impartir” suman en la clase, en el curso y en la asignatura.</li>
<li>Los <b>chips CP1…CP11</b> se encienden cuando el capítulo tiene algo dentro; al tocar un chip encendido, la pantalla baja hasta ese capítulo.</li>
<li><b>Notas:</b> cada capítulo tiene un panel “Notas” (plegado por defecto) para apuntar lo que quieras — recordatorios, tareas, páginas del libro. El punto ● avisa de que hay texto guardado.</li>
</ul>`},
{ic:'ti-video-off',t:'Vídeos',c:`
<p>Dentro del capítulo, toca <b>Añadir vídeo</b>. En el formulario puedes rellenar:</p>
<ul>
<li>El <b>nombre</b> del vídeo (obligatorio).</li>
<li><b>Enlace de YouTube:</b> en cuanto lo pegas, la app rellena sola el <b>nombre del vídeo</b> y la <b>duración</b> (hace falta internet solo en ese momento). Sin enlace, el botón de la lupa busca el vídeo por nombre en YouTube.</li>
<li><b>Duración</b> en el campo pequeño de al lado del enlace (MM:SS o H:MM:SS) — si no se detecta sola, escríbela a mano; alimenta los totales de la clase, del curso y de la asignatura.</li>
<li><b>Resumen</b> de hasta ≈3 páginas — está en una sección plegada debajo del botón de búsqueda; tócala para abrirla. Se exporta en <b>Word (.doc)</b> o <b>PDF</b>.</li>
<li><b>Borrador automático:</b> lo que escribes en este formulario se guarda solo; si la app se cierra antes de guardar, te ofrece restaurarlo todo la próxima vez que la abras.</li>
</ul>
<p>En la lista, <b>▶</b> abre el enlace del vídeo, y los iconos de al lado del tiempo indican si hay resumen, materiales o documentos adjuntos.</p>`},
{ic:'ti-paperclip',t:'Material didáctico y documentos',c:`
<p>En el formulario del vídeo, la sección <b>“Material didáctico y documentos”</b> viene plegada — tócala para abrirla.</p>
%FIG3%
<ul>
<li><b>Materiales citados:</b> una lista sencilla con el <b>título</b> del libro citado en el vídeo. La <b>lupa</b> de al lado de cada material busca en internet una versión <b>gratuita en PDF</b> de ese libro.</li>
<li><b>Documentos adjuntos:</b> toca <b>Importar PDF, imagen, Word o audio</b> para guardar hasta <b>10 archivos por vídeo</b> (<b>100 MB</b> cada uno — cabe un libro entero) dentro de la propia app.</li>
<li>Cada documento tiene un <b>Título</b> que puedes editar, además de una <b>miniatura</b> (fotos) o un <b>sello de color</b> (PDF, DOC, audio), para reconocer el tipo de lejos.</li>
<li>El <b>ojo</b> abre los PDF y las imágenes al momento; los archivos Word se descargan para abrirlos en el editor del dispositivo. Si un PDF no se abre, prueba con otro documento — algunos archivos vienen dañados de origen.</li>
<li>El botón de <b>compartir</b> envía el documento por <b>WhatsApp</b>, correo o cualquier otra app del dispositivo.</li>
<li>Los adjuntos entran en la copia de seguridad del proyecto y salen en los informes.</li>
</ul>`},
{ic:'ti-undo',t:'Deshacer, Papelera y reordenar',c:`
<p>¿Te equivocaste o borraste algo sin querer? La app tiene tres protecciones — y además te deja arrastrarlo todo de sitio:</p>
<ul>
<li><b>Tarjeta Deshacer:</b> al eliminar cualquier elemento (vídeo, capítulo, clase, curso, asignatura o año lectivo), aparece una tarjeta en la <b>esquina superior derecha</b> durante 10 segundos — toca <b>Deshacer</b> y el elemento vuelve al instante, con todo lo que tenía dentro. Si la tarjeta se va, no se ha perdido nada: el elemento sigue en la papelera.</li>
<li><b>Papelera:</b> después de la primera eliminación, aparece en la barra de arriba un <b>botón de papelera con contador</b>. Guarda las <b>últimas 10 eliminaciones</b>; tócalo y usa <b>Restaurar</b> en lo que quieras recuperar. Atención: la papelera es temporal — <b>cerrar la app la vacía</b>.</li>
<li><b>Deshacer general (↩):</b> el botón <b>↩</b> de al lado de la papelera deshace el <b>último cambio</b>, sea el que sea (una edición, la casilla de un capítulo, una eliminación…), paso a paso, hasta 30 veces.</li>
<li><b>Reordenar arrastrando:</b> mantén el dedo (medio segundo) en cualquier tarjeta — asignatura, curso, clase, capítulo, vídeo o año lectivo — y arrástrala arriba o abajo para cambiar el orden.</li>
</ul>`},
{ic:'ti-palette',t:'Temas',c:`
<p>El botón de la esquina superior derecha va pasando por los 6 temas — tu elección queda guardada:</p>
<ol>
<li><b>Claro</b> — fondo beige, rojo terracota.</li>
<li><b>Oscuro</b> — negro OLED con neón blanco.</li>
<li><b>Prometeo</b> — HUD de ciencia ficción en cian (la firma de la app).</li>
<li><b>P. Rojo</b> y <b>P. Azul</b> — variaciones del Prometeo.</li>
<li><b>Sinal Noturno</b> (Señal Nocturna) — azul nocturno con cian y ámbar.</li>
</ol>
<p>En los temas de la familia <b>Prometeo</b>, cada tarjeta se vuelve una <b>caja de cristal 3D</b>: al tocarla se balancea un poco y vuelve sola a su sitio. (El efecto respeta la opción “reducir movimiento” del dispositivo.)</p>`},
{ic:'ti-eye',t:'Tamaño del texto y zoom',c:`
<p>Para quien prefiere las letras más grandes:</p>
<ul>
<li><b>☰ → Tamaño del texto:</b> toca <b>A+</b> para agrandar las letras y <b>A−</b> para reducirlas. Hay <b>4 tamaños</b>, del 100% al 145%, y la elección queda guardada. Los botones y los iconos siguen en su sitio, así que nada se descoloca.</li>
<li><b>Zoom de pellizco:</b> en móviles y tabletas también puedes ampliar cualquier pantalla separando dos dedos sobre ella (gesto de pellizco).</li>
</ul>`},
{ic:'ti-report',t:'Informes y exportaciones',c:`
<ul>
<li><b>Informe del curso:</b> el icono de informe de la tarjeta del curso → Word o PDF con las clases, los capítulos, los vídeos, los enlaces, las notas, los pendientes y los documentos.</li>
<li><b>Resumen del vídeo:</b> dentro del formulario del vídeo → Word o PDF con el texto del resumen, el material didáctico y los adjuntos.</li>
<li>Para PDF, el navegador abre la pantalla de impresión: elige <b>“Guardar como PDF”</b>.</li>
<li><b>En tablet o móvil:</b> guarda el PDF en la <b>memoria interna</b> (carpeta Descargas). Guardarlo directamente en la <b>tarjeta de memoria</b> puede dar un “archivo dañado” — es un límite de Android, no de la app; mueve el archivo a la tarjeta después, con la app Archivos.</li>
</ul>`},
{ic:'ti-shield',t:'Copia de seguridad y protección de datos',c:`
<p><b>El guardado es automático.</b> Todo lo que escribes se guarda solo, con cada cambio, <b>en el navegador de este dispositivo</b> — no hay botón de “guardar” y nada se envía a internet. Pero si se desinstala la app, o se borran los datos del navegador, todo se va con ellos. Por eso, para <b>pasar a otro dispositivo</b> o tener una copia a salvo, exporta una copia de seguridad:</p>
<ul>
<li><b>Exportar:</b> ☰ → Archivo → <b>Exportar copia de seguridad (.json)</b> — genera un archivo con el proyecto entero, adjuntos incluidos.</li>
<li><b>Nombre del archivo:</b> <code>prometeu-&lt;año&gt;.json</code> (por ejemplo, <b>prometeu-2026.json</b>; si el proyecto tiene institución, entra en el nombre). Es el archivo que llevas a otro dispositivo.</li>
<li><b>Dónde queda:</b> en la <b>carpeta de Descargas</b> del dispositivo — en <b>Windows</b>, “Descargas”; en <b>Android</b>, “Download”; en <b>iPhone/iPad</b>, la app <b>Archivos</b> → “Descargas”. Cópialo a Google Drive, al correo o a un USB para no perderlo.</li>
<li><b>Importar:</b> ☰ → Archivo → <b>Importar copia de seguridad (.json)</b> — en el dispositivo nuevo, elige ese archivo y el proyecto entero se vuelve a crear.</li>
<li>Una sugerencia: exporta al final de cada trimestre y antes de actualizar la app.</li>
</ul>`},
{ic:'ti-device-tablet',t:'En una tableta Samsung (Galaxy Tab S)',c:`
<p>La app está ajustada para tabletas — pantalla completa, <b>pantalla dividida</b> y <b>vista emergente</b> de One UI:</p>
%FIG4%
<ul>
<li><b>Instalar en un móvil o tablet Android:</b> abre el sitio en Chrome → menú ⋮ → <b>“Instalar aplicación”</b> (o “Añadir a pantalla de inicio”). Desde ese momento la app se abre en su propia ventana, sin la barra del navegador.</li>
<li><b>Instalar en iPhone o iPad:</b> abre el sitio en <b>Safari</b> → el botón <b>Compartir</b> (un cuadrado con una flecha) → <b>“Añadir a pantalla de inicio”</b>.</li>
<li><b>Instalar en el ordenador (Windows):</b> abre el sitio en <b>Edge o Chrome</b> y haz clic en el <b>icono de instalación</b> que aparece en la barra de direcciones — la app se convierte en un programa con icono en el menú Inicio.</li>
<li><b>Pantalla dividida:</b> toca <b>Recientes</b> (el botón ▯|▯, o el gesto), toca el <b>icono de la app</b> en la parte de arriba de la tarjeta → <b>“Abrir en vista de pantalla dividida”</b> → elige la segunda app (YouTube, por ejemplo). La divisoria central ajusta el tamaño.</li>
<li><b>Vista emergente:</b> en Recientes, toca el icono de la app → <b>“Abrir en vista emergente”</b> — la app se vuelve una ventanita flotante sobre otra app.</li>
<li>El diseño se reorganiza solo en cualquier tamaño de ventana. En las Notas, la conversión de la escritura a mano del lápiz queda desactivada (usa el teclado), para evitar errores.</li>
</ul>`},
{ic:'ti-alert-triangle',t:'Problemas comunes y soluciones',c:`
<p>Antes de pensar que algo se ha roto, repasa esta lista — la mayoría de los casos tiene una solución sencilla:</p>
<ul>
<li><b>“Archivo dañado” al guardar un PDF o una copia de seguridad en la tarjeta de memoria:</b> es un límite de Android — las aplicaciones solo escriben con seguridad en el <b>almacenamiento interno</b> del dispositivo. Guarda siempre en la carpeta <b>Descargas</b> (almacenamiento interno) y luego, si quieres, mueve el archivo a la tarjeta con la app Archivos.</li>
<li><b>Los datos desaparecieron:</b> los datos viven en el navegador de este dispositivo. <b>Borrar los datos del navegador o del sitio</b>, o desinstalar la app, lo borra todo. Para prevenirlo: exporta la <b>copia de seguridad (.json)</b> a menudo (☰ → Archivo).</li>
<li><b>La duración del vídeo no apareció:</b> la detección automática necesita internet en el momento de pegar el enlace. Sin internet, escribe la duración a mano en el campo pequeño de al lado del enlace (MM:SS).</li>
<li><b>La app se abre con la barra del navegador arriba:</b> la instalación no terminó como aplicación. Vuelve a instalarla desde el sitio (Chrome → ⋮ → <b>“Instalar aplicación”</b>) o descarga el APK actualizado en la página Comprar del sitio.</li>
<li><b>Pagué y el código no llegó:</b> mira en la carpeta de <b>spam o correo no deseado</b>. Si no está ahí, escribe al correo de soporte (☰ → Activar) indicando el correo que usaste en la compra.</li>
<li><b>La pantalla de pago muestra un importe mayor que el anunciado:</b> Mercado Pago a veces sugiere su “línea de crédito” (con intereses). Vuelve atrás y elige <b>Pix</b> o una tarjeta normal — el importe correcto aparece antes de confirmar.</li>
<li><b>Un PDF adjunto no se abre:</b> algunos archivos vienen dañados de origen. Prueba con otro documento; si los demás se abren, el problema está en ese archivo, no en la app.</li>
<li><b>Las letras se ven distintas sin internet:</b> es normal — sin red, la app usa la fuente del sistema. No se pierde nada.</li>
</ul>`},
{ic:'ti-help',t:'Actualización y versión',c:`
<ul>
<li><b>☰ → Ayuda → Actualización:</b> explica cómo se actualiza cada versión (PWA o archivo único) y comprueba si hay una más nueva.</li>
<li><b>☰ → Ayuda → Versión:</b> muestra qué versión está instalada y un resumen de los datos guardados.</li>
</ul>`}
],
'zh':[
{ic:'ti-book-2',t:'概览',c:`
<p><b>课程管理器 普罗米修斯</b>把你的视频课程分成 5 个层级，从整体到具体：</p>
%FIG0%
<p>例如：<b>历史</b> → <b>高二</b> → <b>第 12 课（法国大革命）</b> → <b>第 1 章</b> → <b>YouTube 视频</b>。</p>
<p>每个屏幕的顶部都有<b>导航路径</b>（首页 › 科目 › 年级 › 课程），告诉你现在在哪里——点击任一层级即可直接回到那里。</p>
<p>一切都<b>无需网络</b>，每次更改都会自动保存在设备上。</p>`},
{ic:'ti-menu-2',t:'☰ 菜单',c:`
<p><b>☰</b> 按钮（主屏幕左上角）打开<b>菜单</b>——使用这个应用就是从这里开始的。里面有：</p>
<ul>
<li><b>当前项目</b>，以及快速切换列表（最多 7 个学年）。</li>
<li><b>文件：</b>新建和管理项目，导出或导入<b>备份 (.json)</b>。</li>
<li><b>激活 / 购买：</b>启用完整版（适用于通过网站购买的版本）。</li>
<li><b>帮助：</b>使用教程、<b>演示模式</b>、语言、隐私、使用条款、更新和版本。</li>
</ul>
<p>要关闭菜单，点击旁边的深色区域或 <b>✕</b>。</p>`},
{ic:'ti-archive',t:'项目 — 学年',c:`
<p>每个<b>项目</b>保存一个完整的学年（年份 + 学校），里面装着全部科目、课程和文档。</p>
%FIG1%
<ul>
<li><b>创建：</b>菜单 ☰ → <b>新建项目</b> → 填写<b>年份</b>和<b>学校</b>。新项目从空白开始，并成为当前使用的项目。</li>
<li><b>归档：</b>什么都不会丢——上一个学年留在项目列表里。</li>
<li><b>切换：</b>点击主屏幕上的学年栏，或者打开 ☰ 菜单再点击列表中的某个项目——它会成为当前项目，并打开<b>管理项目</b>屏幕。<b>管理项目</b>按钮就在菜单最上面。</li>
<li><b>管理项目：</b>列表里每个学年都带四个图标——<b>下载</b>（只导出那个学年的备份）、<b>铅笔</b>（修改年份和学校）、<b>复制</b>（连同里面的一切复制整个学年）和<b>垃圾桶</b>（删除）。</li>
<li><b>保存到设备之外：</b>用<b>导出备份</b>（见下方的备份部分）。</li>
</ul>`},
{ic:'ti-books',t:'科目与年级',c:`
<p>主屏幕列出各个<b>科目</b>。每个科目里面是<b>年级</b>（如高一、高二、高三）。</p>
<ul>
<li><b>新科目：</b>主屏幕底部的大按钮。</li>
<li><b>新年级：</b>打开科目，再点击<b>新年级</b>。</li>
<li><b>自动建议：</b>创建年级、课程、章节或项目时，应用会在输入框里用<b>浅灰色</b>显示下一个编号（例如“高二”之后显示“高三”）。要采用它，就按键盘上的<b>→ 箭头键</b>；要换成别的值，直接输入覆盖。</li>
<li><b>复制和粘贴年级：</b>年级卡片上的<b>复制</b>图标会把整个年级一起带走（课程、章节、视频和附件）。打开要放进去的科目——也可以是<b>另一个学年/项目</b>——再点击<b>粘贴年级</b>。</li>
<li><b>复制科目：</b>科目卡片上的<b>复制</b>图标会把整个科目连同所有年级一起带走。切换到另一个学年，点击<b>粘贴科目</b>；要放弃等着粘贴的副本，点击粘贴按钮旁的 <b>✕</b>。</li>
<li>年级上那个带<b>小箭头（课程数）</b>的按钮会打开课程的简略树状图。</li>
<li><b>每个年级的课时：</b>卡片上有三个数字——<b>总时长</b>（所有视频时长相加）、<b>已授课</b>（已经标记为上过的章节）和<b>未授课</b>（还差的部分）。你勾选章节时，它们会自己更新。</li>
<li>年级上的<b>报告</b>图标会生成一份包含整个结构的 Word/PDF 文档。</li>
<li><b>铅笔</b>和<b>垃圾桶</b>图标分别用来修改和删除。</li>
</ul>`},
{ic:'ti-player-play',t:'课程与章节',c:`
<p>年级里面是<b>课程</b>（编号自动排好），每节课里面是<b>章节</b>。</p>
%FIG2%
<ul>
<li><b>复制和粘贴课程：</b>课程卡片上的<b>复制</b>图标会把整节课一起带走（章节、视频和附件）。打开要放进去的年级——可以是<b>另一个学年/项目</b>——再点击底部出现的<b>粘贴课程</b>按钮。</li>
<li><b>一次搬动多节课：</b>手指按在某节课上<b>2 秒</b>，不要拖动——每节课上都会出现一个<b>勾选框</b>。勾选你要的几节，再用底部出现的操作栏把它们一起复制到另一个年级。</li>
<li>章节的<b>勾选框</b>管着待办状态：勾上 = 这节还没上；空着 = 已经上过。“● 待授课”的计数会汇总到课程、年级和科目。</li>
<li>章节里有内容时，<b>CP1…CP11 圆片</b>就会亮起；点击亮着的圆片，屏幕就滚到那一章。</li>
<li><b>备注：</b>每个章节都有一个默认收起的“备注”面板，想记什么都可以——提醒、作业、教材页码。● 圆点表示里面已经存了文字。</li>
</ul>`},
{ic:'ti-video-off',t:'视频',c:`
<p>在章节里点击<b>添加视频</b>。表单里可以填：</p>
<ul>
<li>视频的<b>名称</b>（必填）。</li>
<li><b>YouTube 链接：</b>一粘贴进去，应用就会自己填好<b>视频名称</b>和<b>时长</b>（只有这一刻需要联网）。没有链接时，放大镜按钮可以按名称在 YouTube 上查找这个视频。</li>
<li><b>时长</b>填在链接旁边的小输入框里（MM:SS 或 H:MM:SS）— 如果没有自动识别出来，就手动填；它会计入课程、年级和科目的总时长。</li>
<li>最多约 3 页的<b>摘要</b>——它在搜索按钮下方的收起区域里，点一下就展开。可以导出成 <b>Word (.doc)</b> 或 <b>PDF</b>。</li>
<li><b>自动草稿：</b>你在这个表单里输入的内容会自己存下来；如果应用在保存之前就关了，下次打开时会问你要不要全部恢复。</li>
</ul>
<p>在列表里，<b>▶</b> 打开视频链接；时间旁边的图标显示有没有摘要、材料或附件。</p>`},
{ic:'ti-paperclip',t:'教学材料与文档',c:`
<p>在视频表单里，<b>“教学材料与文档”</b>这一部分默认是收起的——点一下就展开。</p>
%FIG3%
<ul>
<li><b>引用材料：</b>一份简单的列表，只写视频里提到的书的<b>标题</b>。每条材料旁边的<b>放大镜</b>会上网找这本书的<b>免费 PDF</b> 版本。</li>
<li><b>附件文档：</b>点击<b>导入 PDF、图片、Word 或音频</b>，每个视频最多可以在应用里存 <b>10 个文件</b>（每个最大 <b>100 MB</b>——一整本书也放得下）。</li>
<li>每个文档都有可以修改的<b>标题</b>，还带<b>缩略图</b>（照片）或<b>彩色标识</b>（PDF、DOC、音频），远远一看就知道是什么类型。</li>
<li><b>眼睛</b>图标直接打开 PDF 和图片；Word 文件会先下载，再用设备上的编辑器打开。要是某个 PDF 打不开，换一个文档试试——有些文件本来就是坏的。</li>
<li><b>分享</b>按钮把文档通过 <b>WhatsApp</b>、电子邮件或设备上任何别的应用发出去。</li>
<li>附件会一起进项目的备份，也会出现在报告里。</li>
</ul>`},
{ic:'ti-undo',t:'撤销、回收站与排序',c:`
<p>操作错了，或者不小心删掉了东西？应用有三重保护——而且什么都可以拖着换位置：</p>
<ul>
<li><b>撤销卡片：</b>删除任何内容（视频、章节、课程、年级、科目或学年）时，<b>右上角</b>会出现一张卡片，停留 10 秒——点击<b>撤销</b>，那样东西就连同里面的一切立刻回来。卡片消失了也没关系：东西还在回收站里。</li>
<li><b>回收站：</b>第一次删除之后，顶栏上会出现一个<b>带计数的回收站按钮</b>。它保留<b>最近 10 次</b>删除；点击它，对想找回的内容用<b>恢复</b>。要注意：回收站是临时的——<b>关闭应用就会清空</b>。</li>
<li><b>全局撤销（↩）：</b>回收站旁边的 <b>↩</b> 按钮会撤销<b>最近一次更改</b>，不管是什么（修改、勾选章节、删除…），一步一步地退，最多 30 次。</li>
<li><b>拖动排序：</b>手指按住任意一张卡片（约半秒）——科目、年级、课程、章节、视频或学年——上下拖动就能改顺序。</li>
</ul>`},
{ic:'ti-palette',t:'主题',c:`
<p>右上角的按钮在 6 种主题之间轮换——你的选择会存下来：</p>
<ol>
<li><b>浅色</b>——米色背景，赤陶红。</li>
<li><b>深色</b>——OLED 纯黑配白色霓虹。</li>
<li><b>普罗米修斯</b>——青色科幻 HUD（这个应用的招牌）。</li>
<li><b>普罗米修斯·红</b>和<b>普罗米修斯·蓝</b>——普罗米修斯的两种变体。</li>
<li><b>Sinal Noturno</b>（夜间信号）— 夜蓝底色配青色与琥珀色。</li>
</ol>
<p>在<b>普罗米修斯</b>这一系列主题里，每张卡片都变成一个<b>3D 玻璃盒</b>：点一下它就轻轻晃动，然后自己回到原位。（这个效果会遵守设备上的“减弱动态效果”设置。）</p>`},
{ic:'ti-eye',t:'文字大小与缩放',c:`
<p>喜欢大一点的字的话：</p>
<ul>
<li><b>☰ → 文字大小：</b>点击 <b>A+</b> 把字放大，点击 <b>A−</b> 把字缩小。一共 <b>4 种大小</b>，从 100% 到 145%，选好了会存下来。按钮和图标都留在原来的位置，所以什么都不会错位。</li>
<li><b>双指缩放：</b>在手机和平板上，也可以在任意屏幕上把两根手指张开来放大（捏合手势）。</li>
</ul>`},
{ic:'ti-report',t:'报告与导出',c:`
<ul>
<li><b>年级报告：</b>年级卡片上的报告图标 → Word 或 PDF，里面有课程、章节、视频、链接、备注、待办和文档。</li>
<li><b>视频摘要：</b>在视频表单里面 → Word 或 PDF，里面有摘要的文字、教学材料和附件。</li>
<li>导出 PDF 时，浏览器会打开打印界面：选<b>“另存为 PDF”</b>。</li>
<li><b>在平板或手机上：</b>把 PDF 存到<b>内部存储</b>（下载文件夹）。直接存到<b>存储卡</b>可能会出现“文件已损坏”——这是 Android 的限制，不是应用的问题；之后再用文件管理应用把文件移到存储卡。</li>
</ul>`},
{ic:'ti-shield',t:'备份与数据安全',c:`
<p><b>保存是自动的。</b>你输入的一切，每改一次就自动存在<b>这台设备的浏览器</b>里——没有“保存”按钮，也不会传到网上。不过，卸载应用或者清除浏览器数据，它们就跟着一起走了。所以，要<b>换一台设备</b>或者留一份安全副本，就导出备份：</p>
<ul>
<li><b>导出：</b>☰ → 文件 → <b>导出备份 (.json)</b>——生成一个文件，整个项目都在里面，附件也在。</li>
<li><b>文件名：</b><code>prometeu-&lt;年份&gt;.json</code>（例如 <b>prometeu-2026.json</b>；项目填了学校的话，名字里也会带上）。这就是你带到另一台设备上的文件。</li>
<li><b>它存到哪里：</b>设备的<b>下载文件夹</b>——<b>Windows</b> 上是“下载/Downloads”；<b>Android</b> 上是“Download”；<b>iPhone/iPad</b> 上是<b>文件</b>应用 →“下载”。把它复制到 Google 云端硬盘、邮箱或 U 盘，免得丢掉。</li>
<li><b>导入：</b>☰ → 文件 → <b>导入备份 (.json)</b>——在新设备上选中那个文件，整个项目就重建好了。</li>
<li>一个建议：每学期末导出一次，更新应用之前也导出一次。</li>
</ul>`},
{ic:'ti-device-tablet',t:'在三星平板上（Galaxy Tab S）',c:`
<p>应用已经为平板调整过——全屏、One UI 的<b>分屏</b>和<b>弹窗视图</b>：</p>
%FIG4%
<ul>
<li><b>在 Android 手机或平板上安装：</b>用 Chrome 打开网站 → ⋮ 菜单 → <b>“安装应用”</b>（或“添加到主屏幕”）。此后应用会在自己的窗口里打开，没有浏览器栏。</li>
<li><b>在 iPhone 或 iPad 上安装：</b>用 <b>Safari</b> 打开网站 → <b>分享</b>按钮（带箭头的方块）→ <b>“添加到主屏幕”</b>。</li>
<li><b>在电脑（Windows）上安装：</b>用 <b>Edge 或 Chrome</b> 打开网站，点击地址栏里出现的<b>安装图标</b>——应用就成了一个程序，在开始菜单里有图标。</li>
<li><b>分屏：</b>点击<b>最近任务</b>（▯|▯ 按钮，或者用手势），点击卡片顶部的<b>应用图标</b> → <b>“在分屏视图中打开”</b> → 选第二个应用（比如 YouTube）。中间的分隔线可以调整大小。</li>
<li><b>弹窗视图：</b>在最近任务里点击应用图标 → <b>“在弹窗视图中打开”</b>——应用就变成悬浮在别的应用上面的小窗口。</li>
<li>不管窗口多大，布局都会自己重排。在“备注”栏里，手写笔的手写转文字功能是关掉的（请用键盘），以免转换出错。</li>
</ul>`},
{ic:'ti-alert-triangle',t:'常见问题与解决办法',c:`
<p>在断定出了故障之前，先看看这份清单——大多数情况都有简单的解决办法：</p>
<ul>
<li><b>把 PDF 或备份存到存储卡时提示“文件已损坏”：</b>这是 Android 的限制——应用只能稳妥地写入设备的<b>内部存储</b>。请一律存到<b>下载（Downloads）</b>文件夹（内部存储），之后需要的话，再用文件管理应用把文件移到存储卡。</li>
<li><b>数据不见了：</b>数据就住在这台设备的浏览器里。<b>清除浏览器或网站的数据</b>，或者卸载应用，都会把一切删掉。预防的办法：经常导出<b>备份（.json）</b>（☰ → 文件）。</li>
<li><b>视频时长没出来：</b>自动识别需要在粘贴链接的那一刻联网。没有网络时，请在链接旁边的小输入框里手动填时长（MM:SS）。</li>
<li><b>应用上方出现了浏览器地址栏：</b>说明安装没有以应用的方式完成。请从网站重新安装（Chrome → ⋮ → <b>“安装应用”</b>），或者在网站的购买页下载最新的 APK。</li>
<li><b>付了款，激活码没来：</b>先看<b>垃圾邮件</b>文件夹。要是也不在那里，就写信给支持邮箱（☰ → 激活），说明购买时用的是哪个邮箱。</li>
<li><b>付款页面的金额比宣传的高：</b>Mercado Pago 有时会推荐它的“信用额度”（要付利息）。请返回，改选 <b>Pix</b> 或普通银行卡——确认之前就会显示正确的金额。</li>
<li><b>附件里的 PDF 打不开：</b>有些文件本来就是坏的。换一个文档试试；如果别的都能打开，问题就在那个文件上，不在应用上。</li>
<li><b>离线时字体变了样：</b>这是正常的——没有网络时应用会改用系统字体，什么都不会丢。</li>
</ul>`},
{ic:'ti-help',t:'更新与版本',c:`
<ul>
<li><b>☰ → 帮助 → 更新：</b>说明每种版本（PWA 或单文件）怎么更新，并检查有没有新版本。</li>
<li><b>☰ → 帮助 → 版本：</b>显示装的是哪个版本，以及已存数据的概要。</li>
</ul>`}
]
};
