import { useState, useRef, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import mammoth from 'mammoth'
import './App.css'

const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY
const VOICE_ID = '21m00Tcm4TlvDq8ikWAM' // Rachel — natural, clear

const SHARE_TARGETS = [
  {
    id: 'whatsapp', label: 'WhatsApp', color: '#25D366',
    icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>),
    getUrl: (text, filename) => `https://api.whatsapp.com/send?text=${encodeURIComponent(`📄 *${filename}*\n\n${text.slice(0, 500)}${text.length > 500 ? '...' : ''}`)}`
  },
  {
    id: 'notes', label: 'Notes', color: '#FFD60A',
    icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zm-7 14H7v-2h5v2zm5-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>),
    action: 'copy'
  },
  {
    id: 'instagram', label: 'Instagram', color: '#E1306C',
    icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>),
    action: 'copy_instagram'
  },
  {
    id: 'tiktok', label: 'TikTok', color: '#ffffff',
    icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.27 8.27 0 004.84 1.55V6.79a4.85 4.85 0 01-1.07-.1z"/></svg>),
    action: 'copy_tiktok'
  },
  {
    id: 'twitter', label: 'X / Twitter', color: '#1DA1F2',
    icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.741l7.73-8.835L1.254 2.25H8.08l4.259 5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>),
    getUrl: (text, filename) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(`📄 ${filename}\n\n${text.slice(0, 200)}${text.length > 200 ? '...' : ''}`)}`
  },
  {
    id: 'email', label: 'Email', color: '#a78bfa',
    icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>),
    getUrl: (text, filename) => `mailto:?subject=${encodeURIComponent(filename)}&body=${encodeURIComponent(text.slice(0, 1000))}`
  }
]

function getFileType(file) {
  const ext = file.name.split('.').pop().toLowerCase()
  if (ext === 'md' || ext === 'markdown') return 'markdown'
  if (ext === 'pdf') return 'pdf'
  if (ext === 'docx') return 'docx'
  if (ext === 'txt') return 'text'
  return 'unknown'
}

function FileIcon({ type }) {
  const icons = {
    markdown: { label: 'MD', color: '#7c6fff' },
    pdf: { label: 'PDF', color: '#ff6b9d' },
    docx: { label: 'DOC', color: '#4fc3f7' },
    text: { label: 'TXT', color: '#00e5c3' },
    unknown: { label: '?', color: '#6b6b80' }
  }
  const { label, color } = icons[type] || icons.unknown
  return (
    <span style={{
      fontFamily: 'DM Mono, monospace', fontSize: '11px', fontWeight: 500,
      color, background: `${color}18`, border: `1px solid ${color}40`,
      borderRadius: '6px', padding: '2px 7px', letterSpacing: '0.05em'
    }}>{label}</span>
  )
}

export default function App() {
  const [file, setFile] = useState(null)
  const [fileType, setFileType] = useState(null)
  const [content, setContent] = useState(null)
  const [pdfUrl, setPdfUrl] = useState(null)
  const [rawText, setRawText] = useState('')
  const [loading, setLoading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [toast, setToast] = useState(null)
  const [shareLoading, setShareLoading] = useState(null)
  const [ttsLoading, setTtsLoading] = useState(false)
  const [ttsPlaying, setTtsPlaying] = useState(false)
  const [ttsPaused, setTtsPaused] = useState(false)
  const audioRef = useRef(null)
  const audioBlobRef = useRef(null)
  const fileRef = useRef()

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 2800)
  }

  const processFile = async (f) => {
    setLoading(true)
    setContent(null)
    setPdfUrl(null)
    setRawText('')
    stopAudio()
    const type = getFileType(f)
    setFile(f)
    setFileType(type)
    try {
      if (type === 'markdown' || type === 'text') {
        const text = await f.text()
        setContent(text)
        setRawText(text)
      } else if (type === 'pdf') {
        const url = URL.createObjectURL(f)
        setPdfUrl(url)
        setRawText(`[PDF Document: ${f.name}]`)
      } else if (type === 'docx') {
        const arrayBuffer = await f.arrayBuffer()
        const result = await mammoth.extractRawText({ arrayBuffer })
        const htmlResult = await mammoth.convertToHtml({ arrayBuffer })
        setContent(htmlResult.value)
        setRawText(result.value)
      }
    } catch (e) {
      showToast('Error reading file', 'error')
    }
    setLoading(false)
  }

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    if (audioBlobRef.current) {
      URL.revokeObjectURL(audioBlobRef.current)
      audioBlobRef.current = null
    }
    setTtsPlaying(false)
    setTtsPaused(false)
  }

  const handleListen = async () => {
    if (ttsPlaying && !ttsPaused) {
      audioRef.current?.pause()
      setTtsPaused(true)
      setTtsPlaying(false)
      return
    }
    if (ttsPaused && audioRef.current) {
      audioRef.current.play()
      setTtsPaused(false)
      setTtsPlaying(true)
      return
    }

    if (!rawText.trim()) { showToast('No text to read', 'error'); return }
    if (!ELEVENLABS_API_KEY) { showToast('ElevenLabs API key missing', 'error'); return }

    setTtsLoading(true)
    stopAudio()

    try {
      const textToRead = rawText.slice(0, 4500)
      const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY
        },
        body: JSON.stringify({
          text: textToRead,
          model_id: 'eleven_monolingual_v1',
          voice_settings: { stability: 0.5, similarity_boost: 0.75 }
        })
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.detail?.message || 'ElevenLabs error')
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      audioBlobRef.current = url
      const audio = new Audio(url)
      audioRef.current = audio
      audio.play()
      setTtsPlaying(true)
      setTtsPaused(false)
      audio.onended = () => { setTtsPlaying(false); setTtsPaused(false) }
      showToast('🎙️ Playing with ElevenLabs voice')
    } catch (e) {
      showToast(e.message || 'Voice error', 'error')
    }
    setTtsLoading(false)
  }

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) processFile(f)
  }, [])

  const onDragOver = (e) => { e.preventDefault(); setDragging(true) }
  const onDragLeave = () => setDragging(false)
  const onFileChange = (e) => { if (e.target.files[0]) processFile(e.target.files[0]) }

  const handleShare = async (target) => {
    setShareLoading(target.id)
    await new Promise(r => setTimeout(r, 300))
    if (target.action === 'copy' || target.action === 'copy_instagram' || target.action === 'copy_tiktok') {
      const prefix = target.action === 'copy_instagram' ? `📄 ${file?.name}\n\n`
        : target.action === 'copy_tiktok' ? `📄 ${file?.name} — check this out!\n\n` : ''
      await navigator.clipboard.writeText(prefix + rawText.slice(0, 2000))
      const labels = {
        copy: '📋 Copied to clipboard — paste into Notes',
        copy_instagram: '📸 Caption copied — paste into Instagram',
        copy_tiktok: '🎵 Caption copied — paste into TikTok'
      }
      showToast(labels[target.action])
    } else if (target.getUrl) {
      window.open(target.getUrl(rawText, file?.name || 'Document'), '_blank')
      showToast(`Opening ${target.label}...`)
    }
    setShareLoading(null)
  }

  const reset = () => {
    setFile(null); setFileType(null); setContent(null); setPdfUrl(null); setRawText('')
    stopAudio()
    if (fileRef.current) fileRef.current.value = ''
  }

  const hasContent = file && (content || pdfUrl)
  const canListen = hasContent && fileType !== 'pdf' && rawText.trim()

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-icon">⬡</span>
            <span className="logo-text">Folio</span>
          </div>
          <span className="logo-sub">preview & share anything</span>
        </div>
      </header>

      <main className="main">
        {!file && (
          <div className="upload-zone-wrap">
            <div
              className={`upload-zone ${dragging ? 'dragging' : ''}`}
              onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}
              onClick={() => fileRef.current?.click()}
            >
              <input ref={fileRef} type="file" accept=".md,.markdown,.pdf,.docx,.txt" onChange={onFileChange} style={{ display: 'none' }} />
              <div className="upload-icon-wrap">
                <div className="upload-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
                  </svg>
                </div>
              </div>
              <h2 className="upload-title">Drop your file here</h2>
              <p className="upload-sub">or click to browse</p>
              <div className="upload-types">
                <span className="type-pill">MD</span>
                <span className="type-pill">PDF</span>
                <span className="type-pill">DOCX</span>
                <span className="type-pill">TXT</span>
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="loading-wrap">
            <div className="spinner" />
            <p>Reading file...</p>
          </div>
        )}

        {hasContent && !loading && (
          <div className="workspace">
            <div className="file-bar">
              <div className="file-info">
                <FileIcon type={fileType} />
                <span className="file-name">{file.name}</span>
                <span className="file-size">{(file.size / 1024).toFixed(1)} KB</span>
              </div>
              <div className="file-actions">
                {canListen && (
                  <button
                    className={`listen-btn ${ttsPlaying ? 'playing' : ''} ${ttsLoading ? 'loading' : ''}`}
                    onClick={handleListen}
                    disabled={ttsLoading}
                    title="Listen with ElevenLabs AI voice"
                  >
                    {ttsLoading ? (
                      <>
                        <div className="spinner-xs" />
                        <span>Generating...</span>
                      </>
                    ) : ttsPlaying ? (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                        </svg>
                        <span>Pause</span>
                        <span className="sound-bars">
                          <span/><span/><span/><span/>
                        </span>
                      </>
                    ) : ttsPaused ? (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                        <span>Resume</span>
                      </>
                    ) : (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                        </svg>
                        <span>Listen</span>
                      </>
                    )}
                  </button>
                )}
                <button className="reset-btn" onClick={reset}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                  New file
                </button>
              </div>
            </div>

            <div className="workspace-body">
              <div className="preview-panel">
                <div className="panel-label"><span>PREVIEW</span></div>
                <div className="preview-content">
                  {fileType === 'markdown' && (
                    <div className="markdown-body">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                    </div>
                  )}
                  {fileType === 'text' && <pre className="text-body">{content}</pre>}
                  {fileType === 'pdf' && <iframe src={pdfUrl} className="pdf-frame" title="PDF Preview" />}
                  {fileType === 'docx' && <div className="docx-body" dangerouslySetInnerHTML={{ __html: content }} />}
                </div>
              </div>

              <div className="share-panel">
                <div className="panel-label"><span>SHARE TO</span></div>
                <div className="share-grid">
                  {SHARE_TARGETS.map(target => (
                    <button
                      key={target.id}
                      className={`share-btn ${shareLoading === target.id ? 'loading' : ''}`}
                      onClick={() => handleShare(target)}
                      style={{ '--btn-color': target.color }}
                    >
                      <span className="share-icon" style={{ color: target.color }}>
                        {shareLoading === target.id ? (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                          </svg>
                        ) : target.icon}
                      </span>
                      <span className="share-label">{target.label}</span>
                      <svg className="share-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M7 17L17 7M17 7H7M17 7v10"/>
                      </svg>
                    </button>
                  ))}
                </div>
                <div className="share-hint">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                  </svg>
                  Instagram, TikTok & Notes copy content to clipboard
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {toast && (
        <div className={`toast ${toast.type}`}>
          <span>{toast.msg}</span>
        </div>
      )}
    </div>
  )
}
