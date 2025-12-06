import { useState, useRef } from 'react'
import Header from './components/Header'
import ControlPanel from './components/ControlPanel'
import StringArtCanvas from './StringArtCanvas'
import GlassCard from './components/GlassCard'
import Dashboard from './components/Dashboard'
import Welcome from './components/Welcome'
import { Download, FileText, Image as ImageIcon, Save, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useHistory } from './hooks/useHistory'
import './index.css'

function App() {
    const [view, setView] = useState('welcome') // 'welcome' | 'dashboard' | 'create'
    const { history, saveItem, deleteItem, getStats } = useHistory()

    const [file, setFile] = useState(null)
    const [nNails, setNNails] = useState(200)
    const [maxLines, setMaxLines] = useState(4000)
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState({ sequence: [], image: null })
    const [error, setError] = useState(null)
    const [savedId, setSavedId] = useState(null)

    // Backend Integration
    const handleGenerate = async () => {
        if (!file) return;

        setLoading(true)
        setError(null)
        setResult({ sequence: [], image: null })
        setSavedId(null)

        const formData = new FormData()
        formData.append('image', file)
        formData.append('n_nails', nNails)
        formData.append('max_lines', maxLines)

        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                body: formData,
            })

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Server returned ${response.status}: ${errorText}`);
            }

            const reader = response.body.getReader()
            const decoder = new TextDecoder()
            let buffer = ''

            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                buffer += decoder.decode(value, { stream: true })
                const lines = buffer.split('\n')
                buffer = lines.pop()

                for (const line of lines) {
                    if (!line.trim()) continue
                    try {
                        const data = JSON.parse(line)
                        if (data.type === 'step') {
                            setResult(prev => ({
                                ...prev,
                                sequence: [...(prev?.sequence || []), data.nail]
                            }))
                        } else if (data.type === 'result') {
                            setResult(prev => ({
                                ...prev,
                                image: data.image,
                                sequence: data.sequence
                            }))
                        } else if (data.type === 'error') {
                            throw new Error(data.error)
                        }
                    } catch (e) {
                        console.warn("Stream parse error", e)
                    }
                }
            }

        } catch (err) {
            console.error(err)
            setError(err.message || "Failed to generate art")
        } finally {
            setLoading(false)
        }
    }

    const downloadSequence = async () => {
        if (!result.sequence || result.sequence.length < 2) return

        try {
            const { jsPDF } = await import('jspdf')
            const doc = new jsPDF()

            const nLines = result.sequence.length - 1
            let y = 20
            const pageHeight = doc.internal.pageSize.height
            const margin = 20

            doc.setFontSize(16)
            doc.text("String Art Sequence", margin, y)
            y += 10
            doc.setFontSize(11)
            doc.text(`Nails: ${nNails}`, margin, y)
            y += 7
            doc.text(`Total Lines: ${nLines}`, margin, y)
            y += 10

            doc.line(margin, y, 210 - margin, y)
            y += 10

            doc.setFont("courier", "normal")
            doc.setFontSize(10)

            for (let i = 0; i < nLines; i++) {
                if (y > pageHeight - margin) {
                    doc.addPage()
                    y = 20
                }
                const start = result.sequence[i]
                const end = result.sequence[i + 1]
                doc.text(`${String(start).padStart(4)} -> ${String(end).padStart(4)}`, margin, y)
                y += 6
            }

            doc.save('string_art_sequence.pdf')
        } catch (e) {
            console.error(e)
            setError("PDF Generation failed")
        }
    }

    const handleSave = () => {
        if (!result.image) return;
        const newItem = saveItem({
            filename: file?.name || 'Untitled',
            nNails,
            maxLines,
            sequence: result.sequence,
            imageThumbnail: result.image
        });
        setSavedId(newItem.id);
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-white selection:bg-accent-primary selection:text-white transition-colors duration-300" style={{ fontFamily: 'Inter, sans-serif' }}>
            {/* Background Glows */}
            <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-accent-primary/10 dark:bg-accent-primary/20 blur-[120px] rounded-full pointer-events-none transition-colors duration-500" />
            <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-accent-secondary/10 dark:bg-accent-secondary/20 blur-[120px] rounded-full pointer-events-none transition-colors duration-500" />

            {view === 'welcome' ? (
                <Welcome onStart={() => setView('create')} />
            ) : (
                <div className="container mx-auto px-6 pb-20 relative z-10">
                    <Header currentView={view} onNavigate={setView} onLogout={() => setView('welcome')} />

                    {view === 'dashboard' && (
                        <Dashboard
                            history={history}
                            stats={getStats()}
                            onDelete={deleteItem}
                            onCreateNew={() => setView('create')}
                        />
                    )}

                    {view === 'create' && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8"
                        >
                            {/* Left Panel: Controls */}
                            <div className="lg:col-span-4">
                                <ControlPanel
                                    file={file}
                                    setFile={setFile}
                                    nNails={nNails}
                                    setNNails={setNNails}
                                    maxLines={maxLines}
                                    setMaxLines={setMaxLines}
                                    handleGenerate={handleGenerate}
                                    loading={loading}
                                    error={error}
                                />
                            </div>

                            {/* Right Panel: Visualization */}
                            <div className="lg:col-span-8 flex flex-col h-full">
                                <AnimatePresence mode="wait">
                                    {result.sequence.length > 0 || loading ? (
                                        <GlassCard className="min-h-[600px] flex items-center justify-center relative">
                                            {/* Main Canvas */}
                                            {result.sequence.length > 0 && (
                                                <StringArtCanvas
                                                    sequence={result.sequence}
                                                    nNails={nNails}
                                                    theme="dark" // Always dark for premium look
                                                />
                                            )}

                                            {/* Loading State Overlay */}
                                            {loading && result.sequence.length === 0 && (
                                                <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                                                    <div className="w-16 h-16 border-4 border-accent-primary border-t-transparent rounded-full animate-spin mb-4" />
                                                    <p className="text-slate-500 dark:text-white/50 text-sm animate-pulse">Calculating paths...</p>
                                                </div>
                                            )}
                                        </GlassCard>
                                    ) : (
                                        <GlassCard className="h-full flex flex-col items-center justify-center text-center p-12 border-dashed border-slate-200 dark:border-white/10" delay={0.3}>
                                            <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-6">
                                                <ImageIcon className="w-10 h-10 text-slate-400 dark:text-white/20" />
                                            </div>
                                            <h2 className="text-2xl font-bold mb-2 text-slate-800 dark:text-white transition-colors">Ready to Create</h2>
                                            <p className="text-slate-500 dark:text-white/50 max-w-md transition-colors">
                                                Select an image and adjust parameters to generate your unique string art masterpiece.
                                            </p>
                                        </GlassCard>
                                    )}
                                </AnimatePresence>

                                {/* Action Bar for Results */}
                                {result.image && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex gap-4 justify-end"
                                    >
                                        <button
                                            onClick={handleSave}
                                            disabled={!!savedId}
                                            className={`
                                            flex items-center gap-2 px-6 py-3 rounded-xl border transition-all text-sm font-medium
                                            ${savedId
                                                    ? 'bg-green-500/20 border-green-500/50 text-green-700 dark:text-green-200 cursor-default'
                                                    : 'bg-white hover:bg-slate-50 border-slate-200 dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/10 hover:scale-105 active:scale-95'}
                                        `}
                                        >
                                            {savedId ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                                            {savedId ? 'Saved to Gallery' : 'Save to Gallery'}
                                        </button>

                                        <button
                                            onClick={downloadSequence}
                                            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-accent-primary/10 hover:bg-accent-primary/20 border border-accent-primary/50 text-accent-primary transition-all hover:scale-105 active:scale-95 text-sm font-medium"
                                        >
                                            <FileText className="w-4 h-4" />
                                            Download PDF Sequence
                                        </button>
                                    </motion.div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </div>
            )}
        </div>
    )
}

export default App
