'use client'

import { useState } from 'react'

export default function Home() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState('')
  const [processingTime, setProcessingTime] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!url.trim()) {
      setError('URLを入力してください')
      return
    }

    setLoading(true)
    setError('')
    setTranscript('')
    setProcessingTime('')

    try {
      const res = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || '文字起こしに失敗しました')
      }

      setTranscript(data.transcript)
      setProcessingTime(data.processingTime)

    } catch (err) {
      setError(err instanceof Error ? err.message : '予期しないエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(transcript)
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea')
      textarea.value = transcript
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
  }

  return (
    <main className="container">
      <header className="header">
        <h1>Mobie2Text</h1>
        <p>YouTube動画を文字起こし</p>
      </header>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="url">YouTube URL</label>
            <input
              id="url"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              disabled={loading}
            />
          </div>

          <button type="submit" className="btn" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner" />
                文字起こし中...
              </>
            ) : (
              '文字起こし開始'
            )}
          </button>
        </form>

        {error && (
          <div className="error">{error}</div>
        )}
      </div>

      {loading && (
        <div className="card">
          <div className="status">
            音声をダウンロードしてWhisper APIで処理しています...
            <br />
            動画の長さによって数分かかる場合があります
          </div>
        </div>
      )}

      {transcript && (
        <div className="card result">
          <div className="result-header">
            <h2>文字起こし結果</h2>
            <button className="btn copy-btn" onClick={copyToClipboard}>
              コピー
            </button>
          </div>
          {processingTime && (
            <p style={{ color: 'var(--muted)', marginBottom: '1rem', fontSize: '0.875rem' }}>
              処理時間: {processingTime}
            </p>
          )}
          <div className="transcript">{transcript}</div>
        </div>
      )}
    </main>
  )
}
