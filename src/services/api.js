const BASE_URL = 'https://alessandra-gluteal-rowena.ngrok-free.dev';
const HEADERS = {
  'ngrok-skip-browser-warning': 'true'
};

export const transcribeAudio = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${BASE_URL}/transcribe`, {
    method: 'POST',
    headers: { ...HEADERS },
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error('Transcription failed');
  }
  return response.json();
};

export const getEmbedding = async (text) => {
  const response = await fetch(`${BASE_URL}/embedding`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...HEADERS },
    body: JSON.stringify({ text }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to get embedding');
  }
  return response.json();
};

export const addOverlap = async (chunks) => {
  const response = await fetch(`${BASE_URL}/add_overlap`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...HEADERS },
    body: JSON.stringify(chunks),
  });

  if (!response.ok) {
    throw new Error('Failed to add overlap');
  }
  return response.json();
};

export const createCollection = async (name) => {
  const response = await fetch(`${BASE_URL}/create_collection`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...HEADERS },
    body: JSON.stringify(name),
  });

  if (!response.ok) {
    throw new Error('Failed to create collection');
  }
  return response.json();
};

export const addChunksToDb = async (collectionName, chunks) => {
  const response = await fetch(`${BASE_URL}/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...HEADERS },
    body: JSON.stringify({ collectionname: collectionName, chunks }),
  });

  if (!response.ok) {
    throw new Error('Failed to add to database');
  }
  return response.json();
};

export const searchDb = async (collectionName, embedding, k = 3) => {
  const response = await fetch(`${BASE_URL}/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...HEADERS },
    body: JSON.stringify({ collectionname: collectionName, embedding, k }),
  });

  if (!response.ok) {
    throw new Error('Failed to search database');
  }
  return response.json();
};
