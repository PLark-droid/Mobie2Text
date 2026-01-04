import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import { unlink, mkdir } from 'fs/promises'
import { existsSync, createReadStream } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'
import OpenAI from 'openai'

const TEMP_DIR = '/tmp/mobie2text'

function getOpenAIClient(): OpenAI {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
}

async function ensureTempDir() {
  if (!existsSync(TEMP_DIR)) {
    await mkdir(TEMP_DIR, { recursive: true })
  }
}

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

async function downloadAudio(url: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const ytdlp = spawn('yt-dlp', [
      '-x',
      '--audio-format', 'mp3',
      '--audio-quality', '5',
      '-o', outputPath,
      '--no-playlist',
      '--max-filesize', '100M',
      url,
    ])

    let stderr = ''
    ytdlp.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    ytdlp.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`yt-dlp failed: ${stderr}`))
      }
    })

    ytdlp.on('error', (err) => {
      reject(new Error(`yt-dlp not found. Please install: brew install yt-dlp\n${err.message}`))
    })
  })
}

async function transcribeAudio(audioPath: string): Promise<string> {
  const openai = getOpenAIClient()
  const audioFile = createReadStream(audioPath)

  const transcription = await openai.audio.transcriptions.create({
    file: audioFile,
    model: 'whisper-1',
    language: 'ja',
    response_format: 'text',
  })

  return transcription
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  let audioPath: string | null = null

  try {
    const body = await request.json()
    const { url } = body

    if (!url) {
      return NextResponse.json(
        { error: 'URLが必要です' },
        { status: 400 }
      )
    }

    const videoId = extractYouTubeId(url)
    if (!videoId) {
      return NextResponse.json(
        { error: '有効なYouTube URLを入力してください' },
        { status: 400 }
      )
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEYが設定されていません' },
        { status: 500 }
      )
    }

    await ensureTempDir()

    const fileId = randomUUID()
    audioPath = join(TEMP_DIR, `${fileId}.mp3`)

    // Download audio from YouTube
    await downloadAudio(url, audioPath)

    // Transcribe with Whisper
    const transcript = await transcribeAudio(audioPath)

    const duration = ((Date.now() - startTime) / 1000).toFixed(1)

    return NextResponse.json({
      success: true,
      transcript,
      videoId,
      processingTime: `${duration}秒`,
    })

  } catch (error) {
    console.error('Transcription error:', error)

    const message = error instanceof Error ? error.message : '文字起こしに失敗しました'

    return NextResponse.json(
      { error: message },
      { status: 500 }
    )

  } finally {
    // Cleanup temp file
    if (audioPath && existsSync(audioPath)) {
      try {
        await unlink(audioPath)
      } catch {
        // Ignore cleanup errors
      }
    }
  }
}
