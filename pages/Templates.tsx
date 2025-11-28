import React, { useState, useRef, useEffect } from 'react';
import { Palette, Image as ImageIcon, Type, Save, QrCode, Move, Trash2, Plus, Upload } from 'lucide-react';
import { templateService } from '../services/supabase/templateService';
import { useAuth } from '../contexts/AuthContext';
import { DiplomaTemplate, TemplateElement } from '../types';

// Mock QR Code Component (SVG)
const MockQRCode: React.FC<{ size: number, color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill={color}>
    <rect x="10" y="10" width="30" height="30" />
    <rect x="60" y="10" width="30" height="30" />
    <rect x="10" y="60" width="30" height="30" />
    <rect x="50" y="50" width="10" height="10" />
    <rect x="70" y="70" width="20" height="20" />
    <rect x="50" y="80" width="10" height="10" />
  </svg>
);

const AVAILABLE_VARIABLES = [
  { label: 'Student Name', value: '{{STUDENT_NAME}}' },
  { label: 'Student ID (Matricule)', value: '{{STUDENT_ID}}' },
  { label: 'Document Type (Diplôme/Certificat)', value: '{{TYPE}}' },
  { label: 'Grade/Cote (%)', value: '{{COTE}}' },
  { label: 'Faculty', value: '{{FACULTY}}' },
  { label: 'Academic Year', value: '{{YEAR}}' },
  { label: 'Date Issued', value: '{{DATE}}' },
];

