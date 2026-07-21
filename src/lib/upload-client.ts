/**
 * Carga directa navegador → Supabase Storage vía signed upload URL,
 * replicando el PUT de `uploadToSignedUrl` pero con progreso y cancelación.
 */
export function uploadToSignedUrlWithProgress(options: {
  signedUrl: string
  file: File
  onProgress: (percent: number) => void
  onXhr?: (xhr: XMLHttpRequest) => void
}): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    options.onXhr?.(xhr)
    xhr.open('PUT', options.signedUrl)
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        options.onProgress(Math.round((e.loaded / e.total) * 100))
      }
    }
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`Storage respondió ${xhr.status}`))
    xhr.onerror = () => reject(new Error('Error de red durante la carga'))
    xhr.onabort = () => reject(new UploadCanceledError())
    const body = new FormData()
    body.append('cacheControl', '3600')
    body.append('', options.file)
    xhr.send(body)
  })
}

export class UploadCanceledError extends Error {
  constructor() {
    super('cancelado')
    this.name = 'UploadCanceledError'
  }
}
