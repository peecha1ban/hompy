// hompy/js/postInteractions.js (게시물 상호작용 관련 스크립트)

// utils.js 파일에서 필요한 함수와 상수를 가져옵니다.
import { APPS_SCRIPT_URL, getEmbedURL, getLikedPostsFromStorage, saveLikedPostsToStorage, copyToClipboard } from './utils.js';

/**
 * ISO 형식의 날짜 문자열을 'YYYY-MM-DD' 형식으로 변환합니다.
 * @param {string} isoString ISO 형식의 날짜 문자열
 * @returns {string} 'YYYY-MM-DD' 형식의 날짜 문자열 또는 원본 문자열 (변환 실패 시)
 */
function formatPostDate(isoString) {
    if (!isoString) return ''; // 입력이 없으면 빈 문자열 반환
    try {
        const date = new Date(isoString); // Date 객체 생성
        // 유효하지 않은 날짜인지 확인합니다.
        if (isNaN(date.getTime())) {
            console.warn('Invalid date string received:', isoString);
            return isoString; // 유효하지 않으면 원본 문자열 반환
        }
        
        // 년, 월, 일을 추출하여 'YYYY-MM-DD' 형식으로 만듭니다.
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // 월은 0부터 시작하므로 +1, 두 자리로 채움
        const day = String(date.getDate()).padStart(2, '0'); // 두 자리로 채움
        return `${year}-${month}-${day}`; // 'YYYY-MM-DD' 형식 반환
    } catch (e) {
        console.error('Error formatting date:', e, 'for string:', isoString);
        return isoString; // 오류 발생 시 원본 문자열 반환
    }
}

let contentFrame = null; // 게시물 내용을 표시할 iframe 요소
let postList = null; // 게시물 목록을 담을 ul 요소
let currentActivePostElement = null; // 현재 활성화된(선택된) 게시물 요소

// NEW: 모바일 감지 함수
const isMobileDevice = () => window.innerWidth <= 768; // responsive.css와 동일한 기준 사용

/**
 * 현재 활성화된 게시물을 시각적으로 강조합니다.
 * @param {HTMLElement} postElement 강조할 게시물 HTML 요소
 */
export function highlightActivePost(postElement) {
    // 이전에 활성화된 게시물이 있으면 'active-post' 클래스를 제거하여 강조를 해제합니다.
    if (currentActivePostElement) {
        currentActivePostElement.classList.remove('active-post');
    }
    // 새로 선택된 게시물에 'active-post' 클래스를 추가하여 강조합니다.
    postElement.classList.add('active-post');
    currentActivePostElement = postElement; // 현재 활성화된 게시물 업데이트
    // 게시물이 화면에 보이도록 스크롤합니다. (부드럽게, 가장 가까운 위치로)
    postElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Apps Script로 좋아요 업데이트 요청을 보냅니다.
 * @param {number} rowIndex 좋아요를 업데이트할 게시물의 행 인덱스
 * @param {'increment' | 'decrement'} action 좋아요 증감 액션
 * @returns {number | null} 업데이트된 좋아요 수 또는 null (실패 시)
 */
async function sendLikeUpdate(rowIndex, action) {
    try {
        // Apps Script로 POST 요청을 보냅니다.
        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST', // POST 방식
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded', // 데이터 형식
            },
            // 요청 본문에 액션, 행 인덱스, 좋아요 액션을 포함합니다.
            body: new URLSearchParams({
                action: 'updateLike',
                rowIndex: rowIndex,
                likeAction: action
            })
        });
        // 응답이 성공적이지 않으면 오류 발생
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json(); // 응답을 JSON으로 파싱

        if (result.success) {
            return result.newLikes; // 성공 시 새로운 좋아요 수 반환
        } else {
            console.error("Error from Apps Script (updateLike):", result.error);
            return null; // 실패 시 null 반환
        }
    } catch (error) {
        console.error('Error sending like update:', error);
        return null; // 오류 발생 시 null 반환
    }
}

/**
 * Apps Script로 공유 수 업데이트 요청을 보냅니다.
 * @param {number} rowIndex 공유 수를 업데이트할 게시물의 행 인덱스
 * @returns {number | null} 업데이트된 공유 수 또는 null (실패 시)
 */
