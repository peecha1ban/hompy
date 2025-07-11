// js/resizer.js (패널 크기 조절 스크립트)

// DOMContentLoaded 이벤트: HTML 문서가 완전히 로드되고 파싱되면 실행됩니다.
document.addEventListener('DOMContentLoaded', () => {
    // 필요한 HTML 요소들을 JavaScript 변수에 연결합니다.
    const container = document.querySelector('.container'); // 전체 컨테이너
    const leftPanel = document.querySelector('.left-panel'); // 왼쪽 패널
    const rightPanel = document.querySelector('.right-panel'); // 오른쪽 패널
    const resizer = document.querySelector('.resizer'); // 크기 조절 바
    const contentFrame = document.getElementById('content-frame'); // 콘텐츠 iframe
    const iframeOverlay = document.getElementById('iframe-overlay'); // iframe 오버레이

    // 필수 요소가 없으면 오류 메시지를 콘솔에 출력하고 함수를 종료합니다.
    if (!container || !leftPanel || !rightPanel || !resizer || !contentFrame || !iframeOverlay) {
        console.error("Resizer elements not found. Make sure .container, .left-panel, .right-panel, .resizer, #content-frame, and #iframe-overlay are in your HTML.");
        return;
    }

    let isResizing = false; // 현재 크기 조절 중인지 여부를 나타내는 플래그

    // 현재 화면 너비가 768px 이하인지 확인하여 모바일 여부를 판단합니다.
    const isMobile = window.innerWidth <= 768;

    // 모바일 환경에서 패널의 확장 및 축소 높이 정의 (vh 단위)
    const MOBILE_EXPANDED_HEIGHT = 75; // 확장될 패널의 높이
    const MOBILE_COLLAPSED_HEIGHT = 25; // 축소될 패널의 높이

    /**
     * 모바일 환경에서 패널의 높이를 부드럽게 설정합니다.
     * @param {number} leftHeightVh 왼쪽 패널의 목표 높이 (vh)
     * @param {number} rightHeightVh 오른쪽 패널의 목표 높이 (vh)
     */
    function setPanelHeightsMobile(leftHeightVh, rightHeightVh) {
        // 기존 transition 스타일을 임시로 제거하여 충돌 방지 (CSS에서 none으로 설정되어 있으므로 필요 없을 수 있지만, 안전을 위해)
        leftPanel.style.transition = 'height 0.3s ease-out';
        rightPanel.style.transition = 'height 0.3s ease-out';

        leftPanel.style.height = `${leftHeightVh}vh`;
        rightPanel.style.height = `${rightHeightVh}vh`;

        // transition 완료 후 스타일 제거 (다음 drag/touch resize를 위해)
        // setTimeout(() => {
        //     leftPanel.style.transition = '';
        //     rightPanel.style.transition = '';
        // }, 300); // 0.3초 transition 시간과 일치
    }

    /**
     * 초기 패널 크기를 설정합니다. 모바일과 데스크톱 환경에 따라 다르게 설정됩니다.
     */
    function setInitialPanelSizes() {
        if (isMobile) {
            // 모바일 환경: 높이를 뷰포트 높이의 50%로 설정
            setPanelHeightsMobile(50, 50); // 초기에는 50/50으로 나눕니다.
        } else {
            // 데스크톱 환경: 너비를 뷰포트 너비의 50%로 설정
            leftPanel.style.width = '50%';
            rightPanel.style.width = '50%';
        }
    }

    setInitialPanelSizes(); // 페이지 로드 시 초기 패널 크기 설정

    // --- 모바일 전용 패널 확장/축소 기능 (클릭 & 스크롤) ---
    if (isMobile) {
        let activePanel = 'initial'; // 'initial', 'left', 'right'

        /**
         * 모바일에서 특정 패널을 확장하고 다른 패널을 축소합니다.
         * @param {'left'|'right'} panelToExpand 확장할 패널 ('left' 또는 'right')
         */
        const adjustMobilePanel = (panelToExpand) => {
            if (activePanel === panelToExpand) return; // 이미 활성화된 패널이면 아무것도 하지 않습니다.

            if (panelToExpand === 'left') {
                setPanelHeightsMobile(MOBILE_EXPANDED_HEIGHT, MOBILE_COLLAPSED_HEIGHT);
            } else { // panelToExpand === 'right'
                setPanelHeightsMobile(MOBILE_COLLAPSED_HEIGHT, MOBILE_EXPANDED_HEIGHT);
            }
            activePanel = panelToExpand;
        };

        // 이 함수를 외부(postInteractions.js)에서 호출할 수 있도록 export 합니다.
        // 게시물 클릭 시 오른쪽 패널을 확장하는 데 사용됩니다.
        window.adjustRightPanelForMobile = () => adjustMobilePanel('right');


        // 스크롤 이벤트 리스너를 위한 debounce 함수
        let scrollTimeout;
        const debounce = (func, delay) => {
            return function() {
                const context = this;
                const args = arguments;
                clearTimeout(scrollTimeout);
                scrollTimeout = setTimeout(() => func.apply(context, args), delay);
            };
        };

        // 왼쪽 패널 스크롤 시
        leftPanel.addEventListener('scroll', debounce(() => {
            if (leftPanel.scrollTop > 0 || leftPanel.scrollHeight > leftPanel.clientHeight) {
                // 스크롤이 발생했거나 스크롤 가능하면 왼쪽 패널 확장
                adjustMobilePanel('left');
            }
        }, 100)); // 100ms 디바운스

        // 오른쪽 패널 스크롤 시
        rightPanel.addEventListener('scroll', debounce(() => {
            if (rightPanel.scrollTop > 0 || rightPanel.scrollHeight > rightPanel.clientHeight) {
                // 스크롤이 발생했거나 스크롤 가능하면 오른쪽 패널 확장
                adjustMobilePanel('right');
            }
        }, 100)); // 100ms 디바운스
    }


    // 마우스 다운 이벤트 리스너 (데스크톱)
    resizer.addEventListener('mousedown', (e) => {
        if (!isMobile) { // 모바일이 아닐 때만 작동
            isResizing = true; // 크기 조절 시작 플래그 설정
            iframeOverlay.style.display = 'block'; // iframe 오버레이 표시 (iframe 내부 클릭 방지)
            // 마우스 이동 및 해제 이벤트 리스너 추가
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }
    });

    // 터치 시작 이벤트 리스너 (모바일)
    resizer.addEventListener('touchstart', (e) => {
        if (isMobile) { // 모바일일 때만 작동
            isResizing = true; // 크기 조절 시작 플래그 설정
            e.preventDefault(); // 기본 터치 동작(스크롤 등) 방지
            // 터치 이동 및 종료 이벤트 리스너 추가 (passive: false는 preventDefault를 허용)
            document.addEventListener('touchmove', handleTouchMove, { passive: false }); 
            document.addEventListener('touchend', handleTouchEnd);
        }
    }, { passive: false });

    /**
     * 마우스 이동 시 패널 크기를 조절하는 함수 (데스크톱)
     * requestAnimationFrame을 사용하여 부드러운 애니메이션을 제공합니다.
     */
    function handleMouseMove(e) {
        if (!isResizing) return; // 크기 조절 중이 아니면 함수 종료
        requestAnimationFrame(() => {
            const containerRect = container.getBoundingClientRect(); // 컨테이너의 크기와 위치 정보
            let newLeftWidth = (e.clientX - containerRect.left); // 새로운 왼쪽 패널 너비 (마우스 X 좌표 기준)

            const minWidthPx = 320; // 왼쪽 패널 최소 너비 (픽셀)
            const maxWidthPx = containerRect.width * 0.9; // 왼쪽 패널 최대 너비 (컨테이너 너비의 90%)

            // 너비 제한을 적용합니다.
            newLeftWidth = Math.max(minWidthPx, Math.min(newLeftWidth, maxWidthPx));

            // 새로운 왼쪽 패널 너비를 백분율로 계산합니다.
            const newLeftPercentage = (newLeftWidth / containerRect.width) * 100;

            // 패널들의 너비를 설정합니다.
            leftPanel.style.width = `${newLeftPercentage}%`;
            rightPanel.style.width = `${100 - newLeftPercentage}%`;
        });
    }

    /**
     * 터치 이동 시 패널 크기를 조절하는 함수 (모바일)
     * requestAnimationFrame을 사용하여 부드러운 애니메이션을 제공합니다.
     */
    function handleTouchMove(e) {
        if (!isResizing) return; // 크기 조절 중이 아니면 함수 종료
        e.preventDefault(); // 기본 터치 동작 방지
        requestAnimationFrame(() => {
            const containerRect = container.getBoundingClientRect(); // 컨테이너의 크기와 위치 정보
            const availableHeight = containerRect.height; // 컨테이너의 사용 가능한 높이
            let newLeftHeightPx = (e.touches[0].clientY - containerRect.top); // 새로운 왼쪽 패널 높이 (터치 Y 좌표 기준)

            const minHeightPx = availableHeight * 0.1; // 왼쪽 패널 최소 높이 (컨테이너 높이의 10%)
            const maxHeightPx = availableHeight * 0.9; // 왼쪽 패널 최대 높이 (컨테이너 높이의 90%)

            // 높이 제한을 적용합니다.
            newLeftHeightPx = Math.max(minHeightPx, Math.min(newLeftHeightPx, maxHeightPx));

            // 새로운 왼쪽 패널 높이를 백분율(vh)로 계산합니다.
            const newLeftPercentage = (newLeftHeightPx / availableHeight) * 100;

            // 패널들의 높이를 설정합니다.
            leftPanel.style.height = `${newLeftPercentage}vh`;
            rightPanel.style.height = `${100 - newLeftPercentage}vh`;
        });
    }

    /**
     * 마우스 업 시 크기 조절을 종료하는 함수
     */
    function handleMouseUp() {
        isResizing = false; // 크기 조절 종료 플래그 설정
        iframeOverlay.style.display = 'none'; // iframe 오버레이 숨김
        // 마우스 이벤트 리스너 제거
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    }

    /**
     * 터치 종료 시 크기 조절을 종료하는 함수
     */
    function handleTouchEnd() {
        isResizing = false; // 크기 조절 종료 플래그 설정
        // 터치 이벤트 리스너 제거
        document.removeEventListener('touchmove', handleTouchMove, { passive: false });
        document.removeEventListener('touchend', handleTouchEnd);
    }

    // 창 크기 변경 시 이벤트 리스너
    window.addEventListener('resize', () => {
        clearTimeout(window.resizeTimeout); // 기존 타이머 클리어
        // 100ms 후에 초기 패널 크기를 다시 설정합니다. (잦은 리사이즈 이벤트에 대한 성능 최적화)
        window.resizeTimeout = setTimeout(() => {
            setInitialPanelSizes();
        }, 100);
    });

    // START: Add iframe content change resize logic here
    // iframe의 contentFrame에 load 이벤트 리스너 추가
    contentFrame.onload = function() {
        try {
            // contentWindow.document가 접근 가능한지 확인 (동일 출처 정책 준수)
            if (contentFrame.contentWindow && contentFrame.contentWindow.document) {
                // iframe 내부 콘텐츠의 전체 높이를 가져옵니다. (이 값을 직접 사용하지는 않지만, 필요시 참조)
                const contentHeight = contentFrame.contentWindow.document.body.scrollHeight;

                // 모바일 환경이고 contentFrame의 부모가 rightPanel인 경우,
                // rightPanel을 확장하는 로직을 추가합니다.
                // 이는 '게시물 클릭 시 오른쪽 패널 확장'과 유사한 동작을 제공합니다.
                if (isMobile && typeof window.adjustRightPanelForMobile === 'function') {
                    window.adjustRightPanelForMobile(); // 이 함수가 75vh/25vh 조정을 담당합니다.
                } else if (!isMobile) {
                    // 데스크톱 환경에서는 iframe의 높이를 콘텐츠에 맞게 조절할 수 있습니다.
                    // 현재 코드에서는 데스크톱 환경의 iframe 높이 조정은 별도로 처리되지 않으므로,
                    // 필요에 따라 여기에 해당 로직을 추가할 수 있습니다.
                    // 예: contentFrame.style.height = `${contentHeight}px`;
                    // 다만, rightPanel의 width 기반 리사이징과 충돌할 수 있으니 주의가 필요합니다.
                }

            }
        } catch (e) {
            console.warn("Error accessing iframe content (likely due to Same-Origin Policy or content not fully loaded):", e);
            // 크로스-오리진 정책으로 인해 iframe 내용에 접근할 수 없는 경우,
            // 기본 높이를 설정하거나 오류를 무시할 수 있습니다.
            // 예를 들어, rightPanel.style.height = '50vh'; 와 같이 고정 높이를 설정할 수 있습니다.
        }
    };
    // END: Add iframe content change resize logic here
});