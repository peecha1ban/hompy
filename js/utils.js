// js/utils.js (유틸리티 함수 모음)

// 이 URL은 Google Apps Script의 배포 URL입니다.
// 게시물 목록과 방명록 기능을 사용하려면 이 값을 자신의 Apps Script URL로 변경해야 합니다.
export const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwcmcCHwdwiLDbBP5LkSW9j5DwozTFJrSwUy1q6y-w37Mg-u-gQAE-DaJRLVg8Opn5fZg/exec'; // IMPROVEMENT: 중앙 집중화된 Apps Script URL
const LIKED_POSTS_STORAGE_KEY = 'myWebsiteLikedPosts'; // 좋아요 누른 게시물 ID를 저장할 로컬 스토리지 키

/**
 * 게시물 타입에 따라 아이프레임에 표시할 적절한 URL을 생성합니다.
 * Google Drive 문서, 이미지, HTML 파일 등을 아이프레임에 삽입할 때 사용됩니다.
 * @param {string} type 게시물의 타입 (예: 'docs', 'slide', 'img', 'html', 'folder')
 * @param {string} id Google Drive 파일 ID 또는 HTML 파일 이름 (예: 'my_page.html')
 * @returns {string} 아이프레임에 삽입할 URL
 */
export function getEmbedURL(type, id) {
    let embedSrc = ''; // 임베드할 URL을 저장할 변수
    switch (type.toLowerCase()) { // 게시물 타입을 소문자로 변환하여 비교합니다.
        case 'docs': // Google Docs (문서)
            embedSrc = `https://docs.google.com/document/d/${id}/preview`;
            break;
        case 'slide': // Google Slides (프레젠테이션)
            embedSrc = `https://docs.google.com/presentation/d/${id}/embed?start=false&loop=false&delayms=3000`;
            break;
        case 'img': // 이미지
        case 'pdf': // PDF
            embedSrc = `https://drive.google.com/file/d/${id}/preview`;
            break;
       case 'spreadsheet': // Google Sheets (스프레드시트)
            embedSrc = `https://docs.google.com/spreadsheets/d/${id}/htmlembed`;
            break;
        case 'html': // NEW: 'contents/html' 폴더에 있는 HTML 파일
            // 'id'는 여기서 'contents/html' 폴더 안의 HTML 파일 이름입니다 (예: 'my_page.html').
            embedSrc = `contents/html/${id}`;
            break;
        case 'folder': // NEW: Google Drive 폴더
            // 참고: Google Drive 폴더를 아이프레임에 직접 삽입하는 것은 보안 정책(X-Frame-Options) 때문에 잘 작동하지 않을 수 있습니다.
            // 이 URL은 보통 직접 링크로 사용될 때 새 탭에서 폴더를 엽니다.
            embedSrc = `https://drive.google.com/embeddedfolderview?id=${id}#grid`;
            break;
        default: // 정의되지 않은 타입인 경우
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