async function sendShareUpdate(rowIndex) {
    try {
        // Apps Script로 POST 요청을 보냅니다.
        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST', // POST 방식
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded', // 데이터 형식
            },
            // 요청 본문에 액션과 행 인덱스를 포함합니다.
            body: new URLSearchParams({
                action: 'updateShare',
                rowIndex: rowIndex
            })
        });
        // 응답이 성공적이지 않으면 오류 발생
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json(); // 응답을 JSON으로 파싱

        if (result.success) {
            return result.newShares; // 성공 시 새로운 공유 수 반환
        } else {
            console.error("Error from Apps Script (updateShare):", result.error);
            return null; // 실패 시 null 반환
        }
    } catch (error) {
        console.error('Error sending share update:', error);
        return null; // 오류 발생 시 null 반환
    }
}

/**
 * 주어진 게시물 데이터를 기반으로 HTML 게시물 요소(li)를 생성합니다.
 * @param {Object} postData 게시물 데이터 객체
 * @returns {HTMLElement} 생성된 게시물 HTML 요소 (li)
 */
export function createPostElement(postData) {
    const li = document.createElement('li'); // 새로운 li 요소 생성
    li.dataset.rowIndex = postData.rowIndex; // 데이터 속성에 행 인덱스 저장
    li.classList.add('post-list-item'); // CSS 클래스 추가

    if (postData.pin) li.classList.add('pinned'); // 'pin' 속성이 true면 'pinned' 클래스 추가

    // 게시물 내용을 HTML 문자열로 설정합니다.
    li.innerHTML = `
        <div class="post-title-container">
        
        <span class="dot">⬤</span> <div class="post-title">${postData.title || 'Untitled Post'}</div> <div class="post-date">${formatPostDate(postData.date)}</div> </div>
        
        <div class="post-note">${postData.note || ''}</div> <div class="action-row">
        ${postData.tag ? `<span class="post-tag">${postData.tag}</span>` : ''} <div class="post-like-container">
                <button class="like-button">좋아요</button> <span class="like-count">${postData.like}</span> </div>
            <div class="share-container">
                 <button class="share-button">퍼가요</button> <span class="share-count">${postData.share}</span> </div>
            ${postData.link ? `<a href="${postData.link}" target="_blank" class="post-external-link-btn">새창에서 보기</a>` : ''} </div>
        
    `;

    // 좋아요 및 공유 관련 요소들을 가져옵니다.
    const likeButton = li.querySelector('.post-like-container');
    const likeCountSpan = li.querySelector('.like-count');
    const shareButton = li.querySelector('.share-container');
    const shareCountSpan = li.querySelector('.share-count');

    // 로컬 스토리지에 좋아요를 누른 게시물인지 확인하여 UI 업데이트
    if (getLikedPostsFromStorage().includes(postData.rowIndex)) {
        likeButton.classList.add('liked'); // 'liked' 클래스 추가
    }

    // 좋아요 버튼 클릭 이벤트 리스너
    likeButton.addEventListener('click', async (event) => {
        event.stopPropagation(); // 부모 요소(게시물 클릭)로 이벤트 전파 방지
        const isLiked = likeButton.classList.toggle('liked'); // 'liked' 클래스 토글 (좋아요 상태 변경)
        let currentLikedPosts = getLikedPostsFromStorage(); // 현재 로컬 스토리지에 저장된 좋아요 게시물 목록
        if (isLiked) {
            currentLikedPosts.push(postData.rowIndex); // 좋아요를 누르면 목록에 추가
        } else {
            currentLikedPosts = currentLikedPosts.filter(id => id !== postData.rowIndex); // 좋아요를 취소하면 목록에서 제거
        }
        saveLikedPostsToStorage(currentLikedPosts); // 변경된 목록을 로컬 스토리지에 저장
        // Apps Script로 좋아요 업데이트 요청을 보내고, 새로운 좋아요 수를 받아옵니다.
        const updatedCount = await sendLikeUpdate(postData.rowIndex, isLiked ? 'increment' : 'decrement');
        if (updatedCount !== null) {
            likeCountSpan.textContent = updatedCount; // 성공 시 좋아요 수 업데이트
        } else { 
            // 업데이트 실패 시 UI를 원래대로 되돌립니다.
            likeButton.classList.toggle('liked');
            saveLikedPostsToStorage(getLikedPostsFromStorage().filter(id => id !== postData.rowIndex));
        }
    });

    // 공유 버튼 클릭 이벤트 리스너
    shareButton.addEventListener('click', async (event) => {
        event.stopPropagation(); // 부모 요소로 이벤트 전파 방지
        // 공유할 링크를 생성합니다. (현재 페이지 URL + 게시물 행 인덱스)
        const shareLink = `${window.location.origin}${window.location.pathname}?post=${postData.rowIndex}`;
        await copyToClipboard(shareLink); // 클립보드에 링크 복사
        const updatedShareCount = await sendShareUpdate(postData.rowIndex); // Apps Script로 공유 수 업데이트
        if (updatedShareCount !== null) shareCountSpan.textContent = updatedShareCount; // 성공 시 공유 수 업데이트
    });

    // 게시물 클릭 이벤트 리스너 (좋아요, 공유, 외부 링크 버튼 제외)
    li.addEventListener('click', (event) => {
        // 클릭된 요소가 외부 링크, 좋아요, 공유 버튼이면 함수 종료 (중복 동작 방지)
        if (event.target.closest('.post-external-link-btn, .like-button, .share-button')) return;
        // 게시물 타입과 ID에 따라 iframe에 임베드할 URL을 가져옵니다.
        const embedURL = getEmbedURL(postData.type, postData.id);
        contentFrame.src = embedURL || 'about:blank'; // iframe의 src를 설정 (URL이 없으면 빈 페이지)
        
        highlightActivePost(li); // 클릭된 게시물 강조

        // NEW: 모바일에서 게시물 클릭 시 오른쪽 패널 확장
        if (isMobileDevice() && typeof window.adjustRightPanelForMobile === 'function') {
            window.adjustRightPanelForMobile();
        }
    });

    return li; // 생성된 게시물 li 요소 반환
}

