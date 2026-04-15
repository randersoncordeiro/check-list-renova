import React, { useState, useRef, useEffect } from 'react';
import { 
  FileText, 
  Upload, 
  Trash2, 
  Move, 
  Maximize2, 
  CheckCircle2,
  AlertCircle,
  Plus,
  Printer,
  Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CHECKLIST_DATA, ChecklistItem } from './constants';
import { cn } from './lib/utils';

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

const HeaderLogos = () => (
  <div className="relative w-full pt-6">
    {/* Header Ribbons */}
    <div className="absolute top-0 right-0 w-[45%] h-5 sm:h-6 flex justify-end no-print-adjust" style={{ pointerEvents: 'none' }}>
      <div className="bg-[#244b9b] h-full w-[85%] relative" style={{ clipPath: 'polygon(15px 0, 100% 0, 100% 100%, 0 100%)' }}></div>
      <div className="bg-[#ef5a24] h-full w-[10%] ml-1 sm:ml-2 relative" style={{ clipPath: 'polygon(15px 0, 100% 0, 100% 100%, 0 100%)' }}></div>
    </div>

    {/* Header Logos */}
    <div className="flex justify-between items-end mb-6 mt-2 relative z-10">
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
              span.className = 'font-bold text-[#1b4596] text-3xl italic tracking-tighter';
              parent.appendChild(span);
            }
          }}
        />
      </div>
      <div className="flex items-center gap-3 pr-2">
        <div className="flex items-center gap-3 min-w-[120px] justify-end">
          <div className="bg-[#0b65ab] py-1 px-2 rounded-[2px] flex items-center justify-center">
            <img 
              src="https://www.agenciabrasilia.df.gov.br/wp-content/uploads/2019/01/logo_gdf.png" 
              alt="GDF" 
              className="h-6 object-contain"
              style={{ filter: 'brightness(0) invert(1)' }}
              referrerPolicy="no-referrer"
              crossOrigin="anonymous"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  const span = document.createElement('span');
                  span.innerText = 'GDF';
                  span.className = 'font-bold text-white text-sm';
                  parent.appendChild(span);
                }
              }}
            />
          </div>
          <div className="flex flex-col justify-center">
            <div className="text-[20px] font-bold leading-none tracking-tight flex items-center">
              <span className="text-[#244b9b]">RENOVA</span>
              <span className="text-[#fbed21]">DF</span>
            </div>
            <div className="text-[10px] font-medium text-[#0b65ab] uppercase leading-tight tracking-wider mt-[2px]">
              SECRETARIA DE TRABALHO
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

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
  const [activeSignature, setActiveSignature] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);

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
          width: 100, // Used as % scale now
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

  const handlePrint = () => {
    const prevZoom = zoom;
    setZoom(1);
    // Pequeno delay para o layout estabilizar em escala 1:1 antes de abrir o diálogo de impressão
    setTimeout(() => {
      window.print();
      setZoom(prevZoom);
    }, 300);
  };

  // Group items by category
  const categories = Array.from(new Set(CHECKLIST_DATA.map(item => item.category)));

  return (
    <div className="min-h-screen bg-zinc-100 py-8 px-4 sm:px-6 lg:px-12 print:p-0 print:bg-white transition-all duration-300">
      <div className="max-w-[1600px] mx-auto space-y-8 print:space-y-0">
        
        {/* App Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-zinc-200 no-print sticky top-0 z-[60]">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
              <FileText className="text-blue-600" />
              Checklist Digital SENAI
            </h1>
            <p className="text-zinc-500 text-sm">Formulário de Entrega de Equipamento - 2025</p>
          </div>
          <div className="flex items-center gap-3 no-print">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-900 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-zinc-200"
            >
              <Printer size={18} />
              Imprimir
            </button>
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-12 gap-10 print:block">
          
          {/* Form Controls */}
          <div className="lg:col-span-4 xl:col-span-3 space-y-6 no-print lg:sticky lg:top-32 lg:self-start max-h-[calc(100vh-10rem)] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-300">
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
                      id="sig-fiscal"
                    />
                    <label 
                      htmlFor="sig-fiscal"
                      className="flex items-center justify-center gap-2 w-full p-3 border-2 border-dashed border-zinc-200 rounded-xl cursor-pointer group-hover:border-blue-400 group-hover:bg-blue-50 transition-all"
                    >
                      <Plus size={18} className="text-zinc-400 group-hover:text-blue-500" />
                      <span className="text-sm text-zinc-500 group-hover:text-blue-600">Upload Assinatura</span>
                    </label>
                    {signatures.find(s => s.label === 'Fiscal SEDET') && (
                      <div className="mt-2 text-xs text-zinc-500">
                        <div className="flex justify-between items-center mb-1">
                          <span>Tamanho</span>
                          <button onClick={() => setSignatures(prev => prev.filter(s => s.label !== 'Fiscal SEDET'))} className="text-red-500 hover:underline">Remover</button>
                        </div>
                        <input 
                          type="range" 
                          min="20" max="250" 
                          value={signatures.find(s => s.label === 'Fiscal SEDET')?.width || 100} 
                          onChange={(e) => updateSignature(signatures.find(s => s.label === 'Fiscal SEDET')!.id, { width: parseInt(e.target.value) })}
                          className="w-full accent-blue-600"
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700">Supervisor</label>
                  <div className="relative group">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => handleSignatureUpload(e, 'Supervisor')}
                      className="hidden" 
                      id="sig-supervisor"
                    />
                    <label 
                      htmlFor="sig-supervisor"
                      className="flex items-center justify-center gap-2 w-full p-3 border-2 border-dashed border-zinc-200 rounded-xl cursor-pointer group-hover:border-blue-400 group-hover:bg-blue-50 transition-all"
                    >
                      <Plus size={18} className="text-zinc-400 group-hover:text-blue-500" />
                      <span className="text-sm text-zinc-500 group-hover:text-blue-600">Upload Assinatura</span>
                    </label>
                    {signatures.find(s => s.label === 'Supervisor') && (
                      <div className="mt-2 text-xs text-zinc-500">
                        <div className="flex justify-between items-center mb-1">
                          <span>Tamanho</span>
                          <button onClick={() => setSignatures(prev => prev.filter(s => s.label !== 'Supervisor'))} className="text-red-500 hover:underline">Remover</button>
                        </div>
                        <input 
                          type="range" 
                          min="20" max="250" 
                          value={signatures.find(s => s.label === 'Supervisor')?.width || 100} 
                          onChange={(e) => updateSignature(signatures.find(s => s.label === 'Supervisor')!.id, { width: parseInt(e.target.value) })}
                          className="w-full accent-blue-600"
                        />
                      </div>
                    )}
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
                <li>Faça o upload das assinaturas e elas serão posicionadas automaticamente.</li>
              </ul>
            </section>
          </div>

          {/* PDF Preview / Editor */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-4">
            <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-zinc-200 no-print">
              <div className="flex items-center gap-2 text-sm font-medium text-zinc-600">
                <Maximize2 size={16} />
                Zoom do Preview
              </div>
              <div className="flex items-center gap-4">
                <input 
                  type="range" 
                  min="0.5" 
                  max="1.5" 
                  step="0.05" 
                  value={zoom} 
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="w-32 h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <span className="text-xs font-mono text-zinc-500 w-10">{Math.round(zoom * 100)}%</span>
                <button 
                  onClick={() => setZoom(1)}
                  className="text-[10px] uppercase font-bold text-blue-600 hover:text-blue-700"
                >
                  Reset
                </button>
              </div>
            </div>

            <div className="overflow-x-auto pb-12 flex justify-center lg:justify-start xl:justify-center">
              <div 
                className="pdf-page shrink-0 origin-top print:scale-100 print:m-0 transition-all duration-300 flex flex-col items-center gap-8 print:gap-0"
                style={{ 
                  fontFamily: 'Inter, sans-serif',
                  transform: `scale(${zoom})`,
                  width: '210mm',
                  margin: '0 auto'
                }}
              >
                {/* PAGE 1 */}
                <div className="w-[210mm] h-[297mm] print:h-[275mm] print:max-h-[275mm] bg-white p-[15mm] print:p-[10mm] relative print:overflow-hidden shadow-2xl print:shadow-none flex flex-col shrink-0 print:break-after-page">
                  <HeaderLogos />

                  <h2 className="text-center font-bold text-lg mb-3 uppercase tracking-widest border-b-2 border-zinc-900 pb-1">
                    Formulário de Entrega
                  </h2>

                  {/* Dynamic Header Table */}
                  <div className="grid grid-cols-12 border-2 border-zinc-900 mb-2 text-[9px] shrink-0 overflow-hidden">
                  <div className="col-span-4 border-r border-b border-zinc-900 p-1">
                    <label className="block font-bold mb-0">Data Início:</label>
                    <input 
                      type="date" 
                      name="dataInicio"
                      value={formData.dataInicio}
                      onChange={handleInputChange}
                      className="w-full bg-transparent outline-none"
                    />
                  </div>
                  <div className="col-span-4 border-r border-b border-zinc-900 p-1">
                    <label className="block font-bold mb-0">Data Fim:</label>
                    <input 
                      type="date" 
                      name="dataFim"
                      value={formData.dataFim}
                      onChange={handleInputChange}
                      className="w-full bg-transparent outline-none"
                    />
                  </div>
                  <div className="col-span-4 border-b border-zinc-900 p-1">
                    <label className="block font-bold mb-0">Ciclo:</label>
                    <input 
                      type="text" 
                      name="ciclo"
                      value={formData.ciclo}
                      onChange={handleInputChange}
                      className="w-full bg-transparent outline-none"
                    />
                  </div>
                  <div className="col-span-8 border-r border-b border-zinc-900 p-1">
                    <label className="block font-bold mb-0">Endereço:</label>
                    <input 
                      type="text" 
                      name="endereco"
                      value={formData.endereco}
                      onChange={handleInputChange}
                      className="w-full bg-transparent outline-none"
                    />
                  </div>
                  <div className="col-span-4 border-b border-zinc-900 p-1">
                    <label className="block font-bold mb-0">RA:</label>
                    <input 
                      type="text" 
                      name="ra"
                      value={formData.ra}
                      onChange={handleInputChange}
                      className="w-full bg-transparent outline-none"
                    />
                  </div>
                  <div className="col-span-6 border-r border-b border-zinc-900 p-1">
                    <label className="block font-bold mb-0">Instrutor:</label>
                    <input 
                      type="text" 
                      name="instrutor"
                      value={formData.instrutor}
                      onChange={handleInputChange}
                      className="w-full bg-transparent outline-none"
                    />
                  </div>
                  <div className="col-span-6 border-b border-zinc-900 p-1">
                    <label className="block font-bold mb-0">Equipamento:</label>
                    <input 
                      type="text" 
                      name="equipamento"
                      value={formData.equipamento}
                      onChange={handleInputChange}
                      className="w-full bg-transparent outline-none"
                    />
                  </div>
                  <div className="col-span-12 p-1 flex items-center gap-4">
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

                {/* Checklist Table Part 1 */}
                <div className="border-2 border-zinc-900 text-[9px] mb-0 overflow-hidden">
                  <div className="grid grid-cols-12 bg-yellow-400 font-bold border-b border-zinc-900">
                    <div className="col-span-8 p-1 border-r border-zinc-900 uppercase">Descrição das Atividades Executadas</div>
                    <div className="col-span-1 p-1 border-r border-zinc-900 text-center text-blue-700">SIM</div>
                    <div className="col-span-1 p-1 border-r border-zinc-900 text-center text-red-600">NÃO</div>
                    <div className="col-span-2 p-1 text-center text-blue-700">NÃO SE APLICA</div>
                  </div>

                  {categories.map((cat) => (
                    <React.Fragment key={cat}>
                      <div className="bg-zinc-100 font-bold p-1 text-center border-b border-zinc-900 uppercase tracking-wider">
                        {cat}
                      </div>
                      {CHECKLIST_DATA.filter(item => item.category === cat).map((item) => (
                        <div key={item.id} className="grid grid-cols-12 border-b border-zinc-900 last:border-b-0 print:break-inside-avoid">
                          <div className="col-span-8 p-1 border-r border-zinc-900 flex items-center">
                            {item.text}
                          </div>
                          <div className="col-span-1 border-r border-zinc-900 flex items-center justify-center cursor-pointer hover:bg-zinc-50" onClick={() => handleResponseChange(item.id, 'SIM')}>
                            <div className="w-4 h-4 border border-zinc-900 flex items-center justify-center relative">
                              {formData.respostas[item.id] === 'SIM' && <div className="text-black font-bold text-[12px]">X</div>}
                            </div>
                          </div>
                          <div className="col-span-1 border-r border-zinc-900 flex items-center justify-center cursor-pointer hover:bg-zinc-50" onClick={() => handleResponseChange(item.id, 'NÃO')}>
                            <div className="w-4 h-4 border border-zinc-900 flex items-center justify-center relative">
                              {formData.respostas[item.id] === 'NÃO' && <div className="text-black font-bold text-[12px]">X</div>}
                            </div>
                          </div>
                          <div className="col-span-2 flex items-center justify-center cursor-pointer hover:bg-zinc-50" onClick={() => handleResponseChange(item.id, 'NÃO SE APLICA')}>
                            <div className="w-4 h-4 border border-zinc-900 flex items-center justify-center relative">
                              {formData.respostas[item.id] === 'NÃO SE APLICA' && <div className="text-black font-bold text-[12px]">X</div>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </React.Fragment>
                  ))}
                </div>

                </div>

                {/* PAGE 2 */}
                <div className="w-[210mm] h-[297mm] print:h-[275mm] print:max-h-[275mm] bg-white p-[15mm] print:p-[10mm] border-t-2 border-dashed border-zinc-300 print:border-none relative print:overflow-hidden shadow-2xl print:shadow-none flex flex-col shrink-0 mt-8 print:mt-0">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white px-4 text-[9px] text-zinc-400 font-mono no-print">PÁGINA 2</div>
                  <div className="shrink-0 mb-4 mt-8 print:mt-0">
                    <HeaderLogos />
                  </div>
                  
                  <div className="border-2 border-zinc-900 mb-4 flex-1 flex flex-col min-h-0">
                    <div className="bg-blue-600 text-white font-bold p-1 text-center uppercase tracking-wider text-xs shrink-0">
                      Observações
                    </div>
                    <textarea 
                      name="observacoes"
                      value={formData.observacoes}
                      onChange={handleInputChange}
                      className="w-full flex-1 p-4 outline-none resize-none text-xs leading-relaxed overflow-hidden bg-transparent"
                      placeholder="Espaço para anotações adicionais..."
                    />
                  </div>

                  <div className="shrink-0">
                    {/* Footer Data */}
                  <div className="flex justify-center mb-8 text-sm">
                    <p>Data: <span className="font-bold">{formattedDate.day}</span> de <span className="font-bold">{formattedDate.month}</span> de <span className="font-bold">{formattedDate.year}</span>.</p>
                  </div>

                  {/* Signature Lines Optimized */}
                  <div className="space-y-12 mt-10 print:mt-6 pb-6 print:pb-2">
                    <div className="relative flex flex-col items-center">
                      <div className="h-24 w-64 flex items-end justify-center mb-1 relative overflow-visible">
                        {signatures.find(s => s.label === 'Fiscal SEDET') && (
                          <img 
                            src={signatures.find(s => s.label === 'Fiscal SEDET')?.url} 
                            alt="Assinatura Fiscal" 
                            className="max-h-full max-w-full object-contain mix-blend-multiply" 
                            style={{ 
                              transform: `scale(${(signatures.find(s => s.label === 'Fiscal SEDET')?.width || 100) / 100})`,
                              transformOrigin: 'bottom center'
                            }}
                          />
                        )}
                      </div>
                      <div className="border-t-2 border-zinc-900 w-full max-w-md mx-auto" />
                      <p className="text-center text-sm font-bold mt-2">Assinatura do fiscal da SEDET</p>
                    </div>
                    <div className="relative flex flex-col items-center">
                      <div className="h-24 w-64 flex items-end justify-center mb-1 relative overflow-visible">
                        {signatures.find(s => s.label === 'Supervisor') && (
                          <img 
                            src={signatures.find(s => s.label === 'Supervisor')?.url} 
                            alt="Assinatura Supervisor" 
                            className="max-h-full max-w-full object-contain mix-blend-multiply" 
                            style={{ 
                              transform: `scale(${(signatures.find(s => s.label === 'Supervisor')?.width || 100) / 100})`,
                              transformOrigin: 'bottom center'
                            }}
                          />
                        )}
                      </div>
                      <div className="border-t-2 border-zinc-900 w-full max-w-md mx-auto" />
                      <p className="text-center text-sm font-bold mt-2">Assinatura do Supervisor</p>
                    </div>
                  </div>

                  {/* Institutional Footer */}
                  <footer className="mt-12 pt-4 border-t border-blue-200 print:border-zinc-900 grid grid-cols-3 text-[9px] text-blue-800">
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
                </div>

                {/* Signatures are now rendered inline, no overlay needed */}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
