/**
 * @module api
 * Module này chịu trách nhiệm cho tất cả các giao tiếp với API bên ngoài.
 */

interface ApiRequestBody {
    url: string;
    language?: string;
    prompt?: string;
    apiKey?: string;
    timestamp?: string;
    comment?: string; // For replies
    [key: string]: any;
}

async function fetchFromApi(body: ApiRequestBody, queryParam?: string): Promise<string> {
    const { accessToken } = await chrome.storage.sync.get('accessToken');
    const token = accessToken || '23105d20-3812-44c9-9906-8adf1fd5e69e';
    const API_URL = `https://workflow.softty.net/webhook/${token}${queryParam ? `?${queryParam}=true` : ''}`;
    const extensionVersion = chrome.runtime.getManifest().version;

    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'version': extensionVersion
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        throw new Error(`Lỗi API (${queryParam || 'comment'}): ${response.status} ${response.statusText}`);
    }
    return response.text();
}

export function generateCommentOrReply(body: ApiRequestBody): Promise<string> {
    return fetchFromApi(body);
}

export function fetchSummary(body: ApiRequestBody): Promise<string> {
    return fetchFromApi(body, 'summarize');
}

export function fetchTranscript(body: ApiRequestBody): Promise<string> {
    return fetchFromApi(body, 'transcripts');
}

export function fetchVideoInfo(body: ApiRequestBody): Promise<string> {
    return fetchFromApi(body, 'infovideo');
}