const Templates: React.FC = () => {
  const { schoolProfile } = useAuth();
  const [template, setTemplate] = useState<DiplomaTemplate>({
    id: 'new',
    name: 'Untitled Template',
    layout: 'landscape',
    width: 800,
    height: 600,
    elements: [
      { id: '1', type: 'text', label: 'School Name', content: 'University Name', x: 50, y: 10, fontSize: 32, fontWeight: 'bold', fontFamily: 'Serif' },
      { id: '2', type: 'variable', label: 'Doc Type', content: '{{TYPE}}', x: 50, y: 20, fontSize: 24, fontWeight: 'bold', color: '#4f46e5' },
      { id: '3', type: 'variable', label: 'Student Name', content: '{{STUDENT_NAME}}', x: 50, y: 40, fontSize: 48, fontWeight: 'bold' },
      { id: '4', type: 'text', label: 'Body Text', content: 'Has successfully completed requirements with score:', x: 50, y: 55, fontSize: 16 },
      { id: '5', type: 'variable', label: 'Grade', content: '{{COTE}}', x: 50, y: 62, fontSize: 20, fontWeight: 'bold' },
      { id: '6', type: 'qr', label: 'NFT QR', content: 'QR_PLACEHOLDER', x: 88, y: 80, width: 80, height: 80, color: '#000000' }
    ]
  });

  const [selectedElId, setSelectedElId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<any[]>([]);

  // Dragging State
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    startX: number;
    startY: number;
    initialElX: number; // %
    initialElY: number; // %
  } | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load existing templates
  useEffect(() => {
    if (schoolProfile) {
      loadTemplates();
    }
  }, [schoolProfile]);

  const loadTemplates = async () => {
    try {
      if (!schoolProfile) return;
      const data = await templateService.getTemplates(schoolProfile.id);
      setTemplates(data);

      // Load first template if exists
      if (data.length > 0) {
        setTemplate(data[0] as any);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper to update specific element
  const updateElement = (id: string, changes: Partial<TemplateElement>) => {
    setTemplate(prev => ({
      ...prev,
      elements: prev.elements.map(el => el.id === id ? { ...el, ...changes } : el)
    }));
  };

  const addElement = (type: 'text' | 'qr' | 'variable') => {
    let content = 'New Text';
    if (type === 'variable') content = '{{STUDENT_NAME}}';
    if (type === 'qr') content = 'QR_PLACEHOLDER';

    const newEl: TemplateElement = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      label: type === 'qr' ? 'New QR' : type === 'variable' ? 'New Variable' : 'New Text',
      content,
      x: 50,
      y: 50,
      fontSize: 20,
      width: type === 'qr' ? 80 : undefined,
      height: type === 'qr' ? 80 : undefined,
      color: '#000000'
    };
    setTemplate(prev => ({ ...prev, elements: [...prev.elements, newEl] }));
    setSelectedElId(newEl.id);
  };

  const deleteElement = (id: string) => {
    setTemplate(prev => ({
      ...prev,
      elements: prev.elements.filter(el => el.id !== id)
    }));
    setSelectedElId(null);
  };

  const handleSave = async () => {
    if (!schoolProfile) {
      alert('Please login first');
      return;
    }

    setSaving(true);
    try {
      // Add school_id to template before saving
      const templateToSave = {
        ...template,
        school_id: schoolProfile.id
      } as any;

      await templateService.saveTemplate(templateToSave);
      alert('Template saved successfully!');
      await loadTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  // --- Background Image Upload ---
  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setTemplate(prev => ({ ...prev, backgroundImage: ev.target!.result as string }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // --- Drag Logic ---
  const handleMouseDown = (e: React.MouseEvent, el: TemplateElement) => {
    e.stopPropagation();
    setSelectedElId(el.id);
    setDragState({
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      initialElX: el.x,
      initialElY: el.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragState || !selectedElId || !canvasRef.current) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();

    // Calculate delta in pixels
    const deltaX = e.clientX - dragState.startX;
    const deltaY = e.clientY - dragState.startY;

    // Convert delta to percentage relative to canvas size
    const deltaXPercent = (deltaX / canvasRect.width) * 100;
    const deltaYPercent = (deltaY / canvasRect.height) * 100;

    const newX = Math.min(100, Math.max(0, dragState.initialElX + deltaXPercent));
    const newY = Math.min(100, Math.max(0, dragState.initialElY + deltaYPercent));

    updateElement(selectedElId, { x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setDragState(null);
  };

  const selectedElement = template.elements.find(el => el.id === selectedElId);

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col md:flex-row gap-4 select-none" onMouseUp={handleMouseUp} onMouseMove={handleMouseMove}>

      {/* LEFT SIDEBAR: Tools & Properties */}
      <div className="w-full md:w-80 bg-base-100 shadow-xl flex flex-col h-full border-r border-base-300">
        <div className="p-4 border-b border-base-300">
          <h3 className="font-bold text-lg mb-4">Template Designer</h3>
          <div className="grid grid-cols-2 gap-2">
            <button className="btn btn-sm btn-outline" onClick={() => addElement('text')}><Type size={14} /> Text</button>
            <button className="btn btn-sm btn-outline" onClick={() => addElement('variable')}><Plus size={14} /> Variable</button>
            <button className="btn btn-sm btn-outline" onClick={() => addElement('qr')}><QrCode size={14} /> QR Code</button>
            <button className="btn btn-sm btn-outline" onClick={() => fileInputRef.current?.click()}>
              <ImageIcon size={14} /> Upload BG
            </button>
            {/* Hidden Input for Background Upload */}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleBgUpload}
            />
          </div>

          {template.backgroundImage && (
            <div className="mt-2 flex justify-between items-center text-xs">
              <span className="opacity-70">Background active</span>
              <button className="text-error" onClick={() => setTemplate(t => ({ ...t, backgroundImage: undefined }))}>Remove</button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {selectedElement ? (
            <div className="space-y-4 animate-fade-in">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-sm uppercase text-primary">Edit: {selectedElement.label}</h4>
                <button className="btn btn-ghost btn-xs text-error" onClick={() => deleteElement(selectedElement.id)}><Trash2 size={14} /></button>
              </div>

              <div className="form-control">
                <label className="label-text text-xs">Content</label>
                {selectedElement.type === 'variable' ? (
                  <select
                    className="select select-bordered select-sm w-full"
                    value={selectedElement.content}
                    onChange={(e) => updateElement(selectedElement.id, { content: e.target.value })}
                  >
                    {AVAILABLE_VARIABLES.map(v => (
                      <option key={v.value} value={v.value}>{v.label}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    className="input input-bordered input-sm"
                    value={selectedElement.content}
                    onChange={(e) => updateElement(selectedElement.id, { content: e.target.value })}
                    disabled={selectedElement.type === 'qr'}
                  />
                )}
                {selectedElement.type === 'variable' && (
                  <label className="label-text-alt text-xs opacity-60 mt-1">
                    Value will be replaced during issuance.
                  </label>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="form-control">
                  <label className="label-text text-xs">Position X (%)</label>
                  <input type="range" min="0" max="100" className="range range-xs range-primary"
                    value={selectedElement.x} onChange={(e) => updateElement(selectedElement.id, { x: parseInt(e.target.value) })} />
                </div>
                <div className="form-control">
                  <label className="label-text text-xs">Position Y (%)</label>
                  <input type="range" min="0" max="100" className="range range-xs range-primary"
                    value={selectedElement.y} onChange={(e) => updateElement(selectedElement.id, { y: parseInt(e.target.value) })} />
                </div>
              </div>

              {selectedElement.type !== 'qr' && (
                <>
                  <div className="form-control">
                    <label className="label-text text-xs">Font Size (px)</label>
                    <input type="number" className="input input-bordered input-sm"
                      value={selectedElement.fontSize} onChange={(e) => updateElement(selectedElement.id, { fontSize: parseInt(e.target.value) })} />
                  </div>
                  <div className="form-control">
                    <label className="label-text text-xs">Color</label>
                    <div className="flex gap-2">
                      <input type="color" className="w-8 h-8 rounded cursor-pointer"
                        value={selectedElement.color || '#000000'} onChange={(e) => updateElement(selectedElement.id, { color: e.target.value })} />
                      <span className="text-xs self-center">{selectedElement.color}</span>
                    </div>
                  </div>
                </>
              )}

              {selectedElement.type === 'qr' && (
                <div className="form-control">
                  <label className="label-text text-xs">Size (px)</label>
                  <input type="number" className="input input-bordered input-sm"
                    value={selectedElement.width}
                    onChange={(e) => updateElement(selectedElement.id, { width: parseInt(e.target.value), height: parseInt(e.target.value) })} />
                  <p className="text-xs opacity-60 mt-2">This QR code will link to the immutable NFT record on IPFS.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center opacity-50 mt-10">
              <Move className="mx-auto mb-2" />
              <p>Select an element or use your mouse to drag elements on the canvas.</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-base-300">
          <button className="btn btn-primary w-full gap-2" onClick={handleSave} disabled={saving}>
            {saving ? <span className="loading loading-spinner"></span> : <Save size={18} />} Save Template
          </button>
        </div>
      </div>

      {/* CENTER: Canvas */}
      <div className="flex-1 bg-base-200 overflow-auto flex items-center justify-center relative p-8">
        <div
          ref={canvasRef}
          className="bg-white shadow-2xl relative transition-all duration-300 overflow-hidden"
          style={{
            width: template.layout === 'landscape' ? '800px' : '600px',
            height: template.layout === 'landscape' ? '600px' : '800px',
            backgroundImage: template.backgroundImage ? `url(${template.backgroundImage})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
          onClick={() => setSelectedElId(null)}
        >
          {/* Render Elements */}
          {template.elements.map(el => (
            <div
              key={el.id}
              onMouseDown={(e) => handleMouseDown(e, el)}
              className={`absolute cursor-move hover:outline hover:outline-1 hover:outline-primary ${selectedElId === el.id ? 'outline outline-2 outline-primary' : ''}`}
              style={{
                left: `${el.x}%`,
                top: `${el.y}%`,
                transform: 'translate(-50%, -50%)',
                fontSize: el.fontSize ? `${el.fontSize}px` : undefined,
                fontWeight: el.fontWeight,
                fontFamily: el.fontFamily || 'serif',
                color: el.color || '#000',
                whiteSpace: 'nowrap',
                userSelect: 'none',
                zIndex: 10
              }}
            >
              {el.type === 'qr' ? (
                <MockQRCode size={el.width || 64} color={el.color || '#000'} />
              ) : (
                el.content
              )}
            </div>
          ))}

          {/* Background hint if empty */}
          {!template.backgroundImage && (
            <div className="absolute inset-0 pointer-events-none opacity-5 border-8 border-double border-gray-900 flex items-center justify-center">
              <span className="text-4xl font-bold uppercase rotate-12">Template Preview</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Templates;
