import React, { useState, useRef, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Upload, 
  Trash2, 
  Move, 
  Maximize2, 
  CheckCircle2,
  AlertCircle,
  Plus,
  Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CHECKLIST_DATA, ChecklistItem } from './constants';
import { cn } from './lib/utils';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// --- Types ---

type Selection = 'SIM' | 'NÃO' | 'NÃO SE APLICA' | null;

interface FormData {
  dataInicio: string;
  dataFim: string;
  ciclo: string;
  endereco: string;
  ra: string;
  instrutor: string;
  equipamento: string;
  alunosMatutino: string;
  alunosVespertino: string;
  observacoes: string;
  respostas: Record<string, Selection>;
}

interface Signature {
  id: string;
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
}

// --- Components ---

export default function App() {
  const [formData, setFormData] = useState<FormData>({
    dataInicio: '',
    dataFim: '',
    ciclo: '',
    endereco: '',
    ra: '',
    instrutor: '',
    equipamento: '',
    alunosMatutino: '',
    alunosVespertino: '',
    observacoes: '',
    respostas: {
      'reg_1': 'SIM',
      'reg_2': 'SIM',
      'reg_3': 'SIM',
      'reg_4': 'SIM',
      'reg_5': 'SIM',
      'reg_6': 'SIM',
    },
  });

  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeSignature, setActiveSignature] = useState<string | null>(null);
  const pdfRef = useRef<HTMLDivElement>(null);

  // Sync Data Fim to Footer
  const formattedDate = formData.dataFim ? (() => {
    const [year, month, day] = formData.dataFim.split('-');
    return { day, month, year };
  })() : { day: '___', month: '___', year: '_____' };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleResponseChange = (id: string, value: Selection) => {
    setFormData(prev => ({
      ...prev,
      respostas: { ...prev.respostas, [id]: value }
    }));
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>, label: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newSig: Signature = {
          id: Math.random().toString(36).substr(2, 9),
          url: event.target?.result as string,
          x: 50,
          y: 850, // Default position near bottom
          width: 150,
          height: 60,
          label
        };
        setSignatures(prev => [...prev, newSig]);
      };
      reader.readAsDataURL(file);
    }
  };

  const updateSignature = (id: string, updates: Partial<Signature>) => {
    setSignatures(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const removeSignature = (id: string) => {
    setSignatures(prev => prev.filter(s => s.id !== id));
  };

  const generatePDF = async () => {
    console.log('Iniciando geração de PDF...');
    if (!pdfRef.current) {
      console.error('pdfRef.current não encontrado');
      return;
    }
    setIsGenerating(true);
    
    try {
      // 1. Garantir que todas as imagens dentro do elemento estão carregadas
      const images = Array.from(pdfRef.current.querySelectorAll('img')) as HTMLImageElement[];
      await Promise.all(images.map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      }));

      // 2. Preparar o elemento para captura
      const originalTransform = pdfRef.current.style.transform;
      const originalTransition = pdfRef.current.style.transition;
      const originalPosition = pdfRef.current.style.position;
      const originalZIndex = pdfRef.current.style.zIndex;
      
      pdfRef.current.style.transform = 'none';
      pdfRef.current.style.transition = 'none';
      pdfRef.current.style.position = 'relative';
      pdfRef.current.style.zIndex = '9999';

      await new Promise(resolve => setTimeout(resolve, 500));

      console.log('Capturando canvas com html2canvas...');
      const canvas = await html2canvas(pdfRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        logging: false,
        backgroundColor: '#ffffff',
        scrollX: 0,
        scrollY: -window.scrollY,
        onclone: (clonedDoc) => {
          // 1. Remover todos os links de estilos externos que podem conter oklch e causar erro de parse
          const links = clonedDoc.querySelectorAll('link[rel="stylesheet"]');
          links.forEach(l => l.remove());

          // 2. Remover tags de estilo que contenham oklch
          const styles = clonedDoc.querySelectorAll('style');
          styles.forEach(s => {
            if (s.innerHTML.includes('oklch')) {
              s.remove();
            }
          });

          // 3. Injetar um estilo base simplificado para o PDF no clone
          const style = clonedDoc.createElement('style');
          style.innerHTML = `
            .pdf-page {
              width: 210mm !important;
              background: white !important;
              color: black !important;
              font-family: sans-serif !important;
            }
            .pdf-page * {
              border-color: black !important;
              color: black !important;
              background-color: transparent !important;
            }
            .pdf-page .bg-yellow-400 { background-color: #facc15 !important; }
            .pdf-page .bg-blue-600 { background-color: #2563eb !important; }
            .pdf-page .bg-zinc-100 { background-color: #f4f4f5 !important; }
            .pdf-page .bg-zinc-800 { background-color: #27272a !important; }
            .pdf-page .text-white { color: white !important; }
            .pdf-page .text-blue-700 { color: #1d4ed8 !important; }
            .pdf-page .text-red-600 { color: #dc2626 !important; }
          `;
          clonedDoc.head.appendChild(style);

          const el = clonedDoc.querySelector('.pdf-page') as HTMLElement;
          if (el) {
            el.style.transform = 'none';
            el.style.margin = '0';
            el.style.boxShadow = 'none';
            el.style.overflow = 'visible';
          }
        }
      });
      
      // Restaurar estilos
      pdfRef.current.style.transform = originalTransform;
      pdfRef.current.style.transition = originalTransition;
      pdfRef.current.style.position = originalPosition;
      pdfRef.current.style.zIndex = originalZIndex;

      console.log('Canvas capturado. Gerando PDF...');
      
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      const fileName = `Checklist_SENAI_${formData.equipamento || 'Entrega'}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Erro detalhado ao gerar PDF:', error);
      alert('Erro ao gerar PDF. Tente novamente ou use o Chrome/Edge.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Group items by category
  const categories = Array.from(new Set(CHECKLIST_DATA.map(item => item.category)));

  return (
    <div className="min-h-screen bg-zinc-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* App Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
              <FileText className="text-blue-600" />
              Checklist Digital SENAI
            </h1>
            <p className="text-zinc-500 text-sm">Formulário de Entrega de Equipamento - 2025</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={generatePDF}
              disabled={isGenerating}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-200"
            >
              {isGenerating ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" /> : <Download size={18} />}
              Gerar PDF
            </button>
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Form Controls */}
          <div className="lg:col-span-1 space-y-6">
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200 space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2 border-b pb-3">
                <ImageIcon size={18} className="text-blue-500" />
                Assinaturas
              </h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700">Fiscal da SEDET</label>
                  <div className="relative group">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => handleSignatureUpload(e, 'Fiscal SEDET')}
                      className="hidden" 
                      id="sig-sedet"
                    />
                    <label 
                      htmlFor="sig-sedet"
                      className="flex items-center justify-center gap-2 w-full p-3 border-2 border-dashed border-zinc-200 rounded-xl cursor-pointer group-hover:border-blue-400 group-hover:bg-blue-50 transition-all"
                    >
                      <Plus size={18} className="text-zinc-400 group-hover:text-blue-500" />
                      <span className="text-sm text-zinc-500 group-hover:text-blue-600">Upload Assinatura</span>
                    </label>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700">Supervisão Técnica SENAI</label>
                  <div className="relative group">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => handleSignatureUpload(e, 'Supervisão SENAI')}
                      className="hidden" 
                      id="sig-senai"
                    />
                    <label 
                      htmlFor="sig-senai"
                      className="flex items-center justify-center gap-2 w-full p-3 border-2 border-dashed border-zinc-200 rounded-xl cursor-pointer group-hover:border-blue-400 group-hover:bg-blue-50 transition-all"
                    >
                      <Plus size={18} className="text-zinc-400 group-hover:text-blue-500" />
                      <span className="text-sm text-zinc-500 group-hover:text-blue-600">Upload Assinatura</span>
                    </label>
                  </div>
                </div>
              </div>

              {signatures.length > 0 && (
                <div className="mt-6 pt-6 border-t space-y-3">
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Assinaturas Ativas</p>
                  {signatures.map(sig => (
                    <div key={sig.id} className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                      <span className="text-sm font-medium text-zinc-700 truncate">{sig.label}</span>
                      <button 
                        onClick={() => removeSignature(sig.id)}
                        className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="bg-blue-50 p-6 rounded-2xl border border-blue-100 space-y-3">
              <div className="flex items-center gap-2 text-blue-700 font-semibold">
                <AlertCircle size={18} />
                Instruções
              </div>
              <ul className="text-sm text-blue-600/80 space-y-2 list-disc pl-4">
                <li>Preencha todos os campos do cabeçalho.</li>
                <li>Marque uma opção para cada item da lista.</li>
                <li>Use o campo de observações para detalhes extras.</li>
                <li>Arraste as assinaturas no preview para posicioná-las.</li>
              </ul>
            </section>
          </div>

          {/* PDF Preview / Editor */}
          <div className="lg:col-span-2">
            <div className="overflow-x-auto pb-8">
              <div 
                ref={pdfRef}
                className="pdf-page shadow-2xl origin-top scale-[0.8] sm:scale-100"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                {/* Header Logos */}
                <div className="flex justify-between items-start mb-8">
                  <div className="flex items-center gap-2 min-w-[100px]">
                    <img 
                      src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/SENAI_Logo.svg/512px-SENAI_Logo.svg.png" 
                      alt="SENAI" 
                      className="h-10 object-contain"
                      referrerPolicy="no-referrer"
                      crossOrigin="anonymous"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          const span = document.createElement('span');
                          span.innerText = 'SENAI';
                          span.className = 'font-bold text-blue-700 text-xl';
                          parent.appendChild(span);
                        }
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-2 min-w-[120px] justify-end">
                        <img 
                          src="https://www.agenciabrasilia.df.gov.br/wp-content/uploads/2019/01/logo_gdf.png" 
                          alt="GDF" 
                          className="h-8 object-contain"
                          referrerPolicy="no-referrer"
                          crossOrigin="anonymous"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const parent = e.currentTarget.parentElement;
                            if (parent) {
                              const span = document.createElement('span');
                              span.innerText = 'GDF';
                              span.className = 'font-bold text-blue-900 text-lg';
                              parent.appendChild(span);
                            }
                          }}
                        />
                        <div className="h-8 w-px bg-zinc-300 mx-1" />
                        <div className="text-[10px] font-bold text-blue-900 leading-tight uppercase">
                          RENOVA<span className="text-orange-500">DF</span><br/>
                          <span className="text-[8px] font-normal text-zinc-500">Secretaria de Trabalho</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <h2 className="text-center font-bold text-xl mb-6 uppercase tracking-widest border-b-2 border-zinc-900 pb-2">
                  Formulário de Entrega
                </h2>

                {/* Dynamic Header Table */}
                <div className="grid grid-cols-12 border-2 border-zinc-900 mb-6 text-xs">
                  <div className="col-span-4 border-r border-b border-zinc-900 p-2">
                    <label className="block font-bold mb-1">Data Início:</label>
                    <input 
                      type="date" 
                      name="dataInicio"
                      value={formData.dataInicio}
                      onChange={handleInputChange}
                      className="w-full bg-transparent outline-none"
                    />
                  </div>
                  <div className="col-span-4 border-r border-b border-zinc-900 p-2">
                    <label className="block font-bold mb-1">Data Fim:</label>
                    <input 
                      type="date" 
                      name="dataFim"
                      value={formData.dataFim}
                      onChange={handleInputChange}
                      className="w-full bg-transparent outline-none"
                    />
                  </div>
                  <div className="col-span-4 border-b border-zinc-900 p-2">
                    <label className="block font-bold mb-1">Ciclo:</label>
                    <input 
                      type="text" 
                      name="ciclo"
                      value={formData.ciclo}
                      onChange={handleInputChange}
                      className="w-full bg-transparent outline-none"
                    />
                  </div>
                  <div className="col-span-8 border-r border-b border-zinc-900 p-2">
                    <label className="block font-bold mb-1">Endereço:</label>
                    <input 
                      type="text" 
                      name="endereco"
                      value={formData.endereco}
                      onChange={handleInputChange}
                      className="w-full bg-transparent outline-none"
                    />
                  </div>
                  <div className="col-span-4 border-b border-zinc-900 p-2">
                    <label className="block font-bold mb-1">RA:</label>
                    <input 
                      type="text" 
                      name="ra"
                      value={formData.ra}
                      onChange={handleInputChange}
                      className="w-full bg-transparent outline-none"
                    />
                  </div>
                  <div className="col-span-6 border-r border-b border-zinc-900 p-2">
                    <label className="block font-bold mb-1">Instrutor:</label>
                    <input 
                      type="text" 
                      name="instrutor"
                      value={formData.instrutor}
                      onChange={handleInputChange}
                      className="w-full bg-transparent outline-none"
                    />
                  </div>
                  <div className="col-span-6 border-b border-zinc-900 p-2">
                    <label className="block font-bold mb-1">Equipamento:</label>
                    <input 
                      type="text" 
                      name="equipamento"
                      value={formData.equipamento}
                      onChange={handleInputChange}
                      className="w-full bg-transparent outline-none"
                    />
                  </div>
                  <div className="col-span-12 p-2 flex items-center gap-4">
                    <span className="font-bold">Quantidade de alunos envolvidos na recuperação:</span>
                    <div className="flex items-center gap-2">
                      <label className="font-bold">Matutino</label>
                      <input 
                        type="text" 
                        name="alunosMatutino"
                        value={formData.alunosMatutino}
                        onChange={handleInputChange}
                        className="w-12 border-b border-zinc-900 text-center outline-none bg-transparent"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="font-bold">Vespertino</label>
                      <input 
                        type="text" 
                        name="alunosVespertino"
                        value={formData.alunosVespertino}
                        onChange={handleInputChange}
                        className="w-12 border-b border-zinc-900 text-center outline-none bg-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Checklist Table */}
                <div className="border-2 border-zinc-900 text-[10px]">
                  <div className="grid grid-cols-12 bg-yellow-400 font-bold border-b border-zinc-900">
                    <div className="col-span-8 p-2 border-r border-zinc-900 uppercase">Descrição das Atividades Executadas</div>
                    <div className="col-span-1 p-2 border-r border-zinc-900 text-center text-blue-700">SIM</div>
                    <div className="col-span-1 p-2 border-r border-zinc-900 text-center text-red-600">NÃO</div>
                    <div className="col-span-2 p-2 text-center text-blue-700">NÃO SE APLICA</div>
                  </div>

                  {categories.map((cat) => (
                    <React.Fragment key={cat}>
                      <div className="bg-zinc-100 font-bold p-1 text-center border-b border-zinc-900 uppercase tracking-wider">
                        {cat}
                      </div>
                      {CHECKLIST_DATA.filter(item => item.category === cat).map((item) => (
                        <div key={item.id} className="grid grid-cols-12 border-b border-zinc-900 last:border-b-0">
                          <div className="col-span-8 p-1.5 border-r border-zinc-900 flex items-center">
                            {item.text}
                          </div>
                          <div className="col-span-1 border-r border-zinc-900 flex items-center justify-center cursor-pointer hover:bg-zinc-50" onClick={() => handleResponseChange(item.id, 'SIM')}>
                            <div className={cn("w-4 h-4 border border-zinc-900 flex items-center justify-center", formData.respostas[item.id] === 'SIM' && "bg-zinc-800")}>
                              {formData.respostas[item.id] === 'SIM' && <div className="w-2 h-2 bg-white" />}
                            </div>
                          </div>
                          <div className="col-span-1 border-r border-zinc-900 flex items-center justify-center cursor-pointer hover:bg-zinc-50" onClick={() => handleResponseChange(item.id, 'NÃO')}>
                            <div className={cn("w-4 h-4 border border-zinc-900 flex items-center justify-center", formData.respostas[item.id] === 'NÃO' && "bg-zinc-800")}>
                              {formData.respostas[item.id] === 'NÃO' && <div className="w-2 h-2 bg-white" />}
                            </div>
                          </div>
                          <div className="col-span-2 flex items-center justify-center cursor-pointer hover:bg-zinc-50" onClick={() => handleResponseChange(item.id, 'NÃO SE APLICA')}>
                            <div className={cn("w-4 h-4 border border-zinc-900 flex items-center justify-center", formData.respostas[item.id] === 'NÃO SE APLICA' && "bg-zinc-800")}>
                              {formData.respostas[item.id] === 'NÃO SE APLICA' && <div className="w-2 h-2 bg-white" />}
                            </div>
                          </div>
                        </div>
                      ))}
                    </React.Fragment>
                  ))}
                </div>

                {/* Page 2 Start (Simulated in same container for easy PDF gen) */}
                <div className="mt-12 pt-8 border-t-2 border-dashed border-zinc-300 relative">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white px-4 text-[10px] text-zinc-400 font-mono">PÁGINA 2</div>
                  
                  <div className="border-2 border-zinc-900 mb-8">
                    <div className="bg-blue-600 text-white font-bold p-1 text-center uppercase tracking-wider text-xs">
                      Observações
                    </div>
                    <textarea 
                      name="observacoes"
                      value={formData.observacoes}
                      onChange={handleInputChange}
                      className="w-full h-64 p-4 outline-none resize-none text-xs leading-relaxed"
                      placeholder="Espaço para anotações adicionais..."
                    />
                  </div>

                  {/* Footer Data */}
                  <div className="flex justify-center mb-16 text-sm">
                    <p>Data: <span className="font-bold">{formattedDate.day}</span> de <span className="font-bold">{formattedDate.month}</span> de <span className="font-bold">{formattedDate.year}</span>.</p>
                  </div>

                  {/* Signature Lines */}
                  <div className="space-y-12 mt-20">
                    <div className="relative">
                      <div className="border-t border-zinc-900 w-full max-w-md mx-auto" />
                      <p className="text-center text-xs font-bold mt-2">Assinatura fiscal da SEDET:</p>
                    </div>
                    <div className="relative">
                      <div className="border-t border-zinc-900 w-full max-w-md mx-auto" />
                      <p className="text-center text-xs font-bold mt-2">Assinatura Supervisão Técnica SENAI:</p>
                    </div>
                  </div>

                  {/* Institutional Footer */}
                  <footer className="mt-24 pt-4 border-t border-blue-200 grid grid-cols-3 text-[9px] text-blue-800">
                    <div>
                      <p className="font-bold">SENAI</p>
                      <p>Serviço Nacional de Aprendizagem Industrial</p>
                    </div>
                    <div className="text-center">
                      <p>Edifício-sede: SIA Trecho 3, Lote 225</p>
                      <p>CEP: 71200-030 - Brasília - DF</p>
                    </div>
                    <div className="text-right">
                      <p>Tel (61) 3362-6000</p>
                      <p>sistemafibra.org.br/senai</p>
                    </div>
                  </footer>
                </div>

                {/* Draggable Signatures Overlay */}
                <AnimatePresence>
                  {signatures.map((sig) => (
                    <motion.div
                      key={sig.id}
                      drag
                      dragMomentum={false}
                      onDragEnd={(_, info) => {
                        // This is a simplified positioning. 
                        // In a real app, we'd calculate relative to the container.
                        // For this demo, we'll just let motion handle the visual drag.
                      }}
                      className={cn(
                        "absolute cursor-move group z-50",
                        activeSignature === sig.id && "ring-2 ring-blue-500 ring-offset-2"
                      )}
                      style={{ 
                        left: sig.x, 
                        top: sig.y, 
                        width: sig.width, 
                        height: sig.height 
                      }}
                      onMouseDown={() => setActiveSignature(sig.id)}
                    >
                      <img 
                        src={sig.url} 
                        alt="Assinatura" 
                        className="w-full h-full object-contain pointer-events-none"
                      />
                      <div className="absolute -top-6 left-0 bg-blue-600 text-white text-[8px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {sig.label}
                      </div>
                      
                      {/* Resize Handle */}
                      <button 
                        className="absolute -bottom-2 -right-2 bg-white border border-zinc-300 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          const startX = e.clientX;
                          const startWidth = sig.width;
                          
                          const onMouseMove = (moveEvent: MouseEvent) => {
                            const delta = moveEvent.clientX - startX;
                            updateSignature(sig.id, { 
                              width: Math.max(50, startWidth + delta),
                              height: Math.max(20, (startWidth + delta) * (sig.height / sig.width))
                            });
                          };
                          
                          const onMouseUp = () => {
                            document.removeEventListener('mousemove', onMouseMove);
                            document.removeEventListener('mouseup', onMouseUp);
                          };
                          
                          document.addEventListener('mousemove', onMouseMove);
                          document.addEventListener('mouseup', onMouseUp);
                        }}
                      >
                        <Maximize2 size={10} className="text-zinc-600" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Toast / Feedback */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-zinc-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 z-[100]"
          >
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white" />
            <span className="font-medium">Gerando documento A4...</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
