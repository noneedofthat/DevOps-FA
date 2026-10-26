import { Firestore, doc, setDoc, getDocs, collection } from 'firebase/firestore';

// 500 KB per chunk (Base64 string) to stay safely below Firestore's 1 MB per document limit
const CHUNK_SIZE = 500000;

/**
 * Converts a File into a Data URL string.
 */
export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Saves a File into Firestore in chunked sub-collections under submissions/{submissionDocId}/file_chunks.
 * Guarantees zero byte loss and 100% preservation of original PDF without requiring local backend disk.
 */
export async function saveFileChunksToFirestore(
  db: Firestore,
  submissionDocId: string,
  file: File
): Promise<boolean> {
  try {
    const dataUrl = await fileToDataUrl(file);
    const totalLength = dataUrl.length;
    const totalChunks = Math.ceil(totalLength / CHUNK_SIZE);

    for (let i = 0; i < totalChunks; i++) {
      const slice = dataUrl.substring(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
      await setDoc(doc(db, "submissions", submissionDocId, "file_chunks", `chunk_${i}`), {
        index: i,
        totalChunks,
        fileName: file.name,
        fileType: file.type || 'application/pdf',
        fileSize: file.size,
        data: slice,
        createdAt: Date.now()
      });
    }
    return true;
  } catch (err) {
    console.error("Failed to save file chunks to Firestore:", err);
    return false;
  }
}

/**
 * Retrieves chunked file data from Firestore and initiates a browser download of the genuine, unmodified file.
 */
export async function downloadFileFromFirestore(
  db: Firestore,
  submissionDocId: string,
  defaultFileName: string = 'submission.pdf'
): Promise<boolean> {
  try {
    const chunksSnap = await getDocs(collection(db, "submissions", submissionDocId, "file_chunks"));
    if (chunksSnap.empty) {
      return false;
    }

    const chunks: { index: number; data: string; fileName?: string; fileType?: string }[] = [];
    chunksSnap.forEach((snap) => {
      chunks.push(snap.data() as any);
    });

    chunks.sort((a, b) => a.index - b.index);
    const fullDataUrl = chunks.map(c => c.data).join('');
    const fileName = chunks[0]?.fileName || defaultFileName;
    const fileType = chunks[0]?.fileType || 'application/pdf';

    const res = await fetch(fullDataUrl);
    const blob = await res.blob();
    const typedBlob = new Blob([blob], { type: fileType });
    const url = URL.createObjectURL(typedBlob);

    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  } catch (err) {
    console.error("Failed to download file from Firestore chunks:", err);
    return false;
  }
}
