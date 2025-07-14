// js/utils.js (유틸리티 함수 모음)

// 이 URL은 Google Apps Script의 배포 URL입니다.
// 게시물 목록과 방명록 기능을 사용하려면 이 값을 자신의 Apps Script URL로 변경해야 합니다.
export const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwcmcCHwdwiLDbBP5LkSW9j5DwozTFJrSwUy1q6y-w37Mg-u-gQAE-DaJRLVg8Opn5fZg/exec'; // IMPROVEMENT: 중앙 집중화된 Apps Script URL
const LIKED_POSTS_STORAGE_KEY = 'myWebsiteLikedPosts'; // 좋아요 누른 게시물 ID를 저장할 로컬 스토리지 키

/**
 * Google Drive 파일 ID의 유효성을 검증합니다.
 * Drive ID는 일반적으로 28~33자의 영숫자(a-zA-Z0-9_-)입니다.
 * @param {string} id 검증할 Drive ID 문자열
 * @returns {boolean} 유효하면 true, 아니면 false
 */
function isValidGoogleDriveId(id) {
    if (typeof id !== 'string' || id.length < 28 || id.length > 44) {
        console.warn('Invalid Google Drive ID length or type:', id);
        return false;
    }
    // 영숫자와 하이픈, 밑줄만 허용하는 정규 표현식
    const driveIdRegex = /^[a-zA-Z0-9_-]+$/;
    if (!driveIdRegex.test(id)) {
        console.warn('Invalid Google Drive ID characters:', id);
        return false;
    }
    return true;
}

/**
 * 로컬 HTML 파일 이름의 유효성을 검증합니다.
 * 경로 탐색(e.g., ../)을 방지하고, .html 확장자를 확인합니다.
 * @param {string} fileName 검증할 파일 이름 문자열
 * @returns {boolean} 유효하면 true, 아니면 false
 */
function isValidLocalHtmlFileName(fileName) {
    if (typeof fileName !== 'string' || fileName.length === 0) {
        console.warn('Invalid local HTML file name: empty or not string');
        return false;
    }
    // 경로 탐색 시도 방지 (예: ../, ..\)
    if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
        console.warn('Path traversal attempt detected in local HTML file name:', fileName);
        return false;
    }
    // .html 확장자로 끝나는지 확인 (대소문자 구분 없음)
    if (!fileName.toLowerCase().endsWith('.html')) {
        console.warn('Local HTML file name does not end with .html:', fileName);
        return false;
    }
    // 안전한 파일 이름 문자열 (영숫자, 하이픈, 밑줄, 점만 허용)
    const safeFileNameRegex = /^[a-zA-Z0-9_.-]+$/;
    if (!safeFileNameRegex.test(fileName)) {
        console.warn('Invalid characters in local HTML file name:', fileName);
        return false;
    }
    return true;
}

/**
 * 게시물 타입에 따라 아이프레임에 표시할 적절한 URL을 생성합니다.
 * Google Drive 문서, 이미지, HTML 파일 등을 아이프레임에 삽입할 때 사용됩니다.
 * @param {string} type 게시물의 타입 (예: 'docs', 'slide', 'img', 'html', 'folder')
 * @param {string} id Google Drive 파일 ID 또는 HTML 파일 이름 (예: 'my_page.html')
 * @returns {string} 아이프레임에 삽입할 URL
 */
