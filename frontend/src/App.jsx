import { useState, useEffect } from 'react'
import axios from 'axios'
import StringArtCanvas from './StringArtCanvas'
import './App.css'

function App() {
    const [file, setFile] = useState(null)
    const [preview, setPreview] = useState(null)
    const [nNails, setNNails] = useState(200)
    const [maxLines, setMaxLines] = useState(4000)
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState({ sequence: [], image: null })
    const [error, setError] = useState(null)
    const [theme, setTheme] = useState('dark')
    const [logs, setLogs] = useState([])

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme)
    }, [theme])

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark')
    }

    const addLog = (msg) => {
        setLogs(prev => [...prev, `${new Date().toISOString().split('T')[1]} - ${msg}`].slice(-10))
        console.log(msg)
    }

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0]
        setFile(selectedFile)

        if (selectedFile) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setPreview(reader.result)
            }
            reader.readAsDataURL(selectedFile)
        } else {
            setPreview(null)
        }
    }

    const handleGenerate = async () => {
        addLog("Generate button clicked");
        if (!file) {
            addLog("No file selected");
            return;
        }

        setLoading(true)
        setError(null)
        setResult({ sequence: [], image: null })

        const formData = new FormData()
        formData.append('image', file)
        formData.append('n_nails', nNails)
        formData.append('max_lines', maxLines)

        try {
            addLog("Sending fetch request to /api/generate");
            const response = await fetch('/api/generate', {
                method: 'POST',
                body: formData,
            })

            addLog(`Response received: ${response.status} ${response.statusText}`);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Server returned ${response.status}: ${errorText}`);
            }

            const reader = response.body.getReader()
            const decoder = new TextDecoder()
            let buffer = ''

            addLog("Starting to read stream");
            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                buffer += decoder.decode(value, { stream: true })
                const lines = buffer.split('\n')

                buffer = lines.pop() // Keep the last partial line

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
                            addLog("Got final result");
                            setResult(prev => ({
                                ...prev,
                                image: data.image,
                                sequence: data.sequence
                            }))
                        } else if (data.type === 'error') {
                            addLog(`Backend error: ${data.error}`);
                            throw new Error(data.error)
                        }
                    } catch (e) {
                        console.warn("Failed to parse", line, e)
                    }
                }
            }

        } catch (err) {
            addLog(`Generation error: ${err.message}`)
            console.error(err)
            setError(`Failed to generate: ${err.message}`)
        } finally {
            setLoading(false)
        }
    }

    const downloadSequence = async () => {
        if (!result.sequence || result.sequence.length < 2) return

        try {
            // Dynamic import to avoid issues if not fully loaded yet (though standard import is fine too)
            const { jsPDF } = await import('jspdf')
            const doc = new jsPDF()

            const nLines = result.sequence.length - 1
            let y = 20
            const pageHeight = doc.internal.pageSize.height
            const margin = 20

            // Header
            doc.setFontSize(16)
            doc.text("String Art Sequence", margin, y)
            y += 10
            doc.setFontSize(11)
            doc.text(`Nails: ${nNails} (Numbered 0 to ${nNails - 1})`, margin, y)
            y += 7
            doc.text(`Total Lines: ${nLines}`, margin, y)
            y += 10
            doc.setFontSize(10)
            doc.text("Sequence: <Start Nail> to <End Nail>, <Line Number>/<Total>", margin, y)
            y += 10

            doc.line(margin, y, 210 - margin, y) // Horizontal line
            y += 10

            // Content
            doc.setFont("courier", "normal") // Monospace for better alignment
            doc.setFontSize(10)

            for (let i = 0; i < nLines; i++) {
                if (y > pageHeight - margin) {
                    doc.addPage()
                    y = 20
                }

                const start = result.sequence[i]
                const end = result.sequence[i + 1]
                const lineStr = `${start.toString().padStart(4)} to ${end.toString().padStart(4)}, ${(i + 1).toString().padStart(5)}/${nLines}`
                doc.text(lineStr, margin, y)
                y += 6
            }

            doc.save('string_art_sequence.pdf')
        } catch (e) {
            console.error(e)
            addLog("Failed to generate PDF: " + e.message)
        }
    }

    return (
        <div className="container">
            <header>
                <div>
                    <h1>String Art Generator</h1>
                    <p>Turn your images into thread art</p>
                </div>
                <button onClick={toggleTheme} className="secondary">
                    {theme === 'dark' ? '☀️ Bright Mode' : '🌙 Dark Mode'}
                </button>
            </header>

            <main>
                <div className="controls">
                    <div className="input-group">
                        <label>Upload Image</label>
                        <input type="file" accept="image/*" onChange={handleFileChange} />
                    </div>

                    <div className="input-group">
                        <label>Number of Nails</label>
                        <input
                            type="number"
                            value={nNails}
                            onChange={(e) => setNNails(parseInt(e.target.value))}
                            min="100"
                            max="1000"
                        />
                    </div>

                    <div className="input-group">
                        <label>Max Lines</label>
                        <input
                            type="number"
                            value={maxLines}
                            onChange={(e) => setMaxLines(parseInt(e.target.value))}
                            min="1000"
                            max="10000"
                        />
                    </div>

                    <button onClick={handleGenerate} disabled={!file || loading}>
                        {loading ? 'Generating...' : 'Generate Art'}
                    </button>

                    {error && <div className="error">{error}</div>}
                </div>

                <div className="preview-area">
                    {preview && (
                        <div className="image-card">
                            <h3>Original</h3>
                            <img src={preview} alt="Original" />
                        </div>
                    )}
                </div>

                {(result.sequence.length > 0 || result.image) && (
                    <div className="results-container">
                        <div className="image-card result">
                            <h3>Generated Result (Static)</h3>
                            {result.image ? (
                                <img src={result.image} alt="Result" />
                            ) : (
                                <div className="loading-container" style={{ height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                                    <div className="spinner"></div>
                                    <p>Generating... {result.sequence.length} lines calculated</p>
                                </div>
                            )}
                            {result.image && (
                                <button onClick={downloadSequence} className="secondary">
                                    Download Sequence
                                </button>
                            )}
                        </div>

                        <div className="visualization-card">
                            <h3>Visualization Playback</h3>
                            {!result.image ? (
                                <div style={{ height: '600px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                                    Waiting for generation to complete...
                                </div>
                            ) : (
                                <StringArtCanvas
                                    sequence={result.sequence} // Only passed when result.image is ready (implicitly)
                                    nNails={nNails}
                                    theme={theme}
                                />
                            )}
                        </div>
                    </div>
                )}

                <div className="debug-logs" style={{ marginTop: '20px', padding: '10px', background: 'rgba(0,0,0,0.8)', color: '#0f0', borderRadius: '5px', fontSize: '12px', fontFamily: 'monospace', textAlign: 'left' }}>
                    <strong>Debug Logs:</strong>
                    {logs.length === 0 && <div>Waiting for interactions...</div>}
                    {logs.map((log, i) => <div key={i}>{log}</div>)}
                </div>
            </main>
        </div>
    )
}

export default App