/**
 * 초기 콘텐츠를 설정하고 공유된 게시물이 있으면 강조합니다.
 * @param {Array<Object>} postsData 모든 게시물 데이터
 * @param {number | null} sharedPostRowIndex URL에서 가져온 공유된 게시물의 행 인덱스 (선택 사항)
 */
export function setInitialContentAndHighlight(postsData, sharedPostRowIndex = null) {
    // contentFrame 또는 postList가 초기화되지 않았으면 오류 메시지 출력 후 종료
    if (!contentFrame || !postList) {
        console.error("Content frame or post list not initialized for initial content setup.");
        return;
    }

    // 이전에 활성화된 게시물이 있으면 강조를 해제합니다.
    if (currentActivePostElement) {
        currentActivePostElement.classList.remove('active-post');
        currentActivePostElement = null;
    }

    let postToLoad = null; // 로드할 게시물

    // URL에 공유된 게시물 ID가 있으면 해당 게시물을 찾습니다.
    if (sharedPostRowIndex !== null) {
        postToLoad = postsData.find(post => post.rowIndex === sharedPostRowIndex);
    } 

    if (postToLoad) {
        // 공유된 게시물이 있으면 해당 게시물의 임베드 URL로 iframe src를 설정합니다.
        contentFrame.src = getEmbedURL(postToLoad.type, postToLoad.id);
        // 해당 게시물 요소를 찾아 강조하고 화면에 보이도록 스크롤합니다.
        const initialActiveElement = postList.querySelector(`[data-row-index="${postToLoad.rowIndex}"]`);
        if (initialActiveElement) {
            highlightActivePost(initialActiveElement);
            initialActiveElement.scrollIntoView({ behavior: 'smooth', block: 'center' }); // 가시성 보장
            // NEW: 초기 로드 시에도 모바일에서 오른쪽 패널 확장
            if (isMobileDevice() && typeof window.adjustRightPanelForMobile === 'function') {
                window.adjustRightPanelForMobile();
            }
        }
    } else {
        // 공유된 게시물이 없으면 기본 URL을 설정할 수 있습니다. (현재 주석 처리됨)
        // contentFrame.src = DEFAULT_IFRAME_URL;
    }
}

/**
 * 게시물 상호작용 관련 요소들을 초기화합니다.
 */
export function setupPostInteractions() {
    contentFrame = document.getElementById('content-frame'); // 'content-frame' ID를 가진 iframe 요소 가져오기
    postList = document.getElementById('post-list'); // 'post-list' ID를 가진 ul 요소 가져오기
}