export function getEmbedURL(type, id) {
    let embedSrc = ''; // 임베드할 URL을 저장할 변수
    
    // ID가 유효한지 1차 검증
    if (!id) {
        console.warn('getEmbedURL: ID is null or empty for type:', type);
        return '';
    }
    
    switch (type.toLowerCase()) { // 게시물 타입을 소문자로 변환하여 비교합니다.
        case 'docs': // Google Docs (문서)
        case 'slide': // Google Slides (프레젠테이션)
        case 'img': // 이미지
        case 'pdf': // PDF
        case 'spreadsheet': // Google Sheets (스프레드시트)
        case 'folder': // Google Drive 폴더
            if (!isValidGoogleDriveId(id)) {
                console.error(`Invalid Google Drive ID "${id}" for type "${type}".`);
                return ''; // 유효하지 않은 Drive ID는 처리하지 않음
            }
            if (type.toLowerCase() === 'docs') {
                embedSrc = `https://docs.google.com/document/d/${id}/preview`;
            } else if (type.toLowerCase() === 'slide') {
                embedSrc = `https://docs.google.com/presentation/d/${id}/embed?start=false&loop=false&delayms=3000`;
            } else if (type.toLowerCase() === 'img' || type.toLowerCase() === 'pdf') {
                embedSrc = `https://drive.google.com/file/d/${id}/preview`;
            } else if (type.toLowerCase() === 'spreadsheet') {
                embedSrc = `https://docs.google.com/spreadsheets/d/${id}/htmlembed`;
            } else if (type.toLowerCase() === 'folder') {
                // 참고: Google Drive 폴더를 아이프레임에 직접 삽입하는 것은 보안 정책(X-Frame-Options) 때문에 잘 작동하지 않을 수 있습니다.
                // 이 URL은 보통 직접 링크로 사용될 때 새 탭에서 폴더를 엽니다.
                embedSrc = `https://drive.google.com/embeddedfolderview?id=${id}#grid`;
            }
            break;
        case 'html': // NEW: 'contents/html' 폴더에 있는 HTML 파일
            // 'id'는 여기서 'contents/html' 폴더 안의 HTML 파일 이름입니다 (예: 'my_page.html').
            if (!isValidLocalHtmlFileName(id)) {
                console.error(`Invalid local HTML file name "${id}".`);
                return ''; // 유효하지 않은 파일 이름은 처리하지 않음
            }
            embedSrc = `contents/html/${id}`;
            break;
        default: // 정의되지 않은 타입인 경우
            console.warn(`Unsupported embed type: ${type}`);
            embedSrc = ''; // 빈 문자열 반환
    }
    return embedSrc; // 생성된 임베드 URL 반환
}

// 좋아요한 게시물 ID를 웹 브라우저에 저장하고 불러오는 함수들입니다.
/**
 * 로컬 스토리지에서 좋아요 누른 게시물 ID 목록을 가져옵니다.
 * @returns {Array<number>} 좋아요 누른 게시물 ID 배열
 */
export function getLikedPostsFromStorage() {
    try {
        // 로컬 스토리지에서 'LIKED_POSTS_STORAGE_KEY'에 해당하는 값을 가져와 JSON 파싱합니다.
        // 값이 없으면 빈 배열로 기본값을 설정합니다.
        const likedPosts = JSON.parse(localStorage.getItem(LIKED_POSTS_STORAGE_KEY) || '[]');
        // 가져온 값이 배열인지 확인하고, 아니면 빈 배열을 반환합니다.
        return Array.isArray(likedPosts) ? likedPosts : [];
    } catch (e) {
        return []; // 오류 발생 시 빈 배열 반환
    }
}

/**
 * 좋아요 누른 게시물 ID 목록을 로컬 스토리지에 저장합니다.
 * @param {Array<number>} likedPosts 저장할 좋아요 누른 게시물 ID 배열
 */
export function saveLikedPostsToStorage(likedPosts) {
    localStorage.setItem(LIKED_POSTS_STORAGE_KEY, JSON.stringify(likedPosts)); // 배열을 JSON 문자열로 변환하여 저장
}

// 게시물 링크를 클립보드에 복사하는 함수입니다.
/**
 * 주어진 텍스트를 클립보드에 복사합니다.
 * @param {string} text 클립보드에 복사할 텍스트
 */
export async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text); // 비동기적으로 텍스트를 클립보드에 복사
        alert('링크가 클립보드에 복사되었습니다!'); // 성공 메시지 표시
    } catch (err) {
        alert('복사에 실패했습니다. 수동으로 복사해주세요: ' + text); // 실패 메시지 및 수동 복사 안내
    }
}

/**
 * HTML 특수 문자를 HTML 엔티티로 변환하여 XSS 공격을 방지합니다.
 * @param {string} str 이스케이프할 문자열.
 * @returns {string} 이스케이프된 문자열.
 */
export function escapeHTML(str) {
    if (typeof str !== 'string') {
        return ''; // 문자열이 아니면 빈 문자열 반환
    }
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}