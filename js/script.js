// js/script.js (메인 웹사이트 스크립트)

// hompy/js/script.js
import { APPS_SCRIPT_URL, escapeHTML } from './utils.js'; // escapeHTML 추가

// 필요한 모듈들을 가져옵니다.
import { setupPostInteractions, createPostElement, highlightActivePost, setInitialContentAndHighlight } from './postInteractions.js';

// DOMContentLoaded 이벤트: HTML 문서가 완전히 로드되고 파싱되면 실행됩니다.
document.addEventListener('DOMContentLoaded', () => {
    // HTML 요소들을 JavaScript 변수에 연결합니다.
    const tagFilterSelect = document.getElementById('tag-filter'); // 태그 필터 드롭다운
    const postList = document.getElementById('post-list'); // 게시물 목록 (ul)
    const loadMoreBtn = document.getElementById('load-more-btn'); // '더보기' 버튼
    const searchInput = document.getElementById('search-input'); // 검색 입력 필드
    const searchButton = document.getElementById('search-button'); // 검색 버튼
    const loadingSpinner = document.getElementById('loading-spinner'); // 로딩 스피너
    const loadingOverlay = document.getElementById('loading-overlay'); // 로딩 오버레이
    const clickableDiv = document.getElementById('about-container'); // 'ABOUT' 링크 컨테이너
    const myIframe = document.getElementById('content-frame'); // 콘텐츠를 표시할 iframe
    const searchContainer = document.querySelector('.search-container'); // 검색 컨테이너

    // 로컬 스토리지 캐시를 위한 키와 지속 시간 설정
    const CACHE_KEY_POSTS = 'myWebsitePostsCache'; // 게시물 데이터 캐시 키
    const CACHE_TIMESTAMP_KEY = 'myWebsitePostsCacheTimestamp'; // 캐시 타임스탬프 키
    const CACHE_DURATION_MS = 5 * 60 * 1000; // 캐시 유효 시간: 5분 (밀리초)

    let currentPage = 0; // 현재 페이지 번호
    const postsPerPage = 10; // 페이지당 표시할 게시물 수
    let loadingPosts = false; // 게시물 로딩 중인지 여부 플래그
    let allPostsLoaded = false; // 모든 게시물이 로드되었는지 여부 플래그
    let sharedPostRowIndex = null; // URL에서 공유된 게시물 인덱스 (초기에는 null)
    let allAvailablePosts = []; // Apps Script에서 가져온 모든 게시물 데이터
    let currentSearchQuery = ''; // 현재 검색어

    /**
     * Google Apps Script에서 모든 게시물을 가져옵니다.
     * 로딩 스피너를 표시하고 데이터를 캐시합니다.
     * @returns {Array<Object>} 모든 게시물 데이터 배열
     */
    async function fetchAllPostsFromAppsScript() {
        // 로딩 스피너와 오버레이를 표시합니다.
        if (loadingSpinner && loadingOverlay) {
            loadingSpinner.style.display = 'block';
            loadingOverlay.style.display = 'block';
        }
        loadingPosts = true; // 로딩 중 플래그 설정

        try {
            // Apps Script에서 모든 게시물을 가져오는 요청을 보냅니다.
            const response = await fetch(`${APPS_SCRIPT_URL}?action=getPosts&tag=all`);
            // 응답이 성공적이지 않으면 오류 발생
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const result = await response.json(); // 응답을 JSON으로 파싱

            // Apps Script에서 오류 응답이 왔을 경우 처리
            if (result.success === false) {
                console.error("Error from Apps Script (getPosts):", result.error);
                postList.innerHTML = '<li>Error loading posts. Please try again later.</li>';
                return []; // 빈 배열 반환
            }

            // (선택 사항) 로딩 지연을 시뮬레이션하여 로딩 스피너를 볼 수 있게 합니다.
            await new Promise(resolve => setTimeout(resolve, 300)); 

            allAvailablePosts = result; // 가져온 모든 게시물 데이터를 저장
            // 로컬 스토리지에 게시물 데이터와 현재 시간을 캐시합니다.
            localStorage.setItem(CACHE_KEY_POSTS, JSON.stringify(allAvailablePosts));
            localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());

            return allAvailablePosts; // 가져온 게시물 데이터 반환
        }
        catch (error) {
            console.error('에러...', error);
            postList.innerHTML = '<li>에러...이게 왜이러지...</li>';
            return []; // 오류 발생 시 빈 배열 반환
        } finally {
            // 로딩이 완료되면 스피너와 오버레이를 숨깁니다.
            if (loadingSpinner && loadingOverlay) {
                loadingSpinner.style.display = 'none';
                loadingOverlay.style.display = 'none';
            }
            loadingPosts = false; // 로딩 중 플래그 해제
        }
    }

    /**
     * 모든 게시물이 로드되었는지 확인하고, 필요하면 Apps Script에서 가져옵니다.
     * 캐시된 데이터가 유효하면 캐시를 사용합니다.
     */
    async function ensureAllPostsLoaded() {
        if (allAvailablePosts.length > 0) {
            return; // 이미 로드된 게시물이 있으면 다시 로드하지 않습니다.
        }

        const cachedData = localStorage.getItem(CACHE_KEY_POSTS); // 캐시된 데이터 가져오기
        const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY); // 캐시 타임스탬프 가져오기

        // 캐시된 데이터가 있고, 타임스탬프가 유효 시간 내에 있으면 캐시를 사용합니다.
        if (cachedData && cachedTimestamp && (Date.now() - parseInt(cachedTimestamp, 10) < CACHE_DURATION_MS)) {
            try {
                allAvailablePosts = JSON.parse(cachedData); // 캐시된 데이터를 파싱
                console.log('Loaded ALL posts from cache.');
            }
            catch (e) {
                // 캐시 데이터 파싱 오류 시 캐시를 삭제하고 네트워크에서 다시 가져옵니다.
                console.error("Error parsing cached data, fetching from network.", e);
                localStorage.removeItem(CACHE_KEY_POSTS);
                localStorage.removeItem(CACHE_TIMESTAMP_KEY);
                await fetchAllPostsFromAppsScript();
            }
        } else {
            // 캐시가 없거나 만료되었으면 Apps Script에서 새로 가져옵니다.
            await fetchAllPostsFromAppsScript();
        }
    }

    /**
     * '더보기' 버튼의 표시 여부를 업데이트합니다.
     */
    function updateLoadMoreButton() {
        if (loadMoreBtn) {
            // 모든 게시물이 로드되었으면 버튼을 숨기고, 아니면 표시합니다.
            loadMoreBtn.style.display = allPostsLoaded ? 'none' : 'block';
        }
    }

    /**
     * 현재 필터 및 검색어에 따라 게시물 목록을 필터링하고 정렬합니다.
     * @returns {Array<Object>} 필터링 및 정렬된 게시물 배열
     */
    function getFilteredAndSortedPosts() {
        let posts = [...allAvailablePosts]; // 모든 게시물 데이터를 복사합니다.

        // 태그 필터 적용
        const currentTag = tagFilterSelect.value;
        if (currentTag && currentTag.toLowerCase() !== 'all') {
            posts = posts.filter(post =>
                post.tag && post.tag.toLowerCase() === currentTag.toLowerCase()
            );
        }

        // 검색어 필터 적용
        if (currentSearchQuery !== '') {
            const searchQueryLower = currentSearchQuery.toLowerCase();
            posts = posts.filter(post =>
                (post.title && post.title.toLowerCase().includes(searchQueryLower)) || // 제목에 검색어 포함
                (post.note && post.note.toLowerCase().includes(searchQueryLower)) || // 내용에 검색어 포함
                (post.tag && post.tag.toLowerCase().includes(searchQueryLower)) // 태그에 검색어 포함
            );
        }

        // 게시물 정렬: 고정된 게시물(pinned)이 먼저 오고, 그 다음 최신 날짜순으로 정렬합니다.
        posts.sort((a, b) => {
            if (a.pin && !b.pin) return -1; // a가 고정이고 b가 아니면 a가 먼저
            if (!a.pin && b.pin) return 1; // b가 고정이고 a가 아니면 b가 먼저
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return dateB.getTime() - dateA.getTime(); // 최신 날짜가 먼저 오도록 내림차순 정렬
        });

        return posts; // 필터링 및 정렬된 게시물 반환
    }
    
    /**
     * 게시물을 로드하여 화면에 표시합니다.
     * @param {boolean} reset 게시물 목록을 초기화할지 여부 (true면 초기화)
     */
    async function loadPosts(reset = false) {
        // 이미 로딩 중이고 초기화 요청이 아니면 함수 종료
        if (loadingPosts && !reset) return;

        if (reset) {
            postList.innerHTML = ''; // 게시물 목록 초기화
            currentPage = 0; // 페이지 번호 초기화
            allPostsLoaded = false; // 모든 게시물 로드 상태 초기화
        }

        // 새로운 검색어가 있는지 확인 (초기화 요청 시)
        const newSearchQuery = searchInput.value.trim();
        if (reset && currentSearchQuery !== newSearchQuery) {
             currentSearchQuery = newSearchQuery; // 현재 검색어 업데이트
        }

        await ensureAllPostsLoaded(); // 모든 게시물 데이터가 로드되었는지 확인

        const filteredAndSortedPosts = getFilteredAndSortedPosts(); // 필터링 및 정렬된 게시물 가져오기

        const totalPostsForCurrentView = filteredAndSortedPosts.length; // 현재 조건에 맞는 총 게시물 수
        // 현재 페이지의 게시물 인덱스가 총 게시물 수를 넘으면 모든 게시물이 로드된 것으로 간주
        if ((currentPage * postsPerPage) >= totalPostsForCurrentView) {
            allPostsLoaded = true; // 모든 게시물 로드 플래그 설정
            updateLoadMoreButton(); // '더보기' 버튼 상태 업데이트
            if (currentPage === 0) {
                // 검색 결과가 없을 경우 메시지 표시
                postList.innerHTML = '<div class="post-list-item">검색 결과가 아무것도 없어요...</div>';
                setInitialContentAndHighlight([], sharedPostRowIndex); // 초기 콘텐츠 및 강조 설정
            }
            return; // 함수 종료
        }

        // 현재 페이지에 표시할 게시물들을 슬라이싱하여 가져옵니다.
        const postsToRender = filteredAndSortedPosts.slice(
            currentPage * postsPerPage,
            (currentPage * postsPerPage) + postsPerPage
        );

        // 표시할 게시물이 없고 첫 페이지인 경우
        if (postsToRender.length === 0 && currentPage === 0) {
            postList.innerHTML = '<div class="post-list-item">No posts found matching your criteria.</div>';
            allPostsLoaded = true;
            setInitialContentAndHighlight([], sharedPostRowIndex);
        } else if ((currentPage * postsPerPage) + postsPerPage >= totalPostsForCurrentView) {
            // 다음 페이지에 더 이상 게시물이 없으면 모든 게시물이 로드된 것으로 간주
            allPostsLoaded = true;
        }

        // 가져온 게시물들을 HTML 요소로 만들어서 목록에 추가합니다.
        postsToRender.forEach(post => {
            const postElement = createPostElement(post);
            postList.appendChild(postElement);
        });

        // 첫 페이지 로드 시 초기 콘텐츠 및 공유된 게시물 강조를 설정합니다.
        if (currentPage === 0) {
            setInitialContentAndHighlight(filteredAndSortedPosts, sharedPostRowIndex);
        }

        currentPage++; // 다음 페이지를 위해 현재 페이지 번호 증가
        updateLoadMoreButton(); // '더보기' 버튼 상태 업데이트
    }

    /**
     * 태그 필터 드롭다운을 Apps Script에서 가져온 고유한 태그들로 채웁니다.
     */
    async function populateTagFilter() {
        await ensureAllPostsLoaded(); // 모든 게시물 데이터가 로드되었는지 확인
        // 모든 게시물에서 고유한 태그들을 추출하고 정렬합니다. (빈 값은 제외)
        const uniqueTags = [...new Set(allAvailablePosts.map(p => p.tag).filter(Boolean))].sort();
        // 'All Tags' 옵션을 기본으로 설정
        tagFilterSelect.innerHTML = '<option value="all">All Tags</option>';
        // 각 고유 태그에 대한 옵션을 드롭다운에 추가합니다.
        uniqueTags.forEach(tag => {
            tagFilterSelect.innerHTML += `<option value="${tag}">${tag}</option>`;
        });
    }

    // 'ABOUT' 링크 컨테이너 클릭 시 iframe src 변경
    clickableDiv.addEventListener('click', function() {
        myIframe.src = 'about.html'; // iframe의 src를 'about.html'로 변경
    });

    // 태그 필터 드롭다운 변경 시 이벤트 리스너
    tagFilterSelect.addEventListener('change', () => {
        searchInput.value = ''; // 태그 필터 변경 시 검색 입력창 초기화
        currentSearchQuery = ''; // 현재 검색어 초기화
        loadPosts(true); // 새 필터로 게시물 다시 로드 (초기화)
    });

    // '더보기' 버튼 클릭 시 이벤트 리스너
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            loadPosts(); // 추가 게시물 로드
        });
    }

    // 검색 버튼 클릭 시 이벤트 리스너
    searchButton.addEventListener('click', function() {
        searchContainer.classList.toggle('expanded'); // 검색 입력창 가시성을 위한 'expanded' 클래스 토글

        if (searchContainer.classList.contains('expanded')) {
            searchInput.focus(); // 확장되면 입력창에 포커스
        } else {
            searchInput.value = ''; // 축소되면 입력창 초기화
        }
        loadPosts(true); // 새 검색어로 게시물 다시 로드 (초기화)
    });

    // 검색 입력 필드에서 'Enter' 키 눌렀을 때 이벤트 리스너
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            loadPosts(true); // 'Enter' 키 누르면 게시물 다시 로드 (초기화)
        }
    });

    // URL에서 'post' 파라미터 값(공유된 게시물 ID)을 가져옵니다.
    const urlParams = new URLSearchParams(window.location.search);
    const postIdFromUrl = urlParams.get('post');
    if (postIdFromUrl) {
        sharedPostRowIndex = parseInt(postIdFromUrl, 10); // 정수로 변환하여 저장
    }

    setupPostInteractions(); // 게시물 상호작용 관련 요소 초기화 (iframe, postList 연결)

    populateTagFilter(); // 태그 필터 드롭다운 채우기
    loadPosts(true); // 초기 게시물 로드 (첫 페이지 로딩)
});